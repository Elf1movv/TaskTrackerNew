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

// Task blocks on the calendar are now filled by their own category's color
// (see resolveCategoryColor.ts) instead of one fixed per-entity-type color
// — this is the fallback for a task whose category string doesn't match
// any existing Category record (deleted category, or none assigned).
// Deliberately outside PALETTE_COLORS so it never gets handed out as a
// real category's own color and reads unambiguously as "uncategorized".
export const CATEGORY_FALLBACK_COLOR = "#8a8a8a"
