import { Prisma, type CalendarPlan } from "@prisma/client"
import { db } from "../db.js"

export function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status })
}

// Writes that read before they write (task create/update/delete, category
// delete cascading to tasks and goals, note → task, plan create) run one at
// a time per owner, inside one transaction, so two requests from the same
// user can't interleave halfway.
export async function ownerTransaction<T>(
  userId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${userId}))`
    return work(tx)
  })
}

export function clientPlan({ userId: _owner, ...plan }: CalendarPlan) {
  return { ...plan, date: plan.date?.toISOString().slice(0, 10) ?? null }
}
