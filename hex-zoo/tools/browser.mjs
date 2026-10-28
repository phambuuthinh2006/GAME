import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
export const DEV_URL = process.env.HEX_ZOO_URL || 'http://127.0.0.1:5173/';
export const ARTIFACTS = new URL('../artifacts/', import.meta.url);
export async function launch() {
  return chromium.launch({ headless: true, args: ['--no-sandbox'] });
}
export async function preparePage(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ...options });
  const page = await context.newPage();
  // Freeze this page's loaded code during QA; concurrent edits must not trigger Vite reloads.
  await page.routeWebSocket('**', () => {});
  const errors = [];
  page.on('pageerror', error => errors.push('page: ' + error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push('HTTP ' + response.status() + ' ' + response.url()); });
  return { page, context, errors };
}
export async function qaReady(page) {
  const url = new URL(DEV_URL);
  url.searchParams.set('qa', '1');
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-action="play"], [data-action="resume"]');
  await page.waitForFunction(() => !!window.hexZooQA);
  await page.evaluate(() => document.fonts.ready);
}
export async function show(page, view) {
  await page.waitForFunction(() => !!window.hexZooQA);
  await page.evaluate(view => {
    window.hexZooQA.show(view==='end-win'?'end':view==='menu-active'?'menu':view);
    if(view==='menu-active'){
      document.querySelector('[data-action="play"]').click();
      document.querySelector('[data-action="pause"]').click();
      document.querySelector('[data-action="menu"]').click();
    }
    if(view==='end-win'){
      window.hexZooQA.state().phase='won';
      document.querySelector('[data-action="pause"]').click();
      document.querySelector('[data-action="close"]').click();
    }
  }, view);
  await page.waitForTimeout(80);
}
export function assertClean(errors, label) {
  if (errors.length) throw new Error(label + '\n' + errors.join('\n'));
}
export async function report(name, data) {
  await mkdir(ARTIFACTS, { recursive: true });
  await writeFile(new URL(name, ARTIFACTS), JSON.stringify(data, null, 2) + '\n');
}
