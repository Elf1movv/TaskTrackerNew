import { Router } from "express"
import { db } from "../db.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { updateOnboardingSchema } from "../validation/onboarding.js"

// Per-account settings that belong to the person rather than to one of their
// records. For now only the onboarding outcome.
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
