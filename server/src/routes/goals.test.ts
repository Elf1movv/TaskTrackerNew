import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()
const baseGoal = {
  title: "Learn TypeScript",
  description: "",
  progress: 0,
  targetDate: "2026-12-31",
  color: "#5b7fc7",
  milestones: [],
}

describe("goals router", () => {
  let agent: TestAgent

  beforeEach(async () => {
    await db.goal.deleteMany({})
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    const res = await request(app).get("/api/goals")
    expect(res.status).toBe(401)
  })

  it("creates a goal with milestones and lists it", async () => {
    const created = await agent.post("/api/goals").send({
      ...baseGoal,
      id: crypto.randomUUID(),
      milestones: [{ id: crypto.randomUUID(), title: "Step 1", completed: false }],
    })
    expect(created.status).toBe(201)
    expect(created.body.milestones).toHaveLength(1)

    const list = await agent.get("/api/goals")
    expect(list.body).toHaveLength(1)
  })

  it("patches milestones as part of the goal and returns 409 on a stale update", async () => {
    const created = await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID() })

    const firstPatch = await agent.patch(`/api/goals/${created.body.id}`).send({
      patch: { milestones: [{ id: crypto.randomUUID(), title: "Step 1", completed: false }] },
      expectedUpdatedAt: created.body.updatedAt,
    })
    expect(firstPatch.status).toBe(200)
    expect(firstPatch.body.milestones).toHaveLength(1)

    const stale = await agent
      .patch(`/api/goals/${created.body.id}`)
      .send({ patch: { progress: 50 }, expectedUpdatedAt: created.body.updatedAt })
    expect(stale.status).toBe(409)
  })

  it("reorder returns fresh updatedAt so a follow-up patch isn't a false conflict", async () => {
    const a = await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID(), title: "A" })
    const b = await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID(), title: "B" })

    const reordered = await agent.patch("/api/goals/reorder").send([
      { id: b.body.id, order: 0 },
      { id: a.body.id, order: 1 },
    ])
    expect(reordered.status).toBe(200)
    const freshUpdatedAt = reordered.body.find((g: { id: string }) => g.id === a.body.id).updatedAt

    const withStaleTimestamp = await agent
      .patch(`/api/goals/${a.body.id}`)
      .send({ patch: { progress: 25 }, expectedUpdatedAt: a.body.updatedAt })
    expect(withStaleTimestamp.status).toBe(409)

    const withFreshTimestamp = await agent
      .patch(`/api/goals/${a.body.id}`)
      .send({ patch: { progress: 25 }, expectedUpdatedAt: freshUpdatedAt })
    expect(withFreshTimestamp.status).toBe(200)
  })

  it("deletes a goal", async () => {
    const created = await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID() })
    expect((await agent.delete(`/api/goals/${created.body.id}`)).status).toBe(204)
    expect((await agent.get("/api/goals")).body).toHaveLength(0)
  })

  it("only lists this user's own goals, not another user's", async () => {
    await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID(), title: "Mine" })
    const otherAgent = await createAuthenticatedAgent(app)
    await otherAgent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID(), title: "Theirs" })

    const list = await agent.get("/api/goals")
    expect(list.body.map((g: { title: string }) => g.title)).toEqual(["Mine"])
  })
})
