import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { db } from "../db.js"

const app = createApp()
const baseTask = {
  title: "Write tests",
  completed: false,
  priority: "medium",
  category: "Work",
  dueDate: null,
  completedAt: null,
}

describe("tasks router", () => {
  beforeEach(async () => {
    await db.task.deleteMany({})
  })

  it("creates and lists a task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID() })
    expect(created.status).toBe(201)
    expect(created.body.updatedAt).toBeTypeOf("string")

    const list = await request(app).get("/api/tasks")
    expect(list.body).toHaveLength(1)
  })

  it("round-trips dueDate as the same YYYY-MM-DD string, no timezone drift", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), dueDate: "2026-01-01" })
    expect(created.status).toBe(201)
    expect(created.body.dueDate).toBe("2026-01-01")

    const list = await request(app).get("/api/tasks")
    expect(list.body[0].dueDate).toBe("2026-01-01")
  })

  it("round-trips completedAt when a task is marked completed", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID() })
    expect(created.body.completedAt).toBeNull()

    const completedAt = new Date().toISOString()
    const res = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { completed: true, completedAt }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(200)
    expect(res.body.completedAt).toBe(completedAt)
  })

  it("rejects a malformed dueDate", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), dueDate: "01/01/2026" })
    expect(res.status).toBe(400)
  })

  it("rejects an invalid task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), priority: "urgent" })
    expect(res.status).toBe(400)
  })

  it("updates a task when expectedUpdatedAt matches", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID() })
    const res = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(200)
    expect(res.body.completed).toBe(true)
  })

  it("returns 409 with the current record on a stale expectedUpdatedAt", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID() })
    await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { title: "First edit" }, expectedUpdatedAt: created.body.updatedAt })

    const res = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ patch: { title: "Second edit" }, expectedUpdatedAt: created.body.updatedAt })
    expect(res.status).toBe(409)
    expect(res.body.current.title).toBe("First edit")
  })

  it("returns 404 when patching a task that doesn't exist", async () => {
    const res = await request(app)
      .patch(`/api/tasks/${crypto.randomUUID()}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: new Date().toISOString() })
    expect(res.status).toBe(404)
  })

  it("deletes a task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID() })
    expect((await request(app).delete(`/api/tasks/${created.body.id}`)).status).toBe(204)
    expect((await request(app).get("/api/tasks")).body).toHaveLength(0)
  })

  it("reorders tasks without touching other fields", async () => {
    const a = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), title: "A" })
    const b = await request(app)
      .post("/api/tasks")
      .send({ ...baseTask, id: crypto.randomUUID(), title: "B" })

    await request(app)
      .patch("/api/tasks/reorder")
      .send([
        { id: b.body.id, order: 0 },
        { id: a.body.id, order: 1 },
      ])

    const list = await request(app).get("/api/tasks")
    expect(list.body.map((t: { id: string }) => t.id)).toEqual([b.body.id, a.body.id])
    // Titles must be untouched — reorder only ever writes the `order` column.
    expect(list.body.map((t: { title: string }) => t.title)).toEqual(["B", "A"])
  })

  it("returns a JSON 404 for an unknown path under /api, not the SPA fallback", async () => {
    const res = await request(app).get("/api/tasks/does/not/exist")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "Not found" })
  })
})
