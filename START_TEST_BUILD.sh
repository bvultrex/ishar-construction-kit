#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install --omit=dev --no-audit --no-fund
fi
printf '%s\n' 'Open http://127.0.0.1:4173'
exec node scripts/serve-build.mjs
