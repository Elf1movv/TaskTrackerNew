import type { TestAgent } from "supertest"
import request from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// The push service itself is replaced: no network in tests. Each call is
// recorded; an endpoint containing "gone" answers 410 like a removed app.
const sent: { endpoint: string; payload: string }[] = []
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async (sub: { endpoint: string }, payload: string) => {
      if (sub.endpoint.includes("gone")) throw Object.assign(new Error("Gone"), { statusCode: 410 })
      sent.push({ endpoint: sub.endpoint, payload })
    }),
  },
}))

const KEYS = {
  VAPID_PUBLIC_KEY: "test-public",
  VAPID_PRIVATE_KEY: "test-private",
  VAPID_SUBJECT: "mailto:t@example.com",
}
let saved: Record<string, string | undefined>

beforeAll(() => {
  saved = Object.fromEntries(Object.keys(KEYS).map(k => [k, process.env[k]]))
  Object.assign(process.env, KEYS)
})
afterAll(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

const { createApp } = await import("../app.js")
const { createAuthenticatedAgent } = await import("../test-utils/auth.js")
const { db } = await import("../db.js")
const { runPushCheck } = await import("../lib/push/scheduler.js")

const app = createApp()
const subscription = (endpoint: string) => ({
  endpoint,
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
  timeZone: "Europe/Kyiv",
  language: "ru",
})

describe("push routes", () => {
  let agent: TestAgent

  beforeEach(async () => {
    sent.length = 0
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    expect((await request(app).get("/api/push/key")).status).toBe(401)
  })

  it("gives the public key", async () => {
    const res = await agent.get("/api/push/key")
    expect(res.body).toEqual({ publicKey: "test-public" })
  })

  it("stores a subscription and the time zone, and forgets it on delete", async () => {
    const endpoint = `https://push.example.com/${crypto.randomUUID()}`
    expect((await agent.post("/api/push/subscriptions").send(subscription(endpoint))).status).toBe(201)
    const settings = await agent.get("/api/me/notifications")
    expect(settings.body).toEqual({ notifyTime: "09:00", notifyDigest: true, timeZone: "Europe/Kyiv" })
    expect(await db.pushSubscription.count({ where: { endpoint } })).toBe(1)

    // The same browser again: still one row.
    await agent.post("/api/push/subscriptions").send(subscription(endpoint))
    expect(await db.pushSubscription.count({ where: { endpoint } })).toBe(1)

    expect((await agent.delete("/api/push/subscriptions").send({ endpoint })).status).toBe(204)
    expect(await db.pushSubscription.count({ where: { endpoint } })).toBe(0)
  })

  it("rejects an unknown time zone and a bad time", async () => {
    const endpoint = `https://push.example.com/${crypto.randomUUID()}`
    const bad = await agent
      .post("/api/push/subscriptions")
      .send({ ...subscription(endpoint), timeZone: "Mars/Base" })
    expect(bad.status).toBe(400)
    expect((await agent.put("/api/me/notifications").send({ notifyTime: "25:00" })).status).toBe(400)
    const ok = await agent.put("/api/me/notifications").send({ notifyTime: "07:30", notifyDigest: false })
    expect(ok.body).toMatchObject({ notifyTime: "07:30", notifyDigest: false })
  })

  it("sends a test notification", async () => {
    const endpoint = `https://push.example.com/${crypto.randomUUID()}`
    await agent.post("/api/push/subscriptions").send(subscription(endpoint))
    const res = await agent.post("/api/push/test")
    expect(res.body).toEqual({ result: "delivered" })
    expect(JSON.parse(sent.find(s => s.endpoint === endpoint)!.payload)).toMatchObject({
      body: "Уведомления работают 👍",
    })
  })
})

describe("push scheduler", () => {
  it("sends a due reminder once, in the person's zone, and drops a gone device", async () => {
    sent.length = 0
    const agent = await createAuthenticatedAgent(app)
    const live = `https://push.example.com/${crypto.randomUUID()}`
    const gone = `https://push.example.com/gone-${crypto.randomUUID()}`
    await agent.post("/api/push/subscriptions").send(subscription(live))
    await agent.post("/api/push/subscriptions").send(subscription(gone))
    await agent.put("/api/me/notifications").send({ notifyDigest: false })
    const created = await agent
      .post("/api/reminders")
      .send({
        id: crypto.randomUUID(),
        title: "Позвонить маме",
        date: "2026-11-12",
        time: "14:30",
        priority: "normal",
        completed: false,
      })
    expect(created.status).toBe(201)

    // 12:30 UTC = 14:30 in Kyiv.
    const now = new Date("2026-11-12T12:30:00Z")
    await runPushCheck(now)
    const mine = sent.filter(s => s.endpoint === live)
    expect(mine).toHaveLength(1)
    expect(JSON.parse(mine[0].payload)).toMatchObject({
      title: "Позвонить маме",
      body: "Напоминание · 14:30",
    })
    expect(await db.pushSubscription.count({ where: { endpoint: gone } })).toBe(0)

    await runPushCheck(new Date(now.getTime() + 60_000))
    expect(sent.filter(s => s.endpoint === live)).toHaveLength(1)
  })
})
