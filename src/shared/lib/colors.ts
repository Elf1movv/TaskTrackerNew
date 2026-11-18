// Bright shades from the approved habit mockups (owner, 2026-11-18: the old
// muted set looked "dull and sad"); migration 20261118120000_vivid_palette
// moved every stored color to its new shade in the same order.
// Shared by the habit and goal color pickers — kept as one list so the two
// forms can't drift apart again (they used to duplicate this array, with
// Goal's being a stale 5-color subset of Habit's 12).
export const PALETTE_COLORS = [
  "#f59e0b",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#38bdf8",
  "#facc15",
  "#4ade80",
  "#f87171",
  "#818cf8",
  "#2dd4bf",
  "#fb923c",
]

// Task blocks on the calendar are now filled by their own category's color
// (see resolveCategoryColor.ts) instead of one fixed per-entity-type color
// — this is the fallback for a task whose category string doesn't match
// any existing Category record (deleted category, or none assigned).
// Deliberately outside PALETTE_COLORS so it never gets handed out as a
// real category's own color and reads unambiguously as "uncategorized".
export const CATEGORY_FALLBACK_COLOR = "#8a8a8a"
