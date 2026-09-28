import { format, parseISO } from "date-fns"
import { Pencil } from "lucide-react"
import { useNavigate } from "react-router"
import { ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { DeleteReminderButton } from "@/features/delete-reminder"
import { ReminderToggleCheckbox } from "@/features/toggle-reminder"
import { getTodayKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"

// Tapping the row itself still navigates to the calendar, opened on this
// reminder's day — the calendar is this feature's "home page" (see
// docs/requirements). Edit/delete were missing entirely here (direct
// feedback, 2026-09-28) — added as hover-reveal icon buttons, same
// pattern as DayReminderRow (Calendar's day panel/agenda), so quick fixes
// don't force a detour through Calendar. Edit opens the inline form in
// the parent (ReminderSummary), not a navigation.
export function ReminderRow({ reminder, onEdit }: { reminder: Reminder; onEdit: () => void }) {
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
      className="group grid grid-cols-[auto_1fr_auto] gap-x-2.5 items-start cursor-pointer select-none"
    >
      <div className="flex items-center gap-2 pt-0.5">
        {/* stopPropagation — the row itself navigates on click, but
            toggling completion here shouldn't also trigger that. */}
        <span onClick={e => e.stopPropagation()} className="shrink-0">
          <ReminderToggleCheckbox reminderId={reminder.id} completed={reminder.completed} size={22} />
        </span>
        <ReminderPriorityIcon priority={reminder.priority} size={16} />
      </div>
      <div className="min-w-0">
        <div
          className={`text-[15px] leading-snug ${
            reminder.completed ? "font-medium line-through text-tertiary" : "font-semibold"
          }`}
        >
          {reminder.title}
        </div>
        <div className="text-xs text-tertiary mt-0.5">
          {reminder.time ? `${dateLabel}, ${reminder.time}` : dateLabel}
        </div>
      </div>
      <span onClick={e => e.stopPropagation()} className="flex items-center gap-0.5 pt-0.5">
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
          aria-label="Edit reminder"
        >
          <Pencil size={13} />
        </button>
        <DeleteReminderButton reminderId={reminder.id} />
      </span>
    </div>
  )
}
