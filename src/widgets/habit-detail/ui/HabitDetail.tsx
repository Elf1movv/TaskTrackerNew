import { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"
import { HabitForm } from "@/features/habit-form"
import {
  getBestStreak,
  getHabitMonthCompletionStats,
  getStreak,
  getYearMap,
  HabitIcon,
  useHabits,
  type Habit,
} from "@/entities/habit"
import { getHabitGroupTitle, useHabitGroups } from "@/entities/habit-group"
import { formatDateKey } from "@/shared/lib/date"
import { capitalizeFirst, getDateLocale, getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"
import { YearHeatmap } from "@/shared/ui/year-heatmap"

// One habit's own screen (mockup "Экран привычки · месяц + год", approved
// 2026-11-16), the same on phone and desktop: the numbers, a big month to mark
// days in, the year as a heat map, edit and delete.
export function HabitDetail({ habit }: { habit: Habit }) {
  const { toggleHabit, deleteHabit } = useHabits()
  const { habitGroups } = useHabitGroups()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const locale = getDateLocale(language)
  const weekdayLabels = getWeekdayLabels(language)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [isEditing, setIsEditing] = useState(false)
  const today = new Date()

  const group = habitGroups.find(g => g.id === habit.groupId)
  const groupTitle = group ? (group.isGeneral ? t("habits.withoutBlock") : getHabitGroupTitle(group, t)) : ""
  // Monday-first labels; activeDays holds JS getDay() values (0 = Sunday).
  const scheduleLabel =
    habit.activeDays.length === 7
      ? t("habits.detail.everyDay")
      : [1, 2, 3, 4, 5, 6, 0]
          .filter(d => habit.activeDays.includes(d))
          .map(d => weekdayLabels[(d + 6) % 7])
          .join(", ")

  const streak = getStreak(habit.completedDates, habit.activeDays)
  const best = getBestStreak(habit.completedDates, habit.activeDays, today)
  const { done, scheduled } = getHabitMonthCompletionStats(habit, month, today)
  const monthPercent = scheduled === 0 ? 0 : Math.round((done / scheduled) * 100)
  const yearMap = useMemo(() => getYearMap([habit], new Date().getFullYear(), new Date()), [habit])
  const yearPercent = yearMap.scheduled === 0 ? 0 : Math.round((yearMap.done / yearMap.scheduled) * 100)

  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) })
  const lead = (month.getDay() + 6) % 7
  const createdKey = formatDateKey(new Date(habit.createdAt))
  const atCurrentMonth = isSameMonth(month, today)

  const stats = [
    { value: streak, label: t("habits.detail.currentStreak", { count: streak }), accent: true },
    { value: best, label: t("habits.detail.bestStreak"), accent: false },
    {
      value: `${monthPercent}%`,
      label: t("habits.detail.monthPercent", { month: format(month, "LLLL", { locale }) }),
      accent: false,
    },
  ]

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      {/* No button on the right of this row: the bell and gear float there. */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => navigate("/habits")}
          className="h-11 -ml-1.5 pl-1 pr-3 rounded-md flex items-center gap-1 text-body font-semibold text-primary"
        >
          <ChevronLeft size={18} />
          {t("habits.page.title")}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="size-12 shrink-0 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${habit.color} 16%, transparent)`, color: habit.color }}
        >
          <HabitIcon emoji={habit.icon} size={22} />
        </span>
        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
          <h1 className="text-[24px] leading-tight break-words">{habit.title}</h1>
          <span className="text-meta text-muted-foreground">
            {groupTitle ? `${groupTitle} · ` : ""}
            {scheduleLabel}
          </span>
        </div>
        <button
          type="button"
          aria-expanded={isEditing}
          onClick={() => setIsEditing(v => !v)}
          className="h-11 shrink-0 px-4 rounded-md border border-card-border bg-card text-meta font-semibold"
        >
          {t("habits.detail.edit")}
        </button>
      </div>

      {isEditing && <HabitForm habit={habit} onDone={() => setIsEditing(false)} />}

      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div
            key={s.label}
            className="flex flex-col gap-0.5 rounded-lg border border-card-border bg-card p-3"
          >
            <span
              className="text-[22px] font-bold tabular-nums leading-tight"
              style={{ color: s.accent && streak > 0 ? habit.color : undefined }}
            >
              {s.value}
            </span>
            <span className="text-caption text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-2.5 rounded-xl border border-card-border bg-card p-3.5 shadow-card">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={t("habits.periodPrev")}
            onClick={() => setMonth(m => addMonths(m, -1))}
            className="size-11 flex items-center justify-center text-muted-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-body font-semibold">
            {capitalizeFirst(format(month, "LLLL yyyy", { locale }))}
          </span>
          <button
            type="button"
            aria-label={t("habits.periodNext")}
            disabled={atCurrentMonth}
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="size-11 flex items-center justify-center text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {weekdayLabels.map(label => (
            <span key={label} className="text-center text-caption font-bold text-muted-foreground">
              {label}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${i}`} />
          ))}
          {days.map(day => {
            const key = formatDateKey(day)
            const isDone = habit.completedDates.includes(key)
            const future = isAfter(startOfDay(day), startOfDay(today))
            const offDay = !habit.activeDays.includes(day.getDay())
            // Marks are allowed on any past scheduled day, also before the
            // habit was created (same as the desktop table's day cells).
            const clickable = !future && !offDay
            const isToday = isSameDay(day, today)
            return (
              <button
                key={key}
                type="button"
                disabled={!clickable}
                aria-pressed={isDone}
                aria-label={t("habits.markDay", { title: habit.title, date: key })}
                onClick={() => toggleHabit(habit.id, key)}
                className="aspect-square rounded-lg text-meta font-bold tabular-nums flex items-center justify-center disabled:cursor-default"
                style={{
                  background: isDone
                    ? habit.color
                    : future
                      ? "transparent"
                      : offDay || key < createdKey
                        ? "color-mix(in srgb, var(--muted) 45%, transparent)"
                        : "var(--muted)",
                  color: isDone ? "var(--background)" : future || offDay ? "var(--text-tertiary)" : undefined,
                  outline: isToday ? "2px solid var(--primary)" : undefined,
                  outlineOffset: -2,
                }}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
        <span className="text-center text-caption text-muted-foreground">{t("habits.detail.tapHint")}</span>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-card-border bg-card p-3.5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-body font-semibold">{today.getFullYear()}</span>
          <span className="text-meta text-muted-foreground tabular-nums">
            {t("habits.detail.yearTotal", { count: yearMap.done, percent: yearPercent })}
          </span>
        </div>
        <YearHeatmap
          grid={yearMap.grid}
          values={yearMap.values}
          color={habit.color}
          todayIndex={yearMap.todayIndex}
          monthLabels={Array.from({ length: 12 }, (_, m) =>
            format(new Date(today.getFullYear(), m, 1), "LLL", { locale }).replace(".", ""),
          )}
          label={`${today.getFullYear()}: ${t("habits.detail.yearTotal", { count: yearMap.done, percent: yearPercent })}`}
        />
      </section>

      <ConfirmAction
        title={t("habits.deleteTitle")}
        description={t("habits.deleteBody")}
        onConfirm={async () => {
          await deleteHabit(habit.id)
          navigate("/habits", { replace: true })
        }}
      >
        <button
          type="button"
          className="h-11 rounded-md border border-destructive/40 text-meta font-semibold text-destructive"
        >
          {t("habits.detail.delete")}
        </button>
      </ConfirmAction>
    </div>
  )
}
