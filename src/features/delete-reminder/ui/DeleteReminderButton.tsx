import { Trash2 } from "lucide-react"
import { useReminders } from "@/entities/reminder"
import { useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"

// Asks first, like every other delete (decision 8 of the 2026-11-09 audit).
export function DeleteReminderButton({
  reminderId,
  reminderTitle,
}: {
  reminderId: string
  reminderTitle: string
}) {
  const { deleteReminder } = useReminders()
  const { t } = useLanguage()

  return (
    <ConfirmAction
      title={t("delete.reminderTitle")}
      description={t("delete.reminderBody", { title: reminderTitle })}
      onConfirm={() => deleteReminder(reminderId)}
    >
      <button
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition"
        aria-label="Delete reminder"
      >
        <Trash2 size={13} />
      </button>
    </ConfirmAction>
  )
}
