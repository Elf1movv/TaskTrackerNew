import { createLocalStorageRepository, type Repository } from "@/shared/lib/storage"
import type { Goal } from "../model/goal"
import { seedGoals } from "../lib/seedGoals"

export const goalRepository: Repository<Goal> = createLocalStorageRepository<Goal>(
  "momentum:goals",
  seedGoals,
)
