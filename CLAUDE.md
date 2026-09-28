# Trailer di lancio Matcha: istruzioni per Claude

Leggi questo file per intero prima di toccare qualsiasi cosa. Contiene tutto quello che serve per riprendere il lavoro in una nuova conversazione.

## 1. Stato

- Trailer verticale per Instagram (Reels, Storie, annunci), 1080x1920, 30 fps, 30 s. Consegnato il 27/09/2026.
- Master: `04_render/Matcha_trailer_30s_1080x1920.mp4`. Altri file finali in `04_render` (vedi `04_render/LEGGIMI.md`).
- Script e storyboard definitivi: `01_script/script_storyboard_v2.md`.
- Nel progetto Claude "20260926_matcha_CMO" c'è il riepilogo `claude/trailer_lancio_30s.md` (decisioni e contesto).
- Jacopo (CMO di Matcha) vuole fare modifiche. Standard richiesto: qualità da produzione professionale. Ogni modifica si verifica fotogramma per fotogramma prima di consegnare.

## 2. Regole di sicurezza

- `_keys.env` contiene le chiavi API di Jacopo (OpenAI e Google AI Studio). Non leggerlo, non stamparlo, non copiarlo, non metterlo in git. Lo usa solo il runner sul PC.
- `02_assets/_raw/` contiene dump delle chiamate API: resta fuori da git (audio in base64 che GitHub scambia per chiavi).
- La musica Mixkit non va pubblicata come file a sé (vale anche per `04_render/stems/musica.wav`): repo GitHub solo privata. Dettagli in `02_assets/licenze/LICENZE.md`.

## 3. Dove si lavora

La cartella `trailer` sta sul PC Windows di Jacopo (`C:\Users\JacopoMarcolini\Desktop\workspace\202606_matcha\trailer`) ed è collegata alla sessione Cowork. Due ambienti:

| Ambiente | Cosa c'è | Cosa ci si fa |
|---|---|---|
| Sandbox cloud (Bash) | Chromium headless in `/opt/pw-browsers`, Node, Python, ffmpeg 6, rete verso npm/PyPI/GitHub pubblico | Render video, mix audio, anteprime, controlli |
| PC di Jacopo (device_bash, VM Linux con la cartella in `$HOME/mnt/trailer`) | ffmpeg 4.4, Python 3.10 senza librerie audio, Node, git; niente Chromium; rete quasi nulla | Leggere e modificare file al volo, impacchettare, unire file grandi, ffmpeg semplice |

Le API di AI (Gemini, OpenAI) e Mixkit non sono raggiungibili da nessuno dei due: passano dal runner PowerShell sul PC (sezione 9). La VM Linux del PC raggiunge github.com e api.github.com, ma senza credenziali: i push a GitHub passano anch'essi dal runner, che usa le credenziali Git di Windows.

**Avviare il runner senza disturbare Jacopo**: con il controllo del computer (Esplora file, livello "click", solo clic sinistri): doppio clic sull'icona "workspace" del desktop, poi 202606_matcha, trailer, doppio clic su `AVVIA_RUNNER.bat`. Le finestre di Esplora file possono aprirsi sul secondo monitor (`computer_switch_display`). Verifica con `tools/heartbeat.txt` e `tools/runner.log`, poi rilascia il controllo (`computer_release_lock`).

### Flusso consigliato

1. Sul PC: `bash tools/pack_workset.sh` (con device_bash, dalla cartella trailer) crea `.cache/workset.tgz` (circa 45 MB). Con `--all-music` include tutti i brani candidati.
2. Porta il pacchetto nel cloud con `device_stage_files` (percorso sul PC: `...\trailer\.cache\workset.tgz`), poi `mkdir -p ~/trailer && tar xzf /mnt/user-data/uploads/trailer/.cache/workset.tgz -C ~/trailer` (verifica il percorso di arrivo nel risultato dello staging).
3. `bash ~/trailer/03_animation/pipeline/setup.sh` (1 minuto).
4. Lavora sulla copia cloud: modifiche, stills, bozze, render finale (sezione 4).
5. Riporta sul PC con `device_commit_files` i sorgenti modificati e i file finali. Limiti: 50 file e 100 MB per chiamata, 20 MiB per file (vedi "File oltre 20 MiB").
6. Modifiche piccole ai sorgenti si possono fare direttamente sul PC con device_bash (sed o script Python che legge e riscrive il file), ma il render si fa sempre nel cloud.

### File oltre 20 MiB (i due MP4 finali)

