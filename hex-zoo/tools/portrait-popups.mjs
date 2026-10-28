import { launch, preparePage, qaReady, show, assertClean, report } from './browser.mjs';
const sizes = [[311,530],[320,480],[375,600],[390,664],[844,390],[800,450]];
const views = ['menu','menu-active','run','reward','shop','end','end-win','collection','settings','pause','deck','remove','snacks','keepers'];
const browser = await launch();
const results = [];
try {
  for (const [width,height] of sizes) {
    const {page,context,errors} = await preparePage(browser,{width,height});
    await qaReady(page);
    for (const view of views) {
      await show(page,view);
      const problems = [];
      const maxScroll = await page.evaluate(() => { const box=document.querySelector('.dialog-content')||document.querySelector('[role="dialog"]');return box?Math.max(0,box.scrollHeight-box.clientHeight):0; });
      const scrollPositions = maxScroll ? [0,maxScroll/2,maxScroll] : [0];
      for (const scrollTop of scrollPositions) {
      await page.evaluate(top => { const box=document.querySelector('.dialog-content')||document.querySelector('[role="dialog"]');if(box)box.scrollTop=top; },scrollTop);
      const found = await page.evaluate(() => {
        const issues=[];
        const modal=document.querySelector('[role="dialog"]');
        const root=modal||document;
        const scrollParent=el=>{
          for(let p=el.parentElement;p;p=p.parentElement){
            const style=getComputedStyle(p);
            if(/auto|scroll/.test(style.overflowY)&&p.scrollHeight>p.clientHeight+1)return p;
          }
          return null;
        };
        const visible=el=>{
          const style=getComputedStyle(el),rect=el.getBoundingClientRect();
          if(style.display==='none'||style.visibility==='hidden'||rect.width<1||rect.height<1)return false;
          if(rect.right<=0||rect.left>=innerWidth||rect.bottom<=0||rect.top>=innerHeight)return false;
          for(let p=el.parentElement;p;p=p.parentElement){
            const s=getComputedStyle(p),r=p.getBoundingClientRect();
            if(/auto|scroll|hidden|clip/.test(s.overflowY)&&(rect.bottom<=r.top||rect.top>=r.bottom))return false;
          }
          return true;
        };
        for(const button of root.querySelectorAll('button')){
          if(!visible(button))continue;
          const r=button.getBoundingClientRect();
          const label=button.textContent.trim().replace(/\s+/g,' ').slice(0,65);
          if(r.left<-.8||r.right>innerWidth+.8)issues.push(`${label}: horizontal rect ${r.left.toFixed(1)}..${r.right.toFixed(1)}`);
          if((r.top<-.8||r.bottom>innerHeight+.8)&&!scrollParent(button))issues.push(`${label}: vertical rect ${r.top.toFixed(1)}..${r.bottom.toFixed(1)}`);
          const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
          while(walker.nextNode()){
            const node=walker.currentNode;
            if(!node.textContent.trim()||getComputedStyle(node.parentElement).fontSize==='0px')continue;
            const range=document.createRange(); range.selectNodeContents(node);
            for(const textRect of range.getClientRects()){
              if(textRect.width<.5||textRect.height<.5)continue;
              // Text clipped by an ancestor within a button must still fit its button's bounds.
              if(textRect.left<r.left-1||textRect.right>r.right+1||textRect.top<r.top-1||textRect.bottom>r.bottom+1)
                issues.push(`${label}: text spills (${node.textContent.trim().slice(0,30)})`);
            }
          }
        }
        if(innerWidth===800&&innerHeight===450){
          const textWalker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
          while(textWalker.nextNode()){
            const node=textWalker.currentNode,element=node.parentElement;
            if(!element||!node.textContent.trim()||!visible(element))continue;
            const range=document.createRange();range.selectNodeContents(node);
            if(![...range.getClientRects()].some(r=>r.width>.5&&r.height>.5&&r.bottom>0&&r.top<innerHeight))continue;
            const size=parseFloat(getComputedStyle(element).fontSize);
            if(size>0&&size<11.99)issues.push(`Text below12px at800x450: ${node.textContent.trim().slice(0,35)} (${size}px)`);
          }
        }
        if(!modal){
          const hint=document.querySelector('.board-bottom')?.getBoundingClientRect();
          const hand=document.querySelector('.hand-zone')?.getBoundingClientRect();
          if(hint&&hand&&hint.left<hand.right&&hint.right>hand.left&&hint.bottom>hand.top+1)issues.push(`Board feedback overlaps hand by ${(hint.bottom-hand.top).toFixed(1)}px`);
        }
        return [...new Set(issues)];
      });
      problems.push(...found);
      }
      results.push({width,height,view,scrollPositions,problems:[...new Set(problems)]});
      if(problems.length) console.error(`${width}x${height} ${view}:\n${problems.join('\n')}`);
    }
    assertClean(errors,`${width}x${height}`);
    await context.close();
  }
  const failures=results.filter(result=>result.problems.length);
  await report('portrait-popups.json',{status:failures.length?'FAIL':'PASS',checks:results});
  if(failures.length)throw new Error(`${failures.length} viewport/view checks failed. See artifacts/portrait-popups.json`);
  console.log(`PASS: ${results.length} viewport/view checks; visible button rects and text stay within bounds.`);
}finally{await browser.close();}
