import { Router } from "express"
import { db } from "../db.js"
import { isPrismaNotFound } from "../lib/prismaErrors.js"
import { createCategorySchema, reorderSchema, updateCategorySchema } from "../validation/category.js"

export const categoriesRouter = Router()

function toClientCategory(category: { id: string; name: string; updatedAt: Date }) {
  return { id: category.id, name: category.name, updatedAt: category.updatedAt }
}

categoriesRouter.get("/", async (_req, res) => {
  const categories = await db.category.findMany({ orderBy: { order: "asc" } })
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
  const { _max } = await db.category.aggregate({ _max: { order: true } })
  const created = await db.category.create({
    data: { ...parsed.data, order: (_max.order ?? -1) + 1 },
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
    parsed.data.map(({ id, order }) => db.category.update({ where: { id }, data: { order } })),
  )
  res.status(204).end()
})

categoriesRouter.patch("/:id", async (req, res) => {
  const parsed = updateCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid category patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const result = await db.category.updateMany({
    where: { id: req.params.id, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    const current = await db.category.findUnique({ where: { id: req.params.id } })
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

categoriesRouter.delete("/:id", async (req, res, next) => {
  try {
    await db.category.delete({ where: { id: req.params.id } })
  } catch (err) {
    if (isPrismaNotFound(err)) {
      res.status(404).json({ error: "Category not found" })
      return
    }
    next(err)
    return
  }
  res.status(204).end()
})
