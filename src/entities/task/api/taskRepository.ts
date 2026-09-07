import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { Task } from "../model/task"

export const taskRepository: Repository<Task> = createRestRepository<Task>(
  `${import.meta.env.VITE_API_URL}/tasks`,
)
