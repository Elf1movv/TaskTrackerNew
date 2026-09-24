import { useState } from "react"
import { LayoutGrid, List, Plus } from "lucide-react"
import { HabitGroupForm } from "@/features/habit-group-form"
import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { TodayHabitGroupCard } from "./TodayHabitGroupCard"
import { useHabitViewMode } from "../lib/habitViewMode"

// Today's habit widget — a list of block cards (TodayHabitGroupCard), one
// per HabitGroup that has at least one habit scheduled today (a block
// with nothing due today is skipped here — it's still fully visible and
// manageable on /habits, this just keeps the main screen uncluttered).
// Adding a habit always happens via a specific block's own "+", same
// convention /habits already uses — this widget's own "+" only creates a
// new block.
export function HabitTrackerGrid({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [viewMode, setViewMode] = useHabitViewMode()
  const { t } = useLanguage()

  const groupsWithHabitsToday = habitGroups.filter(g => habits.some(h => h.groupId === g.id))

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
          {t("habits.sectionLabel")}
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={v => v && setViewMode(v as "grid" | "list")}
          >
            <ToggleGroupItem value="grid" aria-label={t("habits.viewGrid")} className="h-7 w-7 p-0">
              <LayoutGrid size={13} />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={t("habits.viewList")} className="h-7 w-7 p-0">
              <List size={13} />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAddingGroup(v => !v)}>
            <Plus size={13} />
            {t("habits.group.addBlock")}
          </Button>
        </div>
      </div>

      {isAddingGroup && (
        <div className="mb-4">
          <HabitGroupForm onDone={() => setIsAddingGroup(false)} />
        </div>
      )}

      {groupsWithHabitsToday.length > 0 ? (
        // space-y-5, not -3: each card's pill overhangs its top edge by
        // ~14px (see TodayHabitGroupCard's border-straddle comment) — a
        // smaller gap here let two collapsed cards' pills visually
        // collide, since a collapsed card's own height barely clears
        // that overhang on its own.
        <div className="space-y-5">
          {groupsWithHabitsToday.map(group => (
            <TodayHabitGroupCard
              key={group.id}
              group={group}
              habits={habits.filter(h => h.groupId === group.id)}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        !isAddingGroup && (
          <div className="text-center py-8 text-muted-foreground text-sm">{t("habits.noHabitsYet")}</div>
        )
      )}
    </div>
  )
}
