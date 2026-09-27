import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { HabitGroupAccordionItem } from "./HabitGroupAccordionItem"

// The /habits page's top-level content — a list of collapsible blocks,
// each its own HabitGroupAccordionItem with its own period/chart state.
// The page-level "+ Add block" action lives in HabitsPage's header now
// (matches Tasks/Goals — see redesign step 5/6), this just renders the
// blocks themselves. Groups are always sorted by the server (order asc),
// including the auto-seeded General one — it's a real row like any
// other, so it just renders wherever its order places it, no
// special-casing needed here.
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
