import { mkdir } from 'node:fs/promises';
import { launch, preparePage, qaReady, show, assertClean, report, ARTIFACTS } from './browser.mjs';
const sizes = [[1280,720],[907,510],[800,450],[390,844],[311,530]];
const views = ['menu','midrun','reward','shop','end','collection'];
const browser = await launch();
const results = [];
try {
  await mkdir(new URL('screenshots/', ARTIFACTS), { recursive: true });
  for (const [width,height] of sizes) {
    const {page,context,errors} = await preparePage(browser,{width,height});
    await qaReady(page);
    for (const view of views) {
      await show(page, view);
      const filename = `${view}-${width}x${height}.png`;
      await page.screenshot({path:new URL('screenshots/'+filename,ARTIFACTS).pathname, fullPage:true, animations:'disabled'});
      const metrics = await page.evaluate(() => ({ scrollWidth:document.documentElement.scrollWidth, viewport:innerWidth }));
      if (metrics.scrollWidth > width + 1) throw new Error(`Page overflows horizontally: ${filename}`);
      results.push({view,width,height,file:'artifacts/screenshots/'+filename});
    }
    assertClean(errors,`${width}x${height}`);
    await context.close();
  }
  await report('shots.json',{status:'PASS',screenshots:results,errors:[]});
  console.log(`PASS: ${results.length} screenshots; no page, console, HTTP, or horizontal-page errors.`);
} finally { await browser.close(); }
