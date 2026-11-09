// Talks to server/src/routes/me.ts. The status lives on the account (not in
// the browser) so a finished or skipped onboarding stays that way on every
// device — decision from 2026-11-09, see docs/BACKLOG.md.

export type OnboardingStatus = "completed" | "skipped"

export async function fetchOnboardingStatus(): Promise<OnboardingStatus | null> {
  const res = await fetch("/api/me/onboarding")
  if (!res.ok) throw new Error(`GET /api/me/onboarding failed: ${res.status}`)
  const body = (await res.json()) as { status: OnboardingStatus | null }
  return body.status
}

export async function saveOnboardingStatus(status: OnboardingStatus): Promise<void> {
  const res = await fetch("/api/me/onboarding", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(`PUT /api/me/onboarding failed: ${res.status}`)
}
