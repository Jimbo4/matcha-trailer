// Fotogrammi singoli (senza motion blur) per controlli veloci, e copertina.
// Uso: node shot.mjs <pagina.html> <uscita.png> [t1,t2,...]
//   node shot.mjs ../index.html out/prova.png 2.0,19.0     -> out/prova_2.00.png, out/prova_19.00.png
//   node shot.mjs ../cover.html out/cover.png               -> copertina (pagina statica)
import fs from 'fs';
import path from 'path';
import { openPage } from './browser.mjs';

const [, , html, out, times] = process.argv;
if (!html || !out) { console.log('uso: node shot.mjs <pagina.html> <uscita.png> [t1,t2,...]'); process.exit(1); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const { browser, page } = await openPage(html);
if (times) {
  for (const t of times.split(',').map(Number)) {
    await page.evaluate((t) => window.__seek(t), t);
    await page.screenshot({ path: out.replace(/\.png$/, `_${t.toFixed(2)}.png`) });
  }
} else {
  await page.screenshot({ path: out });
}
await browser.close();
