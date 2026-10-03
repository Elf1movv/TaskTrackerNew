import { Router } from "express"
import type { Note } from "@prisma/client"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { noteFields, patchNote } from "../validation/productLogic.js"
import { reorderSchema } from "../validation/task.js"
const client = ({ userId: _user, ...note }: Note) => ({
  ...note,
  showFrom: note.showFrom?.toISOString().slice(0, 10) ?? null,
})
export const notesRouter = Router()
notesRouter.use(requireAuth)
notesRouter.get("/", async (req, res) =>
  res.json(
    (await db.note.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })).map(client),
  ),
)
notesRouter.post("/", async (req, res) => {
  const parsed = noteFields.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid note" })
    return
  }
  const { _max } = await db.note.aggregate({ where: { userId: req.userId }, _max: { order: true } })
  res
    .status(201)
    .json(
      client(
        await db.note.create({ data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 } }),
      ),
    )
})
notesRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid order" })
    return
  }
  await db.$transaction(
    [...parsed.data]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, order }) => db.note.updateMany({ where: { id, userId: req.userId }, data: { order } })),
  )
  res.json(
    await db.note.findMany({
      where: { userId: req.userId, id: { in: parsed.data.map(p => p.id) } },
      select: { id: true, updatedAt: true },
    }),
  )
})
notesRouter.patch("/:id", async (req, res) => {
  const parsed = patchNote.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid note patch" })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data
  const result = await db.note.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })
  const current = await db.note.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!current) {
    res.status(404).json({ error: "Note not found" })
    return
  }
  if (!result.count) {
    res.status(409).json({ error: "Note changed elsewhere", current: client(current) })
    return
  }
  res.json(client(current))
})
notesRouter.delete("/:id", async (req, res) => {
  await db.note.deleteMany({ where: { id: req.params.id, userId: req.userId } })
  res.status(204).end()
})
