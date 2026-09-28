#!/usr/bin/env bash
# Controllo tecnico di un video: formato, loudness e true peak, fotogrammi neri o congelati.
# Uso: bash qc/check.sh <video.mp4>
set -euo pipefail
V="${1:?uso: bash qc/check.sh <video.mp4>}"
echo "== formato"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,color_space,sample_rate,channels,nb_frames:format=duration,size,bit_rate -of compact "$V"
echo "== loudness (target -14 LUFS, true peak sotto -1 dBTP)"
ffmpeg -hide_banner -nostats -i "$V" -filter_complex "[0:a]ebur128=peak=true[a]" -map "[a]" -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tail -3
echo "== fotogrammi neri o congelati (nessuna riga = ok)"
ffmpeg -hide_banner -nostats -i "$V" -vf "blackdetect=d=0.05:pix_th=0.05,freezedetect=n=0.001:d=0.5" -an -f null - 2>&1 | grep -E "black_start|freeze_start" || true
