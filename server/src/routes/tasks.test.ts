import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()
const baseTask = {
  title: "Write tests",
  completed: false,
  priority: "medium",
  category: "Work",
  dueDate: null,
  time: null,
  endTime: null,
  completedAt: null,
}

describe("tasks router", () => {
  let agent: TestAgent

  beforeEach(async () => {
    await db.task.deleteMany({})
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    const res = await request(app).get("/api/tasks")
    expect(res.status).toBe(401)
  })

  it("creates and lists a task", async () => {
    const created = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID() })
    expect(created.status).toBe(201)
    expect(created.body.updatedAt).toBeTypeOf("string")

    const list = await agent.get("/api/tasks")
    expect(list.body).toHaveLength(1)
  })

  it("round-trips dueDate as the same YYYY-MM-DD string, no timezone drift", async () => {
    const created = await agent
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), dueDate: "2026-01-01" })
    expect(created.status).toBe(201)
    expect(created.body.dueDate).toBe("2026-01-01")

    const list = await agent.get("/api/tasks")
    expect(list.body[0].dueDate).toBe("2026-01-01")
  })

  it("round-trips time alongside dueDate, and clears it independently via patch", async () => {
    const created = await agent
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), dueDate: "2026-01-01", time: "14:30" })
    expect(created.status).toBe(201)
    expect(created.body.time).toBe("14:30")

    const list = await agent.get("/api/tasks")
    expect(list.body[0].time).toBe("14:30")

    // Rescheduling to a new time (the calendar's day/week drag) — dueDate
    // untouched, only time changes.
    const rescheduled = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { time: "09:15" }, expectedUpdatedAt: created.body.updatedAt })
    expect(rescheduled.status).toBe(200)
    expect(rescheduled.body.time).toBe("09:15")
    expect(rescheduled.body.dueDate).toBe("2026-01-01")

    const cleared = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { time: null }, expectedUpdatedAt: rescheduled.body.updatedAt })
    expect(cleared.status).toBe(200)
    expect(cleared.body.time).toBeNull()
  })

  it("rejects a time that isn't in HH:mm format", async () => {
    const res = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID(), time: "2:30pm" })
    expect(res.status).toBe(400)
  })

  it("round-trips endTime alongside time, independently of it", async () => {
    const created = await agent
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), dueDate: "2026-01-01", time: "14:30", endTime: "15:15" })
    expect(created.status).toBe(201)
    expect(created.body.endTime).toBe("15:15")

    // Resizing (dragging the block's bottom edge) — time untouched, only
    // endTime changes.
    const resized = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { endTime: "16:00" }, expectedUpdatedAt: created.body.updatedAt })
    expect(resized.status).toBe(200)
    expect(resized.body.endTime).toBe("16:00")
    expect(resized.body.time).toBe("14:30")

    const cleared = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { endTime: null }, expectedUpdatedAt: resized.body.updatedAt })
    expect(cleared.status).toBe(200)
    expect(cleared.body.endTime).toBeNull()
  })

  it("rejects an endTime that isn't in HH:mm format", async () => {
    const res = await agent
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), time: "14:30", endTime: "3:15pm" })
    expect(res.status).toBe(400)
  })

  it("round-trips completedAt when a task is marked completed", async () => {
    const created = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID() })
    expect(created.body.completedAt).toBeNull()

    const completedAt = new Date().toISOString()
    const res = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { completed: true, completedAt }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(200)
    expect(res.body.completedAt).toBe(completedAt)
  })

  it("rejects a malformed dueDate", async () => {
    const res = await agent
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), dueDate: "01/01/2026" })
    expect(res.status).toBe(400)
  })

  it("rejects an invalid task", async () => {
    const res = await agent
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), priority: "urgent" })
    expect(res.status).toBe(400)
  })

  it("updates a task when expectedUpdatedAt matches", async () => {
    const created = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID() })
    const res = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(200)
    expect(res.body.completed).toBe(true)
  })

  it("returns 409 with the current record on a stale expectedUpdatedAt", async () => {
    const created = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID() })
    await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { title: "First edit" }, expectedUpdatedAt: created.body.updatedAt })

    const res = await agent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { title: "Second edit" }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(409)
    expect(res.body.current.title).toBe("First edit")
  })

  it("returns 404 when patching a task that doesn't exist", async () => {
    const res = await agent
      .patch(`/api/tasks/${crypto.randomUUID()}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: new Date().toISOString() })
    expect(res.status).toBe(404)
  })

  it("returns 404 when patching a task that belongs to a different user", async () => {
    const created = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID() })
    const otherAgent = await createAuthenticatedAgent(app)
    const res = await otherAgent
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(404)
  })

  it("deletes a task", async () => {
    const created = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID() })
    expect((await agent.delete(`/api/tasks/${created.body.id}`)).status).toBe(204)
    expect((await agent.get("/api/tasks")).body).toHaveLength(0)
  })

  it("reorders tasks without touching other fields", async () => {
    const a = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID(), title: "A" })
    const b = await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID(), title: "B" })

    await agent.patch("/api/tasks/reorder").send([
      { id: b.body.id, order: 0 },
      { id: a.body.id, order: 1 },
    ])

    const list = await agent.get("/api/tasks")
    expect(list.body.map((t: { id: string }) => t.id)).toEqual([b.body.id, a.body.id])
    // Titles must be untouched — reorder only ever writes the `order` column.
    expect(list.body.map((t: { title: string }) => t.title)).toEqual(["B", "A"])
  })

  it("only lists this user's own tasks, not another user's", async () => {
    await agent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID(), title: "Mine" })
    const otherAgent = await createAuthenticatedAgent(app)
    await otherAgent.post("/api/tasks").send({ ...baseTask, id: crypto.randomUUID(), title: "Theirs" })

    const list = await agent.get("/api/tasks")
    expect(list.body.map((t: { title: string }) => t.title)).toEqual(["Mine"])
  })

  it("returns a JSON 404 for an unknown path under /api, not the SPA fallback", async () => {
    const res = await agent.get("/api/tasks/does/not/exist")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "Not found" })
  })
})
