import { useCallback } from "react"
import { Plus } from "lucide-react"
import { ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { PriorityDot, type Task } from "@/entities/task"
import { ENTITY_TYPE_COLORS } from "@/shared/lib/colors"
import { useDragItem, useDropTarget } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"

export interface AllDayColumn {
  day: Date
  // Undated-time tasks/reminders (dueDate/date set, no time) — the only
  // things this row shows. Goal deadlines and habit occurrences used to
  // get a passive icon marker here too, but that read as unclear/unlabeled
  // to the user and was removed; goals/habits are still fully visible in
  // Month's DayDetailPanel and their own pages.
  tasks: Task[]
  reminders: Reminder[]
}

// Sits above HourGrid, same idea as Google Calendar/TickTick's all-day
// strip. Drag here is whole-day only, reusing the exact same
// "calendar-task-move" type Month's CalendarDayCell already accepts — an
// item with no time can only be rescheduled to a different day, not a
// different minute. Reminders aren't draggable at all in this app's model.
//
// `onAddUntimed` is optional — the "+" affordance is Day-view-only this
// round (see CalendarWeekView, which doesn't pass it); when absent, no
// button is rendered and this row renders nothing on an empty day, same
// as before.
export function AllDayRow({
  columns,
  onEditTask,
  onEditReminder,
  onMoveTask,
  onAddUntimed,
}: {
  columns: AllDayColumn[]
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
  onMoveTask: (taskId: string, day: Date) => void
  onAddUntimed?: (day: Date, anchorRect: DOMRect) => void
}) {
  const hasAnyContent = columns.some(c => c.tasks.length + c.reminders.length > 0)
  if (!hasAnyContent && !onAddUntimed) return null

  return (
    <div className="flex border border-border rounded-2xl mb-2 divide-x divide-border overflow-hidden">
      {columns.map(column => (
        <AllDayColumnCell
          key={column.day.toISOString()}
          column={column}
          onEditTask={onEditTask}
          onEditReminder={onEditReminder}
          onMoveTask={onMoveTask}
          onAddUntimed={onAddUntimed}
        />
      ))}
    </div>
  )
}

function AllDayColumnCell({
  column,
  onEditTask,
  onEditReminder,
  onMoveTask,
  onAddUntimed,
}: {
  column: AllDayColumn
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
  onMoveTask: (taskId: string, day: Date) => void
  onAddUntimed?: (day: Date, anchorRect: DOMRect) => void
}) {
  const { t } = useLanguage()
  const handleTaskDrop = useCallback(
    (taskId: string) => onMoveTask(taskId, column.day),
    [onMoveTask, column.day],
  )
  const { ref, isOver } = useDropTarget<HTMLDivElement>({
    type: "calendar-task-move",
    onDrop: handleTaskDrop,
  })

  return (
    <div
      ref={ref}
      className={`flex-1 min-w-[120px] p-1.5 flex flex-col gap-1 ${isOver ? "bg-primary/5" : ""}`}
    >
      {column.tasks.map(task => (
        <AllDayTaskChip key={task.id} task={task} onEdit={rect => onEditTask(task.id, rect)} />
      ))}
      {column.reminders.map(reminder => (
        <AllDayReminderChip
          key={reminder.id}
          reminder={reminder}
          onEdit={rect => onEditReminder(reminder.id, rect)}
        />
      ))}
      {onAddUntimed && (
        <button
          onClick={e => onAddUntimed(column.day, e.currentTarget.getBoundingClientRect())}
          aria-label={t("calendar.addUntimed")}
          className="inline-flex items-center justify-center size-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  )
}

function AllDayTaskChip({ task, onEdit }: { task: Task; onEdit: (anchorRect: DOMRect) => void }) {
  const { ref, isDragging } = useDragItem<HTMLButtonElement>({ type: "calendar-task-move", id: task.id })
  return (
    <button
      ref={ref}
      onClick={e => onEdit(e.currentTarget.getBoundingClientRect())}
      style={{ opacity: isDragging ? 0.4 : 1, borderLeftColor: ENTITY_TYPE_COLORS.task }}
      className={`inline-flex max-w-full items-center gap-1 rounded-md border-l-2 bg-card px-1.5 py-0.5 text-left text-[11px] shadow-sm cursor-grab active:cursor-grabbing overflow-hidden ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <PriorityDot priority={task.priority} size={9} colorOverride={ENTITY_TYPE_COLORS.task} />
      <span className={`truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </span>
    </button>
  )
}

function AllDayReminderChip({
  reminder,
  onEdit,
}: {
  reminder: Reminder
  onEdit: (anchorRect: DOMRect) => void
}) {
  return (
    <button
      onClick={e => onEdit(e.currentTarget.getBoundingClientRect())}
      style={{ borderLeftColor: ENTITY_TYPE_COLORS.reminder }}
      className="inline-flex max-w-full items-center gap-1 rounded-full border-l-2 bg-card px-1.5 py-0.5 text-left text-[11px] overflow-hidden"
    >
      <ReminderPriorityIcon
        priority={reminder.priority}
        size={9}
        colorOverride={ENTITY_TYPE_COLORS.reminder}
      />
      <span className="truncate">{reminder.title}</span>
    </button>
  )
}
