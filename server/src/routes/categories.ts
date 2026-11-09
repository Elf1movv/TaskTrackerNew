import { Prisma } from "@prisma/client"
import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createCategorySchema, reorderSchema, updateCategorySchema } from "../validation/category.js"

import { ownerTransaction } from "../lib/productLogic.js"

export const categoriesRouter = Router()

categoriesRouter.use(requireAuth)

function toClientCategory(category: { id: string; name: string; color: string; updatedAt: Date }) {
  return { id: category.id, name: category.name, color: category.color, updatedAt: category.updatedAt }
}

// The 4 categories every new account used to get for free when categories
// were a single shared list for the whole app (see LEARNING.md). Now that
// they're per-user, each account is seeded with these once, the first time
// it asks for its category list — not tied to a Better Auth lifecycle hook,
// since which hooks are stable across versions wasn't fully confirmed.
// Colors are 4 distinct entries from the client's own PALETTE_COLORS
// (src/shared/lib/colors.ts) — duplicated here rather than shared across
// the workspace boundary, same as every other small color constant in this
// codebase (see HabitGroup's seeded default color).
// Seeded in the language the client is showing (X-Language header, sent by
// createRestRepository) — a Russian-speaking user used to get English
// "Work/Personal/Health/Learning" and had no way to rename them (2026-11-08).
const DEFAULT_CATEGORIES = {
  en: [
    { name: "Work", color: "#5b7fc7" },
    { name: "Personal", color: "#6a9c74" },
    { name: "Health", color: "#c75b8f" },
    { name: "Learning", color: "#c9a63a" },
  ],
  ru: [
    { name: "Работа", color: "#5b7fc7" },
    { name: "Личное", color: "#6a9c74" },
    { name: "Здоровье", color: "#c75b8f" },
    { name: "Учёба", color: "#c9a63a" },
  ],
}

categoriesRouter.get("/", async (req, res) => {
  // categoriesSeeded (not "does the user have zero categories right now")
  // is what tells a brand-new account apart from one that deleted its last
  // category on purpose — count === 0 couldn't distinguish those, so
  // deleting your last category used to silently resurrect the 4 defaults
  // on next load. See LEARNING.md.
  const user = await db.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { categoriesSeeded: true },
  })
  if (!user.categoriesSeeded) {
    await db.$transaction([
      // skipDuplicates: a category can be created via POST before this
      // user's first GET resolves (e.g. submitting "add category" while
      // the initial list load is still in flight) — without it, seeding a
      // default name that collides with one the user already made would
      // throw and crash this request instead of just skipping that name.
      db.category.createMany({
        data: DEFAULT_CATEGORIES[req.get("X-Language") === "ru" ? "ru" : "en"].map(
          ({ name, color }, order) => ({
            name,
            color,
            order,
            userId: req.userId,
          }),
        ),
        skipDuplicates: true,
      }),
      db.user.update({ where: { id: req.userId }, data: { categoriesSeeded: true } }),
    ])
  }

  const categories = await db.category.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })
  res.json(categories.map(toClientCategory))
})

categoriesRouter.post("/", async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid category", details: parsed.error.flatten() })
    return
  }

  // Appended at the end (unlike Task/Goal, which prepend) — a category
  // picker reads top-to-bottom as "oldest/most-established first", not
  // "newest first" like a task list does.
  const { _max } = await db.category.aggregate({ where: { userId: req.userId }, _max: { order: true } })
  try {
    // Also marks categoriesSeeded true: a user who creates their own first
    // category (e.g. their "add category" request beats their initial GET's
    // seed) already has a category to their name, so the next GET must not
    // seed defaults on top of it.
    const [created] = await db.$transaction([
      db.category.create({
        data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 },
      }),
      db.user.update({ where: { id: req.userId }, data: { categoriesSeeded: true } }),
    ])
    res.status(201).json(toClientCategory(created))
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: "Category name already exists" })
      return
    }
    throw err
  }
})

categoriesRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder payload", details: parsed.error.flatten() })
    return
  }

  // Sorted by id — see the matching comment in routes/tasks.ts's reorder
  // handler for why (deterministic lock order avoids deadlocking
  // overlapping reorder transactions).
  await db.$transaction(
    [...parsed.data]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, order }) => db.category.updateMany({ where: { id, userId: req.userId }, data: { order } })),
  )
  // Prisma's @updatedAt bumps updatedAt on every reordered row even though
  // only `order` changed — the client must learn the new values, or its
  // next per-item PATCH on any of these categories will carry a stale
  // expectedUpdatedAt and get a false 409 "changed elsewhere".
  const updated = await db.category.findMany({
    where: { id: { in: parsed.data.map(d => d.id) }, userId: req.userId },
    select: { id: true, updatedAt: true },
  })
  res.json(updated)
})

categoriesRouter.patch("/:id", async (req, res) => {
  const parsed = updateCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid category patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  // Task.category and Goal.category hold the category's NAME (no foreign
  // key), so a rename has to carry them along in the same transaction —
  // otherwise the tasks silently drop out of the category's filter.
  const result = await ownerTransaction(req.userId, async tx => {
    const current = await tx.category.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) return { status: 404 as const }
    if (current.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime())
      return { status: 409 as const, current }
    if (patch.name !== undefined && patch.name !== current.name) {
      const taken = await tx.category.findFirst({ where: { userId: req.userId, name: patch.name } })
      if (taken) return { status: 409 as const, nameTaken: true }
      await tx.task.updateMany({
        where: { userId: req.userId, category: current.name },
        data: { category: patch.name },
      })
      await tx.goal.updateMany({
        where: { userId: req.userId, category: current.name },
        data: { category: patch.name },
      })
    }
    return {
      status: 200 as const,
      updated: await tx.category.update({ where: { id: current.id }, data: patch }),
    }
  })

  if (result.status === 404) {
    res.status(404).json({ error: "Category not found" })
    return
  }
  if (result.status === 409) {
    if ("nameTaken" in result) res.status(409).json({ error: "Category name already exists" })
    else
      res
        .status(409)
        .json({ error: "Category was changed elsewhere", current: toClientCategory(result.current) })
    return
  }
  res.json(toClientCategory(result.updated))
})

categoriesRouter.delete("/:id", async (req, res) => {
  const category = await db.category.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!category) {
    res.status(404).json({ error: "Category not found" })
    return
  }

  // Task.category is a plain string, not a foreign key (see schema comment),
  // so nothing at the DB level would clean these up on its own — the
  // frontend warns the user how many tasks this deletes before confirming
  // (see TaskBoard.tsx), then this cascades both in one transaction so a
  // failure can't leave the category gone but its tasks still around (or
  // vice versa).
  await ownerTransaction(req.userId, async tx => {
    await tx.task.deleteMany({ where: { userId: req.userId, category: category.name } })
    // Goals are long-lived records with their own milestones — unlike the
    // category's tasks they are kept and only lose the category label.
    await tx.goal.updateMany({
      where: { userId: req.userId, category: category.name },
      data: { category: null },
    })
    await tx.category.deleteMany({ where: { id: category.id, userId: req.userId } })
  })
  res.status(204).end()
})
