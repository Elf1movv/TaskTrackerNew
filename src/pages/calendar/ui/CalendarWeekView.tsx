import { useState } from "react"
import { format, isToday } from "date-fns"
import { Plus } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { ReminderForm } from "@/features/reminder-form"
import { GoalForm } from "@/features/goal-form"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import { selectHabitsOnDay, type Habit } from "@/entities/habit"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { AllDayRow, HourGrid } from "@/widgets/calendar-timeline"

// Not redesigned this round (see CalendarDayView for the new popover-
// based flow) — Week keeps its own sidebar, including full Goal add/edit,
// deliberately, per "one view at a time." The only forced change here is
// that AllDayGoalChip (calendar-timeline, shared with Day) is now a
// passive marker with no click/drag, so editing an existing goal from
// this sidebar is no longer reachable via the all-day row — only
// creating a new one through the quick-add button still is.
type Editing =
  { kind: "task" | "reminder"; id: string } | { kind: "new-task" | "new-reminder" | "new-goal" } | null

// Same calendar-timeline widget as CalendarDayView, just 7 day columns
// (buildWeekRange) instead of 1 — the widget itself is already generic
// over N columns, so this view is mostly the per-day filtering + the week
// header row that CalendarDayView doesn't need. New items default onto
// the week's first day (Monday); dragging an all-day item to a different
// column moves it, same as Month's day cells.
export function CalendarWeekView({
  anchorDate,
  allTasks,
  allReminders,
  allGoals,
  allHabits,
  onMoveTaskToDay,
  onRescheduleTaskTime,
}: {
  anchorDate: Date
  allTasks: Task[]
  allReminders: Reminder[]
  allGoals: Goal[]
  allHabits: Habit[]
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onRescheduleTaskTime: (taskId: string, day: Date, time: string) => void
}) {
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const [editing, setEditing] = useState<Editing>(null)

  const days = buildWeekRange(anchorDate)
  const firstDayKey = formatDateKey(days[0])

  const allDayColumns = days.map(day => {
    const dayKey = formatDateKey(day)
    const dayTasks = allTasks.filter(task => isTaskOnDay(task, dayKey))
    const dayReminders = selectRemindersOnDay(allReminders, dayKey)
    return {
      day,
      tasks: dayTasks.filter(task => !task.time),
      reminders: dayReminders.filter(reminder => !reminder.time),
      goals: allGoals.filter(goal => isGoalDueOnDay(goal, dayKey)),
      habits: selectHabitsOnDay(allHabits, day),
    }
  })

  const hourGridColumns = days.map(day => {
    const dayKey = formatDateKey(day)
    return {
      day,
      tasks: allTasks.filter(task => isTaskOnDay(task, dayKey) && task.time),
      reminders: selectRemindersOnDay(allReminders, dayKey).filter(reminder => reminder.time),
    }
  })

  const editingTask = editing?.kind === "task" ? allTasks.find(t => t.id === editing.id) : undefined
  const editingReminder =
    editing?.kind === "reminder" ? allReminders.find(r => r.id === editing.id) : undefined

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px] items-start">
      <div className="min-w-0">
        <div className="flex mb-1">
          <div className="w-12 shrink-0" />
          <div className="flex-1 grid grid-cols-7 min-w-0">
            {days.map(day => (
              <div key={day.toISOString()} className="text-center min-w-0">
                <div
                  css={monoFont}
                  className={`text-[10px] uppercase tracking-wider ${
                    isToday(day) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {format(day, "EEE", { locale })}
                </div>
                <div className={`text-sm ${isToday(day) ? "text-primary font-medium" : ""}`}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AllDayRow
          columns={allDayColumns}
          onEditTask={id => setEditing({ kind: "task", id })}
          onEditReminder={id => setEditing({ kind: "reminder", id })}
          onMoveTask={onMoveTaskToDay}
        />
        <HourGrid
          columns={hourGridColumns}
          onEditTask={id => setEditing({ kind: "task", id })}
          onEditReminder={id => setEditing({ kind: "reminder", id })}
          onRescheduleTask={onRescheduleTaskTime}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 lg:sticky lg:top-4">
        {editing?.kind === "task" && editingTask && (
          <TaskForm task={editingTask} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "reminder" && editingReminder && (
          <ReminderForm reminder={editingReminder} lockedDate={firstDayKey} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "new-task" && (
          <TaskForm defaultDueDate={firstDayKey} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "new-reminder" && (
          <ReminderForm lockedDate={firstDayKey} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "new-goal" && (
          <GoalForm defaultTargetDate={firstDayKey} onDone={() => setEditing(null)} />
        )}

        {editing === null && (
          <div className="flex flex-col gap-2">
            <span
              css={monoFont}
              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1"
            >
              {t("calendar.quickAdd")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 rounded-xl"
              onClick={() => setEditing({ kind: "new-task" })}
            >
              <Plus size={14} /> {t("tasks.addTask")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 rounded-xl"
              onClick={() => setEditing({ kind: "new-reminder" })}
            >
              <Plus size={14} /> {t("reminders.addReminder")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 rounded-xl"
              onClick={() => setEditing({ kind: "new-goal" })}
            >
              <Plus size={14} /> {t("goals.addGoal")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
