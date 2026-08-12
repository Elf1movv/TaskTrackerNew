import { createLocalStorageRepository, type Repository } from "@/shared/lib/storage"
import type { Task } from "../model/task"
import { seedTasks } from "../lib/seedTasks"

export const taskRepository: Repository<Task> = createLocalStorageRepository<Task>(
  "momentum:tasks",
  seedTasks,
)
