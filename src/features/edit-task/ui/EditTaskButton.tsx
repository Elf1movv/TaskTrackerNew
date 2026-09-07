import { Pencil } from "lucide-react"

export function EditTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
      aria-label="Edit task"
    >
      <Pencil size={13} />
    </button>
  )
}
