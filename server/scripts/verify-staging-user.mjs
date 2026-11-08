// Staging intentionally sends no email. After a tester registers, verify
// only that requested test account with this command inside the stage app.
import { PrismaClient } from "@prisma/client"
if (
  process.env.AUTH_COOKIE_PREFIX !== "mytracker-staging" ||
  !process.env.DATABASE_URL?.includes("/tasktracker_stage")
) {
  throw new Error("This command is restricted to the isolated staging database")
}
const email = process.argv[2]
if (!email) throw new Error("Pass the registered test email")
const db = new PrismaClient()
try {
  await db.user.update({ where: { email }, data: { emailVerified: true } })
  console.log("Staging account verified")
} finally {
  await db.$disconnect()
}
