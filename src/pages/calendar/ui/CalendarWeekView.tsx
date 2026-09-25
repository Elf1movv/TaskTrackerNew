import { useState } from "react"
import { format, isToday } from "date-fns"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import { isTaskOnDay, type Task } from "@/entities/task"
import { buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { HourGrid } from "@/widgets/calendar-timeline"
import { CalendarItemPopover, type CalendarItemDraft } from "@/widgets/calendar-item-popover"

// Same calendar-timeline widget as CalendarDayView, just 7 day columns
// (buildWeekRange) instead of 1 — reaches full mechanical parity with Day
// this round: CalendarItemPopover instead of a static sidebar,
// click/drag-to-create, resize, immediate day+time reflection on drag.
// Block visuals are unchanged — only Day's own layout/interaction gap is
// closed here, not its appearance. No all-day/untimed strip above the
// grid (see CalendarDayView's comment) — Week shows only timed items,
// same as Day. No Goal create/edit anywhere in Week, same as Day — only
// Goals' own page can create/edit them.
export function CalendarWeekView({
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
      tasks: allTasks.filter(task => isTaskOnDay(task, dayKey) && task.time),
      reminders: selectRemindersOnDay(allReminders, dayKey).filter(reminder => reminder.time),
    }
  })

  // Week has 7 day arrays, not Day's single one — look items up directly
  // in the full collections by id rather than a per-column array.
  function openEditTask(taskId: string, rect: DOMRect) {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    setDraft({ mode: "edit-task", task })
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
                css={monoFont}
                className={`text-[10px] uppercase tracking-wider ${
                  isToday(day) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {format(day, "EEE", { locale })}
              </div>
              <div
                className={`inline-flex items-center justify-center size-6 rounded-full text-sm ${
                  isToday(day) ? "bg-primary text-primary-foreground font-medium" : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
      </div>

      <HourGrid
        columns={hourGridColumns}
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
