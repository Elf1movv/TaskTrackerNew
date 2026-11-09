import { Trash2 } from "lucide-react"
import { useHabits } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"

export function DeleteHabitButton({ habitId }: { habitId: string }) {
  const { deleteHabit } = useHabits()
  const { t } = useLanguage()

  return (
    <ConfirmAction
      title={t("habits.deleteTitle")}
      description={t("habits.deleteBody")}
      onConfirm={() => deleteHabit(habitId)}
    >
      <button
        // Sits on a habit card that marks the habit done on click.
        onClick={e => e.stopPropagation()}
        className="p-1 rounded text-muted-foreground hover:text-destructive transition"
        aria-label="Delete habit"
      >
        <Trash2 size={12} />
      </button>
    </ConfirmAction>
  )
}
