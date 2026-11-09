import { useState } from "react"
import { HabitForm } from "@/features/habit-form"
import { type Habit } from "@/entities/habit"
import { type HabitGroup } from "@/entities/habit-group"
import { HABIT_MOVE_TYPE, useHabitGroupDnd } from "@/features/habit/group-dnd"
import { useIsDragging } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { HabitGridItem } from "./components"
import type { HabitViewMode } from "../lib/habitViewMode"

// Habits of the built-in "General" group (HabitGroup.isGeneral) shown as a
// plain list above the named blocks — no header, lock or counter (owner
// decision 2026-11-08). Data is unchanged: these are still General's habits.
// The whole list is a drop target so a habit can be dragged out of a block
// back here; when the list is empty the target only appears during a drag.
// It also takes part in block reordering ("habit-group"): a block dragged
// across it swaps places with it, and pressing on the list's empty space
// drags the whole list among the blocks — a habit card pressed directly is
// its own, inner drag source, so it still drags just that habit.
export function GeneralHabitsList({
  group,
  habits,
  viewMode,
  isAdding,
  onCloseAdding,
}: {
  group: HabitGroup
  habits: Habit[]
  viewMode: HabitViewMode
  isAdding: boolean
  onCloseAdding: () => void
}) {
  const { t } = useLanguage()
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const isDraggingHabit = useIsDragging(HABIT_MOVE_TYPE)
  // Block drag + habit drops, shared with the other two block cards (audit Д3).
  const { ref: listRef, isDragging, isOver, dropHabitOn } = useHabitGroupDnd(group)

  const showForm = isAdding || editingHabit
  if (habits.length === 0 && !showForm && !isDraggingHabit) return null

  return (
    <div
      data-general-habits
      ref={listRef}
      className="space-y-3 select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {showForm && (
        <HabitForm
          habit={editingHabit ?? undefined}
          lockedGroupId={group.id}
          onDone={() => {
            onCloseAdding()
            setEditingHabit(null)
          }}
        />
      )}
      {habits.length > 0 ? (
        <div
          className={viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-4 gap-2" : "flex flex-col gap-2"}
        >
          {habits.map(habit => (
            <HabitGridItem
              key={habit.id}
              habit={habit}
              viewMode={viewMode}
              onDropHabit={draggedId => dropHabitOn(draggedId, habit.id)}
              onEdit={() => {
                onCloseAdding()
                setEditingHabit(habit)
              }}
            />
          ))}
        </div>
      ) : (
        isDraggingHabit && (
          <div
            className={`rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground ${
              isOver ? "border-primary bg-primary-soft" : "border-border-strong"
            }`}
          >
            {t("habits.dropOutOfBlock")}
          </div>
        )
      )}
    </div>
  )
}
