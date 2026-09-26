import { Flame } from "lucide-react"
import styled from "@emotion/styled"
import { getStreak, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"

const Row = styled.button<{ active: boolean; color: string }>`
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

// Same click-to-toggle/streak logic as HabitCard, just laid out as a full-width
// row instead of a card — used when the Habits section view is set to "list".
export function HabitListRow({ habit }: { habit: Habit }) {
  const { toggleHabit } = useHabits()
  const { t } = useLanguage()
  const today = getTodayKey()
  const doneToday = habit.completedDates.includes(today)
  const streak = getStreak(habit.completedDates, habit.activeDays)

  return (
    <Row
      active={doneToday}
      color={habit.color}
      onClick={() => toggleHabit(habit.id, today)}
      className="w-full min-h-14 px-3 py-2 rounded-[10px] border text-left transition-all flex items-center gap-3"
      aria-pressed={doneToday}
    >
      <IconTile
        active={doneToday}
        color={habit.color}
        className="size-9 shrink-0 rounded-[10px] flex items-center justify-center"
      >
        <HabitIcon emoji={habit.icon} size={17} />
      </IconTile>
      <div className="text-sm font-semibold flex-1 min-w-0 truncate">{habit.title}</div>
      {/* pr-14 reserves the corner HabitGridItem's absolute-positioned
          edit/delete overlay occupies on hover — without it this row's
          own right-aligned streak label lands directly under those
          icons (see docs/ARCHITECTURE.md gotcha list). */}
      <StreakLabel
        color={
          streak > 0 ? `color-mix(in srgb, ${habit.color} 80%, var(--foreground))` : "var(--text-tertiary)"
        }
        className={`flex items-center gap-1 text-xs shrink-0 pr-14 ${streak > 0 ? "font-extrabold" : "font-semibold"}`}
      >
        <Flame size={13} fill={streak > 0 ? "currentColor" : "none"} />
        <span css={monoFont}>{streak}</span>
        <span className="font-semibold text-muted-foreground">{t("habitCard.days")}</span>
      </StreakLabel>
    </Row>
  )
}
