import { useState } from "react"
import { LayoutGrid, List, Plus, Repeat } from "lucide-react"
import { HabitGroupForm } from "@/features/habit-group-form"
import { useHabitGroups } from "@/entities/habit-group"
import { type Habit } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { GeneralHabitsList } from "./GeneralHabitsList"
import { TodayHabitGroupCard } from "./TodayHabitGroupCard"
import { useHabitViewMode } from "../lib/habitViewMode"

// Today's habit widget. Groups render in their shared server order: the
// built-in General group (habits without a block) as a plain headerless list
// (GeneralHabitsList), each named block as a collapsible card
// (TodayHabitGroupCard), collapsed by default. General can sit anywhere among
// the blocks — drag a block across it, or drag the list by its empty space
// (owner request 2026-11-08: no extra handle). "Add habit" here adds a habit
// without a block; a named block's own "+" adds into that block.
export function HabitTrackerGrid({ habits }: { habits: Habit[] }) {
  const { habitGroups } = useHabitGroups()
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [isAddingHabit, setIsAddingHabit] = useState(false)
  const general = habitGroups.find(group => group.isGeneral)
  const blocks = habitGroups.filter(group => !group.isGeneral)
  const generalHabits = general ? habits.filter(h => h.groupId === general.id) : []
  const [viewMode, setViewMode] = useHabitViewMode()
  const { t } = useLanguage()

  const today = getTodayKey()
  const doneToday = habits.filter(h => h.completedDates.includes(today)).length

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-card p-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold">{t("habits.sectionLabel")}</h2>
          <span className="text-meta font-semibold text-muted-foreground">
            {t("habits.doneToday", { done: doneToday, total: habits.length })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={v => v && setViewMode(v as "grid" | "list")}
          >
            <ToggleGroupItem value="grid" aria-label={t("habits.viewGrid")} className="h-8 px-2.5 gap-1.5">
              <LayoutGrid size={17} strokeWidth={1.75} />
              <span className="text-meta">{t("habits.viewGrid")}</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label={t("habits.viewList")} className="h-8 px-2.5 gap-1.5">
              <List size={17} strokeWidth={1.75} />
              <span className="text-meta">{t("habits.viewList")}</span>
            </ToggleGroupItem>
          </ToggleGroup>
          {general && (
            <Button
              variant="outline"
              className="h-8 px-3 gap-1.5 rounded-md border-primary/25 text-primary text-sm font-semibold"
              onClick={() => setIsAddingHabit(v => !v)}
            >
              <Plus size={16} />
              {t("habits.addHabit")}
            </Button>
          )}
          <Button
            variant="outline"
            className="h-8 px-3 gap-1.5 rounded-md border-primary/25 text-primary text-sm font-semibold"
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

      {generalHabits.length > 0 || blocks.length > 0 || isAddingHabit ? (
        <div className="flex flex-col gap-5">
          {habitGroups.map(group =>
            group.isGeneral ? (
              <GeneralHabitsList
                key={group.id}
                group={group}
                habits={generalHabits}
                viewMode={viewMode}
                isAdding={isAddingHabit}
                onCloseAdding={() => setIsAddingHabit(false)}
              />
            ) : (
              <TodayHabitGroupCard
                key={group.id}
                group={group}
                habits={habits.filter(h => h.groupId === group.id)}
                viewMode={viewMode}
              />
            ),
          )}
        </div>
      ) : (
        !isAddingGroup &&
        !isAddingHabit &&
        generalHabits.length === 0 && (
          <div className="border border-dashed border-border-strong rounded-xl px-6 py-10 flex flex-col items-center gap-2.5 text-center">
            <span className="size-12 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Repeat size={22} strokeWidth={1.75} />
            </span>
            <span className="text-title font-bold">{t("habits.noHabitsYet")}</span>
          </div>
        )
      )}
    </div>
  )
}
