import { useNavigate } from "react-router"
import { REMINDER_PRIORITY_COLORS, type Reminder } from "@/entities/reminder"
import { ReminderToggleCheckbox } from "@/features/toggle-reminder"
import { monoFont } from "@/shared/lib/typography"

// Tapping the row navigates to the calendar, opened on this reminder's day
// — the calendar is this feature's "home page" (see docs/requirements).
export function ReminderRow({ reminder }: { reminder: Reminder }) {
  const navigate = useNavigate()

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
      {reminder.priority === "critical" && (
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: REMINDER_PRIORITY_COLORS.critical }}
        />
      )}
      <span
        className={`text-xs flex-1 leading-snug line-clamp-2 ${
          reminder.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {reminder.title}
      </span>
      {reminder.time && (
        <span css={monoFont} className="text-xs text-muted-foreground shrink-0">
          {reminder.time}
        </span>
      )}
    </div>
  )
}
