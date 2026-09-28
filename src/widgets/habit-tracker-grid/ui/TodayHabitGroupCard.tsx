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
            {/* The trigger sits in normal flow with no top padding — its
                unshifted box starts exactly at the card's top border, so
                `relative` + a negative `top` of half the pill's own
                fixed height (30px — half is 15px) pulls it up just
                enough that the pill ends up centered ON that border:
                50% above, 50% below. Using
                `top`, not a negative margin, matters here — margin would
                also shrink the space this row reserves in the page's
                flow, which is what let two collapsed cards' pills
                overlap each other before (see LEARNING.md, 2026-09-24).
                Don't also add top padding to compensate "visually" —
                that cancels the offset back to zero, landing the pill's
                TOP (not its center) on the border instead. */}
            {/* [&>svg]:hidden — this hides the chevron the shared
                AccordionTrigger normally appends after its children on
                its own, floating outside the pill next to it (that's
                the stray arrow this whole block exists to get rid of).
                Rendering our own ChevronDown inside the pill span below
                instead keeps it visually part of the pill (same
                colored background, rotates with `isOpen` like the
                built-in one does). */}
            <AccordionTrigger className="hover:no-underline !py-0 relative -top-[15px] justify-center [&>svg]:hidden">
              <span
                className="h-[30px] px-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
                style={{ backgroundColor: group.color }}
              >
                <span className="leading-none">
                  <HabitIcon emoji={getHabitGroupIcon(group)} size={15} />
                </span>
                <span className="leading-none">{getHabitGroupTitle(group, t)}</span>
                <span className="text-xs font-bold opacity-85">
                  {doneCount}/{habits.length}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </AccordionTrigger>
            {/* Absolutely positioned, not normal flow — these sit beside
                the pill (which itself straddles the card's top border, see
                above), not stacked below it. This used to be `absolute`
                before redesign step 4 accidentally dropped it in favor of
                a flow div, which made the card reserve this row's own
                height below the pill AS WELL AS the trigger's own
                unshifted box, leaving a big dead gap between the pill and
                everything below it (direct feedback, 2026-09-28). */}
            {group.isGeneral && (
              <span className="absolute left-4 top-1 h-[22px] px-2 rounded-md bg-fill text-tertiary text-[11px] font-bold inline-flex items-center gap-1">
                <Lock size={11} strokeWidth={2.25} />
                {t("habits.group.general")}
              </span>
            )}
            <div className="absolute right-4 top-1 flex items-center gap-1">
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
