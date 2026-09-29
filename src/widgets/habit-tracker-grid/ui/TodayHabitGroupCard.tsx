import { useCallback, useState } from "react"
import { ChevronDown, Lock, Plus } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { HabitIcon, useHabits, type Habit } from "@/entities/habit"
import {
  getHabitGroupIcon,
  getHabitGroupTitle,
  useHabitGroups,
  type HabitGroup,
} from "@/entities/habit-group"
import { useDragReorder, useDropTarget } from "@/shared/lib/dnd"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Button } from "@/shared/ui/button"
import { HabitGridItem } from "./components"
import type { HabitViewMode } from "../lib/habitViewMode"

// One block's card on the Today page — a plain header (icon badge tinted
// in the block's own custom color, bold name, count) and its habits
// below, in the same compact grid/list style Today always used. Its own
// independent collapse state and, via reorderHabitsToday/
// moveHabitToGroupToday, its own independent habit ordering — completely
// separate from this same block's accordion on /habits
// (HabitGroupAccordionItem), which uses `order`/`reorderHabitsInGroup`/
// `moveHabitToGroup` instead. Group membership (groupId) and the blocks'
// own relative order ARE shared — only per-habit position within a block
// differs per screen.
export function TodayHabitGroupCard({
  group,
  habits,
  viewMode,
}: {
  group: HabitGroup
  habits: Habit[]
  viewMode: HabitViewMode
}) {
  const { habits: allHabits, reorderHabitsToday, moveHabitToGroupToday } = useHabits()
  const { reorderHabitGroups } = useHabitGroups()
  const { t } = useLanguage()

  const [isOpen, setIsOpen] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const doneCount = habits.filter(h => h.completedDates.includes(getTodayKey())).length

  // Block reordering — same shared order/type as /habits' own block drag
  // (HabitGroupAccordionItem), since the blocks' relative order is shared
  // between the two screens (only habit order within a block isn't).
  const { ref: dragGroupRef, isDragging } = useDragReorder<HTMLDivElement>({
    type: "habit-group",
    id: group.id,
    onHoverMove: reorderHabitGroups,
  })
  // Accepts a habit dragged from any Today block's card — type
  // "habit-move-today" is separate from /habits' "habit-move", so this
  // axis's drops can never land on the /habits page's accordion or vice
  // versa.
  const { ref: dropHabitRef } = useDropTarget<HTMLDivElement>({
    type: "habit-move-today",
    onDrop: habitId => moveHabitToGroupToday(habitId, group.id),
  })
  const headerRef = useCallback(
    (node: HTMLDivElement | null) => {
      dragGroupRef(node)
      dropHabitRef(node)
    },
    [dragGroupRef, dropHabitRef],
  )

  function handleHabitDrop(draggedId: string, targetHabitId: string) {
    const dragged = allHabits.find(h => h.id === draggedId)
    const target = allHabits.find(h => h.id === targetHabitId)
    if (!dragged || !target || draggedId === targetHabitId) return
    if (dragged.groupId === target.groupId) {
      reorderHabitsToday(target.groupId, draggedId, targetHabitId)
    } else {
      moveHabitToGroupToday(draggedId, target.groupId)
    }
  }

  return (
    <div ref={headerRef} className="select-none" style={{ opacity: isDragging ? 0.4 : 1 }}>
      <Accordion
        type="single"
        collapsible
        value={isOpen ? group.id : ""}
        onValueChange={v => setIsOpen(v === group.id)}
      >
        <AccordionItem
          value={group.id}
          // Mixed against var(--card)/transparent, not var(--sunken)/
          // var(--border) — mixing color INTO a grey base still read as
          // "mostly grey" (direct feedback, 2026-09-29): a pastel wash of
          // the block's own color reads as colorful on its own, the same
          // way the habit icon tiles below already do
          // (color-mix(..., transparent)), without needing a grey base to
          // separate from the white parent card.
          className="!border-b-0 border rounded-xl overflow-hidden"
          style={{
            backgroundColor: `color-mix(in srgb, ${group.color} 12%, var(--card))`,
            borderColor: `color-mix(in srgb, ${group.color} 35%, transparent)`,
          }}
        >
          {/* relative, and the button group below is absolute — not a
              plain flex row: AccordionTrigger only ever sizes to its own
              content (a flex item with no stretch unless it's the SOLE
              child of a block-level parent), so `flex-1` on it here would
              NOT push a flex sibling to the row's right edge (same gotcha
              this file already worked around for the old pill layout). */}
          <div className="relative flex items-center gap-2.5 pl-4 pr-20 py-3 cursor-grab active:cursor-grabbing">
            <AccordionTrigger className="hover:no-underline !py-0 flex-1 justify-start gap-2.5 min-w-0 [&>svg]:hidden">
              <span className="flex-1 flex items-center gap-2.5 min-w-0">
                {/* Solid color fill + white icon, not a soft tint — same
                    "color as a small solid accent" treatment already used
                    for a habit's own done-state tile (HabitListRow/
                    HabitCard), just applied to the block's icon instead of
                    spreading the solid color across the whole header. */}
                <span
                  className="size-9 shrink-0 rounded-[10px] flex items-center justify-center text-white"
                  style={{ background: group.color }}
                >
                  <HabitIcon emoji={getHabitGroupIcon(group)} size={17} />
                </span>
                <span className="text-[15px] font-bold truncate min-w-0">{getHabitGroupTitle(group, t)}</span>
                {group.isGeneral && (
                  <span className="h-[22px] px-2 rounded-md bg-fill text-tertiary text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                    <Lock size={11} strokeWidth={2.25} />
                    {t("habits.group.general")}
                  </span>
                )}
                <span className="text-xs font-semibold text-tertiary shrink-0">
                  {doneCount}/{habits.length}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`shrink-0 text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </AccordionTrigger>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <EditHabitGroupButton onClick={() => setIsEditingGroup(true)} />
              {!group.isGeneral && <DeleteHabitGroupButton group={group} />}
            </div>
          </div>

          <AccordionContent className="px-4 pb-4 pt-3 space-y-3">
            {isEditingGroup && <HabitGroupForm group={group} onDone={() => setIsEditingGroup(false)} />}

            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="h-[30px] px-2.5 gap-1 text-[13px] font-bold"
                onClick={() => {
                  setEditingHabit(null)
                  setIsAdding(v => !v)
                }}
              >
                <Plus size={14} strokeWidth={2.25} />
                {t("habits.addHabit")}
              </Button>
            </div>

            {(isAdding || editingHabit) && (
              <HabitForm
                habit={editingHabit ?? undefined}
                lockedGroupId={group.id}
                onDone={() => {
                  setIsAdding(false)
                  setEditingHabit(null)
                }}
              />
            )}

            {habits.length === 0 ? (
              !isAdding && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {t("habits.noHabitsYet")}
                </div>
              )
            ) : (
              <div
                className={
                  viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-4 gap-2" : "flex flex-col gap-2"
                }
              >
                {habits.map(habit => (
                  <HabitGridItem
                    key={habit.id}
                    habit={habit}
                    viewMode={viewMode}
                    onDropHabit={draggedId => handleHabitDrop(draggedId, habit.id)}
                    onEdit={() => {
                      setIsAdding(false)
                      setEditingHabit(habit)
                    }}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
