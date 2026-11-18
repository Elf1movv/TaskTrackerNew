-- Bright palette (owner, 2026-11-18): every stored color from the old muted
-- set moves to its bright shade in the same position (shared/lib/colors.ts).
-- Custom colors outside the old set are left as they are.

UPDATE "Habit" SET "color" = CASE lower("color")
    WHEN '#c97b3a' THEN '#f59e0b'
    WHEN '#6a9c74' THEN '#34d399'
    WHEN '#5b7fc7' THEN '#60a5fa'
    WHEN '#a35bc7' THEN '#a78bfa'
    WHEN '#c75b8f' THEN '#f472b6'
    WHEN '#3aa6c9' THEN '#38bdf8'
    WHEN '#c9a63a' THEN '#facc15'
    WHEN '#4f9c5e' THEN '#4ade80'
    WHEN '#c75b5b' THEN '#f87171'
    WHEN '#7b6ac9' THEN '#818cf8'
    WHEN '#3ac9a0' THEN '#2dd4bf'
    WHEN '#c98f5b' THEN '#fb923c'
  END
WHERE lower("color") IN ('#c97b3a', '#6a9c74', '#5b7fc7', '#a35bc7', '#c75b8f', '#3aa6c9', '#c9a63a', '#4f9c5e', '#c75b5b', '#7b6ac9', '#3ac9a0', '#c98f5b');

UPDATE "HabitGroup" SET "color" = CASE lower("color")
    WHEN '#c97b3a' THEN '#f59e0b'
    WHEN '#6a9c74' THEN '#34d399'
    WHEN '#5b7fc7' THEN '#60a5fa'
    WHEN '#a35bc7' THEN '#a78bfa'
    WHEN '#c75b8f' THEN '#f472b6'
    WHEN '#3aa6c9' THEN '#38bdf8'
    WHEN '#c9a63a' THEN '#facc15'
    WHEN '#4f9c5e' THEN '#4ade80'
    WHEN '#c75b5b' THEN '#f87171'
    WHEN '#7b6ac9' THEN '#818cf8'
    WHEN '#3ac9a0' THEN '#2dd4bf'
    WHEN '#c98f5b' THEN '#fb923c'
  END
WHERE lower("color") IN ('#c97b3a', '#6a9c74', '#5b7fc7', '#a35bc7', '#c75b8f', '#3aa6c9', '#c9a63a', '#4f9c5e', '#c75b5b', '#7b6ac9', '#3ac9a0', '#c98f5b');

UPDATE "Goal" SET "color" = CASE lower("color")
    WHEN '#c97b3a' THEN '#f59e0b'
    WHEN '#6a9c74' THEN '#34d399'
    WHEN '#5b7fc7' THEN '#60a5fa'
    WHEN '#a35bc7' THEN '#a78bfa'
    WHEN '#c75b8f' THEN '#f472b6'
    WHEN '#3aa6c9' THEN '#38bdf8'
    WHEN '#c9a63a' THEN '#facc15'
    WHEN '#4f9c5e' THEN '#4ade80'
    WHEN '#c75b5b' THEN '#f87171'
    WHEN '#7b6ac9' THEN '#818cf8'
    WHEN '#3ac9a0' THEN '#2dd4bf'
    WHEN '#c98f5b' THEN '#fb923c'
  END
WHERE lower("color") IN ('#c97b3a', '#6a9c74', '#5b7fc7', '#a35bc7', '#c75b8f', '#3aa6c9', '#c9a63a', '#4f9c5e', '#c75b5b', '#7b6ac9', '#3ac9a0', '#c98f5b');

UPDATE "Category" SET "color" = CASE lower("color")
    WHEN '#c97b3a' THEN '#f59e0b'
    WHEN '#6a9c74' THEN '#34d399'
    WHEN '#5b7fc7' THEN '#60a5fa'
    WHEN '#a35bc7' THEN '#a78bfa'
    WHEN '#c75b8f' THEN '#f472b6'
    WHEN '#3aa6c9' THEN '#38bdf8'
    WHEN '#c9a63a' THEN '#facc15'
    WHEN '#4f9c5e' THEN '#4ade80'
    WHEN '#c75b5b' THEN '#f87171'
    WHEN '#7b6ac9' THEN '#818cf8'
    WHEN '#3ac9a0' THEN '#2dd4bf'
    WHEN '#c98f5b' THEN '#fb923c'
  END
WHERE lower("color") IN ('#c97b3a', '#6a9c74', '#5b7fc7', '#a35bc7', '#c75b8f', '#3aa6c9', '#c9a63a', '#4f9c5e', '#c75b5b', '#7b6ac9', '#3ac9a0', '#c98f5b');
