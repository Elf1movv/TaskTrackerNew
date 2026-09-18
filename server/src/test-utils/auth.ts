import request from "supertest"
import type { Express } from "express"
import { db } from "../db.js"

// A logged-in supertest agent for route tests — `agent` (not plain
// `request`) persists cookies across calls, which is what carries the
// session between the sign-in below and whatever request the test makes
// next. Email verification is satisfied by writing straight to the DB
// instead of going through a real email — there's no inbox to click a
// link from in a test run.
export async function createAuthenticatedAgent(app: Express) {
  const email = `test-${crypto.randomUUID()}@example.com`
  const password = "test-password-123"

  await request(app).post("/api/auth/sign-up/email").send({ name: "Test User", email, password })

  await db.user.update({ where: { email }, data: { emailVerified: true } })

  const agent = request.agent(app)
  await agent.post("/api/auth/sign-in/email").send({ email, password })

  return agent
}
