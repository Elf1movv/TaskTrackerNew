import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { db } from "../db.js"

const app = createApp()
const baseHabit = {
  title: "Read",
  icon: "📚",
  color: "#6a9c74",
  completedDates: [],
}

describe("habits router", () => {
  beforeEach(async () => {
    await db.habit.deleteMany({})
  })

  it("creates and lists a habit", async () => {
    const created = await request(app)
      .post("/api/habits")
      .send({ ...baseHabit, id: crypto.randomUUID() })
    expect(created.status).toBe(201)

    const list = await request(app).get("/api/habits")
    expect(list.body).toHaveLength(1)
  })

  it("toggles a completed date via patch, then rejects a stale patch", async () => {
    const created = await request(app)
      .post("/api/habits")
      .send({ ...baseHabit, id: crypto.randomUUID() })

    const patched = await request(app)
      .patch(`/api/habits/${created.body.id}`)
      .send({ patch: { completedDates: ["2026-09-16"] }, expectedUpdatedAt: created.body.updatedAt })
    expect(patched.status).toBe(200)
    expect(patched.body.completedDates).toEqual(["2026-09-16"])

    const stale = await request(app)
      .patch(`/api/habits/${created.body.id}`)
      .send({ patch: { completedDates: [] }, expectedUpdatedAt: created.body.updatedAt })
    expect(stale.status).toBe(409)
  })

  it("deletes a habit", async () => {
    const created = await request(app)
      .post("/api/habits")
      .send({ ...baseHabit, id: crypto.randomUUID() })
    expect((await request(app).delete(`/api/habits/${created.body.id}`)).status).toBe(204)
    expect((await request(app).get("/api/habits")).body).toHaveLength(0)
  })
})
