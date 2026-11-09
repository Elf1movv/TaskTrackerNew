import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { Habit } from "../model/habit"

export const habitRepository: Repository<Habit> = createRestRepository<Habit>(
  `${import.meta.env.VITE_API_URL}/habits`,
)
