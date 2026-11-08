#!/usr/bin/env bash
# One-command staging deploy (owner rule 2026-11-08: fewer manual steps).
# Run from the repo root in Git Bash / any POSIX shell with SSH access as
# deploy@185.65.202.121. Deploys the given commit of the pushed branch:
#   scripts/staging-deploy.sh            # current HEAD (must be pushed)
#   scripts/staging-deploy.sh <sha>
# Steps: wait for the GitHub-built image → pg_dump backup → checkout →
# STAGING_IMAGE → schema/migrations → restart app → health, log errors,
# record counts, and the production bundle (must not change).
# Never touches production.
set -euo pipefail
SHA=$(git rev-parse "${1:-HEAD}")
SHORT=${SHA:0:7}
HOST=deploy@185.65.202.121
IMAGE=ghcr.io/elf1movv/tasktracker:staging-$SHA

echo "Waiting for $IMAGE (GitHub build takes ~5 min)…"
for _ in $(seq 1 40); do
  ssh -o BatchMode=yes "$HOST" "docker pull -q $IMAGE" >/dev/null 2>&1 && break
  sleep 30
done
ssh -o BatchMode=yes "$HOST" "docker image inspect $IMAGE" >/dev/null 2>&1 || {
  echo "Image not found after 20 min — check the GitHub Actions run." >&2
  exit 1
}

ssh -o BatchMode=yes "$HOST" bash -s -- "$SHA" "$SHORT" "$IMAGE" <<'REMOTE'
set -euo pipefail
SHA=$1 SHORT=$2 IMAGE=$3
cd /var/www/tasktracker-staging
C="docker compose --env-file .env.staging -p mytracker-staging -f docker-compose.staging.yml"
COUNT='select (select count(*) from "user")||'"'"'/'"'"'||(select count(*) from "Note")||'"'"'/'"'"'||(select count(*) from "Task")||'"'"'/'"'"'||(select count(*) from "Goal")||'"'"'/'"'"'||(select count(*) from "CalendarPlan")||'"'"'/'"'"'||(select count(*) from "Reminder")'
count() { $C exec -T db sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -At" <<<"$COUNT"; }
BEFORE=$(count)
DUMP=backups/$(date +%Y%m%d-%H%M)-$SHORT.dump
$C exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' < /dev/null > "$DUMP"
git fetch -q origin < /dev/null && git checkout -q "$SHA"
sed -i "s|^STAGING_IMAGE=.*|STAGING_IMAGE=$IMAGE|" .env.staging
$C run --rm -T app node scripts/deploy-staging-schema.mjs < /dev/null 2>&1 | grep -E "Applying|No pending|applied|Error" || true
$C up -d app < /dev/null >/dev/null 2>&1
sleep 8
echo "commit:   $(git log --oneline -1)"
echo "backup:   $DUMP"
echo "counts:   $BEFORE -> $(count)   (users/notes/tasks/goals/plans/reminders)"
echo "health:   $(curl -s -o /dev/null -w '%{http_code}' https://test.mytracker.space/api/health)"
echo "log errors (1m): $($C logs --since 1m app < /dev/null 2>&1 | grep -ci error || true)"
echo "prod bundle: $(curl -s https://mytracker.space/ | grep -o 'assets/index-[^"]*\.js')"
REMOTE
