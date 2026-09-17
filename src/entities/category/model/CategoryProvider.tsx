import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { usePersistedCollection } from "@/shared/lib/storage"
import { categoryRepository } from "../api/categoryRepository"
import { CategoryContext } from "./categoryContext"
import type { Category } from "./category"

export function CategoryProvider({ children }: { children: ReactNode }) {
  const { items: categories, create } = usePersistedCollection<Category>(categoryRepository, "category")

  const addCategory = useCallback(
    (name: string) => {
      create({ id: generateId(), name, updatedAt: new Date().toISOString() })
    },
    [create],
  )

  const value = useMemo(() => ({ categories, addCategory }), [categories, addCategory])

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
}
