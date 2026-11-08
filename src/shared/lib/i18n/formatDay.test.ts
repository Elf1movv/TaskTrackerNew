import { describe, expect, it } from "vitest"
import { capitalizeFirst, formatDay, formatDayRange } from "./formatDay"

const today = new Date(2026, 10, 8)

describe("formatDay", () => {
  it("omits the current year", () => {
    expect(formatDay("2026-11-08", "ru", today)).toBe("8 ноября")
    expect(formatDay("2026-11-08", "en", today)).toBe("November 8")
  })
  it("adds another year", () => {
    expect(formatDay("2027-05-27", "ru", today)).toBe("27 мая 2027")
    expect(formatDay("2027-05-27", "en", today)).toBe("May 27, 2027")
  })
})

describe("formatDayRange", () => {
  it("same month", () => {
    expect(formatDayRange("2026-11-02", "2026-11-08", "ru", today)).toBe("2–8 ноября")
    expect(formatDayRange("2026-11-02", "2026-11-08", "en", today)).toBe("November 2–8")
  })
  it("across months", () => {
    expect(formatDayRange("2026-10-26", "2026-11-01", "ru", today)).toBe("26 октября – 1 ноября")
  })
  it("other year", () => {
    expect(formatDayRange("2025-11-03", "2025-11-09", "ru", today)).toBe("3–9 ноября 2025")
  })
})

it("capitalizeFirst only touches the first letter", () => {
  expect(capitalizeFirst("воскресенье, 8 ноября")).toBe("Воскресенье, 8 ноября")
})
