import { Prisma } from "@prisma/client"

// Prisma's "record to delete/update does not exist" error code — used to
// turn that specific case into a normal 404 instead of a 500.
export function isPrismaNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
}
