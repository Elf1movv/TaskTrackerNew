export interface Repository<T extends { id: string; updatedAt: string }> {
  list(): Promise<T[]>
  create(item: T): Promise<T>
  update(id: string, patch: Partial<T>, expectedUpdatedAt: string): Promise<T>
  remove(id: string): Promise<void>
  // Returns each reordered item's fresh `updatedAt` (Prisma's `@updatedAt`
  // bumps it even though only `order` changed) — callers must merge this
  // back into local state, or the next per-item update() on any of these
  // items will send a now-stale expectedUpdatedAt and get a false 409.
  reorder(order: { id: string; order: number }[]): Promise<{ id: string; updatedAt: string }[]>
}

// Thrown by createRestRepository on a 409 so callers can special-case it
// (toast + reconcile with the server's version) instead of treating it as a
// generic network failure.
export class ConflictError<T> extends Error {
  constructor(public readonly current: T) {
    super("Record was changed elsewhere")
  }
}
