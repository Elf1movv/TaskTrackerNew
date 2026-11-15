import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import request from "supertest"
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

// Load speed, 2026-11-15: responses are compressed, and the hashed build
// files under /assets are cached for a year. Needs the built frontend
// (`npm run build` at the project root) — skipped where there is none.
describe("static frontend delivery", () => {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "dist")
  const assets = fs.existsSync(path.join(dist, "assets")) ? fs.readdirSync(path.join(dist, "assets")) : []
  const bundle = assets.find(name => name.endsWith(".js"))

  it.skipIf(!bundle)("sends the JS bundle compressed and cacheable for a year", async () => {
    const res = await request(createApp()).get(`/assets/${bundle}`).set("Accept-Encoding", "gzip")
    expect(res.status).toBe(200)
    expect(res.headers["content-encoding"]).toBe("gzip")
    expect(res.headers["cache-control"]).toBe("public, max-age=31536000, immutable")
  })

  it.skipIf(!bundle)("lets the browser re-check index.html every time", async () => {
    const res = await request(createApp()).get("/index.html")
    expect(res.status).toBe(200)
    expect(res.headers["cache-control"]).not.toContain("immutable")
  })
})
