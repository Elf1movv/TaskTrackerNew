import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { HabitGroupAccordionItem } from "./HabitGroupAccordionItem"

// The /habits page's top-level content — a list of collapsible blocks,
// each its own HabitGroupAccordionItem with its own period/chart state.
// The page-level "+ Add block" action lives in HabitsPage's header now
// (matches Tasks/Goals — see redesign step 5/6), this just renders the
// blocks themselves. Named blocks follow the server order (order asc); the
// auto-seeded General group (habits without a block) is always shown first
// and without a header — see HabitGroupAccordionItem.
export function HabitHistoryGrid({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()

  return (
    <div className="space-y-5">
      {/* Habits without a block (General) first, like on Today. */}
      {[...habitGroups.filter(g => g.isGeneral), ...habitGroups.filter(g => !g.isGeneral)].map(group => (
        <HabitGroupAccordionItem
          key={group.id}
          group={group}
          habits={habits.filter(h => h.groupId === group.id)}
        />
      ))}
    </div>
  )
}
