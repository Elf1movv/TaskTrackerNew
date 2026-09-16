import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
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
  beforeEach(async () => {
    await db.goal.deleteMany({})
  })

  it("creates a goal with milestones and lists it", async () => {
    const created = await request(app)
      .post("/api/goals")
      .send({
        ...baseGoal,
        id: crypto.randomUUID(),
        milestones: [{ id: crypto.randomUUID(), title: "Step 1", completed: false }],
      })
    expect(created.status).toBe(201)
    expect(created.body.milestones).toHaveLength(1)

    const list = await request(app).get("/api/goals")
    expect(list.body).toHaveLength(1)
  })

  it("patches milestones as part of the goal and returns 409 on a stale update", async () => {
    const created = await request(app)
      .post("/api/goals")
      .send({ ...baseGoal, id: crypto.randomUUID() })

    const firstPatch = await request(app)
      .patch(`/api/goals/${created.body.id}`)
      .send({
        patch: { milestones: [{ id: crypto.randomUUID(), title: "Step 1", completed: false }] },
        expectedUpdatedAt: created.body.updatedAt,
      })
    expect(firstPatch.status).toBe(200)
    expect(firstPatch.body.milestones).toHaveLength(1)

    const stale = await request(app)
      .patch(`/api/goals/${created.body.id}`)
      .send({ patch: { progress: 50 }, expectedUpdatedAt: created.body.updatedAt })
    expect(stale.status).toBe(409)
  })

  it("deletes a goal", async () => {
    const created = await request(app)
      .post("/api/goals")
      .send({ ...baseGoal, id: crypto.randomUUID() })
    expect((await request(app).delete(`/api/goals/${created.body.id}`)).status).toBe(204)
    expect((await request(app).get("/api/goals")).body).toHaveLength(0)
  })
})
