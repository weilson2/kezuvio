import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
const root=path.join(process.cwd(),'assets/marketing');
await fs.mkdir(path.join(root,'previews'),{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const results=[];
try{
 for(const name of (await fs.readdir(root)).filter(n=>n.endsWith('.html')&&n!=='index.html')){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(pathToFileURL(path.join(root,name)).href);
  await page.evaluate(()=>document.fonts.ready);
  const size=await page.locator('.canvas').evaluate(el=>({width:el.offsetWidth,height:el.offsetHeight}));
  await page.setViewportSize({width:size.width,height:size.height+130});
  await page.evaluate(()=>document.fonts.ready);
  const check=await page.locator('.canvas').evaluate(el=>{
   const r=el.getBoundingClientRect();const nodes=[...el.querySelectorAll('.brand,.eyebrow,.headline,.lead,.cta,.chips,.bottom')].filter(n=>getComputedStyle(n).display!=='none');
   const overflow=nodes.filter(n=>{const b=n.getBoundingClientRect();return b.left<r.left||b.right>r.right+1||b.bottom>r.bottom+1}).map(n=>n.className);
   const overlaps=nodes.flatMap((n,i)=>nodes.slice(i+1).filter(m=>{const a=n.getBoundingClientRect(),b=m.getBoundingClientRect();return Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1}).map(m=>[n.className,m.className]));
   return {overflow,overlaps,chineseFont:document.fonts.check('400 16px "Noto Sans SC"','创造构建进化'),images:[...el.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)};
  });
  await page.locator('.canvas').screenshot({path:path.join(root,'previews',name.replace('.html','.png'))});
  results.push({name,...size,...check});await page.close();
 }
}finally{await browser.close()}
await fs.writeFile(path.join(root,'previews/layout-check.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.overflow.length||r.overlaps.length||!r.images||!r.chineseFont))process.exitCode=1;
