import { Prisma, type CalendarPlan, type Task } from "@prisma/client"
import { db } from "../db.js"

export function fail(status: number, message: string): never {
  throw Object.assign(new Error(message), { status })
}

// Related writes serialize per owner, including deletion and migration.
// This prevents a new link slipping in between ownership checks and deletion.
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

export async function removeTask(tx: Prisma.TransactionClient, task: Task) {
  await tx.task.delete({ where: { id: task.id } })
}
