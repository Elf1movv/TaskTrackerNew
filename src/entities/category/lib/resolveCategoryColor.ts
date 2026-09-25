import { CATEGORY_FALLBACK_COLOR } from "@/shared/lib/colors"
import type { Category } from "../model/category"

// Task.category is a plain string (the category's name), not a foreign
// key — so "no category" (empty string) and "category was deleted" both
// just fail to match anything here. Both get the same neutral fallback;
// the task model has no way to tell them apart anyway, and distinguishing
// them wouldn't change what the user should see.
export function resolveCategoryColor(categoryName: string, categories: Category[]): string {
  return categories.find(c => c.name === categoryName)?.color ?? CATEGORY_FALLBACK_COLOR
}
