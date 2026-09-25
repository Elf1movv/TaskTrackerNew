import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"
import { db } from "../db.js"

const app = createApp()

describe("feedback router", () => {
  let agent: TestAgent

  beforeEach(async () => {
    await db.feedback.deleteMany({})
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    const res = await request(app).post("/api/feedback").send({ message: "hello" })
    expect(res.status).toBe(401)
  })

  it("rejects an empty message", async () => {
    const res = await agent.post("/api/feedback").send({ message: "", type: "bug" })
    expect(res.status).toBe(400)
  })

  it("rejects a missing or invalid type", async () => {
    const missing = await agent.post("/api/feedback").send({ message: "Found a bug" })
    expect(missing.status).toBe(400)

    const invalid = await agent.post("/api/feedback").send({ message: "Found a bug", type: "idea" })
    expect(invalid.status).toBe(400)
  })

  it("creates a feedback entry scoped to the logged-in user", async () => {
    const res = await agent
      .post("/api/feedback")
      .send({ message: "Found a bug", type: "bug", page: "/today" })
    expect(res.status).toBe(201)

    const stored = await db.feedback.findUniqueOrThrow({ where: { id: res.body.id } })
    expect(stored.message).toBe("Found a bug")
    expect(stored.type).toBe("bug")
    expect(stored.page).toBe("/today")
  })

  it("stores a suggestion type distinctly from a bug", async () => {
    const res = await agent
      .post("/api/feedback")
      .send({ message: "Would love a dark mode toggle", type: "suggestion" })
    expect(res.status).toBe(201)

    const stored = await db.feedback.findUniqueOrThrow({ where: { id: res.body.id } })
    expect(stored.type).toBe("suggestion")
  })

  it("accepts an optional screenshot as base64 image data", async () => {
    const res = await agent
      .post("/api/feedback")
      .send({ message: "Layout looks off", type: "bug", imageData: "data:image/png;base64,aGVsbG8=" })
    expect(res.status).toBe(201)

    const stored = await db.feedback.findUniqueOrThrow({ where: { id: res.body.id } })
    expect(stored.imageData).toBe("data:image/png;base64,aGVsbG8=")
  })
})
