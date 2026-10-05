# Matcha, trailer di lancio (30 s, verticale)

Trailer animato per il lancio dell'app Matcha su Instagram: 1080x1920, 30 fps, 30 secondi. Animazione in HTML/CSS/JavaScript (GSAP), render video deterministico con motion blur, voce generata con Gemini TTS, musica ed effetti Mixkit.

- File finali: `04_render/` (istruzioni d'uso in `04_render/LEGGIMI.md`).
- Script e storyboard: `01_script/script_storyboard_v2.md`.
- Istruzioni complete per riprendere il lavoro con Claude: `CLAUDE.md`.

## Struttura

| Cartella | Contenuto |
|---|---|
| `01_script` | Script della voce e storyboard |
| `02_assets` | Voce (take e prompt), musica candidata, effetti, licenze |
| `03_animation` | Animazione (`index.html`), copertina, pipeline di render e mix audio |
| `04_render` | Video finali, copertina, mix e tracce separate |
| `tools` | Runner che esegue sul PC le chiamate alle API di AI (voce, musica) |

## Vedere l'animazione

Aprire `03_animation/index.html` in Chrome. Barra in basso: Play/Pausa (anche con la barra spaziatrice) e cursore per scorrere. Se l'audio non parte, aprire la cartella con un piccolo server locale (`npx serve 03_animation`).

## Rigenerare i file

Serve un ambiente con Node 18+, Python 3.10+, ffmpeg e Chromium (la sandbox cloud di Claude li ha già):

```bash
cd 03_animation/pipeline
bash setup.sh
bash build.sh all      # audio, video (~15 min), copertina, controlli, copia in 04_render
```

## Backup su GitHub

Repo: https://github.com/Jimbo4/matcha-trailer (branch `main`).

Il file `.gitignore` esclude già le chiavi (`_keys.env`), i dump delle chiamate API (`02_assets/_raw`), lo stato del runner, i file generati e la bozza superata. Restano fuori anche i brani candidati non usati (per includerli, vedi il commento nel `.gitignore`). Peso della repo: circa 145 MB in 139 file, nessuno sopra i 25 MB (sotto i limiti di GitHub, Git LFS non serve).
