import { HabitToggleCard } from "@/features/toggle-habit"
import type { Habit } from "@/entities/habit"
import { monoFont } from "@/shared/lib/typography"

export function HabitTrackerGrid({ habits }: { habits: Habit[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-5">
        Habits
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {habits.map(habit => (
          <HabitToggleCard key={habit.id} habit={habit} />
        ))}
      </div>
    </div>
  )
}
