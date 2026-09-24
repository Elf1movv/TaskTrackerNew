import { useCallback, useState } from "react"
import { Plus } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { useHabits, type Habit } from "@/entities/habit"
import {
  getHabitGroupIcon,
  getHabitGroupTitle,
  useHabitGroups,
  type HabitGroup,
} from "@/entities/habit-group"
import { useDragReorder, useDropTarget } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Button } from "@/shared/ui/button"
import { HabitGridItem } from "./components"
import type { HabitViewMode } from "../lib/habitViewMode"

// One block's card on the Today page — a pill-shaped, colored header
// (block name centered, the block's own custom color) and its habits
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
          // Border/background only show while open — collapsed, the block
          // is just the pill floating with nothing around it. The border
          // is always rendered (1px, color toggles to transparent) rather
          // than added/removed, so nothing shifts by a pixel when it
          // appears. No overflow-hidden here (unlike the /habits
          // accordion): the pill below straddles this box's top edge on
          // purpose, and clipping would cut its top half off.
          className={`!border-b-0 rounded-2xl border transition-colors ${
            isOpen ? "border-border bg-muted/30" : "border-transparent"
          }`}
        >
          {/* relative + absolute buttons, not a flex row: AccordionTrigger
              only ever sizes to its own content (a flex item with no
              stretch unless it's the SOLE child of a block-level parent),
              so a trigger sharing a flex row with a sibling button group
              never gets the extra width `justify-center` would need to
              center within — it just hugs the left edge instead. */}
          <div className="relative px-4 cursor-grab active:cursor-grabbing">
            {/* -mt-3.5 pulls the trigger row up by roughly half the
                pill's own height, so the pill's vertical center lands
                exactly on the card's top border (a fieldset-legend look)
                instead of floating below it. */}
            <AccordionTrigger className="hover:no-underline !py-0 -mt-3.5 justify-center">
              <span
                className="px-4 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1.5 text-white"
                style={{ backgroundColor: group.color }}
              >
                <span className="leading-none">{getHabitGroupIcon(group)}</span>
                <span className="leading-none">{getHabitGroupTitle(group, t)}</span>
              </span>
            </AccordionTrigger>
            <div className="absolute right-4 top-1 flex items-center gap-1">
              <EditHabitGroupButton onClick={() => setIsEditingGroup(true)} />
              {!group.isGeneral && <DeleteHabitGroupButton group={group} />}
            </div>
          </div>

          <AccordionContent className="px-4 pb-4 pt-3 space-y-3">
            {isEditingGroup && <HabitGroupForm group={group} onDone={() => setIsEditingGroup(false)} />}

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setEditingHabit(null)
                  setIsAdding(v => !v)
                }}
              >
                <Plus size={13} />
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
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
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
