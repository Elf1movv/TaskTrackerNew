export interface LaneItem {
  id: string
  startMinutes: number
  endMinutes: number
}

export interface LaneAssignment {
  id: string
  laneIndex: number
  laneCount: number
}

// Side-by-side lane assignment for items that overlap in time within one
// day column — classic interval-graph coloring ("meeting rooms"), not a
// naive max-concurrent count. Pure minutes in, no DOM/pixel math — the
// caller (TimelineDayColumn) converts via minutesFromMidnight first.
//
// Two items that merely touch (one ends exactly when the next starts) are
// NOT treated as overlapping — they share a lane, stacking back-to-back
// with no visual gap, matching how the existing single-lane case already
// looks (no regression for the overwhelming common case of zero overlap).
//
// `laneCount` is the max concurrency within each item's own connected
// overlap group, not globally across the whole day — a chain A-B-C where
// A and C don't directly overlap but both overlap B still needs only 2
// lanes total (A and C can share one), and two unrelated overlaps later
// in the same day are sized independently of each other.
export function computeLanes(items: LaneItem[]): LaneAssignment[] {
  if (items.length === 0) return []

  const sorted = [...items].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes || a.id.localeCompare(b.id),
  )

  const laneIndexById = new Map<string, number>()
  const lastEndByLane: number[] = []
  // Lane count accumulated per connected group so far, applied to every
  // member once the group closes (see the sweep below).
  let currentGroup: string[] = []
  let currentGroupLaneCount = 0
  const result: LaneAssignment[] = []

  function closeGroup() {
    for (const id of currentGroup) {
      result.push({ id, laneIndex: laneIndexById.get(id)!, laneCount: currentGroupLaneCount })
    }
    currentGroup = []
    currentGroupLaneCount = 0
    lastEndByLane.length = 0
  }

  for (const item of sorted) {
    // No lane is still "open" (every previously seen item in the current
    // sweep has already ended at or before this item's start) — the
    // current connected group is finished, start a fresh one.
    if (currentGroup.length > 0 && lastEndByLane.every(end => end <= item.startMinutes)) {
      closeGroup()
    }

    let laneIndex = lastEndByLane.findIndex(end => end <= item.startMinutes)
    if (laneIndex === -1) {
      laneIndex = lastEndByLane.length
      lastEndByLane.push(item.endMinutes)
    } else {
      lastEndByLane[laneIndex] = item.endMinutes
    }

    laneIndexById.set(item.id, laneIndex)
    currentGroup.push(item.id)
    currentGroupLaneCount = Math.max(currentGroupLaneCount, laneIndex + 1)
  }
  closeGroup()

  return result
}
