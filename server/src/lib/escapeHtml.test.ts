import { describe, expect, it } from "vitest"
import { escapeHtml } from "./escapeHtml.js"

describe("escapeHtml", () => {
  it("escapes angle brackets so tags can't be injected", () => {
    expect(escapeHtml("<img src=x onerror=alert(1)>")).toBe("&lt;img src=x onerror=alert(1)&gt;")
  })

  it("escapes ampersands, quotes, and apostrophes", () => {
    expect(escapeHtml(`R&D "quotes" 'and' apostrophes`)).toBe(
      "R&amp;D &quot;quotes&quot; &#39;and&#39; apostrophes",
    )
  })

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Nothing to escape here 123")).toBe("Nothing to escape here 123")
  })

  it("returns an empty string for empty input", () => {
    expect(escapeHtml("")).toBe("")
  })
})
