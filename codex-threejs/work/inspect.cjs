const { chromium } = require('playwright');
const fs = require('node:fs');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
  const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
  const errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());else if(m.type()==='warning')warnings.push(m.text());});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
  await page.waitForTimeout(4000);
  const stats=await page.evaluate(()=>window.__rainyCorner?.stats);
  if(stats){await page.evaluate(()=>window.__rainyCorner.freeze(7.2));await page.waitForTimeout(500);}
  await page.screenshot({path:__dirname+'/first-view.png'});
  fs.writeFileSync(__dirname+'/inspection.json',JSON.stringify({stats,errors:[...new Set(errors)],warnings:[...new Set(warnings)]},null,2));
  console.log(JSON.stringify({stats,errors:[...new Set(errors)],warnings:[...new Set(warnings)]},null,2));
  await browser.close();
})();
