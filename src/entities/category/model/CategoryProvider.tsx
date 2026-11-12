import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { categoryRepository } from "../api/categoryRepository"
import { CategoryContext } from "./categoryContext"
import type { Category } from "./category"

export function CategoryProvider({ children }: { children: ReactNode }) {
  const {
    items: categories,
    create,
    update,
    remove,
    reorder,
  } = usePersistedCollection<Category>(categoryRepository, "category")

  const addCategory = useCallback(
    (name: string, color: string) => {
      const id = generateId()
      create({ id, name, color, updatedAt: new Date().toISOString() })
      return id
    },
    [create],
  )

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, "id" | "updatedAt">>) => update(id, patch),
    [update],
  )

  const deleteCategory = useCallback((id: string) => remove(id), [remove])

  // Drag a category chip onto another (Tasks page) — saved through
  // PATCH /api/categories/reorder, which the server always had but nothing
  // called (audit Л4, kept by the owner: "должна быть возможность переставлять").
  const reorderCategories = useCallback(
    (draggedId: string, targetId: string) => reorder(reorderById(categories, draggedId, targetId)),
    [categories, reorder],
  )

  const value = useMemo(
    () => ({ categories, addCategory, updateCategory, deleteCategory, reorderCategories }),
    [categories, addCategory, updateCategory, deleteCategory, reorderCategories],
  )

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
}
