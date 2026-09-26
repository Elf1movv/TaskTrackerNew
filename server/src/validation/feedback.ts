import { z } from "zod"

// ~5MB image, base64-encoded (~33% size overhead) plus headroom for the
// "data:image/png;base64," prefix.
const MAX_IMAGE_DATA_LENGTH = 7_000_000

// The client's FileReader.readAsDataURL always produces a
// "data:<mimetype>;base64,<data>" string — this requires that prefix to
// actually say "image/<raster format>", so an arbitrary file can't be
// smuggled through as an attachment misleadingly named "screenshot.png"
// (see routes/feedback.ts, which sends imageData as-is to the recipient's
// inbox). Deliberately excludes image/svg+xml — an SVG can embed a
// <script>, the same class of risk this check exists to close.
const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp|gif|bmp);base64,/i

export const createFeedbackSchema = z.object({
  message: z.string().min(1).max(5000),
  type: z.enum(["bug", "suggestion"]),
  imageData: z
    .string()
    .max(MAX_IMAGE_DATA_LENGTH)
    .regex(IMAGE_DATA_URL_PATTERN, "imageData must be a PNG/JPEG/WebP/GIF/BMP data URL")
    .optional(),
  page: z.string().max(200).optional(),
})
