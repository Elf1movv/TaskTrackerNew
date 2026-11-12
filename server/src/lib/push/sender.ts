import webpush from "web-push"
import { db } from "../../db.js"
import type { PushMessage } from "./messages.js"

// Sends one message to every browser a person turned notifications on in.
// The VAPID keys (server/.env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT) sign the message so push services know it's from us.
// Without them push is simply off: the key endpoint answers 503 and the
// settings switch stays hidden — the server never fails to start over it.

let configured: boolean | null = null

export function pushConfigured(): boolean {
  if (configured !== null) return configured
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT)
  if (configured) webpush.setVapidDetails(VAPID_SUBJECT!, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)
  return configured
}

export function vapidPublicKey(): string | null {
  return pushConfigured() ? process.env.VAPID_PUBLIC_KEY! : null
}

export interface SubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

// "delivered" — at least one device got it; "gone" — no device left (all
// subscriptions expired and were removed); "failed" — a temporary error,
// worth trying again on the next check.
export type SendResult = "delivered" | "gone" | "failed"

export async function sendToSubscriptions(
  subscriptions: SubscriptionRow[],
  message: PushMessage,
  { urgent }: { urgent: boolean },
): Promise<SendResult> {
  if (!pushConfigured() || subscriptions.length === 0) return "gone"
  let delivered = false
  let failed = false
  await Promise.all(
    subscriptions.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(message),
          // An hour on the push service's side: a phone that was off longer
          // gets nothing rather than a pile of stale reminders.
          { TTL: 3600, urgency: urgent ? "high" : "normal" },
        )
        delivered = true
        await db.pushSubscription.update({ where: { id: sub.id }, data: { lastSuccessAt: new Date() } })
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // The browser unsubscribed or the app was removed — forget it.
          await db.pushSubscription.deleteMany({ where: { id: sub.id } })
        } else {
          failed = true
          console.error("Push send failed", status ?? "", (err as Error).message)
        }
      }
    }),
  )
  if (delivered) return "delivered"
  return failed ? "failed" : "gone"
}
