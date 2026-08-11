import styled from "@emotion/styled"
import { MilestoneRow } from "@/features/toggle-milestone"
import { ProgressRing, type Goal } from "@/entities/goal"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"

export interface GoalListItem extends Goal {
  dueLabel: string
}

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

export function GoalList({ goals }: { goals: GoalListItem[] }) {
  return (
    <Accordion type="single" collapsible defaultValue={goals[0]?.id} className="space-y-4">
      {goals.map(goal => {
        const completedCount = goal.milestones.filter(m => m.completed).length

        return (
          <StyledAccordionItem key={goal.id} value={goal.id} color={goal.color} className="!border-b-0">
            <AccordionTrigger className="px-6 py-6 hover:no-underline [&>svg]:mt-0.5">
              <div className="flex items-start gap-4 flex-1">
                <ProgressRing progress={goal.progress} color={goal.color} />
                <div className="flex-1 min-w-0 text-left">
                  <h3 css={displayFont} className="text-base leading-snug pr-2">
                    {goal.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{goal.description}</p>
                  <div className="flex gap-4 mt-3">
                    <MilestoneCountLabel css={monoFont} color={goal.color} className="text-xs">
                      {completedCount}/{goal.milestones.length} milestones
                    </MilestoneCountLabel>
                    <span css={monoFont} className="text-xs text-muted-foreground">
                      Due {goal.dueLabel}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-0">
              <MilestonesSection color={goal.color} className="pt-5 pb-6">
                <div
                  css={monoFont}
                  className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4"
                >
                  Milestones
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
                </div>
              </MilestonesSection>
            </AccordionContent>
          </StyledAccordionItem>
        )
      })}
    </Accordion>
  )
}
