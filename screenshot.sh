#!/usr/bin/env bash
# 1440x900 screenshots of the live server (falls back to the snapshot).
cd "$(dirname "$0")"; mkdir -p screenshots
BASE=http://127.0.0.1:4141/
curl -sf -o /dev/null "$BASE" || BASE="file://$PWD/dist/agent-playbook-snapshot.html"
shot(){ google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars --user-data-dir=$(mktemp -d /tmp/pb-chrome.XXXX) --window-size=1440,900 \
  --virtual-time-budget=5000 --screenshot="$PWD/screenshots/$1.png" "$BASE$2" >/dev/null 2>&1; echo "screenshots/$1.png"; }
shot 01-hero-radar ""
shot 02-front-door "?shot=front-door"
shot 03-specialists "?shot=specialists"
shot 04-memory "?shot=memory"
shot 05-listeners "?shot=routines-listeners"
shot 06-arena "?shot=arena"
shot 07-cost "?shot=cost"
shot 08-briefs "?shot=briefs"
shot 09-upgrades "?shot=upgrades"
shot 10-roster "?shot=roster"
