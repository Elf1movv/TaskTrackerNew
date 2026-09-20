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
  const existing = await db.category.count({ where: { userId: req.userId } })
  if (existing === 0) {
    await db.category.createMany({
      data: DEFAULT_CATEGORY_NAMES.map((name, order) => ({ name, order, userId: req.userId })),
    })
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
  const created = await db.category.create({
    data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 },
  })
  res.status(201).json(toClientCategory(created))
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
