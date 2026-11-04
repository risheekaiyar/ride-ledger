const assert=require('node:assert/strict'),{chromium}=require('playwright'),{ride}=require('./compare-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');
  const a=ride(),b=ride(1);a.signals=a.signals.filter(p=>![1,30].includes(p[0]));b.duration=120;b.signals=Array.from({length:120},(_,i)=>[i,2+i/100,.1,.2,2+i/100]);
  await page.evaluate(async records=>{for(const r of records)await saveRide(r);selected=records[0].id;navigate('explore');},[a,b]);
  const section=page.locator('[data-compare-channel="acceleration"]'),plot=section.locator('[data-compare-plot]'),slider=section.locator('[data-compare-seek]'),first=section.locator('.compare-moment-a'),second=section.locator('.compare-moment-b');
  await plot.focus();await plot.press('ArrowRight');assert.equal(await plot.getAttribute('aria-valuenow'),'1');assert.match(await first.textContent(),/No complete/);assert.match(await second.textContent(),/0:02 – 0:03/);assert.match(await second.textContent(),/2.020/);
  await plot.press('Shift+ArrowRight');assert.equal(await slider.inputValue(),'11');await plot.press('PageDown');assert.equal(await slider.inputValue(),'1');
  await slider.focus();await slider.press('End');assert.equal(await slider.inputValue(),'60');assert.match(await first.textContent(),/0:59 – 1:00/);assert.match(await second.textContent(),/1:59 – 2:00/);assert.match(await second.textContent(),/3.190/);
  await slider.press('Home');assert.equal(await slider.inputValue(),'0');
  await plot.evaluate(el=>el.scrollIntoView({block:'center'}));let box=await plot.boundingBox();await page.mouse.click(box.x+box.width*.25,box.y+box.height*.5);assert(Math.abs(Number(await slider.inputValue())-15)<.2);assert.match(await second.textContent(),/0:30 – 0:31/);
  await slider.evaluate(el=>{el.value='30.3';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await first.textContent(),/No complete/);assert.match(await second.textContent(),/1:00 – 1:01/);assert.match(await plot.getAttribute('aria-valuetext'),/no complete bin/);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await section.locator('.compare-chart-scale').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=11));const rail=section.locator('.compare-gap-row').first();assert(await rail.evaluate(el=>el.scrollWidth<=el.clientWidth));}
  await page.setViewportSize({width:390,height:844});await section.evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-signal-inspector-mobile.png'});
  await section.locator('.compare-inspection').evaluate(el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:'/tmp/odo-signal-gap-inspection-mobile.png'});
  const timing=await page.evaluate(()=>{
   const start=performance.now(),a={...rides[0],duration:86400},b={...rides[1],duration:86400};
   a.signals=Array.from({length:86400},(_,i)=>[i,1+Math.sin(i/20)*.1,.2,.1,1+Math.sin(i/20)*.1]).filter(p=>p[0]!==12345);a.signals.find(p=>p[0]===40000)[4]=3.2;a.signals.find(p=>p[0]===20000)[4]=0;b.signals=a.signals.map(p=>[...p]);
   rides=[a,b];selected=a.id;render();return {milliseconds:performance.now()-start,original:a.signals.length,display:comparisonView.pair.channels[0].first.points.length};
  });assert.equal(timing.original,86399);assert.equal(timing.display,86399);assert.match(await section.locator('.compare-chart-scale').textContent(),/Time-column ranges/);
  assert(await section.locator('.compare-trace').evaluateAll(paths=>paths.every(p=>p.getAttribute('d').length<40000)));
  await slider.evaluate(el=>{el.value='40000';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await first.textContent(),/3.200/);
  await slider.evaluate(el=>{el.value='12345';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await first.textContent(),/No complete/);
  await slider.evaluate(el=>{el.value='20000';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await first.textContent(),/0.000/);
  await page.setViewportSize({width:1440,height:1100});await section.evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-signal-full-day-desktop.png'});
  await page.evaluate(()=>navigate('garage'));assert.equal(await page.evaluate(()=>comparisonView),null);
  assert.deepEqual(errors,[]);console.log('PASS: source-bin inspection, different-duration mapping, pointer and keyboard seeking, missing/zero/end values, readable narrow layouts and bounded full-day rendering',timing);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
