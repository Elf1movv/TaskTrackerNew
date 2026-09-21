import { Prisma } from "@prisma/client"
import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createCategorySchema, reorderSchema, updateCategorySchema } from "../validation/category.js"

export const categoriesRouter = Router()

categoriesRouter.use(requireAuth)

function toClientCategory(category: { id: string; name: string; updatedAt: Date }) {
  return { id: category.id, name: category.name, updatedAt: category.updatedAt }
}

// The 4 categories every new account used to get for free when categories
// were a single shared list for the whole app (see LEARNING.md). Now that
// they're per-user, each account is seeded with these once, the first time
// it asks for its category list — not tied to a Better Auth lifecycle hook,
// since which hooks are stable across versions wasn't fully confirmed.
const DEFAULT_CATEGORY_NAMES = ["Work", "Personal", "Health", "Learning"]

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
        data: DEFAULT_CATEGORY_NAMES.map((name, order) => ({ name, order, userId: req.userId })),
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

  await db.$transaction(
    parsed.data.map(({ id, order }) =>
      db.category.updateMany({ where: { id, userId: req.userId }, data: { order } }),
    ),
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

  const result = await db.category.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    const current = await db.category.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) {
      res.status(404).json({ error: "Category not found" })
      return
    }
    res.status(409).json({ error: "Category was changed elsewhere", current: toClientCategory(current) })
    return
  }

  const updated = await db.category.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(toClientCategory(updated))
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
  await db.$transaction([
    db.task.deleteMany({ where: { userId: req.userId, category: category.name } }),
    db.category.delete({ where: { id: category.id } }),
  ])
  res.status(204).end()
})
