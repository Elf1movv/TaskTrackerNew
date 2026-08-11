import { createLocalStorageRepository } from "@/shared/lib/storage/createLocalStorageRepository"
import type { Repository } from "@/shared/lib/storage/repository"
import type { Goal } from "../model/types"
import { seedGoals } from "../lib/seedGoals"

export const goalRepository: Repository<Goal> = createLocalStorageRepository<Goal>(
  "momentum:goals",
  seedGoals,
)
