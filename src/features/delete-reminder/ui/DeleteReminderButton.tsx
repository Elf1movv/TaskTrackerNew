import { Trash2 } from "lucide-react"
import { useReminders } from "@/entities/reminder"

export function DeleteReminderButton({ reminderId }: { reminderId: string }) {
  const { deleteReminder } = useReminders()

  return (
    <button
      onClick={() => deleteReminder(reminderId)}
      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
      aria-label="Delete reminder"
    >
      <Trash2 size={13} />
    </button>
  )
}
