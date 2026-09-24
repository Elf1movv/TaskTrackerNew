import { useMemo, useState } from "react"
import { format, isToday } from "date-fns"
import { TaskForm } from "@/features/task-form"
import { ReminderForm } from "@/features/reminder-form"
import { GoalForm } from "@/features/goal-form"
import { DayGoalRow, DayHabitRow, DayReminderRow, DayTaskRow } from "@/widgets/day-detail-panel"
import { isGoalDueOnDay, type Goal } from "@/entities/goal"
import { selectHabitsOnDay, type Habit } from "@/entities/habit"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { buildAgendaRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"

type EditingItem = { kind: "task" | "reminder" | "goal"; id: string } | null

// A flat, scannable list over a fixed forward window (see
// shared/lib/calendarGrid.ts's buildAgendaRange for why fixed, not
// infinite scroll) — days with nothing scheduled are skipped entirely,
// unlike Month's grid which always shows every day. Reuses the exact same
// row components the day panel already has (DayTaskRow etc., exported
// from widgets/day-detail-panel) instead of a second rendering for the
// same four entity types.
//
// Deliberately no "+ add" here, unlike the day panel — this view's job is
// scanning what's ahead and making quick edits, not primary data entry;
// adding new items happens from Today/Tasks/Goals or the other calendar
// views. Rows aren't draggable here either (draggable={false}) — a flat
// list has no day-cell equivalent to drop onto.
export function CalendarAgendaView({
  anchorDate,
  allTasks,
  allReminders,
  allGoals,
  allHabits,
}: {
  anchorDate: Date
  allTasks: Task[]
  allReminders: Reminder[]
  allGoals: Goal[]
  allHabits: Habit[]
}) {
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const [editing, setEditing] = useState<EditingItem>(null)

  const days = useMemo(() => buildAgendaRange(anchorDate), [anchorDate])

  const groups = useMemo(() => {
    return days
      .map(day => {
        const dayKey = formatDateKey(day)
        return {
          day,
          tasks: allTasks.filter(t => isTaskOnDay(t, dayKey)),
          reminders: selectRemindersOnDay(allReminders, dayKey),
          goals: allGoals.filter(g => isGoalDueOnDay(g, dayKey)),
          habits: selectHabitsOnDay(allHabits, day),
        }
      })
      .filter(g => g.tasks.length + g.reminders.length + g.goals.length + g.habits.length > 0)
  }, [days, allTasks, allReminders, allGoals, allHabits])

  if (groups.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm">{t("calendar.agendaEmpty")}</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {groups.map(group => {
        const dayKey = formatDateKey(group.day)
        return (
          <div key={dayKey} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-baseline gap-2 mb-4">
              <span
                css={monoFont}
                className={`text-xs uppercase tracking-wider ${isToday(group.day) ? "text-primary" : "text-muted-foreground"}`}
              >
                {format(group.day, "EEEE", { locale })}
              </span>
              <span className="text-sm font-medium">{format(group.day, "d MMMM", { locale })}</span>
            </div>

            <div className="space-y-2.5">
              {group.tasks.map(task =>
                editing?.kind === "task" && editing.id === task.id ? (
                  <TaskForm key={task.id} task={task} onDone={() => setEditing(null)} />
                ) : (
                  <DayTaskRow
                    key={task.id}
                    task={task}
                    draggable={false}
                    onEdit={() => setEditing({ kind: "task", id: task.id })}
                  />
                ),
              )}
              {group.reminders.map(reminder =>
                editing?.kind === "reminder" && editing.id === reminder.id ? (
                  <ReminderForm
                    key={reminder.id}
                    reminder={reminder}
                    lockedDate={dayKey}
                    onDone={() => setEditing(null)}
                  />
                ) : (
                  <DayReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    onEdit={() => setEditing({ kind: "reminder", id: reminder.id })}
                  />
                ),
              )}
              {group.goals.map(goal =>
                editing?.kind === "goal" && editing.id === goal.id ? (
                  <GoalForm key={goal.id} goal={goal} onDone={() => setEditing(null)} />
                ) : (
                  <DayGoalRow
                    key={goal.id}
                    goal={goal}
                    draggable={false}
                    onEdit={() => setEditing({ kind: "goal", id: goal.id })}
                  />
                ),
              )}
              {group.habits.map(habit => (
                <DayHabitRow key={habit.id} habit={habit} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
