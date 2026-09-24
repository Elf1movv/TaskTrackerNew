import { useCallback } from "react"
import { Repeat, Target } from "lucide-react"
import type { Goal } from "@/entities/goal"
import type { Habit } from "@/entities/habit"
import { ReminderPriorityIcon, REMINDER_PRIORITY_COLORS, type Reminder } from "@/entities/reminder"
import { PriorityDot, PRIORITY_COLORS, type Task } from "@/entities/task"
import { useDragItem, useDropTarget } from "@/shared/lib/dnd"

export interface AllDayColumn {
  day: Date
  // Undated-time tasks/reminders (dueDate/date set, no time) plus goal
  // deadlines and habit occurrences — none of the latter two have a time
  // field at all (see isGoalDueOnDay/selectHabitsOnDay), so they always
  // live here, never in HourGrid.
  tasks: Task[]
  reminders: Reminder[]
  goals: Goal[]
  habits: Habit[]
}

// Sits above HourGrid, same idea as Google Calendar/TickTick's all-day
// strip. Drag here is whole-day only, reusing the exact same
// "calendar-task-move"/"calendar-goal-move" types Month's CalendarDayCell
// already accepts — an item with no time can only be rescheduled to a
// different day, not a different minute. Habits are never draggable here
// (see DayHabitRow — activeDays is a recurring pattern, not a per-instance
// date to move) and reminders aren't draggable at all in this app's model.
export function AllDayRow({
  columns,
  onEditTask,
  onEditReminder,
  onEditGoal,
  onMoveTask,
  onMoveGoal,
}: {
  columns: AllDayColumn[]
  onEditTask: (taskId: string) => void
  onEditReminder: (reminderId: string) => void
  onEditGoal: (goalId: string) => void
  onMoveTask: (taskId: string, day: Date) => void
  onMoveGoal: (goalId: string, day: Date) => void
}) {
  const hasAnyContent = columns.some(
    c => c.tasks.length + c.reminders.length + c.goals.length + c.habits.length > 0,
  )
  if (!hasAnyContent) return null

  return (
    <div className="flex border border-border rounded-2xl mb-2 divide-x divide-border overflow-hidden">
      {columns.map(column => (
        <AllDayColumnCell
          key={column.day.toISOString()}
          column={column}
          onEditTask={onEditTask}
          onEditReminder={onEditReminder}
          onEditGoal={onEditGoal}
          onMoveTask={onMoveTask}
          onMoveGoal={onMoveGoal}
        />
      ))}
    </div>
  )
}

function AllDayColumnCell({
  column,
  onEditTask,
  onEditReminder,
  onEditGoal,
  onMoveTask,
  onMoveGoal,
}: {
  column: AllDayColumn
  onEditTask: (taskId: string) => void
  onEditReminder: (reminderId: string) => void
  onEditGoal: (goalId: string) => void
  onMoveTask: (taskId: string, day: Date) => void
  onMoveGoal: (goalId: string, day: Date) => void
}) {
  const handleTaskDrop = useCallback(
    (taskId: string) => onMoveTask(taskId, column.day),
    [onMoveTask, column.day],
  )
  const handleGoalDrop = useCallback(
    (goalId: string) => onMoveGoal(goalId, column.day),
    [onMoveGoal, column.day],
  )
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

  return (
    <div
      ref={ref}
      className={`flex-1 min-w-[120px] p-1.5 flex flex-col gap-1 ${
        isTaskOver || isGoalOver ? "bg-primary/5" : ""
      }`}
    >
      {column.tasks.map(task => (
        <AllDayTaskChip key={task.id} task={task} onEdit={() => onEditTask(task.id)} />
      ))}
      {column.reminders.map(reminder => (
        <AllDayReminderChip
          key={reminder.id}
          reminder={reminder}
          onEdit={() => onEditReminder(reminder.id)}
        />
      ))}
      {column.goals.map(goal => (
        <AllDayGoalChip key={goal.id} goal={goal} onEdit={() => onEditGoal(goal.id)} />
      ))}
      {column.habits.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-1">
          <Repeat size={10} />
          {column.habits.length}
        </div>
      )}
    </div>
  )
}

function AllDayTaskChip({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { ref, isDragging } = useDragItem<HTMLButtonElement>({ type: "calendar-task-move", id: task.id })
  return (
    <button
      ref={ref}
      onClick={onEdit}
      style={{ opacity: isDragging ? 0.4 : 1, borderLeftColor: PRIORITY_COLORS[task.priority] }}
      className={`flex items-center gap-1 rounded-md border-l-2 bg-card px-1.5 py-0.5 text-left text-[11px] shadow-sm cursor-grab active:cursor-grabbing overflow-hidden ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <PriorityDot priority={task.priority} size={9} />
      <span className={`truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </span>
    </button>
  )
}

function AllDayReminderChip({ reminder, onEdit }: { reminder: Reminder; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      style={{ borderLeftColor: REMINDER_PRIORITY_COLORS[reminder.priority] }}
      className={`flex items-center gap-1 rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11px] overflow-hidden ${
        reminder.priority === "critical" ? "bg-destructive/10" : "bg-primary/10"
      }`}
    >
      <ReminderPriorityIcon priority={reminder.priority} size={9} />
      <span className="truncate">{reminder.title}</span>
    </button>
  )
}

function AllDayGoalChip({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const { ref, isDragging } = useDragItem<HTMLButtonElement>({ type: "calendar-goal-move", id: goal.id })
  return (
    <button
      ref={ref}
      onClick={onEdit}
      style={{ opacity: isDragging ? 0.4 : 1, borderLeftColor: goal.color }}
      className="flex items-center gap-1 rounded-md border-l-2 bg-card px-1.5 py-0.5 text-left text-[11px] shadow-sm cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <Target size={9} />
      <span className="truncate">{goal.title}</span>
    </button>
  )
}
