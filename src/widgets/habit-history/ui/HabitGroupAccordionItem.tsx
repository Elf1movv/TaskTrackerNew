import { Fragment, useCallback, useState } from "react"
import { format } from "date-fns"
import { Activity, BarChart3, Flame, Plus, TrendingUp } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { EditHabitButton } from "@/features/edit-habit"
import { DeleteHabitButton } from "@/features/delete-habit"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { getStreak, useHabits, type Habit } from "@/entities/habit"
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
          className="!border-b-0 bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="flex items-start gap-1 px-6 pt-5 cursor-grab active:cursor-grabbing">
            <AccordionTrigger className="hover:no-underline pb-5 [&>svg]:mt-1">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-lg leading-none shrink-0">{getHabitGroupIcon(group)}</span>
                <span className="text-base font-medium truncate">{getHabitGroupTitle(group, t)}</span>
                <span css={monoFont} className="text-xs text-muted-foreground shrink-0">
                  {t("habits.group.habitCount", { count: habits.length })}
                </span>
              </div>
            </AccordionTrigger>
            {!group.isGeneral && (
              <div className="flex items-center gap-1 pt-4 shrink-0">
                <EditHabitGroupButton onClick={() => setIsEditingGroup(true)} />
                <DeleteHabitGroupButton group={group} />
              </div>
            )}
          </div>

          <AccordionContent className="px-6 pb-6 space-y-6">
            {isEditingGroup && <HabitGroupForm group={group} onDone={() => setIsEditingGroup(false)} />}

            <div className="flex items-center justify-end flex-wrap gap-3">
              <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      period === p
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`habits.period.${p}`)}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingHabit(null)
                  setIsAdding(v => !v)
                }}
              >
                <Plus size={14} />
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
                {days?.map((date, i) => (
                  <div key={date.toISOString()} className="text-center self-end pb-1">
                    {period === "month" && (
                      <div css={monoFont} className="text-[9px] text-muted-foreground/70 leading-tight">
                        {weekdayLabels[(date.getDay() + 6) % 7]}
                      </div>
                    )}
                    <div css={monoFont} className="text-[10px] text-muted-foreground leading-tight">
                      {period === "week" ? weekdayLabels[i] : date.getDate()}
                    </div>
                    {period === "week" && (
                      <div css={monoFont} className="text-[9px] text-muted-foreground/70 leading-tight">
                        {date.getDate()}
                      </div>
                    )}
                  </div>
                ))}
                {months?.map(month => (
                  <div
                    key={month.toISOString()}
                    css={monoFont}
                    className="text-[10px] text-muted-foreground text-center self-end pb-1 capitalize"
                  >
                    {format(month, "LLL", { locale })}
                  </div>
                ))}

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
                  <div className="flex items-center gap-1">
                    {CHART_STYLES.map(({ style, Icon }) => (
                      <button
                        key={style}
                        onClick={() => setChartStyle(style)}
                        aria-label={t(`habits.chartStyle.${style}`)}
                        className={`flex items-center justify-center size-6 rounded-md transition-all ${
                          chartStyle === style
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                  <div style={{ gridColumn: `2 / -1` }}>
                    <HabitHistoryChart data={summary.chartData} style={chartStyle} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {t("habits.page.summary", { completed: summary.completed, total: summary.total, percent })}
                </p>
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

  return (
    <Fragment>
      <div
        ref={ref}
        className={`flex items-center gap-2 pr-2 group/row rounded-lg cursor-grab active:cursor-grabbing select-none ${
          isOver ? "bg-accent" : ""
        }`}
        style={{ opacity: isDragging ? 0.4 : 1 }}
      >
        <span className="text-base leading-none">{habit.icon}</span>
        <span className="text-sm font-medium truncate flex-1">{habit.title}</span>
        <span css={monoFont} className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
          <Flame size={10} />
          {getStreak(habit.completedDates, habit.activeDays)}
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
