import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { updateOnboardingSchema } from "../validation/onboarding.js"
import { notificationSettingsSchema } from "../validation/push.js"

// Per-account settings that belong to the person rather than to one of their
// records: the onboarding outcome and the notification settings.
export const meRouter = Router()

meRouter.use(requireAuth)

meRouter.get("/onboarding", async (req, res) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { onboardingStatus: true },
  })
  res.json({ status: user.onboardingStatus })
})

meRouter.put("/onboarding", async (req, res) => {
  const parsed = updateOnboardingSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid onboarding status", details: parsed.error.flatten() })
    return
  }
  const user = await db.user.update({
    where: { id: req.userId },
    data: { onboardingStatus: parsed.data.status, onboardingAt: new Date() },
    select: { onboardingStatus: true },
  })
  res.json({ status: user.onboardingStatus })
})

// Push notification settings (2026-11-12): when untimed reminders and the
// morning digest arrive, whether the digest is on, and the time zone.
const notificationSelect = { notifyTime: true, notifyDigest: true, timeZone: true } as const

meRouter.get("/notifications", async (req, res) => {
  const user = await db.user.findUniqueOrThrow({ where: { id: req.userId }, select: notificationSelect })
  res.json(user)
})

meRouter.put("/notifications", async (req, res) => {
  const parsed = notificationSettingsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid notification settings", details: parsed.error.flatten() })
    return
  }
  const user = await db.user.update({
    where: { id: req.userId },
    data: parsed.data,
    select: notificationSelect,
  })
  res.json(user)
})
