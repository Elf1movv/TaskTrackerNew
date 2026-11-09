import { Trash2 } from "lucide-react"
import { useHabits } from "@/entities/habit"
import { useHabitGroups, type HabitGroup } from "@/entities/habit-group"
import { useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"

// Never rendered for the General group (see HabitGroupAccordionItem) — no
// isGeneral guard needed here, the backend also rejects it defensively.
export function DeleteHabitGroupButton({ group }: { group: HabitGroup }) {
  const { deleteHabitGroup } = useHabitGroups()
  const { refreshHabits } = useHabits()
  const { t } = useLanguage()

  async function handleDelete() {
    await deleteHabitGroup(group.id)
    // The backend reassigns this group's habits to General in the same
    // transaction — this collection's local state doesn't know that
    // happened on its own. (Category delete doesn't need this: its
    // cascade is covered by shared/lib/storage/invalidate.ts.)
    await refreshHabits()
  }

  return (
    <ConfirmAction
      title={t("habits.group.deleteTitle")}
      description={t("habits.group.deleteBody", { title: group.title })}
      onConfirm={handleDelete}
    >
      <button
        // Sits in the block's accordion header: don't open/close it too.
        onClick={e => e.stopPropagation()}
        className="p-1 rounded text-muted-foreground hover:text-destructive transition"
        aria-label="Delete habit block"
      >
        <Trash2 size={13} />
      </button>
    </ConfirmAction>
  )
}
