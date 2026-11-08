-- Iteration 3.1 (2026-11-08): two-level goal tree. Goal.subgoals is an
-- embedded JSON array [{ id, title, milestones: [{ id, title, completed }] }],
-- next to Goal.milestones (the goal's own steps) — same "embedded JSON"
-- convention, so the whole goal still saves atomically in one PATCH.
-- Existing goals get no subgoals; their progress formula is unchanged.
ALTER TABLE "Goal" ADD COLUMN "subgoals" JSONB NOT NULL DEFAULT '[]';
