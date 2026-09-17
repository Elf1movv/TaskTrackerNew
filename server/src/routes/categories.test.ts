import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../app.js"
import { db } from "../db.js"

const app = createApp()

describe("categories router", () => {
  beforeEach(async () => {
    await db.category.deleteMany({})
  })

  it("creates and lists a category, appended after existing ones", async () => {
    const first = await request(app).post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect(first.status).toBe(201)

    const second = await request(app)
      .post("/api/categories")
      .send({ id: crypto.randomUUID(), name: "Personal" })
    expect(second.status).toBe(201)

    const list = await request(app).get("/api/categories")
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(["Work", "Personal"])
  })

  it("rejects a duplicate category name", async () => {
    await request(app).post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    const res = await request(app).post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect(res.status).toBe(500)
  })

  it("deletes a category", async () => {
    const created = await request(app).post("/api/categories").send({ id: crypto.randomUUID(), name: "Work" })
    expect((await request(app).delete(`/api/categories/${created.body.id}`)).status).toBe(204)
    expect((await request(app).get("/api/categories")).body).toHaveLength(0)
  })
})
