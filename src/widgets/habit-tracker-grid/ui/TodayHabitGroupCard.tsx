import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { EditHabitGroupButton } from "@/features/edit-habit-group"
import { DeleteHabitGroupButton } from "@/features/delete-habit-group"
import { HabitGroupForm } from "@/features/habit-group-form"
import { HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { useHabitGroupDnd } from "@/features/habit/group-dnd"
import { getHabitGroupIcon, getHabitGroupTitle, type HabitGroup } from "@/entities/habit-group"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Button } from "@/shared/ui/button"
import { HabitGridItem } from "./components"
import type { HabitViewMode } from "../lib/habitViewMode"
import { useTodayGroupOpen } from "../lib/todayGroupOpen"

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
  const { habits: allHabits } = useHabits()
  // Block drag, habit drop into the block, and row-to-row drops — shared with
  // the other two block cards (audit Д3).
  const { ref: headerRef, isDragging, dropHabitOn } = useHabitGroupDnd(group)
  const { t } = useLanguage()

  // Collapsed by default; the choice is remembered for this browser session.
  const [isOpen, setIsOpen] = useTodayGroupOpen(group.id)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const doneCount = habits.filter(h => h.completedDates.includes(getTodayKey())).length
  const hasHabitsInGroup = allHabits.some(habit => habit.groupId === group.id)

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
          className="!border-b-0 bg-card border border-border rounded-xl overflow-hidden"
        >
          {/* Color lives on the header strip only — the body below (where
              the actual habits sit) stays plain bg-card, same neutral
              tone as every other card in the app. relative, and the
              button group below is absolute — not a plain flex row:
              AccordionTrigger only ever sizes to its own content (a flex
              item with no stretch unless it's the SOLE child of a
              block-level parent), so `flex-1` on it here would NOT push a
              flex sibling to the row's right edge (same gotcha this file
              already worked around for the old pill layout). The real flex
              item is Radix's <h3> wrapper around the trigger, so that h3
              gets flex-1/min-w-0 too — without it a long block title
              never truncates and runs under the edit/delete buttons. */}
          <div
            className="relative flex items-center gap-2.5 pl-4 pr-20 py-3 cursor-grab active:cursor-grabbing [&>h3]:flex-1 [&>h3]:min-w-0"
            style={{ backgroundColor: `color-mix(in srgb, ${group.color} 14%, var(--card))` }}
          >
            <AccordionTrigger className="hover:no-underline !py-0 flex-1 justify-start gap-2.5 min-w-0 [&>svg]:hidden">
              <span className="flex-1 flex items-center gap-2.5 min-w-0">
                {/* Solid color fill + white icon, not a soft tint — same
                    "color as a small solid accent" treatment already used
                    for a habit's own done-state tile (HabitListRow/
                    HabitCard), just applied to the block's icon instead of
                    spreading the solid color across the whole header. */}
                <span
                  className="size-9 shrink-0 rounded-md flex items-center justify-center text-white"
                  style={{ background: group.color }}
                >
                  <HabitIcon emoji={getHabitGroupIcon(group)} size={17} />
                </span>
                <span className="text-body font-bold truncate min-w-0">{getHabitGroupTitle(group, t)}</span>
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
                className="h-8 px-2.5 gap-1 text-meta font-bold"
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
                  {t(hasHabitsInGroup ? "habits.group.noneToday" : "habits.group.empty")}
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
                    onDropHabit={draggedId => dropHabitOn(draggedId, habit.id)}
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
