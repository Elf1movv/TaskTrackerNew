import { describe, expect, it } from "vitest"
import { computeLanes, type LaneItem } from "./computeLanes"

function byId(assignments: ReturnType<typeof computeLanes>) {
  return Object.fromEntries(assignments.map(a => [a.id, { laneIndex: a.laneIndex, laneCount: a.laneCount }]))
}

describe("computeLanes", () => {
  it("returns empty for empty input", () => {
    expect(computeLanes([])).toEqual([])
  })

  it("assigns a single item to lane 0 of 1", () => {
    const result = byId(computeLanes([{ id: "a", startMinutes: 540, endMinutes: 600 }]))
    expect(result.a).toEqual({ laneIndex: 0, laneCount: 1 })
  })

  it("splits two fully overlapping items into two lanes", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 },
      { id: "b", startMinutes: 540, endMinutes: 600 },
    ]
    const result = byId(computeLanes(items))
    expect(result.a.laneCount).toBe(2)
    expect(result.b.laneCount).toBe(2)
    expect(result.a.laneIndex).not.toBe(result.b.laneIndex)
  })

  it("splits two partially overlapping items into two lanes", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 }, // 9:00-10:00
      { id: "b", startMinutes: 570, endMinutes: 630 }, // 9:30-10:30
    ]
    const result = byId(computeLanes(items))
    expect(result.a.laneCount).toBe(2)
    expect(result.b.laneCount).toBe(2)
    expect(result.a.laneIndex).not.toBe(result.b.laneIndex)
  })

  it("shares one lane for two items that touch but don't overlap", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 }, // 9:00-10:00
      { id: "b", startMinutes: 600, endMinutes: 660 }, // 10:00-11:00, starts exactly when a ends
    ]
    const result = byId(computeLanes(items))
    expect(result.a).toEqual({ laneIndex: 0, laneCount: 1 })
    expect(result.b).toEqual({ laneIndex: 0, laneCount: 1 })
  })

  it("splits a three-way simultaneous overlap into three lanes", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 },
      { id: "b", startMinutes: 540, endMinutes: 600 },
      { id: "c", startMinutes: 540, endMinutes: 600 },
    ]
    const result = byId(computeLanes(items))
    const indices = new Set([result.a.laneIndex, result.b.laneIndex, result.c.laneIndex])
    expect(indices.size).toBe(3)
    expect(result.a.laneCount).toBe(3)
    expect(result.b.laneCount).toBe(3)
    expect(result.c.laneCount).toBe(3)
  })

  it("resolves a chain (A-B overlap, B-C overlap, A-C don't) with only 2 lanes, sharing one", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 }, // 9:00-10:00
      { id: "b", startMinutes: 570, endMinutes: 630 }, // 9:30-10:30
      { id: "c", startMinutes: 600, endMinutes: 660 }, // 10:00-11:00
    ]
    const result = byId(computeLanes(items))
    expect(result.a.laneCount).toBe(2)
    expect(result.b.laneCount).toBe(2)
    expect(result.c.laneCount).toBe(2)
    // A and C don't overlap each other, so they can share a lane; B must
    // be in the other one.
    expect(result.a.laneIndex).toBe(result.c.laneIndex)
    expect(result.b.laneIndex).not.toBe(result.a.laneIndex)
  })

  it("sizes two independent overlap groups in the same day separately", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 }, // 9:00-10:00
      { id: "b", startMinutes: 540, endMinutes: 600 }, // 9:00-10:00, overlaps a
      { id: "c", startMinutes: 900, endMinutes: 960 }, // 15:00-16:00, standalone
    ]
    const result = byId(computeLanes(items))
    expect(result.a.laneCount).toBe(2)
    expect(result.b.laneCount).toBe(2)
    expect(result.c).toEqual({ laneIndex: 0, laneCount: 1 })
  })

  it("treats a task+reminder overlap the same as any other overlap (combined set, not per-type)", () => {
    // The literal reported bug: a task with a real endTime overlapping a
    // reminder, which has no endTime at all.
    const items: LaneItem[] = [
      { id: "task:1", startMinutes: 1170, endMinutes: 1200 }, // 19:30-20:00
      { id: "reminder:1", startMinutes: 1180, endMinutes: 1210 }, // 19:40, nominal 30min window
    ]
    const result = byId(computeLanes(items))
    expect(result["task:1"].laneCount).toBe(2)
    expect(result["reminder:1"].laneCount).toBe(2)
    expect(result["task:1"].laneIndex).not.toBe(result["reminder:1"].laneIndex)
  })

  it("is deterministic regardless of input order", () => {
    const items: LaneItem[] = [
      { id: "a", startMinutes: 540, endMinutes: 600 },
      { id: "b", startMinutes: 570, endMinutes: 630 },
      { id: "c", startMinutes: 600, endMinutes: 660 },
    ]
    const forward = byId(computeLanes(items))
    const reversed = byId(computeLanes([...items].reverse()))
    expect(reversed).toEqual(forward)
  })

  it("doesn't throw for a nominal window that overshoots past the end of the day", () => {
    // 23:50 + 30min nominal = 1460, past the 1440-minute day boundary —
    // computeLanes does pure arithmetic and never converts back to a
    // time-of-day string, so this is never clamped here.
    const items: LaneItem[] = [{ id: "a", startMinutes: 1430, endMinutes: 1460 }]
    expect(() => computeLanes(items)).not.toThrow()
    expect(byId(computeLanes(items)).a).toEqual({ laneIndex: 0, laneCount: 1 })
  })
})
