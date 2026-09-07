import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { Goal } from "../model/goal"

export const goalRepository: Repository<Goal> = createRestRepository<Goal>(
  `${import.meta.env.VITE_API_URL}/goals`,
)
