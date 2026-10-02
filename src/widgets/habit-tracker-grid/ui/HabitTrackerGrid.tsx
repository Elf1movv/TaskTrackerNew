import { useState } from "react"
import { LayoutGrid, List, Plus, Repeat } from "lucide-react"
import { HabitGroupForm } from "@/features/habit-group-form"
import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { TodayHabitGroupCard } from "./TodayHabitGroupCard"
import { useHabitViewMode } from "../lib/habitViewMode"

// Today's habit widget — a list of block cards (TodayHabitGroupCard), one
// per HabitGroup, including empty groups. Creating a group must give an
// immediate visible result and a place to add its first habit on Today.
// Adding a habit always happens via a specific block's own "+", same
// convention /habits already uses — this widget's own "+" only creates a
// new block.
export function HabitTrackerGrid({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [viewMode, setViewMode] = useHabitViewMode()
  const { t } = useLanguage()

  const today = getTodayKey()
  const doneToday = habits.filter(h => h.completedDates.includes(today)).length

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold tracking-[-0.015em]">{t("habits.sectionLabel")}</h2>
          <span className="text-[13px] font-semibold text-muted-foreground">
            {t("habits.doneToday", { done: doneToday, total: habits.length })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={v => v && setViewMode(v as "grid" | "list")}
          >
            <ToggleGroupItem
              value="grid"
              aria-label={t("habits.viewGrid")}
              className="h-[34px] px-2.5 gap-1.5"
            >
              <LayoutGrid size={17} strokeWidth={1.75} />
              <span className="text-[13px]">{t("habits.viewGrid")}</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label={t("habits.viewList")}
              className="h-[34px] px-2.5 gap-1.5"
            >
              <List size={17} strokeWidth={1.75} />
              <span className="text-[13px]">{t("habits.viewList")}</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            className="h-[34px] px-3 gap-1.5 rounded-[10px] border-primary/25 text-primary text-sm font-semibold"
            onClick={() => setIsAddingGroup(v => !v)}
          >
            <Plus size={16} />
            {t("habits.group.addBlock")}
          </Button>
        </div>
      </div>

      {isAddingGroup && (
        <div>
          <HabitGroupForm onDone={() => setIsAddingGroup(false)} />
        </div>
      )}

      {habitGroups.length > 0 ? (
        <div className="space-y-5 pt-2.5">
          {habitGroups.map(group => (
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
          <div className="border border-dashed border-border-strong rounded-xl px-6 py-10 flex flex-col items-center gap-2.5 text-center">
            <span className="size-12 rounded-[14px] bg-primary-soft text-primary flex items-center justify-center">
              <Repeat size={22} strokeWidth={1.75} />
            </span>
            <span className="text-[17px] font-bold">{t("habits.noHabitsYet")}</span>
          </div>
        )
      )}
    </div>
  )
}
