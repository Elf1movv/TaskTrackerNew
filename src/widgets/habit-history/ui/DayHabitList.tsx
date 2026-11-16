import { isAfter, startOfDay } from "date-fns"
import { Check } from "lucide-react"
import { useNavigate } from "react-router"
import { getStreak, HabitIcon, selectHabitsOnDay, useHabits, type Habit } from "@/entities/habit"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"

// The "День" mode, shared by the phone view and the desktop table
// (2026-11-16): one block's habits scheduled on `date`, a row each — tap the
// name to open the habit screen, tap the round button to mark the day.
export function DayHabitList({ habits, date, today }: { habits: Habit[]; date: Date; today: Date }) {
  const { t } = useLanguage()
  const scheduled = selectHabitsOnDay(habits, date)

  if (scheduled.length === 0) {
    return <div className="py-6 text-center text-meta text-muted-foreground">{t("habits.noneOnDay")}</div>
  }

  return (
    <div className="flex flex-col gap-2">
      {scheduled.map(habit => (
        <DayHabitRow key={habit.id} habit={habit} date={date} today={today} />
      ))}
    </div>
  )
}

function DayHabitRow({ habit, date, today }: { habit: Habit; date: Date; today: Date }) {
  const { toggleHabit } = useHabits()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const dateKey = formatDateKey(date)
  const done = habit.completedDates.includes(dateKey)
  const future = isAfter(startOfDay(date), startOfDay(today))
  const streak = getStreak(habit.completedDates, habit.activeDays)

  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 transition-opacity"
      style={{ borderColor: "var(--border)", opacity: done ? 0.75 : 1 }}
    >
      <button
        type="button"
        onClick={() => navigate(`/habits/${habit.id}`)}
        aria-label={t("habits.openHabit", { title: habit.title })}
        className="flex flex-1 min-w-0 items-center gap-3 text-left"
      >
        <span
          className="size-9 shrink-0 rounded-md flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${habit.color} 16%, transparent)`, color: habit.color }}
        >
          <HabitIcon emoji={habit.icon} size={16} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body font-semibold leading-tight break-words">{habit.title}</span>
          <span className="text-meta text-muted-foreground">
            {streak > 0 ? t("habits.streakDays", { count: streak }) : t("habits.startStreak")}
          </span>
        </span>
      </button>
      <button
        type="button"
        disabled={future}
        aria-pressed={done}
        aria-label={t("habits.markDay", { title: habit.title, date: dateKey })}
        onClick={() => toggleHabit(habit.id, dateKey)}
        className="size-11 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-40"
        style={{
          background: done ? habit.color : "transparent",
          borderColor: done ? habit.color : "var(--border)",
          color: "var(--background)",
        }}
      >
        {done && <Check size={18} strokeWidth={3} aria-hidden />}
      </button>
    </div>
  )
}
