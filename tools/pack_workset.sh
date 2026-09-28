#!/usr/bin/env bash
# Impacchetta in .cache/workset.tgz quello che serve per lavorare nella sandbox cloud (animazione, pipeline, audio sorgente).
# Si lancia sul PC con device_bash:   bash tools/pack_workset.sh            (solo il brano in uso, circa 45 MB)
#                                     bash tools/pack_workset.sh --all-music (tutti i brani candidati, +80 MB)
set -euo pipefail
cd "$(dirname "$0")/.."
MUSIC="02_assets/music/candidates/me_and_you_851.mp3"
[ "${1:-}" = "--all-music" ] && MUSIC="02_assets/music"
mkdir -p .cache
tar czf .cache/workset.tgz \
  --exclude='03_animation/pipeline/node_modules' --exclude='03_animation/pipeline/out' \
  --exclude='03_animation/pipeline/audio/out' --exclude='03_animation/pipeline/images/out' --exclude='__pycache__' \
  CLAUDE.md README.md 01_script 03_animation 02_assets/voice 02_assets/sfx $MUSIC
ls -la .cache/workset.tgz
