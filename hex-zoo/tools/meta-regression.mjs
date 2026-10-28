import {launch,preparePage,qaReady,assertClean,report} from './browser.mjs';
const browser=await launch();
try{
 const {page,context,errors}=await preparePage(browser,{width:390,height:844});
 await qaReady(page);
 const seedSave=async fixture=>{
  await page.evaluate(async fixture=>{
   const C=await import('/src/core/index.ts');
   const today=new Date().toISOString().slice(0,10), yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
   const day=fixture==='yesterday'?yesterday:today;
   const run=C.createRun('daily-'+day,'mira',true);
   if(fixture==='finished')run.phase='lost';
   localStorage.setItem('hex-zoo-save',JSON.stringify({version:2,wins:0,best:0,seen:[],daily:fixture==='active'?{[today]:'started'}:{[today]:'finished'},settings:{music:true,sound:true},keeper:'mira',resultSeeds:[],run}));
  },fixture);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('.menu').waitFor();
 };
 await seedSave('finished');
 if(!await page.locator('[data-action="daily"]').isDisabled())throw new Error('Finished daily can be restarted');
 await seedSave('yesterday');
 if(!await page.locator('[data-action="daily"]').isDisabled())throw new Error('Yesterday daily can bypass today completion');
 await seedSave('active');
 if(await page.locator('[data-action="daily"]').isDisabled())throw new Error('Active daily cannot resume');
 await page.locator('[data-action="daily"]').click();
 const active=await page.evaluate(()=>window.hexZooQA.state());
 if(!active.daily||active.seed!=='daily-'+new Date().toISOString().slice(0,10))throw new Error('Wrong daily resumed');
 // Use the fixture hook to isolate result-recording behavior from balance.
 await page.evaluate(()=>{window.hexZooQA.show('run');const run=window.hexZooQA.state();run.phase='won';run.won=true;document.querySelector('[data-action="pause"]').click();document.querySelector('[data-action="close"]').click();});
 await page.waitForTimeout(100);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('hex-zoo-save')));
 if(before.wins!==1)throw new Error('First victory not recorded');
 await page.reload({waitUntil:'networkidle'});
 await page.locator('[data-action="resume"]').click();
 await page.locator('.dialog.won').waitFor();
 const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('hex-zoo-save')));
 if(reloaded.wins!==1)throw new Error('Reload counted victory again');
 await page.locator('[data-action="continue"]').click();
 await page.locator('[data-action="choose"]').first().click();
 await page.locator('[data-action="continue"]').click();
 await page.evaluate(()=>{window.hexZooQA.state().phase='lost';document.querySelector('[data-action="pause"]').click();document.querySelector('[data-action="close"]').click();});
 await page.waitForTimeout(100);
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('hex-zoo-save')));
 if(after.wins!==1)throw new Error('Same seed result counted twice after Endless');
 await page.evaluate(()=>window.hexZooQA.show('end'));
 const actualTomorrow=await page.locator('.tomorrow b').textContent();
 const expectedTomorrow=await page.evaluate(async()=>{const C=await import('/src/core/index.ts');return C.tomorrowEvent().name;});
 if(actualTomorrow!==expectedTomorrow)throw new Error(`Tomorrow promise ${actualTomorrow} does not match actual daily event ${expectedTomorrow}`);
 assertClean(errors,'Meta regressions');
 await report('meta-regression.json',{status:'PASS',dailyFinishedBlocked:true,yesterdayCannotBypassToday:true,activeDailyResumed:true,reloadDoesNotDuplicateWin:true,endlessResultDoesNotDuplicateWin:true,tomorrowEventMatchesDaily:true,errors});
 console.log('PASS: daily finished/yesterday/active rules; win count preserved across reload and Endless.');
 await context.close();
}finally{await browser.close();}
