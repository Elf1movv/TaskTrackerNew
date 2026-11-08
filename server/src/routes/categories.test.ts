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

  it("seeds the 4 default categories, each with a distinct color, the first time a new user asks for their list", async () => {
    const list = await agent.get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Work", "Personal", "Health", "Learning"])
    const colors = list.body.map((c: { color: string }) => c.color)
    expect(colors.every((c: string) => typeof c === "string" && c.length > 0)).toBe(true)
    expect(new Set(colors).size).toBe(4)
  })

  it("does not reseed defaults once the user already has categories", async () => {
    await agent.get("/api/categories") // triggers the seed
    const created = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Side project", color: "#c97b3a" })
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
    const first = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Work", color: "#5b7fc7" })
    expect(first.status).toBe(201)
    expect(first.body.color).toBe("#5b7fc7")

    const second = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Personal", color: "#6a9c74" })
    expect(second.status).toBe(201)

    const list = await agent.get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Work", "Personal"])
  })

  it("rejects a duplicate category name for the same user with a clean 409, not a raw 500", async () => {
    await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work", color: "#c97b3a" })
    const res = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Work", color: "#c97b3a" })
    expect(res.status).toBe(409)
    expect(res.body.error).toBeTruthy()
  })

  it("allows two different users to each have a category with the same name", async () => {
    const first = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Work", color: "#c97b3a" })
    expect(first.status).toBe(201)

    const otherAgent = await createAuthenticatedAgent(app)
    const second = await otherAgent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Work", color: "#c97b3a" })
    expect(second.status).toBe(201)
  })

  it("updates a category's color", async () => {
    const created = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Errands", color: "#c97b3a" })

    const patched = await agent
      .patch(`/api/categories/${created.body.id}`)
      .send({ patch: { color: "#6a9c74" }, expectedUpdatedAt: created.body.updatedAt })
    expect(patched.status).toBe(200)
    expect(patched.body.color).toBe("#6a9c74")
  })

  it("deleting a category also deletes tasks that were in it, but not other categories' tasks", async () => {
    const category = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Errands", color: "#c97b3a" })

    const inCategory = await agent.post("/api/tasks").send({
      id: crypto.randomUUID(),
      title: "Buy milk",
      completed: false,
      priority: "low",
      category: "Errands",
      dueDate: null,
      time: null,
      endTime: null,
      completedAt: null,
      description: null,
    })
    const elsewhere = await agent.post("/api/tasks").send({
      id: crypto.randomUUID(),
      title: "Unrelated",
      completed: false,
      priority: "low",
      category: "Work",
      dueDate: null,
      time: null,
      endTime: null,
      completedAt: null,
      description: null,
    })

    expect((await agent.delete(`/api/categories/${category.body.id}`)).status).toBe(204)

    const list = await agent.get("/api/tasks")
    const remainingIds = list.body.map((t: { id: string }) => t.id)
    expect(remainingIds).not.toContain(inCategory.body.id)
    expect(remainingIds).toContain(elsewhere.body.id)
  })

  it("deleting a category keeps its goals and only clears their category", async () => {
    const category = await agent
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Errands", color: "#c97b3a" })
    const goal = (category: string | null) =>
      agent.post("/api/goals").send({
        id: crypto.randomUUID(),
        title: `Goal ${category}`,
        description: "",
        progress: 0,
        targetDate: null,
        color: "#5b7fc7",
        category,
        milestones: [],
      })
    const inCategory = (await goal("Errands")).body
    const elsewhere = (await goal("Work")).body

    expect((await agent.delete(`/api/categories/${category.body.id}`)).status).toBe(204)

    const goals = (await agent.get("/api/goals")).body as { id: string; category: string | null }[]
    expect(goals.find(g => g.id === inCategory.id)?.category).toBeNull()
    expect(goals.find(g => g.id === elsewhere.id)?.category).toBe("Work")
  })

  it("deleting the last category does not resurrect the defaults on the next fetch", async () => {
    await agent.get("/api/categories") // triggers the seed
    const all = await agent.get("/api/categories")
    await Promise.all(all.body.map((c: { id: string }) => agent.delete(`/api/categories/${c.id}`)))

    // categoriesSeeded stays true once set, so an empty list here means the
    // user deliberately deleted everything, not that they're new — the
    // next GET must leave it empty, not silently bring the defaults back.
    const list = await agent.get("/api/categories")
    expect(list.body).toEqual([])
  })

  it("seeds the defaults in Russian when the client shows Russian", async () => {
    const list = await agent.get("/api/categories").set("X-Language", "ru")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Работа", "Личное", "Здоровье", "Учёба"])
  })

  describe("rename", () => {
    const task = (category: string) =>
      agent.post("/api/tasks").send({
        id: crypto.randomUUID(),
        title: `Task ${category}`,
        completed: false,
        priority: "low",
        category,
        dueDate: null,
        time: null,
        endTime: null,
        completedAt: null,
        description: null,
      })
    const goal = (category: string) =>
      agent.post("/api/goals").send({
        id: crypto.randomUUID(),
        title: `Goal ${category}`,
        description: "",
        progress: 0,
        targetDate: null,
        color: "#5b7fc7",
        category,
        milestones: [],
      })

    it("carries the category's tasks and goals over to the new name", async () => {
      const work = (
        await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work", color: "#5b7fc7" })
      ).body
      await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Home", color: "#6a9c74" })
      const moved = (await task("Work")).body
      const kept = (await task("Home")).body
      const movedGoal = (await goal("Work")).body

      const res = await agent
        .patch(`/api/categories/${work.id}`)
        .send({ patch: { name: "Работа" }, expectedUpdatedAt: work.updatedAt })
      expect(res.status).toBe(200)
      expect(res.body.name).toBe("Работа")

      const tasks = (await agent.get("/api/tasks")).body as { id: string; category: string }[]
      expect(tasks.find(t => t.id === moved.id)?.category).toBe("Работа")
      expect(tasks.find(t => t.id === kept.id)?.category).toBe("Home")
      const goals = (await agent.get("/api/goals")).body as { id: string; category: string | null }[]
      expect(goals.find(g => g.id === movedGoal.id)?.category).toBe("Работа")
    })

    it("refuses a name another category already has, and changes nothing", async () => {
      const work = (
        await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work", color: "#5b7fc7" })
      ).body
      await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Home", color: "#6a9c74" })
      const moved = (await task("Work")).body

      const res = await agent
        .patch(`/api/categories/${work.id}`)
        .send({ patch: { name: "Home" }, expectedUpdatedAt: work.updatedAt })
      expect(res.status).toBe(409)
      expect(res.body.error).toBe("Category name already exists")
      const tasks = (await agent.get("/api/tasks")).body as { id: string; category: string }[]
      expect(tasks.find(t => t.id === moved.id)?.category).toBe("Work")
    })

    it("still rejects a stale expectedUpdatedAt", async () => {
      const work = (
        await agent.post("/api/categories").send({ id: crypto.randomUUID(), name: "Work", color: "#5b7fc7" })
      ).body
      const res = await agent
        .patch(`/api/categories/${work.id}`)
        .send({ patch: { name: "Job" }, expectedUpdatedAt: new Date(0).toISOString() })
      expect(res.status).toBe(409)
      expect(res.body.current.name).toBe("Work")
    })
  })
})
