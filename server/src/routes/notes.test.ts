import { beforeEach, describe, expect, it } from "vitest"
import type { TestAgent } from "supertest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
const app = createApp()
const fields = { title: "Existing note", description: "A line", showFrom: null, archivedAt: null }
describe("note lifecycle", () => {
  let agent: TestAgent
  beforeEach(async () => {
    agent = await createAuthenticatedAgent(app)
  })
  it("defaults older clients to incomplete, persists completion independently of archive, and deletes", async () => {
    const created = await agent.post("/api/notes").send({ ...fields, id: crypto.randomUUID() })
    expect(created.status).toBe(201)
    expect(created.body.completed).toBe(false)
    const done = await agent
      .patch(`/api/notes/${created.body.id}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: created.body.updatedAt })
    expect(done.status).toBe(200)
    expect((await agent.get("/api/notes")).body[0]).toMatchObject({ completed: true, archivedAt: null })
    const edited = await agent.patch(`/api/notes/${created.body.id}`).send({
      patch: { title: "Edited completed note", archivedAt: "2026-10-10T12:00:00.000Z" },
      expectedUpdatedAt: done.body.updatedAt,
    })
    expect(edited.body.completed).toBe(true)
    const restored = await agent
      .patch(`/api/notes/${created.body.id}`)
      .send({ patch: { archivedAt: null, completed: false }, expectedUpdatedAt: edited.body.updatedAt })
    expect(restored.body).toMatchObject({ completed: false, archivedAt: null })
    expect((await agent.get("/api/tasks")).body).toHaveLength(0)
    expect((await agent.get("/api/plans")).body).toHaveLength(0)
    expect((await agent.delete(`/api/notes/${created.body.id}`)).status).toBe(204)
    expect((await agent.get("/api/notes")).body).toHaveLength(0)
  })
  it("persists manual order, returns fresh versions, and rejects stale edits", async () => {
    const first = (
      await agent.post("/api/notes").send({ ...fields, id: crypto.randomUUID(), showFrom: "2099-01-01" })
    ).body
    const second = (
      await agent.post("/api/notes").send({ ...fields, id: crypto.randomUUID(), showFrom: "2099-02-01" })
    ).body
    const order = await agent.patch("/api/notes/reorder").send([
      { id: second.id, order: 0 },
      { id: first.id, order: 1 },
    ])
    expect(order.status).toBe(200)
    const loaded = (await agent.get("/api/notes")).body
    expect(loaded.map((n: { id: string }) => n.id)).toEqual([second.id, first.id])
    const done = await agent
      .patch(`/api/notes/${second.id}`)
      .send({ patch: { completed: true }, expectedUpdatedAt: loaded[0].updatedAt })
    expect(done.status).toBe(200)
    const stale = await agent
      .patch(`/api/notes/${second.id}`)
      .send({ patch: { title: "Stale" }, expectedUpdatedAt: loaded[0].updatedAt })
    expect(stale.status).toBe(409)
    expect(stale.body.current.completed).toBe(true)
  })
  it("prevents another owner from completing, reordering or deleting a note", async () => {
    const note = (await agent.post("/api/notes").send({ ...fields, id: crypto.randomUUID() })).body
    const other = await createAuthenticatedAgent(app)
    expect(
      (
        await other
          .patch(`/api/notes/${note.id}`)
          .send({ patch: { completed: true }, expectedUpdatedAt: note.updatedAt })
      ).status,
    ).toBe(404)
    await other.patch("/api/notes/reorder").send([{ id: note.id, order: 99 }])
    await other.delete(`/api/notes/${note.id}`)
    expect((await other.get("/api/notes")).body).toEqual([])
    expect((await agent.get("/api/notes")).body[0]).toEqual(note)
  })
})
