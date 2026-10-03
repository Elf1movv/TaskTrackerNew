import { useState } from "react"
import { toast } from "sonner"
import { useNotes, type Note } from "@/entities/note"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Button } from "@/shared/ui/button"
import { DateTimeField } from "@/shared/ui/date-time-field"
export function NoteForm({ note, onDone }: { note?: Note; onDone: () => void }) {
  const { t } = useLanguage()
  const { addNote, updateNote } = useNotes()
  const [title, setTitle] = useState(note?.title ?? "")
  const [description, setDescription] = useState(note?.description ?? "")
  const [showFrom, setShowFrom] = useState(note?.showFrom ?? null)
  const [saving, setSaving] = useState(false)
  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    const fields = { title: title.trim(), description: description.trim() || null, showFrom }
    if (note) updateNote(note.id, fields)
    else if (!(await addNote({ ...fields, archivedAt: null }))) {
      setSaving(false)
      return
    }
    if (showFrom && showFrom > formatDateKey(new Date()))
      toast.success(t("notes.futureSaved"), {
        action: {
          label: t("notes.upcoming"),
          onClick: () => window.dispatchEvent(new Event("show-upcoming-notes")),
        },
      })
    onDone()
  }
  return (
    <div className="bg-card border border-primary/25 rounded-xl p-5 space-y-3 min-w-0">
      <Input
        autoFocus
        aria-label={t("notes.placeholder")}
        placeholder={t("notes.placeholder")}
        value={title}
        maxLength={500}
        onChange={e => setTitle(e.target.value)}
      />
      <Textarea
        aria-label={t("notes.description")}
        placeholder={t("notes.description")}
        value={description}
        onChange={e => {
          setDescription(e.target.value)
          e.target.style.height = "auto"
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
        className="min-h-20 resize-none break-words"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("notes.showFrom")}</span>
        <DateTimeField date={showFrom} onDateChange={setShowFrom} placeholder={t("notes.immediate")} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button size="sm" disabled={saving || !title.trim()} onClick={() => void save()}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  )
}
