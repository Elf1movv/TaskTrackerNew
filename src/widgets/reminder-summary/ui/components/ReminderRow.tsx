import { format, parseISO } from "date-fns"
import { Pencil } from "lucide-react"
import { useNavigate } from "react-router"
import { ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { DeleteReminderButton } from "@/features/delete-reminder"
import { ReminderToggleCheckbox } from "@/features/toggle-reminder"
import { getTodayKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"

// One reminder row for both places reminders are listed (audit Д1,
// 2026-11-09): the Today card and the bell. Tapping the row opens the
// calendar on this reminder's day — the calendar is this feature's "home
// page" (see docs/requirements).
// - default: the Today card — bigger, with hover edit/delete buttons (edit
//   opens the inline form in the parent, ReminderSummary).
// - compact: the bell popover — smaller, no edit/delete, a quick look;
//   `onOpenDay` lets the bell close itself before navigating.
export function ReminderRow({
  reminder,
  onEdit,
  compact = false,
  onOpenDay,
}: {
  reminder: Reminder
  onEdit?: () => void
  compact?: boolean
  onOpenDay?: () => void
}) {
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const dateLabel =
    reminder.date === getTodayKey() ? t("common.today") : format(parseISO(reminder.date), "d MMM", { locale })

  return (
    // Two rows via grid, not one flex row — cramming title+date+time onto
    // one line squeezed the title until it clipped mid-word once dates got
    // added (direct feedback, 2026-09-23). A plain div, not a button — it
    // already contains the checkbox's own <button>, and nested buttons are
    // invalid HTML.
    <div
      onClick={() => {
        onOpenDay?.()
        navigate(`/calendar?date=${reminder.date}`)
      }}
      className={`group grid gap-x-2.5 items-start cursor-pointer select-none ${
        compact ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_1fr_auto]"
      }`}
    >
      <div className="flex items-center gap-2 pt-0.5">
        {/* stopPropagation — the row itself navigates on click, but
            toggling completion here shouldn't also trigger that. */}
        <span onClick={e => e.stopPropagation()} className="shrink-0">
          <ReminderToggleCheckbox
            reminderId={reminder.id}
            completed={reminder.completed}
            size={compact ? 14 : 22}
          />
        </span>
        <ReminderPriorityIcon priority={reminder.priority} size={compact ? 12 : 16} />
      </div>
      <div className="min-w-0">
        <div
          className={`leading-snug ${compact ? "text-xs" : "text-body"} ${
            reminder.completed ? "font-medium line-through text-tertiary" : compact ? "" : "font-semibold"
          }`}
        >
          {reminder.title}
        </div>
        <div className={`tabular-nums text-tertiary mt-0.5 ${compact ? "text-caption" : "text-xs"}`}>
          {reminder.time ? `${dateLabel}, ${reminder.time}` : dateLabel}
        </div>
      </div>
      {!compact && (
        <span onClick={e => e.stopPropagation()} className="flex items-center gap-0.5 pt-0.5">
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition"
            aria-label="Edit reminder"
          >
            <Pencil size={13} />
          </button>
          <DeleteReminderButton reminderId={reminder.id} reminderTitle={reminder.title} />
        </span>
      )}
    </div>
  )
}
