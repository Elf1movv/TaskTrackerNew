import { beforeEach, describe, expect, it } from "vitest"
import request, { type TestAgent } from "supertest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"
const app = createApp()
const taskData = {
  title: "Proposal",
  completed: false,
  priority: "medium",
  category: "Work",
  dueDate: "2030-01-15",
  time: null,
  endTime: null,
  completedAt: null,
  description: "Original detail",
}
const planData = {
  title: "Meeting",
  description: null,
  date: "2030-01-10",
  time: "10:00",
  endTime: "11:00",
  durationMinutes: 60,
  onHold: false,
  completed: false,
  priority: "medium",
  category: "",
  taskId: null,
}
const goalData = {
  title: "Launch",
  description: "Outcome",
  progress: 0,
  targetDate: null,
  color: "#5b7fc7",
  milestones: [],
}
async function createTask(agent: TestAgent) {
  const r = await agent.post("/api/tasks").send({ ...taskData, id: crypto.randomUUID() })
  expect(r.status).toBe(201)
  return r.body
}
async function createPlan(agent: TestAgent, fields = {}) {
  const r = await agent.post("/api/plans").send({ ...planData, ...fields, id: crypto.randomUUID() })
  expect(r.status).toBe(201)
  return r.body
}
describe("independent product entities", () => {
  let agent: TestAgent
  beforeEach(async () => {
    agent = await createAuthenticatedAgent(app)
  })
  it("requires authentication", async () => {
    for (const path of ["notes", "plans", "transition"])
      expect((await request(app).get(`/api/${path}`)).status).toBe(401)
  })
  it("keeps notes and standalone plans out of tasks", async () => {
    const note = await agent.post("/api/notes").send({
      id: crypto.randomUUID(),
      title: "Remember",
      description: "Long\ntext",
      showFrom: "2030-01-01",
      archivedAt: null,
    })
    expect(note.status).toBe(201)
    expect(note.body.showFrom).toBe("2030-01-01")
    await createPlan(agent)
    expect((await agent.get("/api/tasks")).body).toHaveLength(0)
    expect((await agent.get("/api/notes")).body).toHaveLength(1)
  })
  it("keeps tasks, plans and goal milestones independent through edits and deletion", async () => {
    const task = await createTask(agent)
    expect((await agent.get("/api/plans")).body).toHaveLength(0)
    const first = await createPlan(agent)
    const second = await createPlan(agent, { date: "2030-01-11" })
    const goal = await agent.post("/api/goals").send({
      ...goalData,
      id: crypto.randomUUID(),
      milestones: [{ id: "own", title: "Own milestone", completed: false }],
    })
    expect(goal.status).toBe(201)
    await agent
      .patch(`/api/plans/${first.id}`)
      .send({ patch: { completed: true, date: "2030-01-12" }, expectedUpdatedAt: first.updatedAt })
    expect((await agent.get("/api/tasks")).body[0]).toMatchObject({ completed: false, dueDate: "2030-01-15" })
    await agent
      .patch(`/api/tasks/${task.id}`)
      .send({ patch: { title: "Renamed", completed: true }, expectedUpdatedAt: task.updatedAt })
    const plans = (await agent.get("/api/plans")).body
    expect(plans.find((p: { id: string }) => p.id === second.id)).toMatchObject({
      title: "Meeting",
      completed: false,
      date: "2030-01-11",
    })
    expect((await agent.get("/api/goals")).body[0]).toMatchObject({
      progress: 0,
      milestones: [{ id: "own", completed: false, title: "Own milestone" }],
    })
    await agent.patch(`/api/goals/${goal.body.id}`).send({
      patch: { milestones: [{ id: "own", title: "Own milestone", completed: true }], progress: 100 },
      expectedUpdatedAt: goal.body.updatedAt,
    })
    expect((await agent.get("/api/tasks")).body).toHaveLength(1)
    expect((await agent.get("/api/plans")).body).toHaveLength(2)
    await agent.delete(`/api/tasks/${task.id}`)
    expect((await agent.get("/api/plans")).body).toHaveLength(2)
    await agent.delete(`/api/goals/${goal.body.id}`)
    expect((await agent.get("/api/plans")).body).toHaveLength(2)
  })
  it("rejects experimental relationships from stale clients", async () => {
    const task = await createTask(agent)
    const goal = await agent.post("/api/goals").send({ ...goalData, id: crypto.randomUUID() })
    expect(
      (await agent.post("/api/plans").send({ ...planData, id: crypto.randomUUID(), taskId: task.id })).status,
    ).toBe(400)
    expect(
      (
        await agent
          .patch(`/api/tasks/${task.id}`)
          .send({ patch: { goalId: goal.body.id }, expectedUpdatedAt: task.updatedAt })
      ).status,
    ).toBe(400)
    expect(
      (
        await agent.post("/api/reminders").send({
          id: crypto.randomUUID(),
          title: "Obsolete link",
          date: "2030-01-01",
          time: null,
          completed: false,
          priority: "normal",
          taskId: task.id,
        })
      ).status,
    ).toBe(400)
    expect((await agent.get("/api/plans")).body).toHaveLength(0)
  })
  it("rejects foreign links and version conflicts", async () => {
    const other = await createAuthenticatedAgent(app)
    const foreign = await createTask(other)
    expect(
      (await agent.post("/api/plans").send({ ...planData, id: crypto.randomUUID(), taskId: foreign.id }))
        .status,
    ).toBe(400)
    const plan = await createPlan(agent)
    expect((await other.get("/api/plans")).body).toHaveLength(0)
    expect(
      (
        await other
          .patch(`/api/plans/${plan.id}`)
          .send({ patch: { title: "Stolen" }, expectedUpdatedAt: plan.updatedAt })
      ).status,
    ).toBe(404)
    await agent
      .patch(`/api/plans/${plan.id}`)
      .send({ patch: { title: "Changed" }, expectedUpdatedAt: plan.updatedAt })
    const conflict = await agent
      .patch(`/api/plans/${plan.id}`)
      .send({ patch: { title: "Stale" }, expectedUpdatedAt: plan.updatedAt })
    expect(conflict.status).toBe(409)
    expect(conflict.body.current.title).toBe("Changed")
  })
  it("holds and reschedules a plan without affecting ordinary reminders or tasks", async () => {
    const plan = await createPlan(agent)
    const task = await createTask(agent)
    const reminder = await agent.post("/api/reminders").send({
      id: crypto.randomUUID(),
      title: "Independent signal",
      date: "2030-01-10",
      time: "09:30",
      completed: false,
      priority: "normal",
    })
    expect(reminder.status).toBe(201)
    const held = await agent.patch(`/api/plans/${plan.id}`).send({
      patch: { onHold: true, date: null, time: null, endTime: null },
      expectedUpdatedAt: plan.updatedAt,
    })
    expect(held.status).toBe(200)
    expect(held.body.durationMinutes).toBe(60)
    const resumed = await agent.patch(`/api/plans/${plan.id}`).send({
      patch: { onHold: false, date: "2030-01-12", time: "14:00", endTime: "15:00" },
      expectedUpdatedAt: held.body.updatedAt,
    })
    expect(resumed.status).toBe(200)
    expect((await agent.get("/api/reminders")).body[0]).toMatchObject({
      date: "2030-01-10",
      time: "09:30",
      completed: false,
    })
    expect((await agent.get("/api/tasks")).body[0]).toEqual(task)
    await agent.delete(`/api/plans/${plan.id}`)
    expect((await agent.get("/api/reminders")).body).toHaveLength(1)
    expect((await agent.get("/api/tasks")).body).toHaveLength(1)
  })
  it("rejects impossible dates and reversed intervals", async () => {
    for (const patch of [
      { date: "2030-02-30" },
      { endTime: "09:00" },
      { time: "25:00" },
      { date: null },
      { onHold: true },
    ])
      expect(
        (await agent.post("/api/plans").send({ ...planData, ...patch, id: crypto.randomUUID() })).status,
      ).toBe(400)
  })
  it("derives duration from the interval and preserves short legacy intervals on hold", async () => {
    const plan = await createPlan(agent, { endTime: "10:07", durationMinutes: 60 })
    expect(plan.durationMinutes).toBe(7)
    const held = await agent.patch(`/api/plans/${plan.id}`).send({
      patch: { onHold: true, date: null, time: null, endTime: null, durationMinutes: 7 },
      expectedUpdatedAt: plan.updatedAt,
    })
    expect(held.status).toBe(200)
    expect(held.body.durationMinutes).toBe(7)
  })
  it.each(["note", "plan", "task"])("transitions a legacy task to %s idempotently", async choice => {
    const task = await createTask(agent)
    const legacy = await db.task.update({
      where: { id: task.id },
      data: { legacyPending: true, time: "10:00", endTime: "11:00" },
    })
    const body = { sourceId: task.id, choice, expectedUpdatedAt: legacy.updatedAt.toISOString() }
    const first = await agent.post("/api/transition/task").send(body)
    const repeated = await agent.post("/api/transition/task").send(body)
    expect(first.status).toBe(200)
    expect(repeated.body).toEqual(first.body)
    expect((await agent.get("/api/transition")).body.tasks).toHaveLength(0)
    expect((await agent.get("/api/tasks")).body).toHaveLength(choice === "task" ? 1 : 0)
    expect((await agent.get("/api/notes")).body).toHaveLength(choice === "note" ? 1 : 0)
    expect((await agent.get("/api/plans")).body).toHaveLength(choice === "plan" ? 1 : 0)
    expect(await db.legacyTransition.count({ where: { sourceKey: `task:${task.id}` } })).toBe(1)
    expect((await db.task.findUniqueOrThrow({ where: { id: task.id } })).description).toBe("Original detail")
  })
  it("keeps goal milestones in goals and removes the obsolete conversion endpoint", async () => {
    const goal = await agent.post("/api/goals").send({
      ...goalData,
      id: crypto.randomUUID(),
      milestones: [{ id: "one", title: "Milestone", completed: true }],
      progress: 100,
    })
    expect((await agent.get("/api/transition")).body).toEqual({ tasks: [] })
    expect(
      (
        await agent.post("/api/transition/milestone").send({
          goalId: goal.body.id,
          milestoneId: "one",
          existingTaskId: null,
          expectedUpdatedAt: goal.body.updatedAt,
        })
      ).status,
    ).toBe(404)
    expect((await agent.get("/api/goals")).body[0]).toMatchObject({
      progress: 100,
      milestones: [{ id: "one", title: "Milestone", completed: true }],
    })
    expect((await agent.get("/api/tasks")).body).toHaveLength(0)
  })
  it("serializes simultaneous migration retries without duplicates", async () => {
    const task = await createTask(agent)
    const source = await db.task.update({ where: { id: task.id }, data: { legacyPending: true } })
    const payload = { sourceId: task.id, choice: "note", expectedUpdatedAt: source.updatedAt.toISOString() }
    const results = await Promise.all([
      agent.post("/api/transition/task").send(payload),
      agent.post("/api/transition/task").send(payload),
    ])
    expect(results.map(result => result.status)).toEqual([200, 200])
    expect(results[0].body.resultId).toBe(results[1].body.resultId)
    expect((await agent.get("/api/notes")).body).toHaveLength(1)
  })
  it("only one simultaneous plan edit can win the same version", async () => {
    const plan = await createPlan(agent)
    const results = await Promise.all(
      ["First", "Second"].map(title =>
        agent.patch(`/api/plans/${plan.id}`).send({ patch: { title }, expectedUpdatedAt: plan.updatedAt }),
      ),
    )
    expect(results.map(result => result.status).sort()).toEqual([200, 409])
  })
  it("does not expose another owner's legacy records or notes", async () => {
    const task = await createTask(agent)
    const source = await db.task.update({ where: { id: task.id }, data: { legacyPending: true } })
    const other = await createAuthenticatedAgent(app)
    expect((await other.get("/api/transition")).body.tasks).toEqual([])
    expect(
      (
        await other
          .post("/api/transition/task")
          .send({ sourceId: task.id, choice: "note", expectedUpdatedAt: source.updatedAt.toISOString() })
      ).status,
    ).toBe(404)
    await agent
      .post("/api/transition/task")
      .send({ sourceId: task.id, choice: "note", expectedUpdatedAt: source.updatedAt.toISOString() })
    expect((await other.get("/api/notes")).body).toEqual([])
  })
})
