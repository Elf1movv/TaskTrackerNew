import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Captures outgoing emails instead of sending them — the links inside are
// what these tests check.
const sent = vi.hoisted(() => [] as { to: string; subject: string; html: string }[])
vi.mock("./lib/email.js", () => ({
  sendEmail: async (email: { to: string; subject: string; html: string }) => {
    sent.push(email)
  },
}))

const { createApp } = await import("./app.js")
const { db } = await import("./db.js")

const app = createApp()
const verifyLinks = (email: string) =>
  sent
    .filter(m => m.to === email && m.subject.includes("подтвердите почту"))
    .map(m => new URL(m.html.match(/href="([^"]+)"/)![1].replaceAll("&amp;", "&")))

describe("auth flows around email verification", () => {
  beforeEach(() => {
    sent.length = 0
  })

  it("re-sent verification link (sign-in before verifying) lands on /login?verified=1", async () => {
    const email = `test-${crypto.randomUUID()}@example.com`
    const password = "test-password-123"
    await request(app)
      .post("/api/auth/sign-up/email")
      .send({ name: "Test User", email, password, callbackURL: "/login?verified=1" })
    const signIn = await request(app).post("/api/auth/sign-in/email").send({ email, password })
    expect(signIn.status).toBe(403)

    await vi.waitFor(() => expect(verifyLinks(email)).toHaveLength(2))
    const resent = verifyLinks(email)[1]
    expect(resent.searchParams.get("callbackURL")).toBe("/login?verified=1")

    const verify = await request(app).get(resent.pathname + resent.search)
    expect(verify.status).toBe(302)
    expect(verify.headers.location).toBe("/login?verified=1")
    expect((await db.user.findUnique({ where: { email } }))?.emailVerified).toBe(true)
  })

  it("signing up with an already registered email looks like a normal sign-up and changes nothing", async () => {
    const email = `test-${crypto.randomUUID()}@example.com`
    const password = "test-password-123"
    const first = await request(app).post("/api/auth/sign-up/email").send({ name: "Owner", email, password })
    await db.user.update({ where: { email }, data: { emailVerified: true } })

    const again = await request(app)
      .post("/api/auth/sign-up/email")
      .send({ name: "Attacker", email, password: "other-password-456" })
    // Same status as a fresh sign-up — the form can't tell whether the email exists.
    expect(again.status).toBe(first.status)
    expect((await db.user.findUnique({ where: { email } }))?.name).toBe("Owner")
    const signIn = await request(app).post("/api/auth/sign-in/email").send({ email, password })
    expect(signIn.status).toBe(200)
  })
})
