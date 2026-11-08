import { invalidateRelated } from "./invalidate"
import { ConflictError, type Repository } from "./repository"

// REST-backed implementation of Repository<T> — talks to the Node/Express
// backend, one granular request per action (create/update/remove/reorder)
// instead of resaving the whole collection. See docs/ARCHITECTURE.md for
// why this replaced the earlier whole-collection GET/PUT design.
export function createRestRepository<T extends { id: string; updatedAt: string }>(
  baseUrl: string,
): Repository<T> {
  const baseHeaders = {
    "Content-Type": "application/json",
    "X-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  // Read per request, not once: the language can be switched at any time.
  // The server uses it to name a new user's default categories.
  const languageHeader = () => {
    try {
      return { "X-Language": localStorage.getItem("mytracker-language") === "ru" ? "ru" : "en" }
    } catch {
      return { "X-Language": "en" }
    }
  }
  return {
    async list() {
      const res = await fetch(baseUrl, { headers: languageHeader() })
      if (!res.ok) throw new Error(`Failed to load ${baseUrl}: ${res.status}`)
      return res.json() as Promise<T[]>
    },
    async create(item) {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { ...baseHeaders, ...languageHeader() },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error(`Failed to create item at ${baseUrl}: ${res.status}`)
      invalidateRelated(baseUrl)
      return res.json() as Promise<T>
    },
    async update(id, patch, expectedUpdatedAt) {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        headers: { ...baseHeaders, ...languageHeader() },
        body: JSON.stringify({ patch, expectedUpdatedAt }),
      })
      if (res.status === 409) {
        const body = (await res.json()) as { current?: T; error?: string }
        // A 409 without `current` is not a stale-version conflict (e.g. a
        // category name already taken) — plain failure, rolled back.
        if (body.current) throw new ConflictError(body.current)
        throw new Error(`Failed to update ${baseUrl}/${id}: ${body.error ?? res.status}`)
      }
      if (!res.ok) throw new Error(`Failed to update ${baseUrl}/${id}: ${res.status}`)
      invalidateRelated(baseUrl, { renamed: "name" in (patch as object) })
      return res.json() as Promise<T>
    },
    async remove(id) {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "DELETE",
        headers: { ...baseHeaders, ...languageHeader() },
      })
      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to delete ${baseUrl}/${id}: ${res.status}`)
      }
      invalidateRelated(baseUrl, { deleted: true })
    },
    async reorder(order) {
      const res = await fetch(`${baseUrl}/reorder`, {
        method: "PATCH",
        headers: { ...baseHeaders, ...languageHeader() },
        body: JSON.stringify(order),
      })
      if (!res.ok) throw new Error(`Failed to reorder ${baseUrl}: ${res.status}`)
      return res.json() as Promise<{ id: string; updatedAt: string }[]>
    },
  }
}
