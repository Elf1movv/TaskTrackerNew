// Shared by the habit and goal color pickers — kept as one list so the two
// forms can't drift apart again (they used to duplicate this array, with
// Goal's being a stale 5-color subset of Habit's 12).
export const PALETTE_COLORS = [
  "#c97b3a",
  "#6a9c74",
  "#5b7fc7",
  "#a35bc7",
  "#c75b8f",
  "#3aa6c9",
  "#c9a63a",
  "#4f9c5e",
  "#c75b5b",
  "#7b6ac9",
  "#3ac9a0",
  "#c98f5b",
]

// Fixed per-entity-TYPE color — the primary at-a-glance cue on the
// calendar's Day/Week timeline, orthogonal to Task's PRIORITY_COLORS
// (entities/task/model/task.ts) and Reminder's REMINDER_PRIORITY_COLORS
// (entities/reminder/model/reminder.ts): priority stays visible through
// the icon's shape (PriorityDot/ReminderPriorityIcon), not color, once
// this is in play. Chosen from the palette above rather than new hex
// values, checked against PRIORITY_COLORS (#6a9c74/#c97b3a/#c9503a) and
// REMINDER_PRIORITY_COLORS (#8a8578/#c9503a) — no collisions.
export const ENTITY_TYPE_COLORS = {
  task: "#5b7fc7",
  reminder: "#c9a63a",
  goal: "#a35bc7",
} as const
