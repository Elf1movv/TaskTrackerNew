import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { planFields, patchPlan, validPlan } from "../validation/productLogic.js"
import { clientPlan, fail, ownerTransaction } from "../lib/productLogic.js"
function durationOf(plan: { time: string | null; endTime: string | null; durationMinutes: number }) {
  if (!plan.time || !plan.endTime) return plan.durationMinutes
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  return minutes(plan.endTime) - minutes(plan.time)
}
export const plansRouter = Router()
plansRouter.use(requireAuth)
plansRouter.get("/", async (req, res) =>
  res.json(
    (
      await db.calendarPlan.findMany({
        where: { userId: req.userId },
        orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "asc" }],
      })
    ).map(clientPlan),
  ),
)
plansRouter.post("/", async (req, res) => {
  const parsed = planFields.safeParse(req.body)
  if (!parsed.success || !validPlan(parsed.data)) {
    res.status(400).json({ error: "Invalid plan" })
    return
  }
  const plan = await ownerTransaction(req.userId, async tx => {
    return tx.calendarPlan.create({
      data: {
        ...parsed.data,
        durationMinutes: durationOf(parsed.data),
        userId: req.userId,
      },
    })
  })
  res.status(201).json(clientPlan(plan))
})
plansRouter.patch("/:id", async (req, res) => {
  const parsed = patchPlan.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid plan patch" })
    return
  }
  const result = await ownerTransaction(req.userId, async tx => {
    const current = await tx.calendarPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!current) fail(404, "Plan not found")
    if (current.updatedAt.toISOString() !== parsed.data.expectedUpdatedAt)
      return { conflict: true, plan: current }
    const merged = { ...current, ...parsed.data.patch }
    if (!validPlan(merged)) fail(400, "Invalid schedule")
    const plan = await tx.calendarPlan.update({
      where: { id: current.id },
      data: {
        ...parsed.data.patch,
        durationMinutes: durationOf(merged),
      },
    })
    return { conflict: false, plan }
  })
  if (result.conflict) {
    res.status(409).json({ error: "Plan changed elsewhere", current: clientPlan(result.plan) })
    return
  }
  res.json(clientPlan(result.plan))
})
plansRouter.delete("/:id", async (req, res) => {
  await ownerTransaction(req.userId, tx =>
    tx.calendarPlan.deleteMany({ where: { id: req.params.id, userId: req.userId } }),
  )
  res.status(204).end()
})
