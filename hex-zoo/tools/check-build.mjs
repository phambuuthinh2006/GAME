import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { launch, preparePage, assertClean, report } from './browser.mjs';
const root=resolve(new URL('../dist-crazygames/',import.meta.url).pathname);
const prefix='/qa/hex-zoo/';
const counts=new Map();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
async function totalSize(dir){let total=0;for(const entry of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,entry.name);total+=entry.isDirectory()?await totalSize(p):(await stat(p)).size;}return total;}
const buildBytes=await totalSize(root);
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end('Missing sub-path');return;}
    const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
    const path=resolve(root,relative);
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const body=await readFile(path);
    counts.set(relative,body.length);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('File not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();
const url=`http://127.0.0.1:${address.port}${prefix}`;
const sdkDouble=`(() => {
  const q=window.__cgQA={ready:false,events:[],data:{},ads:0,listener:null};
  const event=name=>{if(!q.ready)throw Error('SDK called before init: '+name);q.events.push(name);};
  window.CrazyGames={SDK:{
    init:async()=>{q.events.push('init');await new Promise(r=>setTimeout(r,80));q.ready=true;q.events.push('initialized');},
    game:{settings:{muteAudio:false},loadingStart:()=>event('loadingStart'),loadingStop:()=>event('loadingStop'),gameplayStart:()=>event('gameplayStart'),gameplayStop:()=>event('gameplayStop'),happytime:()=>event('happytime'),addSettingsChangeListener:fn=>{event('listenMute');q.listener=fn;}},
    user:{systemInfo:{locale:'en-GB'}},
    data:{getItem:key=>{event('getItem');return q.data[key]??null;},setItem:(key,val)=>{event('setItem');q.data[key]=val;},removeItem:key=>{event('removeItem');delete q.data[key];}},
    ad:{requestAd:(_type,callbacks)=>{event('rewarded');q.ads++;callbacks.adError({code:'adsDisabled'});}}
  }};
})();`;
const browser=await launch();
try{
  const{page,context,errors}=await preparePage(browser,{width:800,height:450});
  const external=[];
  page.on('request',req=>{if(!req.url().startsWith(url.slice(0,url.indexOf(prefix))))external.push(req.url());});
  await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:sdkDouble}));
  await page.addInitScript(()=>{
    window.__audioGains=[];
    const NativeAudioContext=window.AudioContext;
    window.AudioContext=class extends NativeAudioContext{
      createGain(){const gain=super.createGain();window.__audioGains.push(gain);return gain;}
    };
  });
  await page.addInitScript(()=>localStorage.setItem('hex-zoo-save',JSON.stringify({version:2,wins:1,best:101,seen:[],daily:{},settings:{music:true,sound:true},keeper:'mira'})));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('[data-action="play"]').waitFor();
  const boot=await page.evaluate(()=>window.__cgQA);
  if(boot.events.includes('gameplayStart'))throw new Error('Gameplay started on the menu');
  if(!boot.events.includes('loadingStart')||!boot.events.includes('loadingStop'))throw new Error('Missing loading calls');
  if(boot.events.indexOf('loadingStart')>boot.events.indexOf('loadingStop'))throw new Error('Loading calls reversed');
  if(JSON.parse(boot.data['hex-zoo-save']).best!==101)throw new Error('Legacy save migration failed');
  await page.locator('[data-action="play"]').click();
  await page.locator('.game').waitFor();
  const downloadBytes=[...counts.values()].reduce((sum,size)=>sum+size,0);
  while(await page.locator('.guided').count()){
    await page.locator('.guided').click();
    if(await page.locator('[role="dialog"]').count()||await page.locator('.goal-track i').evaluate(el=>el.style.width==='100%'))break;
  }
  await page.locator('.dialog.reward').waitFor();
  await page.locator('[data-action="choose"]').first().click();
  await page.locator('[data-action="continue"]').click();
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('.dialog.settings').waitFor();
  if(!await page.locator('.dialog.settings').textContent().then(t=>t.includes('en-GB')))throw new Error('SDK locale not read');
  await page.evaluate(()=>window.__cgQA.listener({muteAudio:true}));
  await page.waitForFunction(()=>document.querySelector('.dialog.settings'));
  await page.locator('[data-action="music"]').click();
  await page.locator('[data-action="sound"]').click();
  const mutedGains=await page.evaluate(()=>window.__audioGains.slice(0,3).map(node=>node.gain.value));
  if(mutedGains.join(',')!=='0,0,0')throw new Error('Host mute or settings failed to silence active audio buses: '+mutedGains);

  await page.locator('.dialog.settings [data-action="close"]').click();
  await page.locator('[data-action="snacks"]').click();
  await page.locator('[data-action="ad"]').click();
  if(await page.evaluate(()=>window.__audioGains[0].gain.value)!==0)throw new Error('Input or ad restored audio while host-muted');
  if(!await page.locator('[data-action="ad"]').isDisabled())throw new Error('Ad refusal did not dim/disable the reward button');
  if(await page.evaluate(()=>window.__cgQA.ads)!==1)throw new Error('Unexpected rewarded ad request count');
  const lifecycle=await page.evaluate(()=>window.__cgQA.events);
  const activity=lifecycle.filter(name=>name==='gameplayStart'||name==='gameplayStop');
  if(activity.join(',')!=='gameplayStart,gameplayStop,gameplayStart,gameplayStop,gameplayStart,gameplayStop')throw new Error('Unexpected gameplay sequence: '+activity.join(','));
  assertClean(errors,'Built sub-path checks');
  if(external.some(req=>req!=='https://sdk.crazygames.com/crazygames-sdk-v3.js'))throw new Error('Unexpected runtime external resource: '+external.join(','));
  if(buildBytes>=15*1024*1024)throw new Error('Build exceeds 15 MB');
  if(downloadBytes>=5*1024*1024)throw new Error('Initial download exceeds 5 MB');
  const result={status:'PASS',url:prefix,buildBytes,initialDownloadBytes:downloadBytes,resources:[...counts].map(([path,bytes])=>({path,bytes})),errors,externalRequests:external,lifecycle:activity,storageMigration:true,rewardedRefusalDisabled:true,hostMuteAndAudioBusPriority:true,sdkTestDouble:true,note:'The production bundle was served locally under a nested path. The official SDK URL was intercepted with an SDK double to validate wiring without submitting or signing in. Live portal ads/cloud storage remain unverified.'};
  await report('build-check.json',result);
  console.log(`PASS: built sub-path, zero 404/console/page errors; build ${(buildBytes/1024/1024).toFixed(3)} MiB; initial ${(downloadBytes/1024/1024).toFixed(3)} MiB; SDK lifecycle and Data migration passed with SDK double.`);
  await context.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
