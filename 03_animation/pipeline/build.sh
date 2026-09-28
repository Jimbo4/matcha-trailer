#!/usr/bin/env bash
# Pipeline completa del trailer. Eseguire dalla cartella pipeline (o da qualunque cartella: lo script si sposta da solo).
#   bash build.sh audio     mix audio (musica montata, voce, effetti), versione senza musica, stems, audio per l'anteprima
#   bash build.sh draft     video bozza veloce con audio -> out/trailer_bozza.mp4 (circa 3 min)
#   bash build.sh video     video finale con motion blur e audio -> out/trailer.mp4 (circa 15 min con 2 CPU)
#   bash build.sh cover     copertina -> out/cover.png
#   bash build.sh qc        controlli tecnici e fogli provini di out/trailer.mp4
#   bash build.sh deliver   copia i file finali in ../../04_render (sovrascrive)
#   bash build.sh all       audio + video + cover + qc + deliver
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"            # cartella trailer
REN="$ROOT/04_render"

step_audio() {
  python3 audio/music_edit.py
  python3 audio/mix.py
  NO_MUSIC=1 OUT=out/mix_senza_musica.wav TARGET=-16 python3 audio/mix.py
  ffmpeg -y -loglevel error -i audio/out/mix.wav -c:a aac -b:a 256k -ar 48000 ../assets/audio/trailer_mix.m4a
  echo "audio pronto in audio/out (anteprima aggiornata: assets/audio/trailer_mix.m4a)"
}
step_draft() { node render.mjs --draft 1 --audio audio/out/mix.wav; }
step_video() { node render.mjs --audio audio/out/mix.wav; }
step_cover() { node shot.mjs ../cover.html out/cover.png; }
step_qc() {
  bash qc/check.sh out/trailer.mp4
  python3 qc/contact_sheet.py out/trailer.mp4 --fps 10 --out out/provini
}
step_deliver() {
  mkdir -p "$REN/audio" "$REN/stems"
  cp out/trailer.mp4 "$REN/Matcha_trailer_30s_1080x1920.mp4"
  ffmpeg -y -loglevel error -i out/trailer.mp4 -i audio/out/mix_senza_musica.wav -map 0:v -map 1:a -c:v copy \
    -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$REN/Matcha_trailer_30s_senza_musica.mp4"
  cp audio/out/mix.wav "$REN/audio/Matcha_trailer_mix.wav"
  cp audio/out/mix_senza_musica.wav "$REN/audio/Matcha_trailer_mix_senza_musica.wav"
  cp audio/out/stem_vo.wav "$REN/stems/voce.wav"
  cp audio/out/stem_music.wav "$REN/stems/musica.wav"
  cp audio/out/stem_sfx.wav "$REN/stems/effetti.wav"
  [ -f out/cover.png ] && cp out/cover.png "$REN/Matcha_trailer_cover.png"
  echo "file finali copiati in $REN"
}
case "${1:-}" in
  audio) step_audio ;;
  draft) step_draft ;;
  video) step_video ;;
  cover) step_cover ;;
  qc) step_qc ;;
  deliver) step_deliver ;;
  all) step_audio; step_video; step_cover; step_qc; step_deliver ;;
  *) sed -n '2,10p' "$0"; exit 1 ;;
esac
