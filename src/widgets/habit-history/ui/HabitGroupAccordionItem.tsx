import { Fragment, useCallback, useState } from "react"
import { format } from "date-fns"
import { Activity, BarChart3, Flame, Lock, Plus, TrendingUp } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { EditHabitButton } from "@/features/edit-habit"
import { DeleteHabitButton } from "@/features/delete-habit"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { getStreak, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import {
  getHabitGroupIcon,
  getHabitGroupTitle,
  useHabitGroups,
  type HabitGroup,
} from "@/entities/habit-group"
import { useDragItem, useDragReorder, useDropTarget } from "@/shared/lib/dnd"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Button } from "@/shared/ui/button"
import { getDayCellState } from "../lib/habitCellState"
import { getHabitHistorySummary } from "../lib/habitHistorySummary"
import { getPeriodDays, getYearMonths, type HabitHistoryPeriod } from "../lib/periodColumns"
import { HabitHistoryChart, type HabitChartStyle } from "./HabitHistoryChart"
import { MonthCell } from "./MonthCell"

const PERIODS: HabitHistoryPeriod[] = ["week", "month", "year"]

const CHART_STYLES: { style: HabitChartStyle; Icon: typeof TrendingUp }[] = [
  { style: "area", Icon: TrendingUp },
  { style: "bar", Icon: BarChart3 },
  { style: "step", Icon: Activity },
]

