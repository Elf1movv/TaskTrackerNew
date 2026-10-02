import { format, parseISO } from "date-fns"
import { CalendarDays } from "lucide-react"
import { Link } from "react-router"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import type { Task } from "../model/task"

// Both task lists show the same record's schedule. Untimed tasks need the
// month view: the day/week timeline deliberately has no all-day row.
export function TaskScheduleLink({ task }: { task: Task }) {
  const { language, t } = useLanguage()
  if (!task.dueDate) return null

  const dateLabel = format(parseISO(task.dueDate), "d MMM yyyy", { locale: getDateLocale(language) })
  const timeLabel = task.time ? ` · ${task.time}${task.endTime ? `–${task.endTime}` : ""}` : ""

  return (
    <Link
      to={`/calendar?view=${task.time ? "day" : "month"}&date=${task.dueDate}`}
      draggable={false}
      onClick={event => event.stopPropagation()}
      aria-label={t("tasks.viewInCalendar", { date: `${dateLabel}${timeLabel}` })}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline w-fit"
    >
      <CalendarDays size={12} className="shrink-0" />
      {dateLabel}
      {timeLabel}
    </Link>
  )
}
