import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()

describe("categories router", () => {
  let agent: TestAgent

  beforeEach(async () => {
    await db.category.deleteMany({})
    await db.task.deleteMany({})
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    const res = await request(app).get("/api/categories")
    expect(res.status).toBe(401)
  })

  it("seeds the 4 default categories the first time a new user asks for their list", async () => {
    const list = await agent.get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Work", "Personal", "Health", "Learning"])
  })

  it("does not reseed defaults once the user already has categories", async () => {
    await agent.get("/api/categories") // triggers the seed
    const created = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Side project" })
    expect(created.status).toBe(201)

    const list = await agent.get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual([
      "Work",
      "Personal",
      "Health",
      "Learning",
      "Side project",
    ])
  })

  it("creates and lists a category, appended after existing ones", async () => {
    const first = await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect(first.status).toBe(201)

    const second = await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Personal" })
    expect(second.status).toBe(201)

    const list = await agent.get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Work", "Personal"])
  })

  it("rejects a duplicate category name for the same user", async () => {
    await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    const res = await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect(res.status).toBe(500)
  })

  it("allows two different users to each have a category with the same name", async () => {
    const first = await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect(first.status).toBe(201)

    const otherAgent = await createAuthenticatedAgent(app)
    const second = await otherAgent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect(second.status).toBe(201)
  })

  it("deleting a category also deletes tasks that were in it, but not other categories' tasks", async () => {
    const category = await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Errands" })

    const inCategory = await agent.post("/api/tasks").send({
      id: crypto.randomUUID(),
      title: "Buy milk",
      completed: false,
      priority: "low",
      category: "Errands",
      dueDate: null,
      completedAt: null,
    })
    const elsewhere = await agent.post("/api/tasks").send({
      id: crypto.randomUUID(),
      title: "Unrelated",
      completed: false,
      priority: "low",
      category: "Work",
      dueDate: null,
      completedAt: null,
    })

    expect((await agent.delete(`/api/categories/${category.body.id}`)).status).toBe(204)

    const list = await agent.get("/api/tasks")
    const remainingIds = list.body.map((t: { id: string }) => t.id)
    expect(remainingIds).not.toContain(inCategory.body.id)
    expect(remainingIds).toContain(elsewhere.body.id)
  })

  it("deletes a category — an empty list is re-seeded with defaults on the next fetch", async () => {
    const created = await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect((await agent.delete(`/api/categories/${created.body.id}`)).status).toBe(204)

    // No categories left for this user, so the next GET re-triggers the
    // same lazy seed a brand-new user would get — there's no "permanently
    // empty" state, by design.
    const list = await agent.get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Work", "Personal", "Health", "Learning"])
  })
})
