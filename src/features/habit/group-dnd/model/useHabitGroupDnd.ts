import { useCallback } from "react"
import { useHabits } from "@/entities/habit"
import { useHabitGroups, type HabitGroup } from "@/entities/habit-group"
import { useDragReorder, useDropTarget } from "@/shared/lib/dnd"

// Drag type of a single habit, on Today and on Habits alike.
export const HABIT_MOVE_TYPE = "habit-move"

// Everything a habit block does with drag-and-drop, in one place for its
// three cards — Today's block card, Today's "without a block" list, and the
// Habits page block (audit Д3, 2026-11-09; the same logic used to be written
// three times and a bug in it was once fixed twice):
// - `ref` — put on the block: drag it to reorder blocks (one shared block
//   order) and drop a habit onto it to move the habit into this block.
// - `dropHabitOn(draggedId, targetHabitId)` — a habit dropped on another
//   habit's row: same block = reorder there, other block = move it there.
// Since audit batch 4 there is one habit order for Today and Habits
// (decision 4), so both screens call the same reorderHabitsInGroup /
// moveHabitToGroup.
export function useHabitGroupDnd(group: HabitGroup) {
  const { habits, reorderHabitsInGroup, moveHabitToGroup } = useHabits()
  const { reorderHabitGroups } = useHabitGroups()

  const { ref: dragGroupRef, isDragging } = useDragReorder<HTMLDivElement>({
    type: "habit-group",
    id: group.id,
    onHoverMove: reorderHabitGroups,
  })
  const { ref: dropHabitRef, isOver } = useDropTarget<HTMLDivElement>({
    type: HABIT_MOVE_TYPE,
    onDrop: habitId => moveHabitToGroup(habitId, group.id),
  })
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      dragGroupRef(node)
      dropHabitRef(node)
    },
    [dragGroupRef, dropHabitRef],
  )

  const dropHabitOn = useCallback(
    (draggedId: string, targetHabitId: string) => {
      const dragged = habits.find(h => h.id === draggedId)
      const target = habits.find(h => h.id === targetHabitId)
      if (!dragged || !target || draggedId === targetHabitId) return
      if (dragged.groupId === target.groupId) reorderHabitsInGroup(target.groupId, draggedId, targetHabitId)
      // A cross-block drop on a row only decides WHICH block — the habit is
      // appended at the end there.
      else moveHabitToGroup(draggedId, target.groupId)
    },
    [habits, reorderHabitsInGroup, moveHabitToGroup],
  )

  return { ref, isDragging, isOver, dropHabitOn }
}
