import { describe, expect, it } from "vitest"
import { createApp } from "./app.js"
import { createAuthenticatedAgent } from "./test-utils/auth.js"

// Regression coverage for the per-route JSON body-size limits — each
// router's express.json() is mounted directly on its own path (not one
// shared global limit) specifically so a smaller default elsewhere can't
// silently reject feedback's larger screenshot attachment, and so
// feedback's larger limit can't silently become the ceiling everywhere
// else. See app.ts's own comment for why this has to be per-router, not
// one middleware followed by a second, larger one.
describe("per-route JSON body limits", () => {
  const app = createApp()

  it("rejects an oversized body on a route with the small default limit", async () => {
    const agent = await createAuthenticatedAgent(app)
    const res = await agent.post("/api/tasks").send({
      id: crypto.randomUUID(),
      title: "x".repeat(300_000),
      completed: false,
      priority: "low",
      category: "Work",
      dueDate: null,
      time: null,
      endTime: null,
      completedAt: null,
    })
    expect(res.status).toBe(413)
  })

  it("still accepts a large body on feedback's own larger limit", async () => {
    const agent = await createAuthenticatedAgent(app)
    const res = await agent.post("/api/feedback").send({
      message: "x".repeat(5000), // message's own max length (validation/feedback.ts)
      type: "bug",
      imageData: `data:image/png;base64,${"A".repeat(300_000)}`, // well past the 256kb default limit
    })
    expect(res.status).toBe(201)
  })
})
