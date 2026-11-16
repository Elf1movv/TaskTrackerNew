import { useState } from "react"
import { addDays, endOfWeek, format, isAfter, isSameDay, startOfDay, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { HabitGroupForm } from "@/features/habit-group-form"
import { getDayCounts, type Habit } from "@/entities/habit"
import { useHabitGroups } from "@/entities/habit-group"
import {
  capitalizeFirst,
  formatDayRange,
  getDateLocale,
  getWeekdayLabels,
  useLanguage,
} from "@/shared/lib/i18n"
import { useCollapsedBlocks, useMobilePeriod } from "../../lib/mobilePrefs"
import {
  getPeriodDays,
  isCurrentOrFuturePeriod,
  shiftPeriodAnchor,
  type HabitHistoryPeriod,
} from "../../lib/periodColumns"
import { MobileBlockCard } from "./MobileBlockCard"

const PERIODS: HabitHistoryPeriod[] = ["day", "week", "month", "year"]

// The whole /habits page on a phone (owner decision 2026-11-12, mockups
// approved 2026-11-16): one period switch for every block, blocks one under
// another, nothing wider than the screen. The desktop keeps the table
// (HabitHistoryGrid).
export function MobileHabitsView({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()
  const { t, language } = useLanguage()
  const locale = getDateLocale(language)
  const [period, setPeriod] = useMobilePeriod()
  const [collapsed, toggleCollapsed] = useCollapsedBlocks()
  const [anchor, setAnchor] = useState(() => new Date())
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const [isAddingBlock, setIsAddingBlock] = useState(false)
  const today = new Date()

  const periodLabel =
    period === "week"
      ? formatDayRange(
          startOfWeek(anchor, { weekStartsOn: 1 }),
          endOfWeek(anchor, { weekStartsOn: 1 }),
          language,
        )
      : period === "month"
        ? capitalizeFirst(format(anchor, "LLLL yyyy", { locale }))
        : format(anchor, "yyyy")

  return (
    <div className="flex flex-col gap-3.5">
      <h1>{t("habits.page.title")}</h1>

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-0.5 rounded-md bg-fill p-0.5" role="group">
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => {
                setPeriod(p)
                setAnchor(new Date())
              }}
              className={`h-9 rounded-lg text-meta transition ${
                period === p
                  ? "bg-seg text-foreground font-bold shadow-card"
                  : "text-muted-foreground font-medium"
              }`}
            >
              {t(`habits.period.${p}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={t("habits.addHabit")}
          aria-expanded={isAddingHabit}
          onClick={() => setIsAddingHabit(v => !v)}
          className="size-11 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-raised"
        >
          <Plus size={20} />
        </button>
      </div>

      {isAddingHabit && <HabitForm onDone={() => setIsAddingHabit(false)} />}

      {period === "day" ? (
        <DayStrip habits={habits} anchor={anchor} today={today} onPick={setAnchor} />
      ) : (
        <div className="flex items-center justify-between" role="group" aria-label={t("habits.periodNav")}>
          <button
            type="button"
            aria-label={t("habits.periodPrev")}
            onClick={() => setAnchor(a => shiftPeriodAnchor(period, a, -1))}
            className="size-11 flex items-center justify-center text-muted-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-body font-semibold" data-period-label>
            {periodLabel}
          </span>
          <button
            type="button"
            aria-label={t("habits.periodNext")}
            disabled={isCurrentOrFuturePeriod(period, anchor, today)}
            onClick={() => setAnchor(a => shiftPeriodAnchor(period, a, 1))}
            className="size-11 flex items-center justify-center text-muted-foreground disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {habitGroups.map(group => (
        <MobileBlockCard
          key={group.id}
          group={group}
          habits={habits.filter(h => h.groupId === group.id)}
          period={period}
          anchor={anchor}
          today={today}
          collapsed={!!collapsed[group.id]}
          onToggleCollapsed={() => toggleCollapsed(group.id)}
          onPickMonth={month => {
            setPeriod("month")
            setAnchor(month)
          }}
        />
      ))}

      {isAddingBlock ? (
        <HabitGroupForm onDone={() => setIsAddingBlock(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingBlock(true)}
          className="h-11 rounded-md border border-dashed border-border text-meta font-semibold text-muted-foreground flex items-center justify-center gap-1.5"
        >
          <Plus size={16} />
          {t("habits.group.addBlock")}
        </button>
      )}
    </div>
  )
}

// "День" mode's header: the 7 days of the chosen day's week (a small bar under
// each = share of all habits done that day), ‹ › for other weeks, then the
// chosen day's name with its total.
function DayStrip({
  habits,
  anchor,
  today,
  onPick,
}: {
  habits: Habit[]
  anchor: Date
  today: Date
  onPick: (day: Date) => void
}) {
  const { t, language } = useLanguage()
  const locale = getDateLocale(language)
  const labels = getWeekdayLabels(language)
  const days = getPeriodDays("week", anchor)
  const counts = getDayCounts(habits, anchor, today)
  const share = counts ? counts.done / counts.scheduled : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1" role="group" aria-label={t("habits.periodNav")}>
        <button
          type="button"
          aria-label={t("habits.periodPrev")}
          onClick={() => onPick(addDays(anchor, -7))}
          className="h-11 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {days.map((day, i) => {
            const selected = isSameDay(day, anchor)
            const future = isAfter(startOfDay(day), startOfDay(today))
            const c = getDayCounts(habits, day, today)
            const dayShare = c ? c.done / c.scheduled : 0
            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={future}
                aria-pressed={selected}
                aria-label={format(day, "EEEE, d MMMM", { locale })}
                onClick={() => onPick(day)}
                className={`h-[60px] rounded-lg border flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-card-border"
                }`}
              >
                <span className="text-caption font-bold opacity-80">{labels[i]}</span>
                <span className="text-body font-bold tabular-nums">{day.getDate()}</span>
                <span className="h-[3px] w-[18px] overflow-hidden rounded-full bg-current/20">
                  <span
                    className="block h-full bg-current"
                    style={{ width: `${Math.round(dayShare * 100)}%` }}
                  />
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          aria-label={t("habits.periodNext")}
          disabled={isCurrentOrFuturePeriod("week", anchor, today)}
          onClick={() => {
            const next = addDays(anchor, 7)
            onPick(isAfter(next, today) ? today : next)
          }}
          className="h-11 w-6 shrink-0 flex items-center justify-center text-muted-foreground disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-card-border bg-card px-3.5 py-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-body font-semibold">
            {capitalizeFirst(format(anchor, "EEEE, d MMMM", { locale }))}
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full bg-primary" style={{ width: `${Math.round(share * 100)}%` }} />
          </span>
        </div>
        <span className="text-title font-bold tabular-nums">
          {counts ? `${counts.done}/${counts.scheduled}` : "—"}
        </span>
      </div>
    </div>
  )
}
