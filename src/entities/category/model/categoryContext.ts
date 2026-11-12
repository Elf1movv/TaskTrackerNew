import { createContext, useContext } from "react"
import type { Category } from "./category"

export interface CategoryContextValue {
  categories: Category[]
  // Returns the new category's id.
  addCategory: (name: string, color: string) => string
  updateCategory: (id: string, patch: Partial<Omit<Category, "id" | "updatedAt">>) => void
  deleteCategory: (id: string) => Promise<void>
  reorderCategories: (draggedId: string, targetId: string) => void
}

export const CategoryContext = createContext<CategoryContextValue | null>(null)

export function useCategories(): CategoryContextValue {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error("useCategories must be used within a CategoryProvider")
  return ctx
}
