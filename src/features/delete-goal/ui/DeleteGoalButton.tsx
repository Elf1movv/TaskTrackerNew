import { Trash2 } from "lucide-react"
import { useGoals } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"

// A goal deletion takes every one of its milestones with it, so it asks first.
export function DeleteGoalButton({ goalId, goalTitle }: { goalId: string; goalTitle: string }) {
  const { deleteGoal } = useGoals()
  const { t } = useLanguage()

  return (
    <ConfirmAction
      title={t("goals.deleteTitle")}
      description={t("goals.deleteBody", { title: goalTitle })}
      onConfirm={() => deleteGoal(goalId)}
    >
      <button
        // The button sits inside the goal's accordion header: don't let the
        // click also open/close the goal.
        onClick={e => e.stopPropagation()}
        className="p-2 rounded-md text-tertiary hover:text-foreground hover:bg-fill transition"
        aria-label="Delete goal"
      >
        <Trash2 size={16} strokeWidth={1.75} />
      </button>
    </ConfirmAction>
  )
}
