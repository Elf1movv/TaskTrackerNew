import { createRestRepository, type Repository } from "@/shared/lib/storage"
import type { Reminder } from "../model/reminder"

export const reminderRepository: Repository<Reminder> = createRestRepository<Reminder>(
  `${import.meta.env.VITE_API_URL}/reminders`,
)
