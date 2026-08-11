import { createLocalStorageRepository } from "@/shared/lib/storage/createLocalStorageRepository"
import type { Repository } from "@/shared/lib/storage/repository"
import type { Habit } from "../model/types"
import { seedHabits } from "../lib/seedHabits"

export const habitRepository: Repository<Habit> = createLocalStorageRepository<Habit>(
  "momentum:habits",
  seedHabits,
)
