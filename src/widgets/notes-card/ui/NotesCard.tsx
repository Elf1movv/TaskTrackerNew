import { useEffect, useState } from "react"
import { Archive, ChevronDown, Pencil, RotateCcw, StickyNote } from "lucide-react"
import { useNotes, type Note } from "@/entities/note"
import { NoteForm } from "@/features/note-form"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
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
  if (tab === "upcoming") filtered.sort((a, b) => (a.showFrom ?? "").localeCompare(b.showFrom ?? ""))
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
        filtered.slice(0, limit).map(note => <NoteRow key={note.id} note={note} />)
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
function NoteRow({ note }: { note: Note }) {
  const { t } = useLanguage()
  const { updateNote } = useNotes()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  if (editing)
    return (
      <div className="p-3">
        <NoteForm note={note} onDone={() => setEditing(false)} />
      </div>
    )
  return (
    <article className="p-4 border-b border-border last:border-0 min-w-0">
      <div className="flex items-start gap-2">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          <span className="font-semibold [overflow-wrap:anywhere]">{note.title}</span>
          {note.description && (
            <ChevronDown
              size={14}
              className={`inline ml-2 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </button>
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
      </div>
      {note.showFrom && (
        <p className="text-xs text-muted-foreground mt-1">
          {t("notes.showFrom")} {note.showFrom}
        </p>
      )}
      {note.description && (
        <p
          className={`text-sm text-muted-foreground mt-2 whitespace-pre-wrap [overflow-wrap:anywhere] ${expanded ? "" : "line-clamp-2"}`}
        >
          {note.description}
        </p>
      )}
    </article>
  )
}
