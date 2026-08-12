import { createLocalStorageRepository, type Repository } from "@/shared/lib/storage"
import type { Habit } from "../model/habit"
import { seedHabits } from "../lib/seedHabits"

export const habitRepository: Repository<Habit> = createLocalStorageRepository<Habit>(
  "momentum:habits",
  seedHabits,
)
