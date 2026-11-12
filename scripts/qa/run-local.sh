#!/usr/bin/env bash
# One-command local browser QA on the owner's Windows PC (Git Bash).
# Builds the app, starts the local server on :3002 against the isolated
# tasktracker_test?schema=redesign_browser, starts headless Chrome on :9222,
# registers + verifies a disposable QA user, runs the checks, then cleans up
# the user and stops both processes.
#   scripts/qa/run-local.sh            # 20-check suite + onboarding
#   scripts/qa/run-local.sh --full     # suite + calendar gestures
#   scripts/qa/run-local.sh --keep     # leave server+Chrome running and the
#                                      # QA user logged in (for ad-hoc scripts);
#                                      # stop later with --stop
#   scripts/qa/run-local.sh --stop     # cleanup user, stop processes
# Requires the local Postgres on :5433 (E:\MyTracker\start-db.cmd) and
# server/.env.test. Output (results, screenshots) goes to $QA_TMP.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
export QA_TMP=${QA_TMP:-$(cygpath -w "${TMPDIR:-/tmp}/mytracker-qa" 2>/dev/null || echo /tmp/mytracker-qa)}
UNIX_TMP=$(cygpath -u "$QA_TMP" 2>/dev/null || echo "$QA_TMP")
mkdir -p "$UNIX_TMP"
ENV_FILE=$UNIX_TMP/qa.env
EMAIL_FILE=$UNIX_TMP/qa-email.txt
CHROME=${CHROME:-"/c/Program Files/Google/Chrome/Application/chrome.exe"}

stop() {
  if [ -f "$EMAIL_FILE" ]; then
    (cd "$ROOT/server" && node --env-file="$ENV_FILE" scripts/qa-browser-user.mjs cleanup "$(cat "$EMAIL_FILE")" | tail -1) || true
    rm -f "$EMAIL_FILE" "$UNIX_TMP"/*login*.json
  fi
  for pid in $(netstat -ano 2>/dev/null | grep -E ":(3002|9222) .*LISTENING" | awk '{print $5}' | sort -u); do
    taskkill //PID "$pid" //F //T >/dev/null 2>&1 || true
  done
}
if [ "${1:-}" = "--stop" ]; then stop; exit 0; fi

# QA env: the test DB URL from server/.env.test, isolated browser schema.
BASE=$(grep -E '^DATABASE_URL=' "$ROOT/server/.env.test" | sed 's/^DATABASE_URL=//; s/"//g; s/?.*//')
grep -v -E '^(PORT|BETTER_AUTH_URL|EMAIL_DELIVERY|DATABASE_URL)=' "$ROOT/server/.env.test" > "$ENV_FILE"
printf 'PORT=3002\nBETTER_AUTH_URL=http://localhost:3002\nEMAIL_DELIVERY=disabled\nDATABASE_URL=%s?schema=redesign_browser\n' "$BASE" >> "$ENV_FILE"
# Push notifications: a throwaway VAPID key pair for the local server only.
(cd "$ROOT/server" && node -e 'const k=require("web-push").generateVAPIDKeys();console.log(["VAPID_PUBLIC_KEY="+k.publicKey,"VAPID_PRIVATE_KEY="+k.privateKey,"VAPID_SUBJECT=mailto:qa@example.invalid"].join(String.fromCharCode(10)))') >> "$ENV_FILE"

cd "$ROOT"
npm run build >/dev/null
(cd server && node --env-file="$ENV_FILE" scripts/deploy-staging-schema.mjs | grep -E "Applying|Error" || true)
(cd server && nohup npx tsx --env-file="$ENV_FILE" src/index.ts >"$UNIX_TMP/server.log" 2>&1 &)
nohup "$CHROME" --headless=new --remote-debugging-port=9222 --user-data-dir="$QA_TMP\\chrome" about:blank >/dev/null 2>&1 &
for _ in $(seq 1 30); do
  curl -s -m 2 http://localhost:3002/api/health | grep -q ok && curl -s http://127.0.0.1:9222/json/version >/dev/null && break
  sleep 2
done
[ "${1:-}" = "--keep" ] || trap stop EXIT

EMAIL=$(node scripts/qa/independent-browser.mjs register | grep -oE 'independence-[^"]*@example\.invalid' | head -1)
echo "$EMAIL" > "$EMAIL_FILE"
(cd server && node --env-file="$ENV_FILE" scripts/qa-browser-user.mjs verify "$EMAIL" | tail -1)
node scripts/qa/independent-browser.mjs suite | grep -v '^PASS' || true
# Onboarding walkthrough (desktop, phone, skip hint, light/en, reduced motion)
# on the same user, with its onboarding status reset to "not seen".
QA_RESET="(cd server && node --env-file=\"$ENV_FILE\" scripts/qa-browser-user.mjs onboarding-reset \"$EMAIL\" >/dev/null)"
export QA_RESET
node scripts/qa/onboarding.mjs | grep -v '^PASS' || true
# PWA: installable, service worker, offline page (restarts the local server).
QA_ENV="$ENV_FILE" node scripts/qa/pwa.mjs | cut -c1-200 || true
[ "${1:-}" = "--full" ] && node scripts/qa/calendar-gestures.mjs | tail -1
echo "QA output: $QA_TMP"
