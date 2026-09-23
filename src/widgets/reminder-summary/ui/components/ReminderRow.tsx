import { format, parseISO } from "date-fns"
import { useNavigate } from "react-router"
import { ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { ReminderToggleCheckbox } from "@/features/toggle-reminder"
import { getTodayKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"

// Tapping the row navigates to the calendar, opened on this reminder's day
// — the calendar is this feature's "home page" (see docs/requirements).
export function ReminderRow({ reminder }: { reminder: Reminder }) {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const dateLabel =
    reminder.date === getTodayKey() ? t("common.today") : format(parseISO(reminder.date), "d MMM", { locale })

  return (
    <div
      onClick={() => navigate(`/calendar?date=${reminder.date}`)}
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      {/* stopPropagation — the row itself navigates on click, but toggling
          completion here shouldn't also trigger that navigation. */}
      <span onClick={e => e.stopPropagation()} className="shrink-0">
        <ReminderToggleCheckbox reminderId={reminder.id} completed={reminder.completed} size={16} />
      </span>
      {/* Fixed-width wrapper — ChevronsUp and Equal don't fill their size
          box identically, so without this the title after it started at a
          different x-offset depending on which icon a row got. */}
      <span className="w-3.5 shrink-0 flex justify-center">
        <ReminderPriorityIcon priority={reminder.priority} size={12} />
      </span>
      <span
        className={`text-xs flex-1 leading-snug line-clamp-2 ${
          reminder.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {reminder.title}
      </span>
      <span css={monoFont} className="text-xs text-muted-foreground shrink-0 text-right">
        {reminder.time ? `${dateLabel}, ${reminder.time}` : dateLabel}
      </span>
    </div>
  )
}
