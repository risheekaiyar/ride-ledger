const assert=require('node:assert/strict'),{chromium}=require('playwright'),{seed}=require('./track-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4178')&&!r.url().startsWith('data:'))remote.push(r.url())});
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');await page.evaluate(seed);
  await page.locator('#map-canvas[data-renderer=webgl] canvas').waitFor();await page.waitForTimeout(500);
  const overview=await page.evaluate(()=>trackScene.snapshot());
  await page.locator('[data-track-camera=top]').click();await page.waitForTimeout(150);
  assert.notEqual(await page.evaluate(()=>trackScene.snapshot()),overview,'Camera changes must render a different frame');
  await page.locator('[data-track-action=elevation]').click();assert.match(await page.locator('#map-label').textContent(),/Source altitude/);
  await page.locator('[data-track-action=elevation]').click();await page.locator('[data-track-camera=orbit]').click();
  await page.locator('[data-action=play]').click();await page.waitForFunction(()=>trackTime>1);await page.locator('[data-action=play]').click();
  assert.equal(await page.evaluate(()=>trackWasPlaying),false);assert.equal(await page.locator('#telemetry-speed').textContent(),(await page.locator('#track-speed').textContent()).replace(' km/h',''));
  await page.locator('[data-track-action=snapshot]').click();const download=page.waitForEvent('download');await page.locator('#confirm-track-image').click();
  assert.equal((await download).suggestedFilename(),'odo-track-preview.png');
  await page.getByRole('button',{name:'Load geographic map',exact:false}).click();await page.getByRole('button',{name:'Keep offline',exact:true}).click();assert.equal(await page.locator('#map-canvas').getAttribute('data-renderer'),'webgl');
  await page.evaluate(()=>updateTimeline(25));await page.locator('.track-studio').screenshot({path:'/tmp/odo-track-desktop.png'});
  await page.locator('[data-track-camera=follow]').click();await page.waitForTimeout(800);await page.locator('.track-viewport').screenshot({path:'/tmp/odo-track-chase.png'});await page.locator('[data-track-camera=orbit]').click();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  await page.locator('.track-studio').screenshot({path:'/tmp/odo-track-mobile.png'});
  // Seeking a gap must not show the preceding speed as current telemetry.
  await page.evaluate(()=>{const t=current().track;t[100][7]=1;t[101][7]=1;render();trackScene.setTime((t[99][2]+t[100][2])/2);});
  assert.equal(await page.locator('#track-gap').isHidden(),false);assert.equal(await page.locator('#telemetry-speed').textContent(),'—');
  await page.locator('[data-track-view="2d"]').click();await page.locator('#map-canvas svg').waitFor();assert.equal(await page.locator('[data-track-camera=follow]').isDisabled(),true);
  await page.evaluate(()=>{current().track.forEach(p=>p[5]=null);});await page.locator('[data-track-view="3d"]').click();assert.equal(await page.locator('[data-track-action=elevation]').isDisabled(),true);
  for(let i=0;i<3;i++){await page.locator('[data-track-view="2d"]').click();await page.locator('[data-track-view="3d"]').click();}
  assert.equal(await page.locator('#map-canvas canvas').count(),1);
  await page.evaluate(()=>document.querySelector('#map-canvas canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  assert.equal(await page.locator('#map-canvas').getAttribute('data-renderer'),'fallback');
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
  await fallback.goto('http://127.0.0.1:4178');await fallback.waitForSelector('.studio-hero');await fallback.evaluate(seed);await fallback.locator('#map-canvas[data-renderer=fallback] svg').waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  console.log('PASS: real WebGL track, cameras, playback, PNG, offline consent, portrait fit, gaps, missing elevation, repeated disposal, context-loss and no-WebGL fallback; no external requests');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
