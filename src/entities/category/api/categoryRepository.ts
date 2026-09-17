import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { Category } from "../model/category"

export const categoryRepository: Repository<Category> = createRestRepository<Category>(
  `${import.meta.env.VITE_API_URL}/categories`,
)
