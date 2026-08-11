export interface Repository<T> {
  list(): Promise<T[]>
  save(items: T[]): Promise<void>
}
