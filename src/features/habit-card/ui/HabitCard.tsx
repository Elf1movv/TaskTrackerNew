import { Flame } from "lucide-react"
import { getStreak, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"

export function HabitCard({ habit }: { habit: Habit }) {
  const { toggleHabit } = useHabits()
  const { t } = useLanguage()
  const today = getTodayKey()
  const doneToday = habit.completedDates.includes(today)
  const streak = getStreak(habit.completedDates, habit.activeDays)

  return (
    <button
      onClick={() => toggleHabit(habit.id, today)}
      className="w-full h-full min-h-[150px] p-3.5 rounded-xl border shadow-card text-left transition active:scale-[0.98] flex flex-col items-start gap-2.5"
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
        <HabitIcon emoji={habit.icon} size={18} />
      </span>
      {/* flex-1 on a wrapper, line-clamp on the text: with both on one
          element the box grew to the card's free height, so the clipped
          third line showed under the "…" (owner screenshot, 2026-11-08). */}
      <div className="flex-1 w-full min-w-0">
        <div
          className="text-sm font-semibold leading-snug line-clamp-2 [overflow-wrap:anywhere]"
          title={habit.title}
        >
          {habit.title}
        </div>
      </div>
      <div
        style={{
          color:
            streak > 0 ? `color-mix(in srgb, ${habit.color} 80%, var(--foreground))` : "var(--text-tertiary)",
        }}
        className={`flex items-center gap-1 text-xs ${streak > 0 ? "font-semibold" : "font-semibold"}`}
      >
        <Flame size={13} fill={streak > 0 ? "currentColor" : "none"} />
        <span className="tabular-nums">{streak}</span>
        <span className="font-semibold text-muted-foreground">{t("habitCard.days")}</span>
      </div>
    </button>
  )
}
