import { createLocalStorageRepository } from "@/shared/lib/storage/createLocalStorageRepository"
import type { Repository } from "@/shared/lib/storage/repository"
import type { Task } from "../model/types"
import { seedTasks } from "../lib/seedTasks"

export const taskRepository: Repository<Task> = createLocalStorageRepository<Task>(
  "momentum:tasks",
  seedTasks,
)
