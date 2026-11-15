import { useState } from "react"
import { format, isToday } from "date-fns"
import { selectRemindersOnDay, type Reminder } from "@/entities/reminder"
import type { Goal } from "@/entities/goal"
import type { Task as DeadlineTask } from "@/entities/task"
import { isPlanOnDay, type CalendarEntry as Plan } from "@/entities/calendar-plan"
import { buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { useIsMobile } from "@/shared/ui/use-mobile"
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
//
// On a phone (owner, 2026-11-15) the week is the short overview: all 7 days
// fit the screen (HourGrid `compact`), and tapping a day's header opens that
// day in full (`onOpenDay`). The headers are buttons on a computer too.
export function CalendarWeekView({
  anchorDate,
  allPlans,
  allReminders,
  allDeadlines,
  allGoals,
  onRescheduleTaskTime,
  onResizePlan,
  onOpenDay,
}: {
  anchorDate: Date
  allPlans: Plan[]
  allReminders: Reminder[]
  allDeadlines: DeadlineTask[]
  allGoals: Goal[]
  onRescheduleTaskTime: (taskId: string, day: Date, time: string) => void
  onResizePlan: (taskId: string, endTime: string) => void
  onOpenDay: (day: Date) => void
}) {
  const { language, t } = useLanguage()
  const compact = useIsMobile()
  const locale = getDateLocale(language)
  const [draft, setDraft] = useState<CalendarItemDraft | null>(null)

  function closeDraft() {
    setDraft(null)
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
  function openEditPlan(taskId: string) {
    const task = allPlans.find(t => t.id === taskId)
    if (!task) return
    setDraft({ mode: "edit-plan", task })
  }

  function openEditReminder(reminderId: string) {
    const reminder = allReminders.find(r => r.id === reminderId)
    if (!reminder) return
    setDraft({ mode: "edit-reminder", reminder })
  }

  return (
    <div className="min-w-0">
      <div className="flex mb-1">
        <div className={`${compact ? "w-7" : "w-12"} shrink-0`} />
        <div className="flex-1 grid grid-cols-7 min-w-0">
          {days.map(day => (
            <button
              key={day.toISOString()}
              type="button"
              data-week-day={formatDateKey(day)}
              onClick={() => onOpenDay(day)}
              aria-label={t("calendar.openDay", { day: format(day, "EEEE d MMMM", { locale }) })}
              className="text-center min-w-0 rounded-md py-0.5 hover:bg-fill transition-colors"
            >
              <div
                className={`tabular-nums text-caption uppercase tracking-wider font-bold ${
                  isToday(day) ? "text-primary" : "text-tertiary"
                }`}
              >
                {format(day, compact ? "EEEEEE" : "EEE", { locale })}
              </div>
              <div
                className={`inline-flex items-center justify-center size-7 rounded-full text-sm font-bold ${
                  isToday(day) ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </button>
          ))}
        </div>
      </div>

      <AllDayStrip
        days={days}
        compact={compact}
        reminders={allReminders}
        deadlines={allDeadlines}
        goals={allGoals}
        onEditReminder={openEditReminder}
      />

      <HourGrid
        columns={hourGridColumns}
        compact={compact}
        onEditPlan={openEditPlan}
        onEditReminder={openEditReminder}
        onReschedulePlan={onRescheduleTaskTime}
        onResizePlan={onResizePlan}
        onCreateDraft={(day, startTime, endTime) => {
          setDraft({ mode: "create", day, defaultTime: startTime, defaultEndTime: endTime })
        }}
      />
      <CalendarItemPopover draft={draft} onClose={closeDraft} />
    </div>
  )
}
