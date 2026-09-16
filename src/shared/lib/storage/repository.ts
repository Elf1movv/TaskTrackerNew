export interface Repository<T extends { id: string; updatedAt: string }> {
  list(): Promise<T[]>
  create(item: T): Promise<T>
  update(id: string, patch: Partial<T>, expectedUpdatedAt: string): Promise<T>
  remove(id: string): Promise<void>
  reorder(order: { id: string; order: number }[]): Promise<void>
}

// Thrown by createRestRepository on a 409 so callers can special-case it
// (toast + reconcile with the server's version) instead of treating it as a
// generic network failure.
export class ConflictError<T> extends Error {
  constructor(public readonly current: T) {
    super("Record was changed elsewhere")
  }
}
