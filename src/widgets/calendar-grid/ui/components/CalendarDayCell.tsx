import { useCallback } from "react"
import { format } from "date-fns"
import { resolveCategoryColor, type Category } from "@/entities/category"
import { REMINDER_BORDER_COLORS, ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { type Task } from "@/entities/task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { useDropTarget } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"

// Shown inline on the cell without a tap — up to this many, the rest is
// summarized as "+N". Reminders keep this cap (their own redesign wasn't
// asked for beyond the border treatment below); tasks below deliberately
// don't have one any more — see the task-row block's own comment.
const MAX_VISIBLE_REMINDERS = 2

function pastelFill(hex: string): string {
  return `${hex}33`
}

export function CalendarDayCell({
  day,
  isCurrentMonth,
  dayTasks,
  dayReminders,
  categories,
  isSelected,
  isCurrent,
  onSelect,
  onMoveTaskToDay,
  onMoveGoalToDay,
  onEditTask,
}: {
  day: Date
  isCurrentMonth: boolean
  dayTasks: Task[]
  dayReminders: Reminder[]
  categories: Category[]
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onMoveGoalToDay: (goalId: string, day: Date) => void
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
}) {
  // Composed here (not passed down as a ready-made per-day closure from the
  // parent's .map()) so it stays referentially stable across renders where
  // `day` and `onMoveTaskToDay` don't change — useDropTarget's ref callback
  // depends on this identity staying stable, see useDropTarget's comment.
  const handleTaskDrop = useCallback((taskId: string) => onMoveTaskToDay(taskId, day), [onMoveTaskToDay, day])
  const handleGoalDrop = useCallback((goalId: string) => onMoveGoalToDay(goalId, day), [onMoveGoalToDay, day])
  // Two drop targets, one per draggable type, composed onto the same node
  // (same pattern used for the habit-group header's drag+drop composition)
  // — react-dnd's useDrop only ever accepts one `type` per call, so a cell
  // that must accept both a dragged task AND a dragged goal needs two
  // hook instances, not one hook with a type union.
  const { ref: taskDropRef, isOver: isTaskOver } = useDropTarget<HTMLDivElement>({
    type: "calendar-task-move",
    onDrop: handleTaskDrop,
  })
  const { ref: goalDropRef, isOver: isGoalOver } = useDropTarget<HTMLDivElement>({
    type: "calendar-goal-move",
    onDrop: handleGoalDrop,
  })
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      taskDropRef(node)
      goalDropRef(node)
    },
    [taskDropRef, goalDropRef],
  )
  const isOver = isTaskOver || isGoalOver

  const visibleReminders = dayReminders.slice(0, MAX_VISIBLE_REMINDERS)
  const overflowCount = dayReminders.length - visibleReminders.length

  return (
    // A task row needs its own click target (edit) plus a nested checkbox
    // with its own click target (toggle complete) — both invalid nested
    // inside a native <button>. role="button" + tabIndex give the same
    // keyboard/a11y affordances instead, same pattern already established
    // for TimedTaskBlock in HourGrid.tsx.
    <div
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
      className={`min-h-[84px] rounded-xl border flex flex-col items-stretch gap-1 pt-2 pb-1.5 px-1 text-sm transition-all cursor-pointer ${
        isSelected
          ? "bg-primary text-primary-foreground border-primary"
          : isCurrent
            ? "bg-primary/10 text-primary border-primary/30"
            : isCurrentMonth
              ? "border-border hover:bg-accent text-foreground"
              : "border-border/40 hover:bg-accent/50 text-muted-foreground/50"
      } ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <span css={monoFont} className="text-xs shrink-0 text-center">
        {format(day, "d")}
      </span>

      {visibleReminders.length > 0 && (
        <div className="w-full flex flex-col gap-0.5">
          {visibleReminders.map(reminder => (
            <div
              key={reminder.id}
              className={`w-full flex items-center gap-1 rounded px-1 py-0.5 text-[9px] leading-tight border overflow-hidden ${
                isSelected
                  ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/40"
                  : "bg-card"
              }`}
              style={!isSelected ? { borderColor: REMINDER_BORDER_COLORS[reminder.priority] } : undefined}
            >
              <ReminderPriorityIcon
                priority={reminder.priority}
                size={8}
                colorOverride={isSelected ? "currentColor" : REMINDER_BORDER_COLORS[reminder.priority]}
              />
              {reminder.time && (
                <span css={monoFont} className="shrink-0">
                  {reminder.time}
                </span>
              )}
              <span className="truncate">{reminder.title}</span>
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              className={`text-[9px] px-1 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}
            >
              +{overflowCount}
            </div>
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
              className="w-full flex items-center gap-1 rounded px-1 py-0.5 text-[9px] leading-tight overflow-hidden cursor-pointer"
              style={{
                backgroundColor: task.completed
                  ? "var(--muted)"
                  : pastelFill(resolveCategoryColor(task.category, categories)),
              }}
            >
              <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={11} />
              </div>
              {task.time && (
                <span css={monoFont} className="shrink-0 text-muted-foreground">
                  {task.time}
                </span>
              )}
              <span className={`truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
