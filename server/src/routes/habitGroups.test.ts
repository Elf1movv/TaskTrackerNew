import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()

describe("habit groups router", () => {
  let agent: TestAgent

  beforeEach(async () => {
    await db.habit.deleteMany({})
    await db.habitGroup.deleteMany({})
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    const res = await request(app).get("/api/habit-groups")
    expect(res.status).toBe(401)
  })

  it("seeds exactly one General group the first time a new user asks for their list", async () => {
    const list = await agent.get("/api/habit-groups")
    expect(list.body).toHaveLength(1)
    expect(list.body[0].isGeneral).toBe(true)
  })

  it("does not reseed a second General group on later fetches", async () => {
    await agent.get("/api/habit-groups")
    const list = await agent.get("/api/habit-groups")
    expect(list.body.filter((g: { isGeneral: boolean }) => g.isGeneral)).toHaveLength(1)
  })

  it("creates and lists a habit group, appended after existing ones", async () => {
    await agent.get("/api/habit-groups") // triggers the General seed
    const created = await agent
      .post("/api/habit-groups")
      .send({ id: crypto.randomUUID(), title: "Morning", icon: "🌅", color: "#c97b3a" })
    expect(created.status).toBe(201)
    expect(created.body.isGeneral).toBe(false)

    const list = await agent.get("/api/habit-groups")
    expect(list.body.map((g: { title: string }) => g.title)).toEqual(["General", "Morning"])
  })

  it("allows renaming/re-icon/re-coloring the General group, only deleting stays blocked", async () => {
    const list = await agent.get("/api/habit-groups")
    const general = list.body[0]

    const res = await agent.patch(`/api/habit-groups/${general.id}`).send({
      patch: { title: "Misc", icon: "🗂️", color: "#5b7fc7" },
      expectedUpdatedAt: general.updatedAt,
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ title: "Misc", icon: "🗂️", color: "#5b7fc7", isGeneral: true })
  })

  it("rejects deleting the General group", async () => {
    const list = await agent.get("/api/habit-groups")
    const general = list.body[0]

    const res = await agent.delete(`/api/habit-groups/${general.id}`)
    expect(res.status).toBe(400)
  })

  it("deleting a custom group reassigns its habits to General instead of deleting them", async () => {
    const generalId = (await agent.get("/api/habit-groups")).body[0].id
    const morning = await agent
      .post("/api/habit-groups")
      .send({ id: crypto.randomUUID(), title: "Morning", icon: "🌅", color: "#c97b3a" })

    const habit = await agent.post("/api/habits").send({
      id: crypto.randomUUID(),
      title: "Stretch",
      icon: "🧘",
      color: "#6a9c74",
      completedDates: [],
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      groupId: morning.body.id,
    })

    expect((await agent.delete(`/api/habit-groups/${morning.body.id}`)).status).toBe(204)

    const habits = await agent.get("/api/habits")
    const moved = habits.body.find((h: { id: string }) => h.id === habit.body.id)
    expect(moved.groupId).toBe(generalId)
  })

  it("reorder returns fresh updatedAt so a follow-up patch isn't a false conflict", async () => {
    await agent.get("/api/habit-groups") // triggers the General seed
    const a = await agent
      .post("/api/habit-groups")
      .send({ id: crypto.randomUUID(), title: "A", icon: "🅰️", color: "#c97b3a" })
    const b = await agent
      .post("/api/habit-groups")
      .send({ id: crypto.randomUUID(), title: "B", icon: "🅱️", color: "#6a9c74" })

    const reordered = await agent.patch("/api/habit-groups/reorder").send([
      { id: b.body.id, order: 0 },
      { id: a.body.id, order: 1 },
    ])
    expect(reordered.status).toBe(200)
    const freshUpdatedAt = reordered.body.find((g: { id: string }) => g.id === a.body.id).updatedAt

    const withStaleTimestamp = await agent
      .patch(`/api/habit-groups/${a.body.id}`)
      .send({ patch: { title: "A2" }, expectedUpdatedAt: a.body.updatedAt })
    expect(withStaleTimestamp.status).toBe(409)

    const withFreshTimestamp = await agent
      .patch(`/api/habit-groups/${a.body.id}`)
      .send({ patch: { title: "A2" }, expectedUpdatedAt: freshUpdatedAt })
    expect(withFreshTimestamp.status).toBe(200)
  })

  it("only lists this user's own habit groups, not another user's", async () => {
    await agent.get("/api/habit-groups")
    await agent
      .post("/api/habit-groups")
      .send({ id: crypto.randomUUID(), title: "Mine", icon: "🅰️", color: "#c97b3a" })

    const otherAgent = await createAuthenticatedAgent(app)
    await otherAgent.get("/api/habit-groups")
    await otherAgent
      .post("/api/habit-groups")
      .send({ id: crypto.randomUUID(), title: "Theirs", icon: "🅱️", color: "#6a9c74" })

    const list = await agent.get("/api/habit-groups")
    expect(list.body.map((g: { title: string }) => g.title)).toEqual(["General", "Mine"])
  })
})
