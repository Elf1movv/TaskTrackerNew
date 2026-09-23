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
    // Two rows via grid, not one flex row — cramming title+date+time onto
    // one line squeezed the title until it clipped mid-word once dates got
    // added (direct feedback, 2026-09-23). Left column (checkbox+icon) is
    // fixed-content width; the right column stacks the full title above
    // the date/time, both naturally starting at the same x without any
    // manual offset math.
    <div
      onClick={() => navigate(`/calendar?date=${reminder.date}`)}
      className="grid grid-cols-[auto_1fr] gap-x-2.5 items-start cursor-pointer select-none"
    >
      <div className="flex items-center gap-2 pt-0.5">
        {/* stopPropagation — the row itself navigates on click, but
            toggling completion here shouldn't also trigger that. */}
        <span onClick={e => e.stopPropagation()} className="shrink-0">
          <ReminderToggleCheckbox reminderId={reminder.id} completed={reminder.completed} size={16} />
        </span>
        <ReminderPriorityIcon priority={reminder.priority} size={12} />
      </div>
      <div className="min-w-0">
        <div
          className={`text-xs leading-snug ${reminder.completed ? "line-through text-muted-foreground" : ""}`}
        >
          {reminder.title}
        </div>
        <div css={monoFont} className="text-[10px] text-muted-foreground mt-0.5">
          {reminder.time ? `${dateLabel}, ${reminder.time}` : dateLabel}
        </div>
      </div>
    </div>
  )
}
