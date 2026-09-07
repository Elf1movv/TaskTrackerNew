import { Pencil } from "lucide-react"

export function EditGoalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
      className="p-1 rounded text-muted-foreground hover:text-foreground transition-all"
      aria-label="Edit goal"
    >
      <Pencil size={14} />
    </button>
  )
}
