import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useHabits } from "@/entities/habit"
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

export function DeleteHabitButton({ habitId }: { habitId: string }) {
  const { deleteHabit } = useHabits()
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation()
          setConfirming(true)
        }}
        className="p-1 rounded text-muted-foreground hover:text-destructive transition-all"
        aria-label="Delete habit"
      >
        <Trash2 size={12} />
      </button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("habits.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("habits.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteHabit(habitId)}
              className={buttonVariants({ variant: "destructive" })}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
