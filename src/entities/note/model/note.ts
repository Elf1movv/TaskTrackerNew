export interface Note {
  id: string
  title: string
  description: string | null
  showFrom: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}