// One block's whole card — header (drag handle to reorder blocks, drop
// zone to receive a habit dragged from a different block, edit/delete)
// plus its own independent period switcher + day/month grid + chart. This
// is almost exactly what the page-wide HabitHistoryGrid used to be in
// full, just scoped to one group's habits instead of every habit the user
// has — see docs/requirements for why each block got its own state
// instead of one shared page-level period.
export function HabitGroupAccordionItem({ group, habits }: { group: HabitGroup; habits: Habit[] }) {
  const { habits: allHabits, toggleHabit, reorderHabitsInGroup, moveHabitToGroup } = useHabits()
  const { reorderHabitGroups } = useHabitGroups()
  const { t, language } = useLanguage()
  const locale = getDateLocale(language)
  const weekdayLabels = getWeekdayLabels(language)

  const [period, setPeriod] = useState<HabitHistoryPeriod>("week")
  const [chartStyle, setChartStyle] = useState<HabitChartStyle>("area")
  const [isOpen, setIsOpen] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const today = new Date()

  // Block reordering — drags the whole header to swap this block's
  // position with another's, same mechanism GoalAccordionItem uses for
  // goals. The wrapper `<div>` (not AccordionItem itself) carries the
  // ref — see that component's comment for why (AccordionItem has no
  // forwardRef).
  const { ref: dragGroupRef, isDragging } = useDragReorder<HTMLDivElement>({
    type: "habit-group",
    id: group.id,
    onHoverMove: reorderHabitGroups,
  })
  // Accepts a habit dragged from any block's grid (including this one,
  // dropped broadly rather than on a specific row) — appends it here.
  const { ref: dropHabitRef } = useDropTarget<HTMLDivElement>({
    type: "habit-move",
    onDrop: habitId => moveHabitToGroup(habitId, group.id),
  })
  const headerRef = useCallback(
    (node: HTMLDivElement | null) => {
      dragGroupRef(node)
      dropHabitRef(node)
    },
    [dragGroupRef, dropHabitRef],
  )

  function handleHabitDrop(draggedId: string, targetHabitId: string) {
    const dragged = allHabits.find(h => h.id === draggedId)
    const target = allHabits.find(h => h.id === targetHabitId)
    if (!dragged || !target || draggedId === targetHabitId) return
    if (dragged.groupId === target.groupId) {
      reorderHabitsInGroup(target.groupId, draggedId, targetHabitId)
    } else {
      // Cross-group drop on a specific row only decides WHICH group —
      // moveHabitToGroup always appends at the end, exact drop position
      // within the new group isn't tracked (a possible future refinement).
      moveHabitToGroup(draggedId, target.groupId)
    }
  }

  const days = period !== "year" ? getPeriodDays(period, today) : null
  const months = period === "year" ? getYearMonths(today) : null
  const columnCount = (days ?? months ?? []).length
  const gridTemplateColumns = `minmax(120px, 220px) repeat(${columnCount}, minmax(0, 1fr))`
  const summary = getHabitHistorySummary(habits, period, today)
  const percent = summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100)

  return (
    <div ref={headerRef} className="select-none" style={{ opacity: isDragging ? 0.4 : 1 }}>
      <Accordion
        type="single"
        collapsible
        value={isOpen ? group.id : ""}
        onValueChange={v => setIsOpen(v === group.id)}
      >
        <AccordionItem
          value={group.id}
          className="!border-b-0 bg-card border border-card-border rounded-xl shadow-card overflow-hidden"
        >
          <div className="flex items-start gap-1 px-[22px] pt-[18px] cursor-grab active:cursor-grabbing">
            <AccordionTrigger className="hover:no-underline pb-4 [&>svg]:mt-1.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="size-9 shrink-0 rounded-[10px] bg-primary-soft text-primary flex items-center justify-center">
                  <HabitIcon emoji={getHabitGroupIcon(group)} size={18} />
                </span>
                <span className="text-xl font-bold tracking-[-0.015em] truncate">
                  {getHabitGroupTitle(group, t)}
                </span>
                {group.isGeneral && (
                  <span className="h-[22px] px-2 rounded-md bg-fill text-tertiary text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                    <Lock size={11} strokeWidth={2.25} />
                    {t("habits.group.general")}
                  </span>
                )}
                <span className="text-[13px] font-semibold text-tertiary shrink-0">
                  {t("habits.group.habitCount", { count: habits.length })}
                </span>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-0.5 pt-3.5 shrink-0">
              <EditHabitGroupButton onClick={() => setIsEditingGroup(true)} />
              {!group.isGeneral && <DeleteHabitGroupButton group={group} />}
            </div>
          </div>

          <AccordionContent className="px-[22px] pb-5 space-y-3.5">
            {isEditingGroup && <HabitGroupForm group={group} onDone={() => setIsEditingGroup(false)} />}

            <div className="flex items-center justify-end flex-wrap gap-3">
              <div className="grid grid-cols-3 w-[252px] p-0.5 rounded-[9px] bg-fill">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`h-[30px] rounded-lg text-[13px] transition-all ${
                      period === p
                        ? "bg-seg text-foreground font-bold shadow-card"
                        : "text-muted-foreground font-medium"
                    }`}
                  >
                    {t(`habits.period.${p}`)}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="h-[34px] px-3 gap-1.5 rounded-[10px] border-primary/25 text-primary text-sm font-semibold"
                onClick={() => {
                  setEditingHabit(null)
                  setIsAdding(v => !v)
                }}
              >
                <Plus size={16} />
                {t("habits.addHabit")}
              </Button>
            </div>

            {(isAdding || editingHabit) && (
              <HabitForm
                habit={editingHabit ?? undefined}
                lockedGroupId={group.id}
                onDone={() => {
                  setIsAdding(false)
                  setEditingHabit(null)
                }}
              />
            )}

            {habits.length === 0 ? (
              !isAdding && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {t("habits.noHabitsYet")}
                </div>
              )
            ) : (
              <div className="grid gap-y-2 gap-x-1" style={{ gridTemplateColumns }}>
                <div />
                {days?.map((date, i) => {
                  const isToday = formatDateKey(date) === formatDateKey(today)
                  return (
                    <div
                      key={date.toISOString()}
                      className={`flex flex-col items-center gap-1 self-end pb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {period === "month" && (
                        <div css={monoFont} className="text-[9px] font-bold opacity-70 leading-tight">
                          {weekdayLabels[(date.getDay() + 6) % 7]}
                        </div>
                      )}
                      {period === "week" && (
                        <div className="text-[11px] font-bold uppercase leading-tight">
                          {weekdayLabels[i]}
                        </div>
                      )}
                      <div
                        css={monoFont}
                        className={`flex items-center justify-center leading-tight ${
                          period === "week"
                            ? `size-7 rounded-full text-sm font-bold ${isToday ? "bg-primary text-primary-foreground" : ""}`
                            : `size-[22px] rounded-full text-[11px] font-bold ${isToday ? "bg-primary text-primary-foreground" : ""}`
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                  )
                })}
                {months?.map(month => {
                  const isCurrentMonth =
                    month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()
                  return (
                    <div
                      key={month.toISOString()}
                      className={`text-[12px] font-bold text-center self-end pb-1 capitalize ${
                        isCurrentMonth ? "text-primary" : "text-tertiary"
                      }`}
                    >
                      {format(month, "LLL", { locale })}
                    </div>
                  )
                })}

                {habits.map(habit => (
                  <HabitGridRow
                    key={habit.id}
                    habit={habit}
                    days={days}
                    months={months}
                    today={today}
                    onToggle={dateKey => toggleHabit(habit.id, dateKey)}
                    onDropHabit={draggedId => handleHabitDrop(draggedId, habit.id)}
                    onEdit={() => {
                      setIsAdding(false)
                      setEditingHabit(habit)
                    }}
                  />
                ))}
              </div>
            )}

            {habits.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="grid gap-x-1 items-center" style={{ gridTemplateColumns }}>
                  <div className="flex items-center gap-0.5 w-fit p-0.5 rounded-[9px] bg-fill">
                    {CHART_STYLES.map(({ style, Icon }) => (
                      <button
                        key={style}
                        onClick={() => setChartStyle(style)}
                        aria-label={t(`habits.chartStyle.${style}`)}
                        className={`flex items-center justify-center w-[34px] h-7 rounded-lg transition-all ${
                          chartStyle === style
                            ? "bg-seg text-foreground shadow-card"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon size={15} strokeWidth={1.75} />
                      </button>
                    ))}
                  </div>
                  <div style={{ gridColumn: `2 / -1` }}>
                    <HabitHistoryChart data={summary.chartData} style={chartStyle} />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-0.5">
                  <span className="text-xs font-bold tracking-[0.06em] uppercase text-tertiary">
                    {t("habits.page.summaryLabel")}
                  </span>
                  <span className="text-[15px] font-semibold">
                    {t("habits.page.summary", {
                      completed: summary.completed,
                      total: summary.total,
                      percent,
                    })}
                  </span>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

// One habit's name cell + its row of day/month cells — its own drag
// source/drop target pair (type "habit-move") handles both within-group
// reordering (dropped on a row in the same group) and cross-group moves
// (dropped on a row, or the target block's header, in a different one) —
// see handleHabitDrop above for which one a given drop resolves to.
function HabitGridRow({
  habit,
  days,
  months,
  today,
  onToggle,
  onDropHabit,
  onEdit,
}: {
  habit: Habit
  days: Date[] | null
  months: Date[] | null
  today: Date
  onToggle: (dateKey: string) => void
  onDropHabit: (draggedId: string) => void
  onEdit: () => void
}) {
  const { ref: dragRef, isDragging } = useDragItem<HTMLDivElement>({ type: "habit-move", id: habit.id })
  const { ref: dropRef, isOver } = useDropTarget<HTMLDivElement>({ type: "habit-move", onDrop: onDropHabit })
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      dragRef(node)
      dropRef(node)
    },
    [dragRef, dropRef],
  )

  const streak = getStreak(habit.completedDates, habit.activeDays)

  return (
    <Fragment>
      <div
        ref={ref}
        className={`flex items-center gap-2.5 pr-2 group/row rounded-lg cursor-grab active:cursor-grabbing select-none ${
          isOver ? "bg-accent" : ""
        }`}
        style={{ opacity: isDragging ? 0.4 : 1 }}
      >
        <span
          className="size-8 shrink-0 rounded-[9px] flex items-center justify-center"
          style={{
            background: `color-mix(in srgb, ${habit.color} 16%, transparent)`,
            color: habit.color,
          }}
        >
          <HabitIcon emoji={habit.icon} size={15} />
        </span>
        <span className="text-sm font-semibold truncate flex-1">{habit.title}</span>
        <span
          css={monoFont}
          className="flex items-center gap-1 text-xs shrink-0"
          style={{
            color:
              streak > 0
                ? `color-mix(in srgb, ${habit.color} 80%, var(--foreground))`
                : "var(--text-tertiary)",
            fontWeight: streak > 0 ? 700 : 600,
          }}
        >
          <Flame size={12} fill={streak > 0 ? "currentColor" : "none"} />
          {streak}
        </span>
        <span className="hidden group-hover/row:flex items-center shrink-0">
          <EditHabitButton onClick={onEdit} />
          <DeleteHabitButton habitId={habit.id} />
        </span>
      </div>
      {days?.map(date => {
        const state = getDayCellState(habit, date, today)
        const dateKey = formatDateKey(date)
        const clickable = state === "done" || state === "pending"
        return (
          <button
            key={`${habit.id}-${dateKey}`}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onToggle(dateKey)}
            aria-label={`${habit.title} ${dateKey}`}
            className="w-full max-w-10 aspect-square mx-auto rounded-full border transition-all disabled:cursor-default"
            style={{
              backgroundColor:
                state === "done"
                  ? habit.color
                  : state === "unscheduled" || state === "future"
                    ? "var(--muted)"
                    : "transparent",
              borderColor: state === "done" ? habit.color : "var(--border)",
              borderStyle: state === "unscheduled" || state === "future" ? "dashed" : "solid",
              opacity: state === "unscheduled" || state === "future" ? 0.6 : 1,
            }}
          />
        )
      })}
      {months?.map(month => (
        <div key={month.toISOString()} className="w-full max-w-10 aspect-square mx-auto">
          <MonthCell habit={habit} month={month} today={today} />
        </div>
      ))}
    </Fragment>
  )
}
