#!/usr/bin/env bash
# Rebuild data (verifying every quote) and the offline snapshot.
set -e
cd "$(dirname "$0")"
python3 build/build.py
python3 build/export_static.py
