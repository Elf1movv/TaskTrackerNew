import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useGoals } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { buttonVariants } from "@/shared/ui/button"

// Deleting a goal detaches its tasks and preserves their calendar plans.
export function DeleteGoalButton({ goalId, goalTitle }: { goalId: string; goalTitle: string }) {
  const { deleteGoal } = useGoals()
  const { t } = useLanguage()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <button
        onClick={e => {
          e.stopPropagation()
          setConfirmOpen(true)
        }}
        className="p-2 rounded-[10px] text-tertiary hover:text-foreground hover:bg-fill transition-all"
        aria-label="Delete goal"
      >
        <Trash2 size={16} strokeWidth={1.75} />
      </button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("goals.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{`${goalTitle}. ${t("goals.deletePreserve")}`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteGoal(goalId)}
            className={buttonVariants({ variant: "destructive" })}
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
