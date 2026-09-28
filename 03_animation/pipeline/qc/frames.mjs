// Fotogrammi consecutivi (senza motion blur) per cercare sfarfallii tra un fotogramma e l'altro.
// Uso (da 03_animation/pipeline): node qc/frames.mjs ../index.html out/frames 15.8 17.8   -> out/frames/f0474.png ...
import fs from 'fs';
import { openPage } from '../browser.mjs';
const [, , html, outdir, a, b] = process.argv;
if (!html || !outdir || a === undefined || b === undefined) { console.log('uso: node qc/frames.mjs <pagina.html> <cartella> <inizio_s> <fine_s>'); process.exit(1); }
fs.mkdirSync(outdir, { recursive: true });
const { browser, page } = await openPage(html);
for (let i = Math.round(a * 30); i <= Math.round(b * 30); i++) {
  await page.evaluate((t) => window.__seek(t), i / 30);
  await page.screenshot({ path: `${outdir}/f${String(i).padStart(4, '0')}.png` });
}
await browser.close();