`device_commit_files` rifiuta i file oltre 20 MiB. Procedura usata e verificata:
1. Nel cloud: `split -b 19000000 -d -a 1 trailer.mp4 /mnt/user-data/outputs/_transfer/trailer.part` (i file da trasferire devono stare sotto `/mnt/user-data/outputs`).
2. Commit di `trailer.part0` come `04_render/Matcha_trailer_30s_1080x1920.mp4` e di `trailer.part1` come `04_render/Matcha_trailer_30s_senza_musica.mp4` (nome usato solo come appoggio).
3. Sul PC: `cat Matcha_trailer_30s_senza_musica.mp4 >> Matcha_trailer_30s_1080x1920.mp4`.
4. Sul PC, rigenera la versione senza musica dal master e dal WAV già consegnato (sovrascrive l'appoggio):
   `ffmpeg -y -v error -i Matcha_trailer_30s_1080x1920.mp4 -i audio/Matcha_trailer_mix_senza_musica.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart Matcha_trailer_30s_senza_musica.mp4`
5. Verifica con l'hash dei pacchetti (uguale nel cloud e sul PC): `ffmpeg -v error -i FILE -map 0:v -c copy -f md5 -`. Non usare sha256 sul file intero: durante il trasferimento la piattaforma aggiunge metadati di provenienza C2PA (un box `uuid` negli MP4, un chunk nei PNG e nei WAV), quindi i byte cambiano ma audio e video restano identici.
6. Elimina `/mnt/user-data/outputs/_transfer` nel cloud.

## 4. Avvio rapido (nel cloud, dalla cartella `03_animation/pipeline`)

```bash
bash setup.sh                          # dipendenze Node e Python, controllo Chromium
bash build.sh audio                    # musica montata, mix, versione senza musica, stems, audio anteprima (~30 s)
node shot.mjs ../index.html out/s.png 2.0,19.5   # fotogrammi singoli per controllare una modifica
bash build.sh draft                    # bozza veloce senza motion blur, con audio (~3 min)
node render.mjs --start 18 --end 21 --out out/tratto.mp4   # solo un tratto, qualità finale
bash build.sh video                    # render finale (~15 min con 2 CPU)
bash build.sh cover                    # copertina
bash build.sh qc                       # formato, loudness, fotogrammi neri, fogli provini a 10 fps in out/provini
bash build.sh deliver                  # copia i file finali in ../../04_render
node qc/probe_leaks.mjs                # controllo righe di titolo che sbucano dalle maschere (~3 min)
```

Anteprima interattiva: aprire `03_animation/index.html` in Chrome (barra spaziatrice = play). Con `?render=1` la pagina mostra solo il palco 1080x1920, senza controlli.

## 5. Mappa del progetto

```
trailer/
  CLAUDE.md, README.md, .gitignore, .gitattributes
  AVVIA_RUNNER.bat, _keys.env (segreto), tools/        runner API sul PC + tts_decode.py, pack_workset.sh
  01_script/            storyboard v1 (idea iniziale) e v2 (definitivo)
  02_assets/
    voice/takes/        11 take TTS (usata: vo_Leda.wav); voice/prompt/ i prompt TTS
    music/candidates/   24 brani Mixkit (usato: me_and_you_851.mp3; gli altri solo sul PC, fuori dalla repo); analisi_candidati.json
    sfx/mixkit/         25 effetti Mixkit (mp3 originali, letti direttamente dal mix)
    licenze/            licenze Mixkit salvate + LICENZE.md
    _raw/               dump API (fuori da git)
  03_animation/
    index.html          pagina del trailer; cover.html copertina
    css/trailer.css     token colore, tipografia (.display, .wordmark), maschere delle righe, bolle chat, telefono
    js/core.js          tempi (oggetto T), timeline GSAP in pausa, helper, seek deterministico
    js/flowers.js       fiori del brand (6 forme) e transizioni "iride" a fiore
    js/s1_chat.js       0-5,6 s: chat infinita, "3 settimane di chat / 0 appuntamenti / Romantico, eh?", fantasma
    js/s2_turn.js       5,6-7,5 s: drop, bolle che esplodono in fiori, "Le cose belle non succedono in chat."
    js/s3_live.js       S3 brindisi 7,5 s, S4 risata 9,4 s, S5 sguardo con fumetto 11,25 s
    js/s6_app.js        15-20,6 s: telefono con schermate reali dell'app, "Da un match..." / "Devi solo presentarti."
    js/s7_brand.js      20,6 s wordmark e tagline; 24,4 s CTA con badge App Store e Google Play
    js/main.js          modalità render, scossa di camera sui colpi, player di anteprima
    js/icons.js         icone Ionicons inline; gsap*.js e plugin GSAP 3.15
    assets/img, svg     ritagli halftone, foto, icona, badge store
    assets/audio/trailer_mix.m4a   audio dell'anteprima (lo rigenera build.sh audio)
    fonts/              Bricolage Grotesque, DM Sans, Fraunces (TTF variabili locali)
    pipeline/           render.mjs, shot.mjs, browser.mjs, build.sh, setup.sh, audio/, qc/, images/
  04_render/            file finali consegnati + LEGGIMI.md
```

## 6. Timeline

Griglia musicale: 128 BPM, battuta 1,875 s. Colpi: DROP 5,625 s, JUMP 20,625 s, HIT 28,125 s. Gli stessi valori stanno in `js/core.js` (T) e `pipeline/audio/cues.py`: se li cambi, cambiali in entrambi.

| Tempo (s) | Scena | Voce (inizio) | Titoli e momenti chiave |
|---|---|---|---|
| 0-1,97 | S1 chat | 0,30 "Tre settimane di chat." | "3 settimane / di chat." visibile dal primo fotogramma; chat che scorre |
| 1,97-3,52 | S1 | 1,95 "Zero appuntamenti." | "0 appuntamenti."; "Visualizzato" 3,05; "sta scrivendo" 3,2-4,25 |
| 3,52-5,63 | S1 | 3,50 "Romantico, eh?" | fantasma 3,42; sorriso che diventa smorfia 3,46; tensione e tremolio 4,55-5,63 |
| 5,63-7,5 | S2 svolta | 5,80 "Le cose belle non succedono in chat." | iride a fiore Menta; esplosione di fiori; "chat." barrato in rosa 7,02 |
| 7,38-9,4 | S3 brindisi | 7,80 "Succedono al primo brindisi." | iride rosa; coppia halftone; scintilla del "cin" 8,99 |
| 9,28-11,25 | S4 risata | 9,62 "In una risata che non ti aspettavi." | iride gialla a sole; polaroid "sabato, 19:00 · Milano" |
| 11,15-15,0 | S5 sguardo | 11,50 "In uno sguardo che dice:" / 13,55 "restiamo ancora un po'." | foto a lume di candela; fumetto "Restiamo ancora un po'?" 13,45; spinta verso l'alto 14,98 |
| 15,0-20,6 | S6 app | 15,55 "Da un match a un tavolo vero." / 18,95 "Devi solo presentarti." | "È un match!" 15; "Quando sei libero/a?" 16,85 con tap; "Appuntamento con Giulia" 18,62; zoom finale 19,18; uscita 20,25 |
| 20,6-24,4 | S7 brand | 20,85 "Matcha." / 21,80 "Per te che vuoi uscire davvero." | flash bianco sul colpo; wordmark Fraunces Acqua; tagline 21,78 |
| 24,3-30 | S8 CTA | (musica) | iride a festone Menta; icona, wordmark, tagline, "Scarica Matcha →", badge 26,2; impulso finale 28,13 |

Le posizioni esatte della voce (inizio e fine nella take, inizio nel trailer) sono in `pipeline/audio/cues.py`, gli effetti in `pipeline/audio/sfx_cues.json`.

## 7. Modifiche tipiche

- **Testo a schermo**: nel file della scena, array di righe passato a `textBlock`. Righe entro circa 900 px di larghezza. Spaziatura: `.display` usa -0,035em (per corpi da 110 px in su); sotto i 100 px usare circa -0,02em, sotto i 60 px circa -0,005em (a -0,035em "davvero" si impastava).
- **Tempi di un titolo**: `revealLines(inners, inizio, stagger, durata)` e `hideLines(...)`. Regola: il titolo che esce deve finire prima che entri il successivo (a 2 s, 3,5 s e 19 s c'erano parole sovrapposte). Allinea l'entrata all'inizio della battuta di voce.
- **Colori e font**: token in `css/trailer.css`. Palette: Menta #71F0AB, Acqua #62CFC0, Rosa #FF9DDA, Giallo #FFD36E, Carbone #222222, Bianco caldo #FFFAFA.
- **Schermate dell'app (S6)**: ricostruite a mano in `s6_app.js` dalla codebase (`202606_matcha/matcha-codebase`, file booking/index, slots, venue). Se l'app cambia, aggiornare da lì.
- **Voce**: nuova take con il runner (sezione 9), poi aggiorna `VO_SRC` e la tabella `VO` in `cues.py` (secondi di inizio e fine nella take, inizio nel trailer), poi `bash build.sh audio`. Se cambi i tempi della voce, sposta anche i titoli.
- **Musica**: brano in `cues.py` (`MUSIC_SRC`, `SEG_A_SRC` da cui parte il trailer, `SEG_B_SRC` che cade sul JUMP). `audio/bars.py <nome>` stampa la griglia delle battute; `audio/analyze_music.py` analizza tutti i candidati. `music_edit.py` fa il montaggio (taglio a tempo, dissolvenza di 12 ms, filtro passa basso "ovattato" nell'atto 1 che si apre sul drop).
- **Effetti**: `sfx_cues.json`, una riga per suono. Campi: `s` (`file:<nome mp3 in sfx/mixkit>` oppure un generatore di `sfx.py`: ping, bubble, pop, thwip, whoosh, riser, impact, clink, sparkle, tap, lock, soft_swell), `t` (inizio) oppure `peak_at` (istante del picco) oppure `end_at`, `db` o `lufs`, e opzionali `src` [inizio, fine] nel file, `fade_in`, `fade_out`, `hp`, `lp`, `kw` (parametri del generatore).
- **Immagini**: in `assets/img`. I ritagli halftone si rifanno con `pipeline/images/keyer.py` dalle sorgenti in `202606_matcha/materials` (sezione 10).
- **Durata o struttura**: `T` in `core.js` e costanti in `cues.py`; aggiorna le finestre di motion blur `HI` in `render.mjs`; controlla tutte le scene coinvolte.
- **Copertina**: `cover.html`, poi `bash build.sh cover`.

## 8. Regole tecniche e insidie note

1. **Determinismo**: ogni fotogramma dipende solo dal tempo. Niente `Math.random`, `Date.now`, animazioni CSS o transizioni CSS. Casualità solo con `M.rng(seed)`. Gli aggiornamenti per fotogramma sono funzioni pure di t registrate in `M.procs`.
2. **Mai posizioni negative nella timeline GSAP**: una posizione negativa sposta tutti i figli precedenti (è successo: la smorfia arrivava 0,34 s in ritardo). `core.js` lancia un errore se succede.
3. **Maschere delle righe**: ogni riga è `.line` (overflow nascosto) con dentro `.inner` che si muove. Non scalare `.inner` (viene tagliata a destra): scala il contenitore `box`. `revealLines`/`hideLines` registrano la finestra in cui la riga è visibile; fuori da quella la riga è nascosta, altrimenti le righe ruotate sbucano dalla maschera (la "0" verde nei primi 2 s). Per disattivare la protezione in un controllo: `window.__lineGuard = false`.
4. **Transizioni a fiore (`iris` in flowers.js)**: quando il fiore supera i bordi, gli spazi tra i petali si riempiono (niente spicchi della scena precedente). Parametro `fill: false` per disattivare.
5. **Motion blur**: 6 campioni per fotogramma, 16 nelle finestre `HI` di `render.mjs` (movimenti veloci). Se sposti una transizione, aggiorna `HI`, altrimenti il movimento si vede a scatti.
6. **Flash del brand**: `tl.set` a opacità 1 e poi dissolvenza; la scena S7 compare solo sul colpo, così prima c'è il telefono e subito dopo il bianco.
7. **Safe zone Reels**: niente di essenziale nella fascia bassa (circa 320 px) e nella colonna destra delle icone (circa 150 px).
8. **Font**: solo TTF locali in `fonts/` (mai font di sistema o Google Fonts remoti), altrimenti il render cambia.
9. **Cuciture delle tile**: Chromium a volte rasterizza gli strati scalati con cuciture di 1 px diverse tra un render e l'altro (differenze sotto i 74 livelli su pochi pixel). Sono invisibili dopo la media del motion blur: non inseguirle.
10. **Audio**: voce normalizzata a -17 LUFS (mono, quindi circa -14 in stereo), de-esser a banda divisa (`deess.py`: sibilanti da +2 a -3 dB rispetto alle vocali), musica a -19,5 LUFS con ducking di 6,5 dB sotto la voce, master a -14 LUFS con limiter true peak a -1,3 dBTP. Versione senza musica a -16 LUFS. Stems scritti con 4,5 dB di margine.
11. **Riproducibilità**: con le versioni in `requirements.txt` il mix esce identico bit per bit; il render cambia di poco (PSNR circa 48 dB) solo per la codifica.

## 9. Runner API sul PC (voce, musica, download)

- Serve perché la sandbox non raggiunge le API di AI. Avvio: doppio clic su `AVVIA_RUNNER.bat` (chiedilo a Jacopo). Stop: crea il file `tools/STOP` (il runner si ferma e lo cancella). Stato: `tools/heartbeat.txt` si aggiorna ogni 1,5 s.
- Job ammessi: `ping`, `git_clone` (solo la repo matcha-codebase), `http` (solo host api.openai.com, generativelanguage.googleapis.com, cdn.pixabay.com, pixabay.com, assets.mixkit.co, mixkit.co, raw.githubusercontent.com). Output solo dentro `trailer/`. Le chiavi si inseriscono negli header con i segnaposto `{{GEMINI_API_KEY}}` e `{{OPENAI_API_KEY}}`: il runner li sostituisce, tu non vedi mai le chiavi.
- Invio e attesa (con device_bash, dalla cartella trailer):
  ```bash
  echo '[{"_name":"tts_Leda_v4","type":"http","method":"POST",
    "url":"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent",
    "headers":{"x-goog-api-key":"{{GEMINI_API_KEY}}"},
    "body_file":"02_assets/_raw/req/tts_Leda_v4.json","out":"02_assets/_raw/tts_Leda_v4.json","timeout":300}]' | python3 tools/q.py submit
  python3 tools/q.py wait <id restituito>
  python3 tools/tts_decode.py 02_assets/_raw/tts_Leda_v4.json 02_assets/voice/takes/vo_Leda_v4.wav
  ```
- Prompt TTS: parti da `02_assets/voice/prompt/tts_Leda_v3_con_cta.json` (profilo voce, note di regia, pronuncia). "Matcha" nel testo va scritto "Màccia" perché il modello lo pronunci come il tè. La take finale è `vo_Leda.wav` (prompt `tts_Leda_take_finale.json`), pronuncia verificata.
- Limiti del piano gratuito Google: TTS 3 richieste al minuto e 10 al giorno; Lyria non disponibile (limite 0). L'account OpenAI è senza credito.
- Musica ed effetti Mixkit si scaricano con job `http` da assets.mixkit.co (URL nelle pagine salvate in `02_assets/_raw/web`).
- Pubblicazione su GitHub (job `git_publish`): esegue sul PC `git init` (solo la prima volta), `git add -A`, `git commit`, imposta il remote e fa `git push -u origin main`, con le credenziali già salvate in Git per Windows. Il remote deve essere `https://github.com/Jimbo4/<repo>.git`.
  ```bash
  echo '[{"_name":"publish","type":"git_publish","remote":"https://github.com/Jimbo4/matcha-trailer.git",
    "message":"Descrizione della modifica"}]' | python3 tools/q.py submit
  python3 tools/q.py wait <id>       # il push di file grandi può richiedere qualche minuto: ripeti wait
  ```
  Prima di pubblicare controlla cosa entrerebbe nella repo (sezione 11).

## 10. Immagini e ritagli

- I ritagli halftone (sfondo giallo uniforme, contorno bianco) vengono dalle immagini del brand in `202606_matcha/materials`. `python3 pipeline/images/keyer.py --all` li rigenera in `pipeline/images/out/` (la cartella materials deve stare accanto a `trailer`).
- Interventi manuali fatti una volta sola: rimozione della filigrana Gemini da `1a.png` e `1b.png` (clonazione di una zona pulita, proteggendo il contorno bianco); allineamento della versione "smorfia" su quella "sorriso" con OpenCV (ORB + similarità) per lo scambio a 3,46 s (`woman_phone_cringe_aligned.png`).
- Foto: `toast_photo.jpg` (mission del sito), `bar_table.jpg` (hero), versioni sfocate `_blur`, `piazza.jpg`, profili `p_*.jpg`, `splash2.png` e `icon.png` dall'app.

## 11. Licenze e backup

- Licenze e limiti d'uso: `02_assets/licenze/LICENZE.md`.
- Backup su GitHub: repo privata https://github.com/Jimbo4/matcha-trailer (branch `main`), creata il 28/09/2026. Per salvare le modifiche usa il job `git_publish` (sezione 9) o GitHub Desktop. La repo deve restare privata.
- Controllo prima del push (dalla VM del PC, senza toccare la repo): `git --git-dir=/tmp/gc init -q && git --git-dir=/tmp/gc --work-tree=. add -n -A .` elenca i file che entrerebbero; verifica che non compaiano `_keys.env` né `02_assets/_raw`.

## 12. Idee già proposte a Jacopo

Taglio da 15 s, versione 4:5 per il feed, sottotitoli impressi, varianti per annunci.
