import { chromium } from '@playwright/test';

const baseURL = process.env.VIBE_URL || 'https://vibe-connect-tau.vercel.app';
const outputDir = 'docs/screenshots';

const pages = [
  { name: 'home', path: '/', fullPage: false },
  { name: 'workshops', path: '/workshops', fullPage: false },
  { name: 'login', path: '/login', fullPage: false },
  { name: 'register', path: '/register', fullPage: false },
];

const fs = await import('node:fs/promises');
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

for (const item of pages) {
  const url = new URL(item.path, baseURL).toString();
  console.log(`Capturing ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: `${outputDir}/${item.name}.png`,
    fullPage: item.fullPage,
  });
}

await browser.close();
console.log(`Screenshots saved to ${outputDir}`);