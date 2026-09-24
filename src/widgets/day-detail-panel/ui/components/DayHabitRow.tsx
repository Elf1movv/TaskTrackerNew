import { type Habit } from "@/entities/habit"

// Read-only — unlike DayTaskRow/DayGoalRow, a habit has no per-day record
// to drag or edit here: `activeDays` is a recurring weekday pattern, not a
// specific instance, so "move this occurrence" doesn't map onto the data
// model. Manage the habit itself (rename, change color/schedule) from
// /habits — see the plan's reasoning in docs/requirements.
export function DayHabitRow({ habit }: { habit: Habit }) {
  return (
    <div className="w-full flex items-center gap-2.5 text-left">
      <span className="text-base leading-none shrink-0">{habit.icon}</span>
      <span className="text-sm flex-1 text-left leading-snug">{habit.title}</span>
    </div>
  )
}
