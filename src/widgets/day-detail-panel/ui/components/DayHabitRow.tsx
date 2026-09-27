import { HabitIcon, type Habit } from "@/entities/habit"

// Read-only — unlike DayTaskRow/DayGoalRow, a habit has no per-day record
// to drag or edit here: `activeDays` is a recurring weekday pattern, not a
// specific instance, so "move this occurrence" doesn't map onto the data
// model. Manage the habit itself (rename, change color/schedule) from
// /habits — see the plan's reasoning in docs/requirements.
export function DayHabitRow({ habit }: { habit: Habit }) {
  return (
    <div className="w-full flex items-center gap-2.5 text-left">
      <span
        className="size-7 shrink-0 rounded-[9px] flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${habit.color} 16%, transparent)`, color: habit.color }}
      >
        <HabitIcon emoji={habit.icon} size={14} />
      </span>
      <span className="text-sm font-semibold flex-1 text-left leading-snug">{habit.title}</span>
    </div>
  )
}
