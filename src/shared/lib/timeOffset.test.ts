import { describe, expect, it } from "vitest"
import {
  addMinutesToTime,
  HOUR_HEIGHT_PX,
  minutesFromMidnight,
  offsetPxToTime,
  offsetToTime,
  timeToOffsetPx,
} from "./timeOffset"

describe("minutesFromMidnight", () => {
  it("converts HH:mm to minutes since midnight", () => {
    expect(minutesFromMidnight("00:00")).toBe(0)
    expect(minutesFromMidnight("14:30")).toBe(870)
    expect(minutesFromMidnight("23:45")).toBe(1425)
  })
})

describe("offsetToTime", () => {
  it("snaps to the nearest 15 minutes by default", () => {
    expect(offsetToTime(872)).toBe("14:30") // 872/15 = 58.1 -> rounds to 58 -> 870
    expect(offsetToTime(878)).toBe("14:45") // 878/15 = 58.5 -> rounds to 59 -> 885
  })

  it("round-trips exact quarter-hour values", () => {
    expect(offsetToTime(0)).toBe("00:00")
    expect(offsetToTime(870)).toBe("14:30")
    expect(offsetToTime(1425)).toBe("23:45")
  })

  it("clamps to a valid 00:00-23:45 range instead of overflowing past midnight", () => {
    expect(offsetToTime(-50)).toBe("00:00")
    expect(offsetToTime(1500)).toBe("23:45")
  })

  it("respects a custom snap interval", () => {
    expect(offsetToTime(23, 30)).toBe("00:30")
    expect(offsetToTime(7, 30)).toBe("00:00")
  })
})

describe("timeToOffsetPx / offsetPxToTime round-trip", () => {
  it("HOUR_HEIGHT_PX matches the pixel math (1 hour = HOUR_HEIGHT_PX px)", () => {
    expect(timeToOffsetPx("01:00")).toBe(HOUR_HEIGHT_PX)
  })

  it("converts a time to pixels and back to the same time", () => {
    const times = ["00:00", "09:15", "14:30", "23:45"]
    for (const time of times) {
      expect(offsetPxToTime(timeToOffsetPx(time))).toBe(time)
    }
  })

  it("snaps a pixel offset that doesn't land on an exact minute", () => {
    // 100px at HOUR_HEIGHT_PX=64 -> 93.75 minutes -> snaps to 90 -> 01:30
    expect(offsetPxToTime(100)).toBe("01:30")
  })
})

describe("addMinutesToTime", () => {
  it("shifts forward and backward without rounding", () => {
    expect(addMinutesToTime("14:30", 45)).toBe("15:15")
    expect(addMinutesToTime("14:30", -45)).toBe("13:45")
    expect(addMinutesToTime("09:00", 0)).toBe("09:00")
  })

  it("clamps at the same 00:00-23:45 range as offsetToTime, truncating an overshoot", () => {
    expect(addMinutesToTime("23:30", 45)).toBe("23:45")
    expect(addMinutesToTime("00:15", -30)).toBe("00:00")
  })

  it("does not re-round an already-exact delta (unlike offsetToTime's snapping)", () => {
    // A delta of 7 minutes is not a multiple of 15 - offsetToTime would
    // snap it away, addMinutesToTime must preserve it exactly.
    expect(addMinutesToTime("10:00", 7)).toBe("10:07")
  })
})
