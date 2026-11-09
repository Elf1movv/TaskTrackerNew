import { useState } from "react"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import type { Goal } from "@/entities/goal"
import type { Task as DeadlineTask } from "@/entities/task"
import { isPlanOnDay, type CalendarEntry as Plan } from "@/entities/calendar-plan"
import { formatDateKey } from "@/shared/lib/date"
import { AllDayStrip, HourGrid } from "@/widgets/calendar-timeline"
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
// Above the grid, AllDayStrip shows what belongs to the day but has no hour
// — untimed reminders, task and goal deadlines (audit П8, 2026-11-09) — so
// Day shows the same things as Month and Agenda. It renders nothing on an
// empty day: an always-visible strip was removed earlier as confusing.
export function CalendarDayView({
  anchorDate,
  allPlans,
  allReminders,
  allDeadlines,
  allGoals,
  onRescheduleTaskTime,
  onResizePlan,
}: {
  anchorDate: Date
  allPlans: Plan[]
  allReminders: Reminder[]
  allDeadlines: DeadlineTask[]
  allGoals: Goal[]
  onRescheduleTaskTime: (taskId: string, day: Date, time: string) => void
  onResizePlan: (taskId: string, endTime: string) => void
}) {
  const [draft, setDraft] = useState<CalendarItemDraft | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const dayKey = formatDateKey(anchorDate)

  function closeDraft() {
    setDraft(null)
    setAnchorRect(null)
  }

  const dayPlans = allPlans.filter(task => isPlanOnDay(task, dayKey))
  const dayReminders = selectRemindersOnDay(allReminders, dayKey)

  const timedPlans = dayPlans.filter(task => task.time)
  const timedReminders = dayReminders.filter(reminder => reminder.time)

  function openEditPlan(taskId: string, rect: DOMRect) {
    const task = dayPlans.find(t => t.id === taskId)
    if (!task) return
    setDraft({ mode: "edit-plan", task })
    setAnchorRect(rect)
  }

  function openEditReminder(reminderId: string, rect: DOMRect) {
    const reminder = allReminders.find(r => r.id === reminderId)
    if (!reminder) return
    setDraft({ mode: "edit-reminder", reminder })
    setAnchorRect(rect)
  }

  return (
    <div className="min-w-0">
      <AllDayStrip
        days={[anchorDate]}
        reminders={allReminders}
        deadlines={allDeadlines}
        goals={allGoals}
        onEditReminder={openEditReminder}
      />
      <HourGrid
        columns={[{ day: anchorDate, tasks: timedPlans, reminders: timedReminders }]}
        onEditPlan={openEditPlan}
        onEditReminder={openEditReminder}
        onReschedulePlan={onRescheduleTaskTime}
        onResizePlan={onResizePlan}
        onCreateDraft={(day, startTime, endTime, rect) => {
          setDraft({ mode: "create", day, defaultTime: startTime, defaultEndTime: endTime })
          setAnchorRect(rect)
        }}
      />
      <CalendarItemPopover draft={draft} anchorRect={anchorRect} onClose={closeDraft} />
    </div>
  )
}
