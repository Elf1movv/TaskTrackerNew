import { describe, expect, it } from "vitest"
import { resolveCategoryColor } from "./resolveCategoryColor"
import type { Category } from "../model/category"

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "c1",
    name: "Work",
    color: "#5b7fc7",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

describe("resolveCategoryColor", () => {
  it("returns the matching category's color", () => {
    const categories = [makeCategory({ name: "Work", color: "#5b7fc7" })]
    expect(resolveCategoryColor("Work", categories)).toBe("#5b7fc7")
  })

  it("falls back to the neutral color when no category matches", () => {
    expect(resolveCategoryColor("Ghost category", [makeCategory({ name: "Work" })])).toBe("#8a8a8a")
  })

  it("falls back to the neutral color for an empty category name", () => {
    expect(resolveCategoryColor("", [makeCategory({ name: "Work" })])).toBe("#8a8a8a")
  })

  it("is case-sensitive, matching isTaskOnDay's exact-string-match convention", () => {
    const categories = [makeCategory({ name: "Work", color: "#5b7fc7" })]
    expect(resolveCategoryColor("work", categories)).toBe("#8a8a8a")
  })

  it("picks the first match when duplicate names exist", () => {
    const categories = [
      makeCategory({ id: "c1", name: "Work", color: "#5b7fc7" }),
      makeCategory({ id: "c2", name: "Work", color: "#c9a63a" }),
    ]
    expect(resolveCategoryColor("Work", categories)).toBe("#5b7fc7")
  })
})
