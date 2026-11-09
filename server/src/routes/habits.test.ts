import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()

async function generalGroupId(agent: TestAgent): Promise<string> {
  const groups = await agent.get("/api/habit-groups")
  return groups.body[0].id
}

describe("habits router", () => {
  let agent: TestAgent
  let baseHabit: {
    title: string
    icon: string
    color: string
    completedDates: string[]
    activeDays: number[]
    groupId: string
  }

  beforeEach(async () => {
    await db.habit.deleteMany({})
    await db.habitGroup.deleteMany({})
    agent = await createAuthenticatedAgent(app)
    baseHabit = {
      title: "Read",
      icon: "📚",
      color: "#6a9c74",
      completedDates: [],
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      groupId: await generalGroupId(agent),
    }
  })

  it("requires a session", async () => {
    const res = await request(app).get("/api/habits")
    expect(res.status).toBe(401)
  })

  it("creates and lists a habit", async () => {
    const created = await agent.post("/api/habits").send({ ...baseHabit, id: crypto.randomUUID() })
    expect(created.status).toBe(201)

    const list = await agent.get("/api/habits")
    expect(list.body).toHaveLength(1)
    expect(list.body[0].groupId).toBe(baseHabit.groupId)
  })

  it("toggles a completed date via patch, then rejects a stale patch", async () => {
    const created = await agent.post("/api/habits").send({ ...baseHabit, id: crypto.randomUUID() })

    const patched = await agent
      .patch(`/api/habits/${created.body.id}`)
      .send({ patch: { completedDates: ["2026-09-16"] }, expectedUpdatedAt: created.body.updatedAt })
    expect(patched.status).toBe(200)
    expect(patched.body.completedDates).toEqual(["2026-09-16"])

    const stale = await agent
      .patch(`/api/habits/${created.body.id}`)
      .send({ patch: { completedDates: [] }, expectedUpdatedAt: created.body.updatedAt })
    expect(stale.status).toBe(409)
  })

  it("reorder returns fresh updatedAt so a follow-up patch isn't a false conflict", async () => {
    const a = await agent.post("/api/habits").send({ ...baseHabit, id: crypto.randomUUID(), title: "A" })
    const b = await agent.post("/api/habits").send({ ...baseHabit, id: crypto.randomUUID(), title: "B" })

    const reordered = await agent.patch("/api/habits/reorder").send([
      { id: b.body.id, order: 0 },
      { id: a.body.id, order: 1 },
    ])
    expect(reordered.status).toBe(200)
    const freshUpdatedAt = reordered.body.find((h: { id: string }) => h.id === a.body.id).updatedAt

    // The pre-reorder timestamp is now stale — a patch carrying it must be
    // rejected as a conflict (reorder really did touch this row's updatedAt).
    const withStaleTimestamp = await agent
      .patch(`/api/habits/${a.body.id}`)
      .send({ patch: { completedDates: ["2026-09-16"] }, expectedUpdatedAt: a.body.updatedAt })
    expect(withStaleTimestamp.status).toBe(409)

    // But the timestamp the reorder response just returned must work —
    // this is the bug: the client needs this value, or every next patch
    // after a reorder falsely reports "changed elsewhere".
    const withFreshTimestamp = await agent
      .patch(`/api/habits/${a.body.id}`)
      .send({ patch: { completedDates: ["2026-09-16"] }, expectedUpdatedAt: freshUpdatedAt })
    expect(withFreshTimestamp.status).toBe(200)
  })

  it("deletes a habit", async () => {
    const created = await agent.post("/api/habits").send({ ...baseHabit, id: crypto.randomUUID() })
    expect((await agent.delete(`/api/habits/${created.body.id}`)).status).toBe(204)
    expect((await agent.get("/api/habits")).body).toHaveLength(0)
  })

  it("only lists this user's own habits, not another user's", async () => {
    await agent.post("/api/habits").send({ ...baseHabit, id: crypto.randomUUID(), title: "Mine" })
    const otherAgent = await createAuthenticatedAgent(app)
    const otherGroupId = await generalGroupId(otherAgent)
    await otherAgent
      .post("/api/habits")
      .send({ ...baseHabit, groupId: otherGroupId, id: crypto.randomUUID(), title: "Theirs" })

    const list = await agent.get("/api/habits")
    expect(list.body.map((h: { title: string }) => h.title)).toEqual(["Mine"])
  })

  it("rejects creating a habit with a group id that doesn't belong to this user", async () => {
    const otherAgent = await createAuthenticatedAgent(app)
    const otherGroupId = await generalGroupId(otherAgent)

    const res = await agent
      .post("/api/habits")
      .send({ ...baseHabit, groupId: otherGroupId, id: crypto.randomUUID() })
    expect(res.status).toBe(400)
  })
})
