import { describe, expect, it } from "vitest"
import { revealScrollDelta } from "./pwa"

// Screen: top bar ends at 60, keyboard starts at 400.
const visible = { top: 60, bottom: 400 }

describe("revealScrollDelta", () => {
  it("does nothing when the form is already visible", () => {
    expect(revealScrollDelta({ top: 100, bottom: 300 }, visible)).toBe(0)
  })

  it("scrolls a form hidden under the keyboard up just enough", () => {
    expect(revealScrollDelta({ top: 500, bottom: 700 }, visible)).toBe(700 - 388)
  })

  it("scrolls a form hidden under the top bar down", () => {
    expect(revealScrollDelta({ top: 20, bottom: 200 }, visible)).toBe(20 - 72)
  })

  it("puts the top of a too-tall form just under the bar", () => {
    expect(revealScrollDelta({ top: 300, bottom: 900 }, visible)).toBe(300 - 72)
  })
})
