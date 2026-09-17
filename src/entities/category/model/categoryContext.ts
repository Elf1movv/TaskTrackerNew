import { createContext, useContext } from "react"
import type { Category } from "./category"

export interface CategoryContextValue {
  categories: Category[]
  addCategory: (name: string) => void
}

export const CategoryContext = createContext<CategoryContextValue | null>(null)

export function useCategories(): CategoryContextValue {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error("useCategories must be used within a CategoryProvider")
  return ctx
}
