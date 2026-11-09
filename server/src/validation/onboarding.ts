import { z } from "zod"

// The only two outcomes of the walkthrough. "Not seen yet" is the absence of
// a value (NULL in the database) and can't be set back through the API.
export const ONBOARDING_STATUSES = ["completed", "skipped"] as const

export const updateOnboardingSchema = z.object({
  status: z.enum(ONBOARDING_STATUSES),
})
