import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { format } from "date-fns"
import { Plus, X } from "lucide-react"
import { TaskForm } from "@/features/task-form"
import { ReminderForm } from "@/features/reminder-form"
import { GoalForm } from "@/features/goal-form"
import { type Goal } from "@/entities/goal"
import { type Habit } from "@/entities/habit"
import { type Reminder } from "@/entities/reminder"
import { type Task } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { DayGoalRow, DayHabitRow, DayReminderRow, DayTaskRow } from "./components"

export function DayDetailPanel({
  day,
  tasks,
  reminders,
  goals,
  habits,
  onClose,
}: {
  day: Date
  tasks: Task[]
  reminders: Reminder[]
  goals: Goal[]
  habits: Habit[]
  onClose: () => void
}) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const dueDate = formatDateKey(day)

  return (
    <div className="bg-card border border-border rounded-2xl p-5 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-5">
        <div>
          <div css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            {format(day, "EEEE", { locale })}
          </div>
          <div css={displayFont} className="text-2xl">
            {format(day, "MMMM d", { locale })}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-xl text-muted-foreground hover:text-foreground shrink-0"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <span css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("tasks.title")}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setEditingTaskId(null)
            setIsAddingTask(v => !v)
          }}
          aria-label="Add task"
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
            <TaskForm defaultDueDate={dueDate} onDone={() => setIsAddingTask(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length > 0 ? (
        <div className="space-y-3 mb-6">
          {tasks.map(task =>
            editingTaskId === task.id ? (
              <TaskForm key={task.id} task={task} onDone={() => setEditingTaskId(null)} />
            ) : (
              <DayTaskRow
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

      <div className="flex items-center justify-between mb-2.5">
        <span css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("reminderSummary.title")}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg h-6 w-6 text-muted-foreground hover:text-foreground"
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

      <div className="flex items-center justify-between mb-2.5">
        <span css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("nav.goals")}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setEditingGoalId(null)
            setIsAddingGoal(v => !v)
          }}
          aria-label="Add goal"
        >
          <Plus size={14} />
        </Button>
      </div>

      <AnimatePresence>
        {isAddingGoal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-3"
          >
            <GoalForm defaultTargetDate={dueDate} onDone={() => setIsAddingGoal(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length > 0 ? (
        <div className="space-y-3 mb-6">
          {goals.map(goal =>
            editingGoalId === goal.id ? (
              <GoalForm key={goal.id} goal={goal} onDone={() => setEditingGoalId(null)} />
            ) : (
              <DayGoalRow
                key={goal.id}
                goal={goal}
                onEdit={() => {
                  setIsAddingGoal(false)
                  setEditingGoalId(goal.id)
                }}
              />
            ),
          )}
        </div>
      ) : (
        !isAddingGoal && (
          <div className="text-sm text-muted-foreground text-center py-6 mb-2">
            {t("calendar.noGoalsScheduled")}
          </div>
        )
      )}

      <div className="mb-2.5">
        <span css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("nav.habits")}
        </span>
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
