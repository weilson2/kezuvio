import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// Self-contained file preview: no website server, network font dependency or app port needed.
const root=process.cwd();
const output=path.join(root,'output/pdf/kezuvio-brand-presentation.pdf');
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.mkdir(path.join(root,'documents/brand-presentation/qa'),{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage({viewport:{width:1440,height:810},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'documents/brand-presentation/index.html')).href);
 await page.evaluate(()=>document.fonts.ready);
 const layout=await page.evaluate(()=>[...document.querySelectorAll('.slide')].map((slide,i)=>{
  const r=slide.getBoundingClientRect();
  const overflow=[...slide.querySelectorAll('h1,h2,h3,h4,p,article,header,footer')].filter(el=>{const b=el.getBoundingClientRect();return b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1}).map(el=>el.textContent.slice(0,60));
  return {page:i+1,width:r.width,height:r.height,overflow};
 }));
 const assets=await page.evaluate(()=>({images:[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),fonts:document.fonts.status,inter:document.fonts.check('400 16px Inter'),chinese:document.fonts.check('400 16px "Noto Sans SC"','创造构建进化')}));
 if(layout.length!==12||layout.some(p=>p.overflow.length)||errors.length||assets.images.some(i=>!i.loaded))throw new Error(JSON.stringify({layout,errors,assets},null,2));
 await page.pdf({path:output,preferCSSPageSize:true,printBackground:true,tagged:true});
 await fs.writeFile(path.join(root,'documents/brand-presentation/qa/layout-check.json'),JSON.stringify({layout,errors,assets},null,2));
 console.log(output);
}finally{await browser.close()}
