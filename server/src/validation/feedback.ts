import { z } from "zod"

// ~5MB image, base64-encoded (~33% size overhead) plus headroom for the
// "data:image/png;base64," prefix.
const MAX_IMAGE_DATA_LENGTH = 7_000_000

export const createFeedbackSchema = z.object({
  message: z.string().min(1).max(5000),
  imageData: z.string().max(MAX_IMAGE_DATA_LENGTH).optional(),
  page: z.string().max(200).optional(),
})
