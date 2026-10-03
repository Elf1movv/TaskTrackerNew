import { useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { createRestRepository, usePersistedCollection } from "@/shared/lib/storage"
import { NoteContext } from "./noteContext"
import type { Note } from "./note"
const repository = createRestRepository<Note>(`${import.meta.env.VITE_API_URL}/notes`)
export function NoteProvider({ children }: { children: ReactNode }) {
  const { items: notes, isLoaded, create, update, refresh } = usePersistedCollection(repository, "note")
  const value = useMemo(
    () => ({
      notes,
      isLoaded,
      updateNote: update,
      refreshNotes: refresh,
      addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
        const now = new Date().toISOString()
        return create({ ...note, id: generateId(), createdAt: now, updatedAt: now })
      },
    }),
    [notes, isLoaded, update, refresh, create],
  )
  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>
}
