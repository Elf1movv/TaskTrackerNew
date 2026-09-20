import styled from "@emotion/styled"
import { AddMilestoneForm } from "@/features/add-milestone"
import { DeleteGoalButton } from "@/features/delete-goal"
import { EditGoalButton } from "@/features/edit-goal"
import { MilestoneRow } from "@/features/milestone-row"
import { ProgressRing, useGoals } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import type { GoalListItem } from "../GoalList"

const StyledAccordionItem = styled(AccordionItem)<{ color: string }>`
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
  background-color: var(--card);

  &[data-state="open"] {
    border-color: ${p => `${p.color}44`};
  }
`

const MilestonesSection = styled.div<{ color: string }>`
  border-top: 1px solid ${p => `${p.color}28`};
`

const MilestoneCountLabel = styled.span<{ color: string }>`
  color: ${p => p.color};
`

export function GoalAccordionItem({ goal, onEdit }: { goal: GoalListItem; onEdit: () => void }) {
  const { reorderGoals } = useGoals()
  const { t } = useLanguage()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "goal",
    id: goal.id,
    onHoverMove: reorderGoals,
  })
  const completedCount = goal.milestones.filter(m => m.completed).length

  return (
    // `AccordionItem` (shared/ui, vendored shadcn output) is a plain function
    // component without forwardRef, so the drag ref is attached to this
    // plain wrapper div instead of the accordion item itself.
    <div
      ref={ref}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <StyledAccordionItem value={goal.id} color={goal.color} className="!border-b-0">
        <div className="flex items-start gap-1 px-6 pt-6">
          <AccordionTrigger className="hover:no-underline [&>svg]:mt-0.5 pb-6">
            <div className="flex items-start gap-4 flex-1">
              <ProgressRing progress={goal.progress} color={goal.color} />
              <div className="flex-1 min-w-0 text-left">
                <h3 css={displayFont} className="text-base leading-snug pr-2">
                  {goal.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{goal.description}</p>
                <div className="flex gap-4 mt-3">
                  <MilestoneCountLabel css={monoFont} color={goal.color} className="text-xs">
                    {t("goals.milestonesCount", { completed: completedCount, total: goal.milestones.length })}
                  </MilestoneCountLabel>
                  <span css={monoFont} className="text-xs text-muted-foreground">
                    {goal.dueLabel ? t("goals.due", { date: goal.dueLabel }) : t("goalForm.noTargetDate")}
                  </span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <div className="flex items-center gap-1 pt-4 shrink-0">
            <EditGoalButton onClick={onEdit} />
            <DeleteGoalButton goalId={goal.id} />
          </div>
        </div>
        <AccordionContent className="px-6 pb-0">
          <MilestonesSection color={goal.color} className="pt-5 pb-6 space-y-4">
            <div css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("goals.milestones")}
            </div>
            <div className="space-y-3">
              {goal.milestones.map((milestone, idx) => (
                <MilestoneRow
                  key={milestone.id}
                  goalId={goal.id}
                  milestone={milestone}
                  color={goal.color}
                  index={idx}
                />
              ))}
              {goal.milestones.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("goals.noMilestonesYet")}</p>
              )}
            </div>
            <AddMilestoneForm goalId={goal.id} />
          </MilestonesSection>
        </AccordionContent>
      </StyledAccordionItem>
    </div>
  )
}
