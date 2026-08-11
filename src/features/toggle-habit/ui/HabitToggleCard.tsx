import { Flame } from "lucide-react"
import styled from "@emotion/styled"
import { getStreak, useHabits, type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { monoFont } from "@/shared/lib/typography"

const Card = styled.button<{ active: boolean; color: string }>`
  border-color: ${p => (p.active ? `${p.color}55` : "var(--border)")};
  background-color: ${p => (p.active ? `${p.color}18` : "transparent")};
`

const StreakLabel = styled.div<{ color: string }>`
  color: ${p => p.color};
`

export function HabitToggleCard({ habit }: { habit: Habit }) {
  const { toggleHabit } = useHabits()
  const today = getTodayKey()
  const doneToday = habit.completedDates.includes(today)
  const streak = getStreak(habit.completedDates)

  return (
    <Card
      active={doneToday}
      color={habit.color}
      onClick={() => toggleHabit(habit.id, today)}
      className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
      aria-pressed={doneToday}
    >
      <div className="text-2xl mb-2 leading-none">{habit.icon}</div>
      <div className="text-xs font-medium leading-snug mb-2.5 line-clamp-2">{habit.title}</div>
      <StreakLabel
        color={streak > 0 ? habit.color : "var(--muted-foreground)"}
        className="flex items-center gap-1"
      >
        <Flame size={11} />
        <span css={monoFont} className="text-xs">
          {streak}
        </span>
        <span className="text-xs text-muted-foreground">days</span>
      </StreakLabel>
    </Card>
  )
}
