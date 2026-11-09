import type { CSSProperties } from "react"
import { CalendarDays, Tag } from "lucide-react"
import { resolveCategoryColor, useCategories } from "@/entities/category"
import { AddMilestoneForm } from "./AddMilestoneForm"
import { DeleteGoalButton } from "@/features/delete-goal"
import { EditGoalButton } from "@/features/edit-goal"
import { MilestoneRow } from "./MilestoneRow"
import { SubgoalItem } from "./SubgoalItem"
import { getGoalItems, ProgressRing, useGoals } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import type { GoalListItem } from "../GoalList"

export function GoalAccordionItem({ goal, onEdit }: { goal: GoalListItem; onEdit: () => void }) {
  const { reorderGoals } = useGoals()
  const { categories } = useCategories()
  const { t } = useLanguage()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "goal",
    id: goal.id,
    onHoverMove: reorderGoals,
  })
  const completedCount = goal.milestones.filter(m => m.completed).length
  const items = getGoalItems(goal)
  // "#N" counts only the goal's own steps, in the order they're shown.
  const stepNumbers = new Map(
    items.filter(entry => entry.kind === "step").map((entry, index) => [entry.item.id, index]),
  )

  return (
    // `AccordionItem` (shared/ui, vendored shadcn output) is a plain function
    // component without forwardRef, so the drag ref is attached to this
    // plain wrapper div instead of the accordion item itself.
    <div
      ref={ref}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {/* The open card's border takes the goal's own color (data), passed in
          as the --goal-color variable. !border-b-0: no bottom border — this is
          how the card has always rendered (Emotion era included, 2026-11-09). */}
      <AccordionItem
        value={goal.id}
        className="rounded-[0.75rem] overflow-hidden bg-card border border-card-border shadow-card !border-b-0 data-[state=open]:border-[color:color-mix(in_srgb,var(--goal-color)_45%,transparent)] data-[state=open]:shadow-raised"
        style={{ "--goal-color": goal.color } as CSSProperties}
      >
        <div className="flex items-start gap-1 pl-4 pr-3 sm:pl-6 sm:pr-5 py-5">
          {/* flex-1 on this wrapper, not directly on AccordionTrigger —
              Radix wraps every trigger in its own <h3 class="flex">
              (shared/ui/accordion.tsx), a plain flex item with no grow of
              its own; putting flex-1 only on the Trigger inside it (as
              before) had nothing to stretch AGAINST, so it hugged its own
              content width and left edit/delete stranded mid-row instead
              of at the card's edge (direct feedback, 2026-09-28). This
              wrapper is the thing that actually sits in the outer flex
              row, so it's the one that needs flex-1 — its sole child
              (the <h3>, block-level by default) then fills it the normal
              way, no extra classes needed on the trigger itself. */}
          <div className="flex-1 min-w-0">
            <AccordionTrigger className="hover:no-underline [&>svg]:mt-1 !py-0">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <ProgressRing progress={goal.progress} color={goal.color} />
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-lg font-semibold leading-snug pr-2 [overflow-wrap:anywhere]">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{goal.description}</p>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="flex items-center gap-1.5 text-meta font-medium text-muted-foreground">
                      <span className="size-2 rounded-full shrink-0" style={{ background: goal.color }} />
                      {t("goals.milestonesCount", {
                        completed: completedCount,
                        total: goal.milestones.length,
                      })}
                      {goal.subgoals.length > 0 &&
                        ` · ${t("goals.subgoalsCount", { count: goal.subgoals.length })}`}
                    </span>
                    <span className="flex items-center gap-1.5 text-meta font-medium text-tertiary whitespace-nowrap">
                      <CalendarDays size={14} strokeWidth={1.75} />
                      {goal.dueLabel ? t("goals.due", { date: goal.dueLabel }) : t("goalForm.noTargetDate")}
                    </span>
                    {goal.category && (
                      <span className="flex items-center gap-1.5 text-meta font-medium text-muted-foreground whitespace-nowrap">
                        <Tag
                          size={13}
                          strokeWidth={2}
                          style={{ color: resolveCategoryColor(goal.category, categories) }}
                        />
                        {goal.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 -mt-1.5">
            <EditGoalButton onClick={onEdit} />
            <DeleteGoalButton goalId={goal.id} goalTitle={goal.title} />
          </div>
        </div>
        <AccordionContent className="px-5 pb-5 flex flex-col gap-3">
          {/* Add fields first, directly under the title and counts — part of
              the goal's header, always above the list however long it gets
              (owner, 2026-11-08). Two columns on wide screens, stacked on
              phones. */}
          <div className="grid gap-2 sm:grid-cols-2 pl-1" data-goal-add>
            <AddMilestoneForm goalId={goal.id} placement="header" />
            <AddMilestoneForm goalId={goal.id} kind="subgoal" placement="header" />
          </div>
          {/* One headerless list (owner, 2026-11-08 — same idea as the
              headerless "without a block" habits): the goal's own steps and
              subgoals (folders of steps) in one shared order the owner sets
              by dragging — a step can sit before a subgoal or after it. */}
          <div className="bg-sunken rounded-xl p-4 flex flex-col gap-1.5" data-goal-tree>
            {items.map(entry =>
              entry.kind === "step" ? (
                <MilestoneRow
                  key={entry.item.id}
                  goalId={goal.id}
                  milestone={entry.item}
                  color={goal.color}
                  index={stepNumbers.get(entry.item.id) ?? 0}
                />
              ) : (
                <SubgoalItem key={entry.item.id} goalId={goal.id} subgoal={entry.item} color={goal.color} />
              ),
            )}
            {items.length === 0 && <p className="text-sm text-tertiary px-1">{t("goals.emptyTree")}</p>}
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}
