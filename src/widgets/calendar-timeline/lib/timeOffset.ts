// Pixel height of one hour row in the timeline grid — shared between the
// grid's own CSS (HourGrid.tsx) and this file's pixel<->minute math, so
// they can never drift out of sync with each other.
export const HOUR_HEIGHT_PX = 64
const PIXELS_PER_MINUTE = HOUR_HEIGHT_PX / 60

// "14:30" -> 870 (minutes since midnight).
export function minutesFromMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Inverse of minutesFromMidnight, snapped to the nearest `snapMinutes` (a
// mouse-drag pixel position is never going to land on an exact minute, and
// nobody wants to schedule something at "14:31" by accident) — clamped to
// a valid 00:00-23:45 range so a drag that overshoots past midnight in
// either direction doesn't produce a nonsense time.
export function offsetToTime(minutes: number, snapMinutes = 15): string {
  const snapped = Math.round(minutes / snapMinutes) * snapMinutes
  const clamped = Math.max(0, Math.min(23 * 60 + 45, snapped))
  const hours = Math.floor(clamped / 60)
  const mins = clamped % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

// Where a "HH:mm" time should sit, in pixels from the top of the timeline.
export function timeToOffsetPx(time: string): number {
  return minutesFromMidnight(time) * PIXELS_PER_MINUTE
}

// The inverse — a pixel offset within the timeline (e.g. a drop's Y
// position relative to the column's own top edge) back to a snapped time.
export function offsetPxToTime(offsetPx: number, snapMinutes = 15): string {
  return offsetToTime(offsetPx / PIXELS_PER_MINUTE, snapMinutes)
}
