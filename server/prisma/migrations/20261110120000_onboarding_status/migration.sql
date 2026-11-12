-- Onboarding (2026-11-10): whether the user has finished or skipped the
-- first-run walkthrough. NULL means "not seen yet" and opens it on the next
-- visit. Everyone who already has an account is marked as done, so the
-- walkthrough only reaches people who sign up after this release.
-- Additive only: the previous release's code ignores these columns.
BEGIN;

ALTER TABLE "user" ADD COLUMN "onboardingStatus" TEXT;
ALTER TABLE "user" ADD COLUMN "onboardingAt" TIMESTAMP(3);

UPDATE "user" SET "onboardingStatus" = 'completed', "onboardingAt" = CURRENT_TIMESTAMP;

COMMIT;
