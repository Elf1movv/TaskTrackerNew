import { useState } from "react"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { formatDateKey } from "@/shared/lib/date"
import { HourGrid } from "@/widgets/calendar-timeline"
import { CalendarItemPopover, type CalendarItemDraft } from "@/widgets/calendar-item-popover"

// Composes calendar-timeline full-width, edge to edge (no reserved
// sidebar column) — the hour grid is the detail view here (see the plan's
// rationale: Day/Week don't reuse DayDetailPanel, since a fixed side
// panel would duplicate what the timeline already shows visually), and
// clicking any block or dragging on an empty slot opens
// CalendarItemPopover anchored at that point, rather than a static
// sidebar. Goals get no create/edit affordance here at all — Day/Week
// give goals no CRUD, only their own page (or Month's day panel) can
// create/edit them.
//
// No all-day/untimed strip above the grid — removed per user feedback
// that it read as an unclear intermediate layer (a bare row of "+"
// buttons above the actual calendar). This means an untimed task/
// reminder (a due date but no time) has nowhere to render in Day/Week
// specifically — it's still visible in Month, Agenda, and the Tasks/
// Reminders pages, just not on this hour-grid timeline, which now only
// ever shows items that have a time.
export function CalendarDayView({
  anchorDate,
  allTasks,
  allReminders,
  onRescheduleTaskTime,
  onResizeTask,
}: {
  anchorDate: Date
  allTasks: Task[]
  allReminders: Reminder[]
  onRescheduleTaskTime: (taskId: string, day: Date, time: string) => void
  onResizeTask: (taskId: string, endTime: string) => void
}) {
  const [draft, setDraft] = useState<CalendarItemDraft | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const dayKey = formatDateKey(anchorDate)

  function closeDraft() {
    setDraft(null)
    setAnchorRect(null)
  }

  const dayTasks = allTasks.filter(task => isTaskOnDay(task, dayKey))
  const dayReminders = selectRemindersOnDay(allReminders, dayKey)

  const timedTasks = dayTasks.filter(task => task.time)
  const timedReminders = dayReminders.filter(reminder => reminder.time)

  function openEditTask(taskId: string, rect: DOMRect) {
    const task = dayTasks.find(t => t.id === taskId)
    if (!task) return
    setDraft({ mode: "edit-task", task })
    setAnchorRect(rect)
  }

  function openEditReminder(reminderId: string, rect: DOMRect) {
    const reminder = dayReminders.find(r => r.id === reminderId)
    if (!reminder) return
    setDraft({ mode: "edit-reminder", reminder })
    setAnchorRect(rect)
  }

  return (
    <div className="min-w-0">
      <HourGrid
        columns={[{ day: anchorDate, tasks: timedTasks, reminders: timedReminders }]}
        onEditTask={openEditTask}
        onEditReminder={openEditReminder}
        onRescheduleTask={onRescheduleTaskTime}
        onResizeTask={onResizeTask}
        onCreateDraft={(day, startTime, endTime, rect) => {
          setDraft({ mode: "create", day, defaultTime: startTime, defaultEndTime: endTime })
          setAnchorRect(rect)
        }}
      />
      <CalendarItemPopover draft={draft} anchorRect={anchorRect} onClose={closeDraft} />
    </div>
  )
}
