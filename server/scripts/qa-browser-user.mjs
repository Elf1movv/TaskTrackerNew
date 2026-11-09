// Run only on the isolated local browser database or inside the staging app.
// Never prints a password or token. Caller creates credentials outside the repo.
import { PrismaClient } from "@prisma/client"
const database = new URL(process.env.DATABASE_URL ?? "")
const local =
  database.pathname === "/tasktracker_test" && database.searchParams.get("schema") === "redesign_browser"
const stage =
  database.pathname === "/tasktracker_stage" && process.env.AUTH_COOKIE_PREFIX === "mytracker-staging"
if (!local && !stage) throw new Error("Isolated QA database required")
const [action, email] = process.argv.slice(2)
if (!/^independence-[a-f0-9-]+@example.invalid$/.test(email ?? ""))
  throw new Error("Disposable QA account required")
const db = new PrismaClient()
try {
  // verify also marks the onboarding as done, so the regular suite isn't
  // covered by the first-run walkthrough; onboarding-reset brings it back
  // for scripts/qa/onboarding.mjs.
  if (action === "verify")
    await db.user.update({ where: { email }, data: { emailVerified: true, onboardingStatus: "completed" } })
  else if (action === "onboarding-reset")
    await db.user.update({ where: { email }, data: { onboardingStatus: null, onboardingAt: null } })
  else if (action === "cleanup") await db.user.deleteMany({ where: { email } })
  else throw new Error("Use verify, onboarding-reset or cleanup")
  console.log(JSON.stringify({ action, ok: true }))
} finally {
  await db.$disconnect()
}
