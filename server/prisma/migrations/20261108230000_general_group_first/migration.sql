-- Hand-written data migration (2026-11-08). Until now the UI always showed
-- the General group (habits without a block) first, whatever its "order"
-- said: it was seeded with order 999999 and its value drifted with block
-- reorders. The UI now follows "order" for General too (it can be dragged
-- among blocks), so pin every user's General just before their first block
-- once — everyone keeps seeing it first, exactly as before. Only General rows
-- that are not already first are touched; "updatedAt" is left alone.
UPDATE "HabitGroup" AS g
SET "order" = blocks.min_order - 1
FROM (
  SELECT "userId", MIN("order") AS min_order
  FROM "HabitGroup"
  WHERE NOT "isGeneral"
  GROUP BY "userId"
) AS blocks
WHERE g."userId" = blocks."userId"
  AND g."isGeneral"
  AND g."order" >= blocks.min_order;
