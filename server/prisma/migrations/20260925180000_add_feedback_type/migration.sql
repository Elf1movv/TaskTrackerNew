-- Feedback.type: "bug" | "suggestion", validated at the zod layer. Existing
-- rows (submitted before this field existed) are backfilled to 'bug' — a
-- guess, since the original beta feedback didn't distinguish the two, but a
-- reasonable default given the original banner text led with "Нашли баг".
-- New rows always supply their own via the client's toggle, so the DB-level
-- default is dropped right after backfilling, same convention as every
-- other additive-field migration in this project.
ALTER TABLE "Feedback" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'bug';
ALTER TABLE "Feedback" ALTER COLUMN "type" DROP DEFAULT;
