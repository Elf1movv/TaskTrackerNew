import { Router } from "express"
import { db } from "../db.js"
import { testMessage } from "../lib/push/messages.js"
import { sendToSubscriptions, vapidPublicKey } from "../lib/push/sender.js"
import { requireAuth } from "../middleware/requireAuth.js"
import { subscribeSchema, unsubscribeSchema } from "../validation/push.js"

// Push notifications (2026-11-12): the browser's subscription is stored here,
// lib/push/scheduler.ts sends to it. Settings (time, digest) — routes/me.ts.
export const pushRouter = Router()

pushRouter.use(requireAuth)

// The public half of the VAPID key pair — the browser needs it to subscribe.
// 503 = push isn't set up on this server (no keys): the UI hides the switch.
pushRouter.get("/key", (_req, res) => {
  const publicKey = vapidPublicKey()
  if (!publicKey) {
    res.status(503).json({ error: "Push notifications are not configured" })
    return
  }
  res.json({ publicKey })
})

// Upsert by endpoint: the same browser re-sends it on every visit (keeps the
// time zone and language fresh), and a browser that another account logs into
// moves to that account.
pushRouter.post("/subscriptions", async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid subscription", details: parsed.error.flatten() })
    return
  }
  const { endpoint, keys, timeZone, language } = parsed.data
  const data = { p256dh: keys.p256dh, auth: keys.auth, language, userId: req.userId }
  await db.$transaction([
    db.pushSubscription.upsert({ where: { endpoint }, create: { endpoint, ...data }, update: data }),
    db.user.update({ where: { id: req.userId }, data: { timeZone } }),
  ])
  res.status(201).json({ ok: true })
})

pushRouter.delete("/subscriptions", async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid subscription", details: parsed.error.flatten() })
    return
  }
  await db.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, userId: req.userId } })
  res.status(204).end()
})

// "Send a test notification" in settings — proves the whole chain works.
pushRouter.post("/test", async (req, res) => {
  const subs = await db.pushSubscription.findMany({ where: { userId: req.userId } })
  if (subs.length === 0) {
    res.status(404).json({ error: "No subscriptions" })
    return
  }
  const groups = new Map<"ru" | "en", typeof subs>()
  for (const sub of subs) {
    const language = sub.language === "en" ? "en" : "ru"
    groups.set(language, [...(groups.get(language) ?? []), sub])
  }
  const results = await Promise.all(
    [...groups].map(([language, list]) => sendToSubscriptions(list, testMessage(language), { urgent: true })),
  )
  res.json({
    result: results.includes("delivered") ? "delivered" : results.includes("failed") ? "failed" : "gone",
  })
})
