import { formatDateKey } from "@/shared/lib/date"
import { useCallback } from "react"
import { format } from "date-fns"
import { Flag, Target } from "lucide-react"
import { resolveCategoryColor, type Category } from "@/entities/category"
import { type Goal } from "@/entities/goal"
import type { Task as DeadlineTask } from "@/entities/task"
import { REMINDER_BORDER_COLORS, ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { PLAN_COLOR, type CalendarEntry as Task } from "@/entities/calendar-plan"
import { PlanToggleCheckbox as TaskToggleCheckbox } from "@/features/toggle-plan"
import { useDropTarget } from "@/shared/lib/dnd"

// Shown inline on the cell without a tap — up to this many, the rest is
// summarized as "+N". Reminders keep this cap (their own redesign wasn't
// asked for beyond the border treatment below); tasks below deliberately
// don't have one any more — see the task-row block's own comment.
const MAX_VISIBLE_REMINDERS = 2

export function CalendarDayCell({
  day,
  isCurrentMonth,
  dayTasks,
  dayReminders,
  dayGoals,
  dayDeadlines = [],
  categories,
  isSelected,
  isCurrent,
  onSelect,
  onMoveTaskToDay,
  onEditTask,
  onEditReminder,
}: {
  day: Date
  isCurrentMonth: boolean
  dayTasks: Task[]
  dayReminders: Reminder[]
  dayGoals: Goal[]
  dayDeadlines?: DeadlineTask[]
  categories: Category[]
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
}) {
  // Composed here (not passed down as a ready-made per-day closure from the
  // parent's .map()) so it stays referentially stable across renders where
  // `day` and `onMoveTaskToDay` don't change — useDropTarget's ref callback
  // depends on this identity staying stable, see useDropTarget's comment.
  const handleTaskDrop = useCallback((taskId: string) => onMoveTaskToDay(taskId, day), [onMoveTaskToDay, day])
  // Only plans can be dropped on a day. A goal's deadline is read-only in
  // the calendar (audit П7, 2026-11-09) — it's changed on the Goals page.
  const { ref, isOver } = useDropTarget<HTMLDivElement>({
    type: "calendar-task-move",
    onDrop: handleTaskDrop,
  })

  const visibleReminders = dayReminders.slice(0, MAX_VISIBLE_REMINDERS)
  const overflowCount = dayReminders.length - visibleReminders.length

  return (
    // A task row needs its own click target (edit) plus a nested checkbox
    // with its own click target (toggle complete) — both invalid nested
    // inside a native <button>. role="button" + tabIndex give the same
    // keyboard/a11y affordances instead, same pattern already established
    // for TimedTaskBlock in HourGrid.tsx.
    <div
      data-plan-day={formatDateKey(day)}
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") onSelect()
      }}
      // min-h keeps an empty day from collapsing to just its number (a
      // week with nothing scheduled looked squashed/cramped next to a
      // busy one otherwise, even though every cell in a CSS Grid row
      // already stretches to that row's tallest cell by default) — cells
      // still grow past this floor with content (stacked task rows
      // below), matching the "week row is as tall as its busiest day"
      // look the TickTick reference has.
      className={`min-h-[84px] rounded-md border flex flex-col items-stretch gap-1 pt-2 pb-1.5 px-1 text-sm transition cursor-pointer ${
        isSelected
          ? "border-2 border-primary bg-primary-soft"
          : isCurrent
            ? "border-primary-line bg-primary-soft"
            : isCurrentMonth
              ? "border-border bg-card hover:bg-sunken text-foreground"
              : "border-border bg-sunken/60 hover:bg-sunken text-tertiary"
      } ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <span
        className={`tabular-nums self-center w-[26px] h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
          isCurrent ? "bg-primary text-primary-foreground" : ""
        }`}
      >
        {format(day, "d")}
      </span>

      {visibleReminders.length > 0 && (
        <div className="w-full flex flex-col gap-0.5">
          {visibleReminders.map(reminder => (
            <div
              key={reminder.id}
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation()
                onEditReminder(reminder.id, e.currentTarget.getBoundingClientRect())
              }}
              onKeyDown={e => {
                if (e.key !== "Enter" && e.key !== " ") return
                e.stopPropagation()
                onEditReminder(reminder.id, e.currentTarget.getBoundingClientRect())
              }}
              className="w-full flex items-center gap-1 rounded-md px-1 py-0.5 text-caption leading-tight border bg-card overflow-hidden cursor-pointer"
              style={{ borderColor: REMINDER_BORDER_COLORS[reminder.priority] }}
            >
              <ReminderPriorityIcon
                priority={reminder.priority}
                size={8}
                colorOverride={REMINDER_BORDER_COLORS[reminder.priority]}
              />
              {reminder.time && (
                <span className="tabular-nums shrink-0 text-muted-foreground font-bold">{reminder.time}</span>
              )}
              <span
                className={`truncate font-semibold ${reminder.completed ? "line-through text-tertiary" : ""}`}
              >
                {reminder.title}
              </span>
            </div>
          ))}
          {overflowCount > 0 && (
            <div className="text-caption px-1 text-muted-foreground">+{overflowCount}</div>
          )}
        </div>
      )}

      {/* One row per task, no cap — a CSS Grid row already stretches every
          cell in it to the tallest one, so a busy day naturally grows its
          whole week row, matching the TickTick reference. */}
      {dayTasks.length > 0 && (
        <div className="w-full flex flex-col gap-0.5">
          {dayTasks.map(task => (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation()
                onEditTask(task.id, e.currentTarget.getBoundingClientRect())
              }}
              onKeyDown={e => {
                if (e.key !== "Enter" && e.key !== " ") return
                e.stopPropagation()
                onEditTask(task.id, e.currentTarget.getBoundingClientRect())
              }}
              className="w-full flex items-center gap-1 rounded-md px-1 py-0.5 text-caption leading-tight overflow-hidden cursor-pointer"
              style={{
                backgroundColor: task.completed
                  ? "var(--fill)"
                  : `color-mix(in srgb, ${PLAN_COLOR} 22%, var(--card))`,
              }}
            >
              <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={11} />
              </div>
              {task.time && (
                <span className="tabular-nums shrink-0 text-muted-foreground font-bold">{task.time}</span>
              )}
              <span
                className={`truncate font-semibold ${task.completed ? "line-through text-tertiary" : ""}`}
              >
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* A goal's deadline day — deliberately a third, distinct visual
          shape (left accent bar + Target icon, plain card background) so
          it doesn't read as "just another task" (filled chip) or "just
          another reminder" (outlined chip) at a glance. No click handler
          of its own — unlike task/reminder rows, which open their own
          inline-edit popover, a goal chip just falls through to the
          cell's onSelect and opens the day panel, whose DayGoalRow links
          to the goal (goals are read-only in the calendar, audit П7). */}
      {/* A task's deadline (iteration 3) — the same marker shape as a goal
          deadline (left bar + icon, plain background) but a Flag in the
          task's category color, so it reads as "due", not as a scheduled
          block. Like goal markers it has no click of its own: it falls
          through to the day panel, which lists it under "Task deadlines". */}
      {dayDeadlines.length > 0 && (
        <div className="w-full flex flex-col gap-0.5">
          {dayDeadlines.map(task => {
            const color = resolveCategoryColor(task.category, categories)
            return (
              <div
                key={task.id}
                data-deadline-id={task.id}
                className="w-full flex items-center gap-1 rounded-md pl-1.5 pr-1 py-0.5 text-caption leading-tight bg-card overflow-hidden"
                style={{ borderLeft: `2px solid ${color}` }}
              >
                <Flag size={8} strokeWidth={2.5} style={{ color }} className="shrink-0" />
                <span className="truncate font-semibold">{task.title}</span>
              </div>
            )
          })}
        </div>
      )}

      {dayGoals.length > 0 && (
        <div className="w-full flex flex-col gap-0.5">
          {dayGoals.map(goal => (
            <div
              key={goal.id}
              className="w-full flex items-center gap-1 rounded-md pl-1.5 pr-1 py-0.5 text-caption leading-tight bg-card overflow-hidden"
              style={{ borderLeft: `2px solid ${goal.color}` }}
            >
              <Target size={8} strokeWidth={2.5} style={{ color: goal.color }} className="shrink-0" />
              <span className="truncate font-semibold">{goal.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
