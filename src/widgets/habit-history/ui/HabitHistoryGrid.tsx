import { useState } from "react"
import { Plus } from "lucide-react"
import { HabitGroupForm } from "@/features/habit-group-form"
import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { HabitGroupAccordionItem } from "./HabitGroupAccordionItem"

// The /habits page's top-level content — a list of collapsible blocks
// (each its own HabitGroupAccordionItem, with its own period/chart state),
// plus the page-level "+ Add block" action. Groups are always sorted by
// the server (order asc), including the auto-seeded General one — it's a
// real row like any other, so it just renders wherever its order places
// it, no special-casing needed here.
export function HabitHistoryGrid({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()
  const { t } = useLanguage()
  const [isAddingGroup, setIsAddingGroup] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setIsAddingGroup(v => !v)}>
          <Plus size={14} />
          {t("habits.group.addBlock")}
        </Button>
      </div>

      {isAddingGroup && <HabitGroupForm onDone={() => setIsAddingGroup(false)} />}

      <div className="space-y-4">
        {habitGroups.map(group => (
          <HabitGroupAccordionItem
            key={group.id}
            group={group}
            habits={habits.filter(h => h.groupId === group.id)}
          />
        ))}
      </div>
    </div>
  )
}
