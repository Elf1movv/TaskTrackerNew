import { invalidateRelated } from "./invalidate"
import { ConflictError, type Repository } from "./repository"

// REST-backed implementation of Repository<T> — talks to the Node/Express
// backend, one granular request per action (create/update/remove/reorder)
// instead of resaving the whole collection. See docs/ARCHITECTURE.md for
// why this replaced the earlier whole-collection GET/PUT design.
export function createRestRepository<T extends { id: string; updatedAt: string }>(
  baseUrl: string,
): Repository<T> {
  const headers = {
    "Content-Type": "application/json",
    "X-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  return {
    async list() {
      const res = await fetch(baseUrl)
      if (!res.ok) throw new Error(`Failed to load ${baseUrl}: ${res.status}`)
      return res.json() as Promise<T[]>
    },
    async create(item) {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error(`Failed to create item at ${baseUrl}: ${res.status}`)
      invalidateRelated(baseUrl)
      return res.json() as Promise<T>
    },
    async update(id, patch, expectedUpdatedAt) {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ patch, expectedUpdatedAt }),
      })
      if (res.status === 409) {
        const body = (await res.json()) as { current: T }
        throw new ConflictError(body.current)
      }
      if (!res.ok) throw new Error(`Failed to update ${baseUrl}/${id}: ${res.status}`)
      invalidateRelated(baseUrl)
      return res.json() as Promise<T>
    },
    async remove(id) {
      const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE", headers })
      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to delete ${baseUrl}/${id}: ${res.status}`)
      }
      invalidateRelated(baseUrl, true)
    },
    async reorder(order) {
      const res = await fetch(`${baseUrl}/reorder`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(order),
      })
      if (!res.ok) throw new Error(`Failed to reorder ${baseUrl}: ${res.status}`)
      return res.json() as Promise<{ id: string; updatedAt: string }[]>
    },
  }
}
