import { Flame } from "lucide-react"
import styled from "@emotion/styled"
import { getStreak, useHabits, type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"

const Row = styled.button<{ active: boolean; color: string }>`
  border-color: ${p => (p.active ? `${p.color}55` : "var(--border)")};
  background-color: ${p => (p.active ? `${p.color}18` : "transparent")};
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
      className="w-full px-4 py-3 rounded-xl border text-left transition-all flex items-center gap-3"
      aria-pressed={doneToday}
    >
      <div className="text-xl leading-none shrink-0">{habit.icon}</div>
      <div className="text-sm font-medium flex-1 min-w-0 truncate">{habit.title}</div>
      {/* pr-14 reserves the corner HabitGridItem's absolute-positioned
          edit/delete overlay occupies on hover — without it this row's
          own right-aligned streak label lands directly under those
          icons (see docs/ARCHITECTURE.md gotcha list). */}
      <StreakLabel
        color={streak > 0 ? habit.color : "var(--muted-foreground)"}
        className="flex items-center gap-1 shrink-0 pr-14"
      >
        <Flame size={11} />
        <span css={monoFont} className="text-xs">
          {streak}
        </span>
        <span className="text-xs text-muted-foreground">{t("habitCard.days")}</span>
      </StreakLabel>
    </Row>
  )
}
