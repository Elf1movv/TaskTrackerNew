import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useHabits } from "@/entities/habit"
import { useHabitGroups, type HabitGroup } from "@/entities/habit-group"
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

// Never rendered for the General group (see HabitGroupAccordionItem) — no
// isGeneral guard needed here, the backend also rejects it defensively.
export function DeleteHabitGroupButton({ group }: { group: HabitGroup }) {
  const { deleteHabitGroup } = useHabitGroups()
  const { refreshHabits } = useHabits()
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    await deleteHabitGroup(group.id)
    // The backend reassigns this group's habits to General in the same
    // transaction — this collection's local state doesn't know that
    // happened on its own (same pattern as category delete cascading
    // to tasks, see TaskBoard.tsx's refreshTasks call).
    await refreshHabits()
  }

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation()
          setConfirming(true)
        }}
        className="p-1 rounded text-muted-foreground hover:text-destructive transition-all"
        aria-label="Delete habit block"
      >
        <Trash2 size={13} />
      </button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("habits.group.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("habits.group.deleteBody", { title: group.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
