import type { CreatedItems, OwnedRecords } from "./onboardingMachine"

// Only a convenience: if the tab closes in the middle of the first
// onboarding, the next visit continues from the same screen instead of
// starting over (and creating a second copy of the habit). `owned` keeps the
// ids of what the run created, so a resumed run that is then skipped still
// deletes them. Whether the
// onboarding is finished at all is stored on the server, not here.
// Keyed by user id: on a shared browser another account must not resume
// someone else's walkthrough (found by the browser check, 2026-11-10).
const keyFor = (userId: string) => `mytracker-onboarding-progress:${userId}`

interface StoredProgress {
  stepIndex: number
  created: CreatedItems
  owned?: OwnedRecords
}

export function readProgress(userId: string): StoredProgress | null {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredProgress
    return typeof parsed.stepIndex === "number" ? parsed : null
  } catch {
    return null
  }
}

export function writeProgress(userId: string, progress: StoredProgress): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(progress))
  } catch {
    // Blocked storage (private mode) — resuming just won't work there.
  }
}

export function clearProgress(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId))
  } catch {
    // Same as above.
  }
}
