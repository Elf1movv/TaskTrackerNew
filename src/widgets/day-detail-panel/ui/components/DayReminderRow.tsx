import { Pencil } from "lucide-react"
import { ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { DeleteReminderButton } from "@/features/delete-reminder"
import { ReminderToggleCheckbox } from "@/features/toggle-reminder"
import { monoFont } from "@/shared/lib/typography"

export function DayReminderRow({ reminder, onEdit }: { reminder: Reminder; onEdit: () => void }) {
  return (
    <div className="w-full flex items-center gap-2.5 text-left group">
      <ReminderToggleCheckbox reminderId={reminder.id} completed={reminder.completed} size={16} />
      {reminder.time && (
        <span css={monoFont} className="text-xs text-muted-foreground shrink-0">
          {reminder.time}
        </span>
      )}
      <ReminderPriorityIcon priority={reminder.priority} size={13} />
      <span
        className={`text-sm flex-1 text-left leading-snug ${
          reminder.completed ? "line-through text-muted-foreground" : ""
        }`}
      >
        {reminder.title}
      </span>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
        aria-label="Edit reminder"
      >
        <Pencil size={13} />
      </button>
      <DeleteReminderButton reminderId={reminder.id} />
    </div>
  )
}
