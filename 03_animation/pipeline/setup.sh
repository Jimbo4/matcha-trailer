#!/usr/bin/env bash
# Installa le dipendenze della pipeline (Node + Python). Richiede ffmpeg, Node 18+ e Python 3.10+.
# Uso: bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"
command -v ffmpeg >/dev/null || { echo "Manca ffmpeg"; exit 1; }
command -v node >/dev/null || { echo "Manca Node.js"; exit 1; }
npm install --no-audit --no-fund --loglevel=error
python3 -m pip install -q -r requirements.txt 2>/dev/null || python3 -m pip install -q --break-system-packages -r requirements.txt
node -e "import('./browser.mjs').then(m => { const p = m.findChromium(); console.log('Chromium:', p || 'non trovato: esegui  npx playwright install chromium'); })"
echo "setup completato"
