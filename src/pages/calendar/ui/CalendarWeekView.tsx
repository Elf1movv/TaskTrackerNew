import { useState } from "react"
import { format, isToday } from "date-fns"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import type { Goal } from "@/entities/goal"
import type { Task as DeadlineTask } from "@/entities/task"
import { isPlanOnDay, type CalendarEntry as Plan } from "@/entities/calendar-plan"
import { buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { AllDayStrip, HourGrid } from "@/widgets/calendar-timeline"
import { CalendarItemPopover, type CalendarItemDraft } from "@/widgets/calendar-item-popover"

// Same calendar-timeline widget as CalendarDayView, just 7 day columns
// (buildWeekRange) instead of 1 — reaches full mechanical parity with Day
// this round: CalendarItemPopover instead of a static sidebar,
// click/drag-to-create, resize, immediate day+time reflection on drag.
// Block visuals are unchanged — only Day's own layout/interaction gap is
// closed here, not its appearance. Above the grid, AllDayStrip shows what
// has a day but no hour (untimed reminders, task and goal deadlines), same
// as Day (audit П8). No Goal create/edit anywhere in Week — only Goals' own
// page can create/edit them.
export function CalendarWeekView({
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
  const { language } = useLanguage()
  const locale = getDateLocale(language)
  const [draft, setDraft] = useState<CalendarItemDraft | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  function closeDraft() {
    setDraft(null)
    setAnchorRect(null)
  }

  const days = buildWeekRange(anchorDate)

  const hourGridColumns = days.map(day => {
    const dayKey = formatDateKey(day)
    return {
      day,
      tasks: allPlans.filter(task => isPlanOnDay(task, dayKey) && task.time),
      reminders: selectRemindersOnDay(allReminders, dayKey).filter(reminder => reminder.time),
    }
  })

  // Week has 7 day arrays, not Day's single one — look items up directly
  // in the full collections by id rather than a per-column array.
  function openEditPlan(taskId: string, rect: DOMRect) {
    const task = allPlans.find(t => t.id === taskId)
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
      <div className="flex mb-1">
        <div className="w-12 shrink-0" />
        <div className="flex-1 grid grid-cols-7 min-w-0">
          {days.map(day => (
            <div key={day.toISOString()} className="text-center min-w-0">
              <div
                className={`tabular-nums text-caption uppercase tracking-wider font-bold ${
                  isToday(day) ? "text-primary" : "text-tertiary"
                }`}
              >
                {format(day, "EEE", { locale })}
              </div>
              <div
                className={`inline-flex items-center justify-center size-7 rounded-full text-sm font-bold ${
                  isToday(day) ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AllDayStrip
        days={days}
        reminders={allReminders}
        deadlines={allDeadlines}
        goals={allGoals}
        onEditReminder={openEditReminder}
      />

      <HourGrid
        columns={hourGridColumns}
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
