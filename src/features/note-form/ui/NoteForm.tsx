import { useState } from "react"
import { useNotes, type Note } from "@/entities/note"
import { useLanguage } from "@/shared/lib/i18n"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Button } from "@/shared/ui/button"
// Notes are undated on purpose (iteration 3): a dated "don't forget" is a
// Reminder, so this form only asks for the text.
export function NoteForm({ note, onDone }: { note?: Note; onDone: () => void }) {
  const { t } = useLanguage()
  const { addNote, updateNote } = useNotes()
  const [title, setTitle] = useState(note?.title ?? "")
  const [description, setDescription] = useState(note?.description ?? "")
  const [saving, setSaving] = useState(false)
  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    const fields = { title: title.trim(), description: description.trim() || null }
    if (note) updateNote(note.id, fields)
    else if (!(await addNote({ ...fields, archivedAt: null, completed: false }))) {
      setSaving(false)
      return
    }
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
