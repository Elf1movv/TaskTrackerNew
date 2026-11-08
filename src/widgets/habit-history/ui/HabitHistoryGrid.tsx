import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { HabitGroupAccordionItem } from "./HabitGroupAccordionItem"

// The /habits page's top-level content — a list of collapsible blocks,
// each its own HabitGroupAccordionItem with its own period/chart state.
// The page-level "+ Add block" action lives in HabitsPage's header now
// (matches Tasks/Goals — see redesign step 5/6), this just renders the
// blocks themselves. All groups, General (habits without a block) included,
// follow the shared server order (order asc) and can be dragged among each
// other (owner request 2026-11-08) — see HabitGroupAccordionItem.
export function HabitHistoryGrid({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()

  return (
    <div className="space-y-5">
      {habitGroups.map(group => (
        <HabitGroupAccordionItem
          key={group.id}
          group={group}
          habits={habits.filter(h => h.groupId === group.id)}
        />
      ))}
    </div>
  )
}
