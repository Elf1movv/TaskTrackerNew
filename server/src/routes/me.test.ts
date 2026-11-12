import type { TestAgent } from "supertest"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { createAuthenticatedAgent } from "../test-utils/auth.js"

const app = createApp()

describe("me router — onboarding", () => {
  let agent: TestAgent

  beforeEach(async () => {
    agent = await createAuthenticatedAgent(app)
  })

  it("requires a session", async () => {
    const res = await request(app).get("/api/me/onboarding")
    expect(res.status).toBe(401)
  })

  it("starts as not seen for a new account", async () => {
    const res = await agent.get("/api/me/onboarding")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: null })
  })

  it("stores skipped, then completed after a later rerun", async () => {
    const skipped = await agent.put("/api/me/onboarding").send({ status: "skipped" })
    expect(skipped.body).toEqual({ status: "skipped" })

    const completed = await agent.put("/api/me/onboarding").send({ status: "completed" })
    expect(completed.body).toEqual({ status: "completed" })

    const read = await agent.get("/api/me/onboarding")
    expect(read.body).toEqual({ status: "completed" })
  })

  it("rejects any other status, including resetting to not seen", async () => {
    for (const status of ["done", null, ""]) {
      const res = await agent.put("/api/me/onboarding").send({ status })
      expect(res.status).toBe(400)
    }
  })

  it("keeps each account's status separate", async () => {
    await agent.put("/api/me/onboarding").send({ status: "skipped" })
    const other = await createAuthenticatedAgent(app)
    const res = await other.get("/api/me/onboarding")
    expect(res.body).toEqual({ status: null })
  })
})
