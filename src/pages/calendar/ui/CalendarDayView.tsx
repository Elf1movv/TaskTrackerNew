import { useState } from "react"
import { Plus } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { ReminderForm } from "@/features/reminder-form"
import { GoalForm } from "@/features/goal-form"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import { selectHabitsOnDay, type Habit } from "@/entities/habit"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { AllDayRow, HourGrid } from "@/widgets/calendar-timeline"

// Either an existing item being edited, or a blank form for a new one —
// same shape as CalendarAgendaView's EditingItem, extended with the
// "new-*" cases since (unlike Agenda) this view is a primary entry point,
// not just a scanning list, so it needs its own add affordance.
type Editing =
  | { kind: "task" | "reminder" | "goal"; id: string }
  | { kind: "new-task" | "new-reminder" | "new-goal" }
  | null

// Composes calendar-timeline with a single day column — the hour grid is
// the detail view here (see the plan's rationale: Day/Week don't reuse
// DayDetailPanel, since a fixed side panel would duplicate what the
// timeline already shows visually). Clicking any block opens that item's
// form in the side panel; the side panel falls back to three quick-add
// buttons when nothing is being edited.
export function CalendarDayView({
  anchorDate,
  allTasks,
  allReminders,
  allGoals,
  allHabits,
  onMoveTaskToDay,
  onMoveGoalToDay,
  onRescheduleTaskTime,
}: {
  anchorDate: Date
  allTasks: Task[]
  allReminders: Reminder[]
  allGoals: Goal[]
  allHabits: Habit[]
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onMoveGoalToDay: (goalId: string, day: Date) => void
  onRescheduleTaskTime: (taskId: string, day: Date, time: string) => void
}) {
  const { t } = useLanguage()
  const [editing, setEditing] = useState<Editing>(null)
  const dayKey = formatDateKey(anchorDate)

  const dayTasks = allTasks.filter(task => isTaskOnDay(task, dayKey))
  const dayReminders = selectRemindersOnDay(allReminders, dayKey)
  const dayGoals = allGoals.filter(goal => isGoalDueOnDay(goal, dayKey))
  const dayHabits = selectHabitsOnDay(allHabits, anchorDate)

  const timedTasks = dayTasks.filter(task => task.time)
  const untimedTasks = dayTasks.filter(task => !task.time)
  const timedReminders = dayReminders.filter(reminder => reminder.time)
  const untimedReminders = dayReminders.filter(reminder => !reminder.time)

  const editingTask = editing?.kind === "task" ? dayTasks.find(t => t.id === editing.id) : undefined
  const editingReminder =
    editing?.kind === "reminder" ? dayReminders.find(r => r.id === editing.id) : undefined
  const editingGoal = editing?.kind === "goal" ? dayGoals.find(g => g.id === editing.id) : undefined

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px] items-start">
      <div className="min-w-0">
        <AllDayRow
          columns={[
            {
              day: anchorDate,
              tasks: untimedTasks,
              reminders: untimedReminders,
              goals: dayGoals,
              habits: dayHabits,
            },
          ]}
          onEditTask={id => setEditing({ kind: "task", id })}
          onEditReminder={id => setEditing({ kind: "reminder", id })}
          onEditGoal={id => setEditing({ kind: "goal", id })}
          onMoveTask={onMoveTaskToDay}
          onMoveGoal={onMoveGoalToDay}
        />
        <HourGrid
          columns={[{ day: anchorDate, tasks: timedTasks, reminders: timedReminders }]}
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
          <ReminderForm reminder={editingReminder} lockedDate={dayKey} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "goal" && editingGoal && (
          <GoalForm goal={editingGoal} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "new-task" && <TaskForm defaultDueDate={dayKey} onDone={() => setEditing(null)} />}
        {editing?.kind === "new-reminder" && (
          <ReminderForm lockedDate={dayKey} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "new-goal" && (
          <GoalForm defaultTargetDate={dayKey} onDone={() => setEditing(null)} />
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
