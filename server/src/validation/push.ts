import { z } from "zod"
import { isValidTimeZone } from "../lib/push/schedule.js"

export const timeZoneSchema = z.string().max(64).refine(isValidTimeZone, "Unknown time zone")

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm")

// What the browser's PushSubscription.toJSON() gives, plus the person's zone
// and interface language for the notification texts.
export const subscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(64) }),
  timeZone: timeZoneSchema,
  language: z.enum(["ru", "en"]),
})

export const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2048) })

export const notificationSettingsSchema = z
  .object({ notifyTime: hhmm, notifyDigest: z.boolean(), timeZone: timeZoneSchema })
  .partial()
