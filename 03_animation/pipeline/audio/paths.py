"""Percorsi del progetto calcolati da questo file: la pipeline funziona ovunque venga copiata la cartella trailer."""
from pathlib import Path

AUDIO_DIR = Path(__file__).resolve().parent   # trailer/03_animation/pipeline/audio
ROOT = AUDIO_DIR.parents[2]                    # trailer/
ASSETS = ROOT / "02_assets"
SFX_DIR = ASSETS / "sfx" / "mixkit"            # effetti Mixkit (mp3 originali)
OUT = AUDIO_DIR / "out"                        # file generati (fuori da git)
OUT.mkdir(exist_ok=True)


def out_path(p, default):
    """Percorso di output: assoluto com'è, relativo rispetto alla cartella audio."""
    if not p:
        return OUT / default
    p = Path(p)
    return p if p.is_absolute() else AUDIO_DIR / p
