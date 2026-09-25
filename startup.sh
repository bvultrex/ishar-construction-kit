#!/bin/sh
set -eu
if curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1; then exit 0; fi
nohup npm run dev >/tmp/ishar-construction-kit.log 2>&1 &
