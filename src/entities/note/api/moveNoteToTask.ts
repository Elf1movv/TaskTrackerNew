import type { Note } from "../model/note"

// Turns a note into a task in one server transaction (POST
// /api/notes/:id/to-task): the task is created and the note deleted
// together, so a failure never leaves a duplicate or loses the text. The
// task payload is whatever the prefilled TaskForm produced — this entity
// slice deliberately doesn't import the task entity, so it's typed loosely
// here and the caller refreshes both collections afterwards.
export async function moveNoteToTask(
  note: Pick<Note, "id" | "updatedAt">,
  task: Record<string, unknown>,
): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/notes/${note.id}/to-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedUpdatedAt: note.updatedAt, task }),
    })
    return response.ok
  } catch {
    return false
  }
}
