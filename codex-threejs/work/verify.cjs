const { chromium }=require('playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
  const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>requests.push(r.url()));
  await page.route(/^https?:/,r=>r.abort());
  await page.goto(pathToFileURL(path.join(__dirname,'../outputs/index.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__rainyCorner?.stats.frames>20);
  const device=await page.evaluate(()=>{
    const s=window.__rainyCorner,gl=s.renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');
    return{version:gl.getParameter(gl.VERSION),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',stats:s.stats};
  });
  const doors=[];
  for(const time of [2,7,12,22]) {
    const p=await page.evaluate(t=>{const s=window.__rainyCorner;s.freeze(t);return {time:t,x:s.doors.map(d=>d.g.position.x),open:s.stats.doorOpen};},time);
    doors.push(p);
  }
  assert.equal(doors[0].open,0);assert.equal(doors[1].open,1);assert.equal(doors[2].open,0);assert.equal(doors[3].open,1);
  assert.ok(Math.abs(doors[0].x[0]+.585)<.001);assert.ok(Math.abs(doors[1].x[0]+1.495)<.001);
  const cameraState=()=>page.evaluate(()=>{const s=window.__rainyCorner;return {p:s.camera.position.toArray(),target:s.controls.target.toArray(),distance:s.controls.getDistance()};});
  const before=await cameraState();
  await page.mouse.move(740,600);await page.mouse.down();await page.mouse.move(1010,640,{steps:16});await page.mouse.up();await page.waitForTimeout(650);
  const rotate=await cameraState();assert.ok(Math.abs(rotate.p[0]-before.p[0])>1,'drag rotates camera');
  await page.mouse.wheel(0,-320);await page.waitForTimeout(650);
  const zoom=await cameraState();assert.ok(zoom.distance<rotate.distance,'wheel zoom works');
  await page.mouse.move(800,600);await page.mouse.down({button:'right'});await page.mouse.move(900,635,{steps:12});await page.mouse.up({button:'right'});await page.waitForTimeout(650);
  const pan=await cameraState();assert.ok(Math.abs(pan.target[0]-zoom.target[0])>.1,'right drag pans camera');
  // Dedicated inspection views reveal furniture, glass, side props and the rear construction.
  await page.evaluate(()=>{const s=window.__rainyCorner;s.freeze(7.2);s.camera.position.set(3.2,4.5,9);s.controls.target.set(-1.1,1.8,-1.8);s.controls.update();});
  await page.waitForTimeout(600);await page.screenshot({path:__dirname+'/detail-front.png'});
  await page.evaluate(()=>{const s=window.__rainyCorner;s.camera.position.set(11,6,-.3);s.controls.target.set(.4,1.8,-2.4);s.controls.update();});
  await page.waitForTimeout(600);await page.screenshot({path:__dirname+'/detail-side.png'});
  await page.evaluate(()=>{const s=window.__rainyCorner;s.camera.position.set(-12,8,-14);s.controls.target.set(0,1.4,-1);s.controls.update();});
  await page.waitForTimeout(600);await page.screenshot({path:__dirname+'/detail-rear.png'});
  await page.evaluate(()=>window.__rainyCorner.resetView());
  await page.waitForTimeout(600);await page.screenshot({path:__dirname+'/../outputs/preview.png'});
  await page.evaluate(()=>window.__rainyCorner.freeze(8.1));await page.waitForTimeout(200);
  const animationA=await page.screenshot();
  await page.evaluate(()=>window.__rainyCorner.freeze(8.7));await page.waitForTimeout(200);
  const animationB=await page.screenshot();
  assert.ok(!animationA.equals(animationB),'rendered rain, ripples and reflection animate while doors stay open');
  const bounds=await page.evaluate(()=>{
    const s=window.__rainyCorner,T=window.MART;const p=[];
    for(const x of [-7.125,7.125])for(const z of [-7.125,7.125])for(const y of [-.86,0]){const v=new T.Vector3(x,y,z).project(s.camera);p.push([v.x,v.y]);}
    return {minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minY:Math.min(...p.map(v=>v[1])),maxY:Math.max(...p.map(v=>v[1]))};
  });
  assert.ok(bounds.minY>-1&&bounds.maxY<1&&bounds.minX>-1&&bounds.maxX<1,'complete square plinth in initial frame');
  const landscape=await page.screenshot({path:__dirname+'/landscape.png'});
  await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(600);
  await page.screenshot({path:__dirname+'/wide-view.png'});
  await page.setViewportSize({width:720,height:960});await page.waitForTimeout(500);
  await page.screenshot({path:__dirname+'/portrait-view.png'});
  const portrait=await page.evaluate(()=>({stats:window.__rainyCorner.stats,aspect:window.__rainyCorner.camera.aspect,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height]}));
  assert.equal(portrait.aspect,.75);assert.equal(portrait.canvas[0],720);
  assert.equal(errors.length,0,errors.join('\n'));assert.ok(!requests.some(u=>/^https?:/.test(u)),'fully offline: no external requests');
  await page.setViewportSize({width:1440,height:1080});await page.waitForTimeout(600);
  await page.evaluate(()=>{window.__rainyCorner.resume();window.__rainyCorner.freeze(0);window.__rainyCorner.resume();});
  const start=await page.evaluate(()=>({now:performance.now(),frames:window.__rainyCorner.stats.frames}));await page.waitForTimeout(2500);
  const end=await page.evaluate(()=>({now:performance.now(),frames:window.__rainyCorner.stats.frames}));
  const report={device,offline:true,externalRequests:requests.filter(u=>/^https?:/.test(u)),errors,doorCycle:doors,interactions:{rotate:true,zoom:true,pan:true},renderedAnimationFramesDiffer:true,initialPlinthBoundsNDC:bounds,portrait,measuredFps:+((end.frames-start.frames)*1000/(end.now-start.now)).toFixed(1)};
  fs.writeFileSync(__dirname+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  await browser.close();
})();
