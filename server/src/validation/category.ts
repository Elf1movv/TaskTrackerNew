import { z } from "zod"

const categoryFields = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().min(1),
})

export const createCategorySchema = categoryFields

export const updateCategorySchema = z.object({
  patch: categoryFields.omit({ id: true }).partial(),
  expectedUpdatedAt: z.string(),
})

export const reorderSchema = z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
