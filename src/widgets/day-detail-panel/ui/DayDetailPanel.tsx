import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { format } from "date-fns"
import { Plus, X } from "lucide-react"
import { PlanForm } from "@/features/plan-form"
import { ReminderForm } from "@/features/reminder-form"
import { type Goal } from "@/entities/goal"
import type { Task as DeadlineTask } from "@/entities/task"
import { type Habit } from "@/entities/habit"
import { type Reminder } from "@/entities/reminder"
import type { CalendarEntry as Task } from "@/entities/calendar-plan"
import { formatDateKey } from "@/shared/lib/date"
import { formatDay, getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { DayDeadlineRow, DayGoalRow, DayHabitRow, DayReminderRow, DayPlanRow } from "./components"

export function DayDetailPanel({
  day,
  tasks,
  deadlines = [],
  reminders,
  goals,
  habits,
  onClose,
}: {
  day: Date
  tasks: Task[]
  // Real tasks whose deadline is this day — shown read-only under the
  // plans, and only when there are any, to keep the panel short.
  deadlines?: DeadlineTask[]
  reminders: Reminder[]
  goals: Goal[]
  habits: Habit[]
  onClose: () => void
}) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const dueDate = formatDateKey(day)

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-card p-5 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-5">
        <div>
          <div className="tabular-nums text-meta font-semibold text-tertiary mb-1">
            {format(day, "EEEE", { locale })}
          </div>
          <div className="font-[family-name:var(--font-display)] text-2xl font-bold">
            {formatDay(day, language)}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-md text-muted-foreground hover:text-foreground hover:bg-fill shrink-0"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <span className="tabular-nums text-meta font-semibold text-tertiary">{t("plans.title")}</span>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-fill"
          onClick={() => {
            setEditingTaskId(null)
            setIsAddingTask(v => !v)
          }}
          aria-label="Add plan"
        >
          <Plus size={14} />
        </Button>
      </div>

      <AnimatePresence>
        {isAddingTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-3"
          >
            <PlanForm defaultDate={dueDate} onDone={() => setIsAddingTask(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length > 0 ? (
        <div className="space-y-3 mb-6">
          {tasks.map(task =>
            editingTaskId === task.id ? (
              <PlanForm key={task.id} plan={task} onDone={() => setEditingTaskId(null)} />
            ) : (
              <DayPlanRow
                key={task.id}
                task={task}
                onEdit={() => {
                  setIsAddingTask(false)
                  setEditingTaskId(task.id)
                }}
              />
            ),
          )}
        </div>
      ) : (
        !isAddingTask && (
          <div className="text-sm text-muted-foreground text-center py-6 mb-2">
            {t("calendar.noTasksScheduled")}
          </div>
        )
      )}

      {deadlines.length > 0 && (
        <>
          <div className="mb-2.5">
            <span className="tabular-nums text-meta font-semibold text-tertiary">
              {t("calendar.deadlines")}
            </span>
          </div>
          <div className="space-y-3 mb-6">
            {deadlines.map(task => (
              <DayDeadlineRow key={task.id} task={task} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-2.5">
        <span className="tabular-nums text-meta font-semibold text-tertiary">
          {t("reminderSummary.title")}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-fill"
          onClick={() => {
            setEditingReminderId(null)
            setIsAddingReminder(v => !v)
          }}
          aria-label="Add reminder"
        >
          <Plus size={14} />
        </Button>
      </div>

      <AnimatePresence>
        {isAddingReminder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-3"
          >
            <ReminderForm lockedDate={dueDate} onDone={() => setIsAddingReminder(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {reminders.length > 0 ? (
        <div className="space-y-3 mb-6">
          {reminders.map(reminder =>
            editingReminderId === reminder.id ? (
              <ReminderForm
                key={reminder.id}
                reminder={reminder}
                lockedDate={dueDate}
                onDone={() => setEditingReminderId(null)}
              />
            ) : (
              <DayReminderRow
                key={reminder.id}
                reminder={reminder}
                onEdit={() => {
                  setIsAddingReminder(false)
                  setEditingReminderId(reminder.id)
                }}
              />
            ),
          )}
        </div>
      ) : (
        !isAddingReminder && (
          <div className="text-sm text-muted-foreground text-center py-6 mb-2">
            {t("reminders.noRemindersYet")}
          </div>
        )
      )}

      {/* Goals are read-only here (audit П7): no "+", no inline form — a row
          opens the goal on the Goals page. Same height as the other section
          headers that do have a "+" button. */}
      <div className="flex items-center justify-between mb-2.5 h-6">
        <span className="tabular-nums text-meta font-semibold text-tertiary">{t("nav.goals")}</span>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-3 mb-6">
          {goals.map(goal => (
            <DayGoalRow key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-6 mb-2">
          {t("calendar.noGoalsScheduled")}
        </div>
      )}

      <div className="mb-2.5">
        <span className="tabular-nums text-meta font-semibold text-tertiary">{t("nav.habits")}</span>
      </div>

      {habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map(habit => (
            <DayHabitRow key={habit.id} habit={habit} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-6">
          {t("calendar.noHabitsScheduled")}
        </div>
      )}
    </div>
  )
}
