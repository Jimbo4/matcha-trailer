// Apertura deterministica della pagina del trailer in Chromium headless (condivisa da render, stills e controlli).
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

export const W = 1080, H = 1920;
export const ARGS = ['--force-color-profile=srgb', '--hide-scrollbars', '--disable-gpu', '--font-render-hinting=none', '--allow-file-access-from-files', '--disable-lcd-text'];

// Ordine di ricerca: $CHROMIUM_PATH, browser preinstallati in $PLAYWRIGHT_BROWSERS_PATH o /opt/pw-browsers
// (sandbox Cowork: preferisce chromium_headless_shell, quello usato per il master), altrimenti il default di Playwright.
export function findChromium() {
  const env = process.env.CHROMIUM_PATH;
  if (env && fs.existsSync(env)) return env;
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter((r) => r && fs.existsSync(r));
  const rels = ['chrome-linux/headless_shell', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/chrome', 'chrome-linux64/chrome'];
  for (const r of roots) {
    const dirs = fs.readdirSync(r).filter((d) => d.startsWith('chromium')).sort().reverse();
    for (const d of dirs) for (const rel of rels) {
      const p = path.join(r, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

export async function openPage(htmlPath) {
  const browser = await chromium.launch({ executablePath: findChromium(), args: ARGS });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });
  const url = 'file://' + path.resolve(htmlPath) + (htmlPath.includes('?') ? '' : '?render=1');
  await page.goto(url);
  await page.evaluate(() => window.__readyPromise);
  await page.waitForTimeout(200);
  return { browser, page };
}
