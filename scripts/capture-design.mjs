import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.env.DESIGN_URL ?? 'http://127.0.0.1:5173';
const outputDir = resolve('design/landing/screenshots');
const views = ['landing', 'today', 'saved', 'draft', 'review'];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

async function capture(name, viewport, fullPage = false) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const viewUrl = name.includes('landing') ? baseUrl : `${baseUrl}/?view=${name.replace(/-(desktop|mobile)$/, '')}`;
  await page.goto(viewUrl, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: resolve(outputDir, `${name}.png`),
    fullPage,
  });
  await page.close();
}

for (const view of views) {
  await capture(`${view}-desktop`, { width: 1440, height: 980 }, view !== 'landing');
  await capture(`${view}-mobile`, { width: 390, height: 844 }, true);
}

await browser.close();
