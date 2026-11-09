import { Flame } from "lucide-react"
import { getStreak, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"

// Same click-to-toggle/streak logic as HabitCard, just laid out as a full-width
// row instead of a card — used when the Habits section view is set to "list".
export function HabitListRow({ habit }: { habit: Habit }) {
  const { toggleHabit } = useHabits()
  const { t } = useLanguage()
  const today = getTodayKey()
  const doneToday = habit.completedDates.includes(today)
  const streak = getStreak(habit.completedDates, habit.activeDays)

  return (
    <button
      onClick={() => toggleHabit(habit.id, today)}
      className="w-full min-h-14 px-3 py-2 rounded-md border text-left transition flex items-center gap-3"
      aria-pressed={doneToday}
      style={{
        borderColor: doneToday ? `color-mix(in srgb, ${habit.color} 50%, transparent)` : "var(--border)",
        backgroundColor: doneToday ? `color-mix(in srgb, ${habit.color} 13%, var(--card))` : "var(--card)",
      }}
    >
      <span
        className="size-9 shrink-0 rounded-md flex items-center justify-center"
        style={{
          backgroundColor: doneToday ? habit.color : `color-mix(in srgb, ${habit.color} 14%, transparent)`,
          color: doneToday ? "#fff" : habit.color,
        }}
      >
        <HabitIcon emoji={habit.icon} size={17} />
      </span>
      <div className="text-sm font-semibold flex-1 min-w-0 truncate">{habit.title}</div>
      {/* pr-14 reserves the corner HabitGridItem's absolute-positioned
          edit/delete overlay occupies on hover — without it this row's
          own right-aligned streak label lands directly under those
          icons (see docs/ARCHITECTURE.md gotcha list). */}
      <div
        style={{
          color:
            streak > 0 ? `color-mix(in srgb, ${habit.color} 80%, var(--foreground))` : "var(--text-tertiary)",
        }}
        className={`flex items-center gap-1 text-xs shrink-0 pr-14 ${streak > 0 ? "font-semibold" : "font-semibold"}`}
      >
        <Flame size={13} fill={streak > 0 ? "currentColor" : "none"} />
        <span className="tabular-nums">{streak}</span>
        <span className="font-semibold text-muted-foreground">{t("habitCard.days")}</span>
      </div>
    </button>
  )
}
