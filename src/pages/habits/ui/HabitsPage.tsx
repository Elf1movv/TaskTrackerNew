import { useState } from "react"
import { Plus } from "lucide-react"
import { HabitGroupForm } from "@/features/habit-group-form"
import { useHabits } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { HabitHistoryGrid } from "@/widgets/habit-history"

// All habits, always — regardless of today's schedule (see
// entities/habit/lib/selectTodayHabits.ts, used only on the Today page).
// This is where a habit scheduled for other days is actually manageable.
export function HabitsPage() {
  const { habits } = useHabits()
  const { t } = useLanguage()
  const [isAddingGroup, setIsAddingGroup] = useState(false)

  return (
    // max-w-7xl, not 4xl — a block's grid in month view has far more
    // columns than week/year and needs the extra room; each block now
    // renders its own fixed-width card (see HabitGroupAccordionItem), the
    // page just has to be wide enough for the widest of them.
    //
    // Extra top clearance (md:pt-14, not the md:p-10 every other page
    // uses) — now that the header spans the full max-w-7xl (see below),
    // "Добавить блок" sits right under the fixed bell/gear (top-6, size
    // 44px) with only ~7px of clearance, reading as overlapping (direct
    // feedback, 2026-09-28). Other pages keep the plain p-10 top padding
    // — their own narrower headers don't reach anywhere near the icons
    // horizontally, so they never showed this.
    <div className="p-6 md:pt-14 md:px-10 md:pb-10 max-w-7xl mx-auto">
      {/* No max-w-4xl here (unlike the "add block" form below) — this
          row's own button needs to reach the same right edge as the
          block grid beneath it (max-w-7xl on the page wrapper), not a
          narrower column of its own; direct feedback, 2026-09-28. */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em]">
            {t("habits.page.title")}
          </h1>
          <p className="text-[15px] text-muted-foreground">{t("habits.page.subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsAddingGroup(v => !v)}
          className="h-11 px-5 gap-2 rounded-[10px] shadow-raised text-[15px]"
        >
          <Plus size={18} />
          {t("habits.group.addBlock")}
        </Button>
      </div>

      {isAddingGroup && (
        <div className="mb-6 max-w-4xl">
          <HabitGroupForm onDone={() => setIsAddingGroup(false)} />
        </div>
      )}

      <HabitHistoryGrid habits={habits} />
    </div>
  )
}
