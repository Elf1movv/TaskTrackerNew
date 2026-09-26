import { Flame } from "lucide-react"
import styled from "@emotion/styled"
import { getStreak, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"

const Card = styled.button<{ active: boolean; color: string }>`
  border-color: ${p => (p.active ? `color-mix(in srgb, ${p.color} 50%, transparent)` : "var(--border)")};
  background-color: ${p => (p.active ? `color-mix(in srgb, ${p.color} 13%, var(--card))` : "var(--card)")};
`

const IconTile = styled.span<{ active: boolean; color: string }>`
  background-color: ${p => (p.active ? p.color : `color-mix(in srgb, ${p.color} 14%, transparent)`)};
  color: ${p => (p.active ? "#fff" : p.color)};
`

const StreakLabel = styled.div<{ color: string }>`
  color: ${p => p.color};
`

export function HabitCard({ habit }: { habit: Habit }) {
  const { toggleHabit } = useHabits()
  const { t } = useLanguage()
  const today = getTodayKey()
  const doneToday = habit.completedDates.includes(today)
  const streak = getStreak(habit.completedDates, habit.activeDays)

  return (
    <Card
      active={doneToday}
      color={habit.color}
      onClick={() => toggleHabit(habit.id, today)}
      className="w-full h-full min-h-[150px] p-3.5 rounded-xl border shadow-card text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-start gap-2.5"
      aria-pressed={doneToday}
    >
      <IconTile
        active={doneToday}
        color={habit.color}
        className="size-9 shrink-0 rounded-[10px] flex items-center justify-center"
      >
        <HabitIcon emoji={habit.icon} size={18} />
      </IconTile>
      <div className="text-sm font-semibold leading-snug flex-1 line-clamp-2">{habit.title}</div>
      <StreakLabel
        color={
          streak > 0 ? `color-mix(in srgb, ${habit.color} 80%, var(--foreground))` : "var(--text-tertiary)"
        }
        className={`flex items-center gap-1 text-xs ${streak > 0 ? "font-extrabold" : "font-semibold"}`}
      >
        <Flame size={13} fill={streak > 0 ? "currentColor" : "none"} />
        <span css={monoFont}>{streak}</span>
        <span className="font-semibold text-muted-foreground">{t("habitCard.days")}</span>
      </StreakLabel>
    </Card>
  )
}
