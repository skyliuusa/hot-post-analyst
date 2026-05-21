import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.env.DESIGN_URL ?? 'http://127.0.0.1:5173';
const outputDir = resolve('design/landing/screenshots');

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

async function capture(name, viewport, fullPage = false) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: resolve(outputDir, `${name}.png`),
    fullPage,
  });
  await page.close();
}

await capture('desktop', { width: 1440, height: 980 });
await capture('mobile', { width: 390, height: 844 }, true);

await browser.close();
