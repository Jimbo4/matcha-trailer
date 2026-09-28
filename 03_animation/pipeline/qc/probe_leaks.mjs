// Controllo delle maschere dei titoli.
// Ogni riga di titolo è visibile solo nella sua finestra (da revealLines a hideLines, vedi js/core.js).
// Lo script confronta ogni campione con la protezione spenta e accesa e riporta gli intervalli in cui la protezione
// sta nascondendo righe "parcheggiate" che altrimenti sbucherebbero dalla maschera. È normale che ce ne siano:
// serve a capire dove la protezione lavora dopo una modifica (per esempio un titolo nuovo o un tempo spostato).
// Le differenze dovute al rumore di rasterizzazione di Chromium vengono scartate con una seconda cattura.
// Uso: node qc/probe_leaks.mjs [pagina.html]     (circa 4 minuti)
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import { openPage } from '../browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const html = process.argv[2] || path.join(HERE, '..', '..', 'index.html');
const STEP = 1 / 15;
const { browser, page } = await openPage(html);
const cdp = await page.context().newCDPSession(page);
const grab = async (guard, t) => {
  await page.evaluate(([g, t]) => { window.__lineGuard = g; window.__seek(t); }, [guard, t]);
  return PNG.sync.read(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64')).data;
};
const diff = (a, b, i) => Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
const hits = [];
for (let t = 0; t < 30; t += STEP) {
  const off1 = await grab(false, t), on = await grab(true, t), off2 = await grab(false, t);
  let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0; i < off1.length; i += 4) {
    if (diff(off1, off2, i) > 24) continue;            // rumore di rasterizzazione
    if (diff(off1, on, i) > 24 && diff(off2, on, i) > 24) {
      n++; const p = i / 4, x = p % 1080, y = (p / 1080) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (n > 3) hits.push({ t, n, box: [x0, y0, x1, y1] });
}
await page.evaluate(() => { window.__lineGuard = true; });
await browser.close();
const ranges = [];
for (const h of hits) {
  const r = ranges[ranges.length - 1];
  if (r && h.t - r.b < STEP * 1.5) { r.b = h.t; r.n = Math.max(r.n, h.n); r.box = [Math.min(r.box[0], h.box[0]), Math.min(r.box[1], h.box[1]), Math.max(r.box[2], h.box[2]), Math.max(r.box[3], h.box[3])]; }
  else ranges.push({ a: h.t, b: h.t, n: h.n, box: h.box });
}
if (!ranges.length) console.log('Nessuna riga parcheggiata sbuca dalle maschere.');
else {
  console.log('Intervalli in cui la protezione nasconde righe parcheggiate (normale; controlla solo quelli nuovi o lunghi):');
  for (const r of ranges) console.log(`  ${r.a.toFixed(2)}-${r.b.toFixed(2)} s  max ${r.n} px  riquadro x ${r.box[0]}-${r.box[2]}, y ${r.box[1]}-${r.box[3]}`);
}
