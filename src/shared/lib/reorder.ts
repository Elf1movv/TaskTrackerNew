export function reorderById<T extends { id: string }>(list: T[], draggedId: string, targetId: string): T[] {
  if (draggedId === targetId) return list

  const fromIndex = list.findIndex(item => item.id === draggedId)
  const toIndex = list.findIndex(item => item.id === targetId)
  if (fromIndex === -1 || toIndex === -1) return list

  const next = [...list]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}
