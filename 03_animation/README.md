# Matcha, trailer di lancio: animazione e pipeline

Animazione verticale 1080x1920, 30 s, in HTML/CSS/JS con GSAP 3.15. Ogni fotogramma è deterministico: la timeline si posiziona su un tempo esatto, quindi la stessa pagina serve per l'anteprima nel browser e per il render video.

## Anteprima
Aprire `index.html` in Chrome. Barra in basso: Play/Pausa (anche barra spaziatrice) e cursore. Se l'audio non parte per le restrizioni sui file locali: `npx serve .` in questa cartella.

## Struttura
- `js/core.js` tempi (BPM 128, drop 5,625 s, stacco 20,625 s, colpo finale 28,125 s), timeline, helper per i titoli, seek deterministico
- `js/flowers.js` fiori del brand generati in codice e transizioni a fiore
- `js/s1_chat.js` chat infinita, fantasma, reazione
- `js/s2_turn.js` la svolta: le bolle esplodono in fiori
- `js/s3_live.js` brindisi, risata, sguardo
- `js/s6_app.js` schermate reali dell'app ricostruite dalla codebase
- `js/s7_brand.js` wordmark, tagline e CTA con badge store
- `js/main.js` modalità render, scossa sui colpi, player di anteprima
- `cover.html` copertina
- `pipeline/` render video, stills, mix audio, controlli qualità, scontorno immagini

## Pipeline (dalla cartella pipeline)
```bash
bash setup.sh          # dipendenze
bash build.sh audio    # mix audio e audio dell'anteprima
bash build.sh draft    # bozza veloce
bash build.sh video    # render finale con motion blur (~15 min)
bash build.sh cover    # copertina
bash build.sh qc       # controlli e fogli provini
bash build.sh deliver  # copia in ../../04_render
```
Dettagli, regole e insidie: `../CLAUDE.md`.
