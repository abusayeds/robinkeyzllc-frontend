#!/usr/bin/env bash
# Run on the VPS after every change:  ./deploy.sh
#
# `git pull` alone changes nothing users can see. `next start` reads ./.next
# ONCE at boot and serves it from memory, so a deploy must: pull -> rebuild
# -> fully stop the old process -> start a new one.
set -euo pipefail
cd "$(dirname "$0")"

PORT=3005

echo "==> Pulling latest"
git pull --ff-only
git log --oneline -1

echo "==> Installing dependencies"
npm ci

echo "==> Building (errors here mean the OLD build keeps serving)"
rm -rf .next
npm run build
echo "    BUILD_ID: $(cat .next/BUILD_ID)"

echo "==> Stopping old server"
if command -v pm2 >/dev/null 2>&1 && pm2 describe robinkey >/dev/null 2>&1; then
  pm2 restart robinkey --update-env
  echo "==> Restarted via pm2"
else
  pkill -f "next start" 2>/dev/null || true
  pkill -f "next-server" 2>/dev/null || true
  # free the port in case something else holds it
  fuser -k "${PORT}/tcp" 2>/dev/null || true
  sleep 1
  echo "==> Starting fresh (nohup -> app.log)"
  nohup npm run start > app.log 2>&1 &
  sleep 3
fi

echo "==> Verifying"
curl -s "http://localhost:${PORT}/" -o /dev/null -w "    HTTP %{http_code}\n" || true
echo "==> Done. Tail logs with:  tail -f app.log"
