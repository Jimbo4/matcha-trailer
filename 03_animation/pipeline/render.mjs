// Render deterministico del trailer con motion blur a sotto-fotogrammi (adattivo).
// Ogni fotogramma è la media di N campioni temporali entro l'otturatore (180°): 6 di norma, 16 nelle finestre veloci (HI).
// I pixel vengono accumulati in float e passati a ffmpeg in RGB grezzo (x264, BT.709).
//
// Uso (dalla cartella pipeline):
//   node render.mjs                                   -> out/trailer.mp4 (30 s, qualità finale, ~15 min con 2 CPU)
//   node render.mjs --audio audio/out/mix.wav         -> con audio (AAC 320k)
//   node render.mjs --draft 1                         -> bozza veloce (1 campione, crf 20)
//   node render.mjs --start 18 --end 21 --out out/tratto.mp4   -> solo un tratto
// Opzioni: --html --out --fps 30 --spp 6 --spphi 16 --shutter 0.5 --workers N --crf 15 --hi "5.55-6.35,7.3-7.95"
import { spawn } from 'child_process';
import { PNG } from 'pngjs';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { openPage, W, H } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => { if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1]]); return a; }, []));
const DRAFT = !!args.draft;
const HTML = args.html ? path.resolve(args.html) : path.join(HERE, '..', 'index.html');
const OUT = args.out ? path.resolve(args.out) : path.join(HERE, 'out', DRAFT ? 'trailer_bozza.mp4' : 'trailer.mp4');
const FPS = +(args.fps || 30);
const SPP = +(args.spp || (DRAFT ? 1 : 6)), SPPHI = +(args.spphi || (DRAFT ? 1 : 16)), SHUTTER = +(args.shutter || 0.5);
const START = +(args.start || 0), END = +(args.end || 30);
const WORKERS = +(args.workers || Math.max(1, Math.min(4, os.cpus().length)));
const CRF = +(args.crf || (DRAFT ? 20 : 15)), PRESET = DRAFT ? 'veryfast' : 'slow';
const AUDIO = args.audio ? path.resolve(args.audio) : null;
// Finestre di movimento veloce (secondi): transizioni a fiore, esplosione al drop, push, uscita del telefono, flash.
// Se cambi i tempi delle transizioni, aggiorna questa lista (o passala con --hi).
const HI = (args.hi || '5.55-6.35,7.30-7.95,9.20-9.80,11.08-11.75,14.95-15.75,16.80-17.35,18.58-19.10,20.20-21.05,24.25-24.95')
  .split(',').map((s) => s.split('-').map(Number));
const sppAt = (t) => (HI.some(([a, b]) => t >= a && t < b) ? SPPHI : SPP);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const tmpDir = path.join(path.dirname(OUT), '_chunks_' + path.basename(OUT, '.mp4'));
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
const f0 = Math.round(START * FPS), f1 = Math.round(END * FPS), total = f1 - f0;
const per = Math.ceil(total / WORKERS);
const t0 = Date.now();
console.log(`render ${path.relative(process.cwd(), HTML)} -> ${path.relative(process.cwd(), OUT)} | ${START}-${END}s, ${total} fotogrammi, ${WORKERS} worker, spp ${SPP}/${SPPHI}, crf ${CRF}`);

function encoder(chunkPath) {
  const a = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(FPS), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v', 'libx264', '-preset', PRESET, '-crf', String(CRF), '-tune', 'animation', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-g', String(FPS), '-bf', '2', chunkPath];
  return spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
}

async function worker(w, a, b) {
  const { browser, page } = await openPage(HTML);
  const cdp = await page.context().newCDPSession(page);
  const chunk = path.join(tmpDir, `chunk_${String(w).padStart(2, '0')}.mp4`);
  const enc = encoder(chunk);
  const done = new Promise((res) => enc.on('close', res));
  // riscaldamento: scorre la timeline fino al primo fotogramma, così i valori iniziali "lazy" di GSAP sono come in un render lineare
  for (let t = 0; t < a / FPS; t += 0.5) await page.evaluate((t) => window.__seek(t), t);
  const acc = new Float32Array(W * H * 3);
  const out = Buffer.alloc(W * H * 3);
  for (let f = a; f < b; f++) {
    const tc = f / FPS;
    const n = sppAt(tc);
    acc.fill(0);
    for (let j = 0; j < n; j++) {
      let t = tc + (n > 1 ? ((j + 0.5) / n - 0.5) * SHUTTER / FPS : 0);
      t = Math.max(0, Math.min(30 - 1e-4, t));
      await page.evaluate((t) => window.__seek(t), t);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
      const px = PNG.sync.read(Buffer.from(data, 'base64')).data; // RGBA
      for (let i = 0, k = 0; i < px.length; i += 4, k += 3) { acc[k] += px[i]; acc[k + 1] += px[i + 1]; acc[k + 2] += px[i + 2]; }
    }
    const inv = 1 / n;
    for (let k = 0; k < acc.length; k++) { const v = acc[k] * inv + 0.5; out[k] = v > 255 ? 255 : v; }
    if (!enc.stdin.write(out)) await new Promise((r) => enc.stdin.once('drain', r));
    if ((f - a) % 30 === 0) console.log(`[w${w}] fotogramma ${f}/${b} spp=${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  enc.stdin.end();
  await done;
  await browser.close();
  return chunk;
}

const jobs = [];
for (let w = 0; w < WORKERS; w++) { const a = f0 + w * per, b = Math.min(f1, a + per); if (a < b) jobs.push(worker(w, a, b)); }
const chunks = await Promise.all(jobs);
const list = path.join(tmpDir, 'list.txt');
fs.writeFileSync(list, chunks.map((c) => `file '${c}'`).join('\n'));
const muxArgs = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
if (AUDIO) muxArgs.push('-ss', String(START), '-t', String(END - START), '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000');
muxArgs.push('-c:v', 'copy', '-movflags', '+faststart', OUT);
await new Promise((res, rej) => { const p = spawn('ffmpeg', muxArgs, { stdio: 'inherit' }); p.on('close', (c) => (c === 0 ? res() : rej(new Error('mux fallito ' + c)))); });
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`fatto: ${OUT} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
