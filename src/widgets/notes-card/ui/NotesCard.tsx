import { useEffect, useState } from "react"
import {
  Archive,
  Check,
  ChevronDown,
  GripVertical,
  Pencil,
  RotateCcw,
  StickyNote,
  Trash2,
} from "lucide-react"
import { useNotes, type Note } from "@/entities/note"
import { NoteForm } from "@/features/note-form"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { useDragReorder } from "@/shared/lib/dnd"
import { ConfirmAction } from "@/shared/ui/confirm-action"
import { Button } from "@/shared/ui/button"
export function NotesCard() {
  const { notes, isLoaded } = useNotes()
  const { t } = useLanguage()
  const [tab, setTab] = useState<"current" | "upcoming" | "archive">("current")
  const [limit, setLimit] = useState(10)
  useEffect(() => {
    const show = () => setTab("upcoming")
    window.addEventListener("show-upcoming-notes", show)
    return () => window.removeEventListener("show-upcoming-notes", show)
  }, [])
  const today = formatDateKey(new Date())
  const filtered = notes.filter(note =>
    tab === "archive"
      ? !!note.archivedAt
      : !note.archivedAt &&
        (tab === "upcoming"
          ? !!note.showFrom && note.showFrom > today
          : !note.showFrom || note.showFrom <= today),
  )
  return (
    <section className="lg:col-span-2 min-w-0 self-start bg-card border border-card-border rounded-xl shadow-card overflow-hidden">
      <div className="p-5 border-b border-border space-y-3">
        <h2 className="font-bold text-lg flex gap-2 items-center">
          <StickyNote size={18} className="text-primary" />
          {t("notes.title")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {(["current", "upcoming", "archive"] as const).map(value => (
            <Button
              key={value}
              variant={tab === value ? "default" : "outline"}
              size="sm"
              aria-pressed={tab === value}
              onClick={() => {
                setTab(value)
                setLimit(10)
              }}
            >
              {t(`notes.${value}`)}
            </Button>
          ))}
        </div>
      </div>
      {!isLoaded ? (
        <p className="p-6 text-muted-foreground">{t("notes.loading")}</p>
      ) : filtered.length ? (
        filtered
          .slice(0, limit)
          .map((note, index) => (
            <NoteRow
              key={note.id}
              note={note}
              previousId={filtered[index - 1]?.id}
              nextId={filtered[index + 1]?.id}
            />
          ))
      ) : (
        <p className="p-6 text-sm text-muted-foreground">{t("notes.empty")}</p>
      )}
      {filtered.length > limit && (
        <div className="p-3 text-center">
          <Button variant="outline" size="sm" onClick={() => setLimit(n => n + 10)}>
            {t("notes.more")}
          </Button>
        </div>
      )}
    </section>
  )
}
function NoteRow({ note, previousId, nextId }: { note: Note; previousId?: string; nextId?: string }) {
  const { t } = useLanguage()
  const { updateNote, deleteNote, reorderNotes } = useNotes()
  const { dropRef, handleRef, isDragging } = useDragReorder<HTMLElement>({
    type: "note",
    id: note.id,
    onHoverMove: reorderNotes,
  })
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  if (editing)
    return (
      <div className="p-3">
        <NoteForm note={note} onDone={() => setEditing(false)} />
      </div>
    )
  return (
    <article
      ref={dropRef}
      data-note-id={note.id}
      className={`p-4 border-b border-border last:border-0 min-w-0 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <Button
          ref={handleRef}
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 cursor-grab touch-none"
          aria-label={t("notes.reorder")}
          title={t("notes.reorder")}
          onKeyDown={event => {
            const target =
              event.key === "ArrowUp" ? previousId : event.key === "ArrowDown" ? nextId : undefined
            if (target) {
              event.preventDefault()
              reorderNotes(note.id, target)
            }
          }}
        >
          <GripVertical size={15} />
        </Button>
        <button
          type="button"
          role="checkbox"
          aria-checked={note.completed}
          aria-label={t(note.completed ? "notes.undo" : "notes.complete")}
          onClick={() => updateNote(note.id, { completed: !note.completed })}
          className={`size-6 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${note.completed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
        >
          {note.completed && <Check size={14} strokeWidth={3} />}
        </button>
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => note.description && setExpanded(v => !v)}
          aria-expanded={note.description ? expanded : undefined}
          aria-controls={note.description ? `note-description-${note.id}` : undefined}
        >
          <span
            className={`font-semibold [overflow-wrap:anywhere] ${note.completed ? "line-through text-muted-foreground" : ""}`}
          >
            {note.title}
          </span>
          {note.description && (
            <ChevronDown
              size={14}
              className={`inline ml-2 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </button>
      </div>
      <div className="flex items-center justify-end gap-1 mt-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={t("notes.edit")}
          onClick={() => setEditing(true)}
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={t(note.archivedAt ? "notes.restore" : "notes.archiveAction")}
          onClick={() =>
            updateNote(note.id, { archivedAt: note.archivedAt ? null : new Date().toISOString() })
          }
        >
          {note.archivedAt ? <RotateCcw size={14} /> : <Archive size={14} />}
        </Button>
        <ConfirmAction
          title={t("notes.deleteTitle")}
          description={t("notes.deleteBody")}
          confirmLabel={t("common.delete")}
          onConfirm={() => deleteNote(note.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-destructive"
            aria-label={t("notes.delete")}
          >
            <Trash2 size={14} />
          </Button>
        </ConfirmAction>
      </div>
      {note.showFrom && (
        <p className="text-xs text-muted-foreground mt-1">
          {t("notes.showFrom")} {note.showFrom}
        </p>
      )}
      {note.description && expanded && (
        <p
          id={`note-description-${note.id}`}
          className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap [overflow-wrap:anywhere]"
        >
          {note.description}
        </p>
      )}
    </article>
  )
}
