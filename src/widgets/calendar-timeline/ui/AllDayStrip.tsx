import { Flag, Target } from "lucide-react"
import { useNavigate } from "react-router"
import { resolveCategoryColor, useCategories } from "@/entities/category"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import {
  REMINDER_BORDER_COLORS,
  ReminderPriorityIcon,
  selectRemindersOnDay,
  type Reminder,
} from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"

// Things tied to a day but not to an hour, shown above the hour grid in Day
// and Week (audit П8, decision 2, 2026-11-09): reminders without a time,
// task deadlines and goal deadlines — the same chips the Month cell uses.
// Before, Day/Week showed only timed items, so a day could look empty here
// while Month showed a reminder and a deadline on it.
// The whole strip is hidden when none of the visible days has anything — an
// always-on empty band was removed earlier as confusing (owner feedback).
// Deadlines are read-only here (they open the task or goal); a reminder
// opens the same edit popover as a timed one.
export function AllDayStrip({
  days,
  reminders,
  deadlines,
  goals,
  onEditReminder,
}: {
  days: Date[]
  reminders: Reminder[]
  deadlines: Task[]
  goals: Goal[]
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
}) {
  const navigate = useNavigate()
  const { categories } = useCategories()
  const columns = days.map(day => {
    const key = formatDateKey(day)
    return {
      key,
      reminders: selectRemindersOnDay(reminders, key).filter(r => !r.time),
      deadlines: deadlines.filter(task => isTaskOnDay(task, key)),
      goals: goals.filter(goal => isGoalDueOnDay(goal, key)),
    }
  })
  if (columns.every(c => !c.reminders.length && !c.deadlines.length && !c.goals.length)) return null

  return (
    <div data-all-day-strip className="flex mb-2">
      <div className="w-12 shrink-0" />
      <div
        className="flex-1 grid min-w-0"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {columns.map(column => (
          <div key={column.key} className="flex flex-col gap-0.5 min-w-0 px-0.5">
            {column.reminders.map(reminder => (
              <button
                key={reminder.id}
                type="button"
                onClick={e => onEditReminder(reminder.id, e.currentTarget.getBoundingClientRect())}
                className="w-full flex items-center gap-1 rounded-md px-1 py-0.5 text-caption leading-tight border bg-card overflow-hidden text-left"
                style={{ borderColor: REMINDER_BORDER_COLORS[reminder.priority] }}
              >
                <ReminderPriorityIcon
                  priority={reminder.priority}
                  size={8}
                  colorOverride={REMINDER_BORDER_COLORS[reminder.priority]}
                />
                <span
                  className={`truncate font-semibold ${reminder.completed ? "line-through text-tertiary" : ""}`}
                >
                  {reminder.title}
                </span>
              </button>
            ))}
            {column.deadlines.map(task => {
              const color = resolveCategoryColor(task.category, categories)
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate(`/tasks?task=${task.id}`)}
                  className="w-full flex items-center gap-1 rounded-md pl-1.5 pr-1 py-0.5 text-caption leading-tight bg-card overflow-hidden text-left"
                  style={{ borderLeft: `2px solid ${color}` }}
                >
                  <Flag size={8} strokeWidth={2.5} style={{ color }} className="shrink-0" />
                  <span
                    className={`truncate font-semibold ${task.completed ? "line-through text-tertiary" : ""}`}
                  >
                    {task.title}
                  </span>
                </button>
              )
            })}
            {column.goals.map(goal => (
              <button
                key={goal.id}
                type="button"
                onClick={() => navigate(`/goals?goal=${goal.id}`)}
                className="w-full flex items-center gap-1 rounded-md pl-1.5 pr-1 py-0.5 text-caption leading-tight bg-card overflow-hidden text-left"
                style={{ borderLeft: `2px solid ${goal.color}` }}
              >
                <Target size={8} strokeWidth={2.5} style={{ color: goal.color }} className="shrink-0" />
                <span className="truncate font-semibold">{goal.title}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
