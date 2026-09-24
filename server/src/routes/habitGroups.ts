import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { createHabitGroupSchema, reorderSchema, updateHabitGroupSchema } from "../validation/habitGroup.js"

export const habitGroupsRouter = Router()

habitGroupsRouter.use(requireAuth)

interface ClientHabitGroup {
  id: string
  title: string
  icon: string
  color: string
  isGeneral: boolean
  updatedAt: Date
}

function toClientHabitGroup(group: {
  id: string
  title: string
  icon: string
  color: string
  isGeneral: boolean
  updatedAt: Date
}): ClientHabitGroup {
  return {
    id: group.id,
    title: group.title,
    icon: group.icon,
    color: group.color,
    isGeneral: group.isGeneral,
    updatedAt: group.updatedAt,
  }
}

// Placeholder values for the one auto-seeded "General" row — never shown
// as-is until the user edits them, the client substitutes its own
// localized label/icon for isGeneral: true while they still match these
// (see docs/requirements, habitGroupDisplay.ts), since the server has no
// concept of the user's language.
const GENERAL_GROUP_TITLE = "General"
const GENERAL_GROUP_ICON = "📋"
const GENERAL_GROUP_COLOR = "#c97b3a"
// Sorts last by default among a user's blocks, without hardcoding "last
// index" — still freely draggable earlier like any other group.
const GENERAL_GROUP_ORDER = 999999

habitGroupsRouter.get("/", async (req, res) => {
  // habitGroupsSeeded (not "does this user have zero groups right now")
  // distinguishes a brand-new account from one that — hypothetically —
  // could otherwise end up without its General row; same guard shape as
  // Category's categoriesSeeded, see routes/categories.ts.
  const user = await db.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { habitGroupsSeeded: true },
  })
  if (!user.habitGroupsSeeded) {
    await db.$transaction([
      db.habitGroup.create({
        data: {
          title: GENERAL_GROUP_TITLE,
          icon: GENERAL_GROUP_ICON,
          color: GENERAL_GROUP_COLOR,
          isGeneral: true,
          order: GENERAL_GROUP_ORDER,
          userId: req.userId,
        },
      }),
      db.user.update({ where: { id: req.userId }, data: { habitGroupsSeeded: true } }),
    ])
  }

  const groups = await db.habitGroup.findMany({ where: { userId: req.userId }, orderBy: { order: "asc" } })
  res.json(groups.map(toClientHabitGroup))
})

habitGroupsRouter.post("/", async (req, res) => {
  const parsed = createHabitGroupSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid habit group", details: parsed.error.flatten() })
    return
  }

  const { _max } = await db.habitGroup.aggregate({ where: { userId: req.userId }, _max: { order: true } })
  const created = await db.habitGroup.create({
    data: { ...parsed.data, userId: req.userId, order: (_max.order ?? -1) + 1 },
  })
  res.status(201).json(toClientHabitGroup(created))
})

habitGroupsRouter.patch("/reorder", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reorder payload", details: parsed.error.flatten() })
    return
  }

  // Sorted by id — same deterministic lock order as the other reorder
  // handlers, avoids deadlocking overlapping reorder transactions. The
  // General group takes part in this exactly like any other row — no
  // special-casing, it's just a row with an order value.
  await db.$transaction(
    [...parsed.data]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, order }) =>
        db.habitGroup.updateMany({ where: { id, userId: req.userId }, data: { order } }),
      ),
  )
  const updated = await db.habitGroup.findMany({
    where: { id: { in: parsed.data.map(d => d.id) }, userId: req.userId },
    select: { id: true, updatedAt: true },
  })
  res.json(updated)
})

habitGroupsRouter.patch("/:id", async (req, res) => {
  const parsed = updateHabitGroupSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid habit group patch", details: parsed.error.flatten() })
    return
  }
  const { patch, expectedUpdatedAt } = parsed.data

  const current = await db.habitGroup.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!current) {
    res.status(404).json({ error: "Habit group not found" })
    return
  }
  // Unlike DELETE below, isGeneral no longer blocks a rename/re-icon/
  // re-color — only deletion is still refused (its habits would have
  // nowhere left to go).

  const result = await db.habitGroup.updateMany({
    where: { id: req.params.id, userId: req.userId, updatedAt: new Date(expectedUpdatedAt) },
    data: patch,
  })

  if (result.count === 0) {
    const latest = await db.habitGroup.findUniqueOrThrow({ where: { id: req.params.id } })
    res.status(409).json({ error: "Habit group was changed elsewhere", current: toClientHabitGroup(latest) })
    return
  }

  const updated = await db.habitGroup.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(toClientHabitGroup(updated))
})

habitGroupsRouter.delete("/:id", async (req, res) => {
  const group = await db.habitGroup.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!group) {
    res.status(404).json({ error: "Habit group not found" })
    return
  }
  if (group.isGeneral) {
    res.status(400).json({ error: "The General group can't be deleted" })
    return
  }

  const general = await db.habitGroup.findFirstOrThrow({ where: { userId: req.userId, isGeneral: true } })

  // Deleting a block never deletes its habits — they move to General, both
  // in one transaction so a failure can't leave habits pointing at a
  // group that no longer exists (Habit.groupId has no ON DELETE CASCADE/
  // SET NULL — see schema.prisma — specifically so this reassignment is
  // the only way habits ever lose their custom group).
  await db.$transaction([
    db.habit.updateMany({ where: { userId: req.userId, groupId: group.id }, data: { groupId: general.id } }),
    db.habitGroup.delete({ where: { id: group.id } }),
  ])
  res.status(204).end()
})
