import { createContext, useContext } from "react"
import type { Note } from "./note"
export interface NoteContextValue {
  notes: Note[]
  isLoaded: boolean
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<boolean>
  updateNote: (id: string, patch: Partial<Note>) => void
  refreshNotes: () => Promise<void>
}
export const NoteContext = createContext<NoteContextValue | null>(null)
export function useNotes() {
  const value = useContext(NoteContext)
  if (!value) throw new Error("NoteProvider required")
  return value
}
