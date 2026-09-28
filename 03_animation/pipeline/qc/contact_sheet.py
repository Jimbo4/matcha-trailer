"""Fogli provini di un video: python3 qc/contact_sheet.py <video.mp4> [--fps 10] [--start 0] [--end 30] [--out out/provini]
Crea fogli JPG da 50 fotogrammi (10 colonne), con il tempo scritto su ogni miniatura."""
import argparse, glob, os, subprocess, tempfile
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("--fps", type=float, default=10); ap.add_argument("--start", type=float, default=0)
ap.add_argument("--end", type=float, default=None); ap.add_argument("--out", default="out/provini")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
W, H, COLS, PER = 180, 320, 10, 50
with tempfile.TemporaryDirectory() as tmp:
    cmd = ["ffmpeg", "-v", "error", "-ss", str(a.start)]
    if a.end is not None: cmd += ["-t", str(a.end - a.start)]
    cmd += ["-i", a.video, "-vf", f"fps={a.fps},scale={W}:{H}:flags=lanczos", os.path.join(tmp, "f_%04d.png")]
    subprocess.run(cmd, check=True)
    fs = sorted(glob.glob(os.path.join(tmp, "f_*.png")))
    for s in range(0, len(fs), PER):
        part = fs[s:s + PER]; rows = (len(part) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * (W + 4) + 4, rows * (H + 18) + 4), (0, 0, 0)); d = ImageDraw.Draw(sheet)
        for i, f in enumerate(part):
            k = s + i; x = 4 + (i % COLS) * (W + 4); y = 4 + (i // COLS) * (H + 18)
            sheet.paste(Image.open(f), (x, y + 14)); d.text((x + 2, y + 1), f"{a.start + k / a.fps:.2f}s", fill=(255, 255, 0))
        out = os.path.join(a.out, f"provini_{s // PER:02d}.jpg"); sheet.save(out, quality=85); print(out)
