const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ordo-ai-decision-os-jihyu.jihyunkims495.chatgpt.site/';
const OUTPUT_DIR = __dirname;
const FRAME = { width: 3840, height: 2160 };
const routes = [
  ['entry', '01-main-entry.jpg'],
  ['today', '02-today.jpg'],
  ['overview', '03-overview.jpg'],
  ['decisions', '04-decisions.jpg'],
  ['simulator', '05-simulator.jpg'],
  ['reports', '06-reports.jpg'],
];

async function settle(page, route) {
  await page.evaluate((nextRoute) => {
    location.hash = `#${nextRoute}`;
  }, route);
  await page.waitForFunction((expected) => document.body.dataset.view === expected, route);
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.documentElement.scrollTop = 0;
    const existing = document.querySelector('#snapshot-style');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = 'snapshot-style';
    style.textContent = `
      *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
      html { scroll-behavior: auto !important; }
      .drawer, .panel-backdrop, .toast { display: none !important; }
      .or-chart-line { stroke-dashoffset: 0 !important; }
    `;
    document.head.appendChild(style);
  });
  await page.waitForTimeout(700);
}

async function composeFrame(page, route, filename) {
  await settle(page, route);
  const raw = await page.screenshot({ fullPage: true, type: 'png' });
  const meta = await sharp(raw).metadata();
  const edge = 56;
  const available = { width: FRAME.width - edge * 2, height: FRAME.height - edge * 2 };
  const scale = Math.min(available.width / meta.width, available.height / meta.height, 1);
  const width = Math.max(1, Math.round(meta.width * scale));
  const height = Math.max(1, Math.round(meta.height * scale));
  const left = Math.round((FRAME.width - width) / 2);
  const top = Math.round((FRAME.height - height) / 2);
  const resized = await sharp(raw).resize(width, height, { fit: 'fill' }).png().toBuffer();
  const output = path.join(OUTPUT_DIR, filename);
  await sharp({
    create: { width: FRAME.width, height: FRAME.height, channels: 3, background: '#d4d5c4' },
  })
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(output);
  return { route, filename, source: `${meta.width}x${meta.height}`, output: `${FRAME.width}x${FRAME.height}`, scale: Number(scale.toFixed(4)) };
}

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const context = await browser.newContext({ viewport: FRAME, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const results = [];
  for (const [route, filename] of routes) results.push(await composeFrame(page, route, filename));
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
