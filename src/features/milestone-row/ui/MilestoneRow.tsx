import { useCallback, useState } from "react"
import { Check, Trash2 } from "lucide-react"
import styled from "@emotion/styled"
import { useGoals, type Milestone } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"
import { Input } from "@/shared/ui/input"

const Circle = styled.div<{ completed: boolean; color: string }>`
  border-radius: 9999px;
  border-width: 2px;
  border-style: solid;
  transition: all 0.15s;
  border-color: ${p => (p.completed ? p.color : "var(--border)")};
  background-color: ${p => (p.completed ? p.color : "transparent")};
`

export function MilestoneRow({
  goalId,
  milestone,
  color,
  index,
}: {
  goalId: string
  milestone: Milestone
  color: string
  index: number
}) {
  const { toggleMilestone, updateMilestone, deleteMilestone, reorderMilestones } = useGoals()
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(milestone.title)

  const onHoverMove = useCallback(
    (draggedId: string, targetId: string) => reorderMilestones(goalId, draggedId, targetId),
    [reorderMilestones, goalId],
  )
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: `milestone-${goalId}`,
    id: milestone.id,
    onHoverMove,
  })

  function commitEdit() {
    const title = draftTitle.trim()
    if (title) updateMilestone(goalId, milestone.id, title)
    else setDraftTitle(milestone.title)
    setIsEditing(false)
  }

  return (
    <div
      ref={ref}
      className="w-full flex items-center gap-3 group cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <button
        onClick={() => toggleMilestone(goalId, milestone.id)}
        className="shrink-0"
        aria-label={milestone.completed ? "Mark milestone as not done" : "Mark milestone as done"}
        aria-pressed={milestone.completed}
      >
        <Circle
          completed={milestone.completed}
          color={color}
          className="w-5 h-5 flex items-center justify-center"
        >
          {milestone.completed && <Check size={9} strokeWidth={3} className="text-white" />}
        </Circle>
      </button>

      {isEditing ? (
        <Input
          autoFocus
          value={draftTitle}
          onChange={e => setDraftTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === "Enter") commitEdit()
            if (e.key === "Escape") {
              setDraftTitle(milestone.title)
              setIsEditing(false)
            }
          }}
          className="text-sm h-7 flex-1 bg-muted border-0"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`text-sm flex-1 leading-snug text-left ${
            milestone.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {milestone.title}
        </button>
      )}

      <span css={monoFont} className="text-xs text-muted-foreground">
        #{index + 1}
      </span>

      <button
        onClick={() => deleteMilestone(goalId, milestone.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
        aria-label="Delete milestone"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
