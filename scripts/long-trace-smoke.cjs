const assert=require('node:assert/strict'),{chromium}=require('playwright'),{ride}=require('./compare-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');
  const timing=await page.evaluate(async base=>{
   const r={...base,duration:25000,title:'Synthetic · all-day signal review'},start=performance.now();
   r.track=Array.from({length:50000},(_,i)=>[77+i*.000003,12+Math.sin(i/3000)*.001,i*.5,30+Math.sin(i/25)*5,2,800+Math.sin(i/500)*10,90,0,.2]);r.track[30000][3]=120;r.track[30001][3]=0;r.track[30002][5]=1234;r.accepted=r.gpsRows=50000;
   r.signals=Array.from({length:25000},(_,i)=>[i,1+Math.sin(i/20)*.1,.1,.2,1]).filter(p=>p[0]!==15001);r.signals.find(p=>p[0]===15000)[1]=3.8;
   await saveRide(r);selected=r.id;navigate('detail');return performance.now()-start;
  },ride());
  const plot=page.locator('[data-telemetry-plot]'),mainLine=page.locator('#telemetry-chart .telemetry-line:not(.telemetry-dots)');
  await plot.waitFor();assert.match(await page.locator('.telemetry-scale').textContent(),/120.0/);assert.match(await page.locator('.telemetry-scale').textContent(),/Time-column min/);assert((await mainLine.getAttribute('d')).length<40000);
  await page.evaluate(()=>seekTrackTime(15000));assert.equal(await page.locator('#telemetry-speed').textContent(),'120');assert.equal(await page.evaluate(()=>playIndex),30000);
  await plot.focus();await plot.press('ArrowRight');assert.equal(await page.locator('#telemetry-speed').textContent(),'0');
  await page.locator('[data-channel="altitude"]').click();assert.match(await page.locator('.telemetry-scale').textContent(),/1,234.0/);await plot.focus();await plot.press('ArrowRight');assert.equal(await page.locator('#sample-altitude').textContent(),'1,234.0 m');
  await page.locator('[data-channel="motion"]').click();await page.evaluate(()=>seekTrackTime(15000));assert.equal(await page.locator('#sample-acceleration').textContent(),'3.80 g');await plot.focus();await plot.press('ArrowRight');assert.equal(await page.locator('#sample-acceleration').textContent(),'Not supplied');assert.match(await page.locator('#sample-time').textContent(),/4:10:01/);assert.match(await plot.getAttribute('aria-valuetext'),/no motion bin/);
  assert((await page.locator('.telemetry-gap-mark').getAttribute('d')).length>0);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.locator('.telemetry-gap-row').evaluate(el=>el.scrollWidth<=el.clientWidth));}
  await page.setViewportSize({width:390,height:844});await page.locator('#telemetry-chart').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-long-trace-mobile.png'});
  await page.setViewportSize({width:1440,height:1100});await page.locator('#telemetry-chart').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-long-trace-desktop.png'});
  assert.deepEqual(errors,[]);console.log('PASS: 50,000 GPS fixes and 25,000 motion bins, bounded paths, retained extremes, original-sample seeking, missing motion and responsive gaps; initial save/render milliseconds',timing);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
