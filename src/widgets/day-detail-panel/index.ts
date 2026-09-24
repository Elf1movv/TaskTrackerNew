export { DayDetailPanel } from "./ui/DayDetailPanel"
// Also exported at the widget's top level (not just used internally) —
// the Agenda view (pages/calendar) reuses these same rows for its flat
// day-grouped list instead of inventing a second rendering for the same
// four entity types.
export { DayTaskRow, DayReminderRow, DayGoalRow, DayHabitRow } from "./ui/components"
