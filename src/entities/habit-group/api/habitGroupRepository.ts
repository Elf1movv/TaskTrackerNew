import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { HabitGroup } from "../model/habitGroup"

export const habitGroupRepository: Repository<HabitGroup> = createRestRepository<HabitGroup>(
  `${import.meta.env.VITE_API_URL}/habit-groups`,
)
