import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
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
  } = usePersistedCollection<Category>(categoryRepository, "category")

  const addCategory = useCallback(
    (name: string, color: string) => {
      create({ id: generateId(), name, color, updatedAt: new Date().toISOString() })
    },
    [create],
  )

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, "id" | "updatedAt">>) => update(id, patch),
    [update],
  )

  const deleteCategory = useCallback((id: string) => remove(id), [remove])

  const value = useMemo(
    () => ({ categories, addCategory, updateCategory, deleteCategory }),
    [categories, addCategory, updateCategory, deleteCategory],
  )

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
}
