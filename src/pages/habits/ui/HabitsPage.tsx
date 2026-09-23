import { useHabits } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { displayFont } from "@/shared/lib/typography"
import { HabitHistoryGrid } from "@/widgets/habit-history"

// All habits, always — regardless of today's schedule (see
// entities/habit/lib/selectTodayHabits.ts, used only on the Today page).
// This is where a habit scheduled for other days is actually manageable.
export function HabitsPage() {
  const { habits } = useHabits()
  const { t } = useLanguage()

  return (
    // max-w-7xl, not 4xl — a block's grid in month view has far more
    // columns than week/year and needs the extra room; each block now
    // renders its own fixed-width card (see HabitGroupAccordionItem), the
    // page just has to be wide enough for the widest of them.
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8 max-w-4xl">
        <h1 css={displayFont} className="text-3xl mb-1">
          {t("habits.page.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("habits.page.subtitle")}</p>
      </div>
      <HabitHistoryGrid habits={habits} />
    </div>
  )
}
