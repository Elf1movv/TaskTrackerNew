import type { TestAgent } from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()
const baseReminder = {
  title: "Call mom",
  date: "2026-03-01",
  time: "18:30",
  priority: "normal",
  completed: false,
}

describe("reminders router — shared date/time check (audit Д6)", () => {
  let agent: TestAgent

  beforeEach(async () => {
    await db.reminder.deleteMany({})
    agent = await createAuthenticatedAgent(app)
  })

  it("accepts and round-trips a valid date and time", async () => {
    const created = await agent.post("/api/reminders").send({ ...baseReminder, id: crypto.randomUUID() })
    expect(created.status).toBe(201)
    expect(created.body.date).toBe("2026-03-01")
    expect(created.body.time).toBe("18:30")
  })

  it("accepts a reminder without a time", async () => {
    const created = await agent
      .post("/api/reminders")
      .send({ ...baseReminder, id: crypto.randomUUID(), time: null })
    expect(created.status).toBe(201)
  })

  it.each([
    ["an impossible date", { date: "2026-02-31" }],
    ["a malformed date", { date: "01/03/2026" }],
    ["a time out of range", { time: "99:99" }],
    ["24:00 as a time", { time: "24:00" }],
  ])("rejects %s", async (_, fields) => {
    const res = await agent
      .post("/api/reminders")
      .send({ ...baseReminder, id: crypto.randomUUID(), ...fields })
    expect(res.status).toBe(400)
  })

  it("rejects an impossible date in a patch", async () => {
    const created = await agent.post("/api/reminders").send({ ...baseReminder, id: crypto.randomUUID() })
    const res = await agent
      .patch(`/api/reminders/${created.body.id}`)
      .send({ patch: { date: "2026-04-31" }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(400)
  })

  it("records when a reminder was checked, and clears it when unchecked", async () => {
    const created = await agent.post("/api/reminders").send({ ...baseReminder, id: crypto.randomUUID() })
    expect(created.body.completedAt).toBeNull()

    const checked = await agent
      .patch(`/api/reminders/${created.body.id}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: created.body.updatedAt })
    expect(checked.status).toBe(200)
    expect(checked.body.completedAt).toBeTypeOf("string")

    // Editing something else keeps the day it was checked.
    const renamed = await agent
      .patch(`/api/reminders/${created.body.id}`)
      .send({ patch: { title: "Call dad" }, expectedUpdatedAt: checked.body.updatedAt })
    expect(renamed.body.completedAt).toBe(checked.body.completedAt)

    const unchecked = await agent
      .patch(`/api/reminders/${created.body.id}`)
      .send({ patch: { completed: false }, expectedUpdatedAt: renamed.body.updatedAt })
    expect(unchecked.body.completedAt).toBeNull()
  })
})
