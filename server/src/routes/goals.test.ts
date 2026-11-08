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

  it("stores an optional category, defaulting to none for older clients", async () => {
    const plain = await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID() })
    expect(plain.status).toBe(201)
    expect(plain.body.category).toBeNull()

    const patched = await agent
      .patch(`/api/goals/${plain.body.id}`)
      .send({ patch: { category: "Work" }, expectedUpdatedAt: plain.body.updatedAt })
    expect(patched.status).toBe(200)
    expect(patched.body.category).toBe("Work")

    const cleared = await agent
      .patch(`/api/goals/${plain.body.id}`)
      .send({ patch: { category: null }, expectedUpdatedAt: patched.body.updatedAt })
    expect(cleared.body.category).toBeNull()
  })

  it("stores subgoals with their own steps and derives progress on the server", async () => {
    const created = await agent.post("/api/goals").send({
      ...baseGoal,
      id: crypto.randomUUID(),
      progress: 99, // ignored — the server computes it
      milestones: [{ id: "s1", title: "Own step", completed: true }],
      subgoals: [
        {
          id: "g1",
          title: "Backend",
          milestones: [
            { id: "a", title: "A", completed: true },
            { id: "b", title: "B", completed: false },
          ],
        },
      ],
    })
    expect(created.status).toBe(201)
    // (1 own step done + 0.5 of the subgoal) / 2 parts = 75%
    expect(created.body.progress).toBe(75)
    expect(created.body.subgoals[0].milestones).toHaveLength(2)

    // A client sending only `milestones` with a wrong progress must not
    // erase the subgoals or store its wrong percentage.
    const ownOnly = await agent.patch(`/api/goals/${created.body.id}`).send({
      patch: { milestones: [{ id: "s1", title: "Own step", completed: false }], progress: 100 },
      expectedUpdatedAt: created.body.updatedAt,
    })
    expect(ownOnly.status).toBe(200)
    expect(ownOnly.body.subgoals).toHaveLength(1)
    expect(ownOnly.body.progress).toBe(25)

    const stale = await agent.patch(`/api/goals/${created.body.id}`).send({
      patch: { subgoals: [] },
      expectedUpdatedAt: created.body.updatedAt,
    })
    expect(stale.status).toBe(409)

    // Even a bare `progress` from the client is replaced by the derived value.
    const bare = await agent.patch(`/api/goals/${created.body.id}`).send({
      patch: { progress: 90 },
      expectedUpdatedAt: ownOnly.body.updatedAt,
    })
    expect(bare.body.progress).toBe(25)
  })

  it("keeps the shared order of the goal's own steps and subgoals", async () => {
    const created = await agent.post("/api/goals").send({
      ...baseGoal,
      id: crypto.randomUUID(),
      milestones: [{ id: "s1", title: "First", completed: false, order: 0 }],
      subgoals: [{ id: "g1", title: "Middle", milestones: [], order: 1 }],
    })
    expect(created.status).toBe(201)
    expect(created.body.milestones[0].order).toBe(0)
    expect(created.body.subgoals[0].order).toBe(1)

    // Subgoal moved above the step.
    const patched = await agent.patch(`/api/goals/${created.body.id}`).send({
      patch: {
        milestones: [{ id: "s1", title: "First", completed: false, order: 1 }],
        subgoals: [{ id: "g1", title: "Middle", milestones: [], order: 0 }],
      },
      expectedUpdatedAt: created.body.updatedAt,
    })
    expect(patched.status).toBe(200)
    const [stored] = (await agent.get("/api/goals")).body
    expect(stored.milestones[0].order).toBe(1)
    expect(stored.subgoals[0].order).toBe(0)
  })

  it("returns an empty subgoal list for goals created by older clients", async () => {
    const created = await agent.post("/api/goals").send({ ...baseGoal, id: crypto.randomUUID() })
    expect(created.body.subgoals).toEqual([])
    expect(created.body.progress).toBe(0)
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
