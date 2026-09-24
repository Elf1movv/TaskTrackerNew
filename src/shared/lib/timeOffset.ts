// Moved here from widgets/calendar-timeline/lib (2026-09-24, the Day-view
// redesign) — CalendarProvider (a page-level connector) needs
// addMinutesToTime too, not just the calendar-timeline widget's own UI, so
// this pure minute/pixel math belongs in shared/lib, same reasoning as
// calendarGrid.ts's earlier move.
//
// Pixel height of one hour row in the timeline grid — shared between the
// grid's own CSS (HourGrid.tsx) and this file's pixel<->minute math, so
// they can never drift out of sync with each other.
export const HOUR_HEIGHT_PX = 64
const PIXELS_PER_MINUTE = HOUR_HEIGHT_PX / 60

// Nominal duration for a point-in-time item (a Reminder, or a Task with no
// endTime) — used both as the fallback block a create-drag click produces
// (useCreateDrag.ts) and as the logical window a point-in-time item
// occupies for overlap-lane purposes (computeLanes.ts). One shared
// constant so the two meanings can't drift apart.
export const DEFAULT_BLOCK_MINUTES = 30

// "14:30" -> 870 (minutes since midnight).
export function minutesFromMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Shared by offsetToTime/addMinutesToTime — clamps to a valid 00:00-23:45
// range (so a drag/shift that overshoots past midnight in either direction
// doesn't produce a nonsense time) and formats as "HH:mm".
function clampedMinutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 45, minutes))
  const hours = Math.floor(clamped / 60)
  const mins = clamped % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

// Inverse of minutesFromMidnight, snapped to the nearest `snapMinutes` (a
// mouse-drag pixel position is never going to land on an exact minute, and
// nobody wants to schedule something at "14:31" by accident).
export function offsetToTime(minutes: number, snapMinutes = 15): string {
  return clampedMinutesToTime(Math.round(minutes / snapMinutes) * snapMinutes)
}

// Shifts a "HH:mm" time by deltaMinutes (positive or negative), same clamp
// as offsetToTime — used to preserve a task block's duration when its
// start time moves (see CalendarProvider.rescheduleTaskTime). No
// rounding: the delta is already exact (the difference between two times
// that were each already snapped), re-snapping it here would distort the
// shift instead of just moving it.
export function addMinutesToTime(time: string, deltaMinutes: number): string {
  return clampedMinutesToTime(minutesFromMidnight(time) + deltaMinutes)
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
