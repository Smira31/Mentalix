import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const shots = '/tmp/mentalix-library-screens';
await mkdir(shots, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
page.on('pageerror', e => console.error('PAGE ERROR:', e.message));

// Library home with demo header
await page.goto('http://127.0.0.1:5173/?demo=1&tab=library&device=max');
await page.waitForSelector('[data-testid="library-home"]');
await page.evaluate(() => {
  const els = document.getAnimations?.() ?? [];
  return Promise.all(els.map(a => a.finished.catch(() => {})));
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/430-home.png` });

// Open sheet
await page.click('[data-testid="library-article-tile"]');
await page.waitForSelector('[data-testid="article-sheet"]');
await page.evaluate(() => {
  const els = document.getAnimations?.() ?? [];
  return Promise.all(els.map(a => a.finished.catch(() => {})));
});
await page.waitForTimeout(500);

// Verify sheet bottom
const sheetInfo = await page.evaluate(() => {
  const sheet = document.querySelector('[data-testid="article-sheet"]');
  const frame = document.querySelector('[data-mentalix-demo-frame="true"]');
  const rect = sheet.getBoundingClientRect();
  const box = frame.getBoundingClientRect();
  return {
    sheetBottomInFrame: Math.round(rect.bottom - box.y - frame.clientTop),
    frameClientHeight: frame.clientHeight,
    topicText: sheet.querySelector('.mx-library-caps')?.textContent?.trim()
  };
});
console.log('Sheet bottom check:', JSON.stringify(sheetInfo));
await page.screenshot({ path: `${shots}/430-sheet-open.png` });

// Close sheet, scroll to show КРИЗИС И РОСТ section
await page.click('[data-testid="article-sheet-backdrop"]');
await page.waitForSelector('[data-testid="library-home"]');
await page.evaluate(() => {
  const topics = document.querySelectorAll('[data-testid="library-topic"]');
  topics[0]?.scrollIntoView({ block: 'start' });
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${shots}/430-crisis-section.png` });

// Check focus outline
await page.click('[data-testid="library-article-tile"]');
await page.waitForSelector('[data-testid="article-sheet"]');
await page.waitForTimeout(300);
const focusStyle = await page.evaluate(() => {
  const btn = document.querySelector('[data-testid="article-sheet-read"]');
  const style = getComputedStyle(btn);
  return { outline: style.outline, outlineWidth: style.outlineWidth };
});
console.log('Focus outline:', JSON.stringify(focusStyle));
await page.screenshot({ path: `${shots}/430-sheet-focus.png` });

await browser.close();
console.log('Screens saved to', shots);
