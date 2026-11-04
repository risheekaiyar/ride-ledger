const assert=require('node:assert/strict'),{chromium}=require('playwright'),{ride}=require('./compare-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];let posts=0;
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts++;});
  await page.goto('http://127.0.0.1:4178');await page.locator('.overview-welcome').waitFor();
  await page.evaluate(async base=>{
   const r={...base,duration:3600,title:'Synthetic · one-hour phone signal'};
   r.track=Array.from({length:3601},(_,i)=>[77+i*.00001,12+Math.sin(i/200)*.001,i,30+Math.sin(i/20)*10,2,i===100?1234:800+Math.sin(i/80)*10,90,0,.2]).filter(p=>p[2]<1798||p[2]>1806);
   r.signals=Array.from({length:3600},(_,i)=>[i,i===1800?3.8:1+Math.sin(i/10)*.1,.1,.2,1]).filter(p=>p[0]<1801||p[0]>1804);
   await saveRide(r);selected=r.id;navigate('detail');window.originalScene=trackScene;window.originalCanvas=document.querySelector('#map-canvas canvas');window.originalFacts=document.querySelector('.telemetry-facts').innerHTML;window.originalEvidence=JSON.stringify(OdoTelemetry.analyze(r));
  },ride());
  const plot=page.locator('[data-telemetry-plot]'),range=page.locator('#telemetry-window-range');
  assert.equal(await plot.getAttribute('aria-valuemax'),'3600');await page.evaluate(()=>seekTrackTime(1800));await page.locator('[data-channel=motion]').click();
  await page.locator('[data-trace-window="15"]').click();assert.equal(await plot.getAttribute('aria-valuemin'),'1792');assert.equal(await plot.getAttribute('aria-valuemax'),'1807');assert.equal(await range.textContent(),'29:52 – 30:07');
  assert.equal(await page.locator('#sample-acceleration').textContent(),'3.80 g');assert.equal(await page.locator('#sample-time').textContent(),'GPS recording gap');assert.equal(await page.locator('#telemetry-cursor').getAttribute('x1'),'320');
  assert.equal(await page.evaluate(()=>trackScene===window.originalScene&&document.querySelector('#map-canvas canvas')===window.originalCanvas),true);
  assert.equal(await page.evaluate(()=>document.querySelector('.telemetry-facts').innerHTML===window.originalFacts&&JSON.stringify(OdoTelemetry.analyze(current()))===window.originalEvidence),true);
  await plot.focus();await plot.press('ArrowRight');assert.equal(await page.evaluate(()=>trackTime),1801);assert.equal(await page.locator('#sample-acceleration').textContent(),'Not supplied');assert.match(await plot.getAttribute('aria-valuetext'),/no motion bin/);
  await plot.press('Home');assert.equal(await page.evaluate(()=>trackTime),1792);await plot.press('End');assert.equal(await page.evaluate(()=>trackTime),1807);await plot.press('ArrowRight');assert.equal(await page.evaluate(()=>trackTime),1807);
  await page.locator('[data-window-step="1"]').click();assert.equal(await range.textContent(),'30:07 – 30:22');assert.equal(await page.evaluate(()=>trackTime),1807);await page.locator('[data-window-step="-1"]').click();
  await plot.scrollIntoViewIfNeeded();const target=await plot.evaluate(svg=>{const p=new DOMPoint(300,75).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};});await page.mouse.click(target.x,target.y);assert.equal(await page.evaluate(()=>trackTime),1799.5);
  await page.evaluate(()=>seekTrackTime(3500));assert.equal(await page.locator('#telemetry-cursor').evaluate(el=>getComputedStyle(el).display),'none');assert.match(await page.locator('#telemetry-window-position').textContent(),/outside this window/);
  await page.locator('[data-window-center]').click();assert.equal(await range.textContent(),'58:12 – 58:27');assert.equal(await page.locator('#telemetry-window-position').isVisible(),false);
  await page.locator('[data-trace-window="60"]').click();assert.equal(await range.textContent(),'57:50 – 58:50');assert.equal(await page.locator('[data-trace-window="60"]').evaluate(el=>document.activeElement===el),true);
  await page.locator('[data-trace-window="300"]').click();assert.equal(await range.textContent(),'55:00 – 1:00:00');assert.equal(await page.locator('[data-window-step="1"]').isDisabled(),true);
  await page.locator('[data-window-step="-1"]').click();assert.equal(await range.textContent(),'50:00 – 55:00');
  await page.locator('[data-window-step="1"]').click();assert.equal(await page.locator('[data-window-center]').evaluate(el=>document.activeElement===el),true,'Disabled end-window button retains a useful focus target');await page.locator('[data-window-step="-1"]').click();
  await page.locator('[data-channel=altitude]').click();assert.equal(await range.textContent(),'50:00 – 55:00');assert.doesNotMatch(await page.locator('.telemetry-scale').textContent(),/1,234/);
  await plot.focus();await plot.press('Home');assert.equal(await page.evaluate(()=>trackTime),3000);await plot.press('Shift+ArrowRight');assert.equal(await page.evaluate(()=>trackTime),3010);await plot.press('End');assert.equal(await page.evaluate(()=>trackTime),3300);
  await page.locator('[data-action=play]').click();await page.waitForFunction(()=>trackWasPlaying);await page.locator('[data-trace-window="60"]').click();assert.equal(await page.evaluate(()=>trackWasPlaying),false);
  await page.locator('[data-trace-window="0"]').click();assert.equal(await plot.getAttribute('aria-valuemax'),'3600');assert.match(await page.locator('.telemetry-scale').textContent(),/1,234/);
  await page.evaluate(()=>seekTrackTime(1800));await page.locator('[data-channel=motion]').click();await page.locator('[data-trace-window="60"]').click();
  for(const width of [320,390,650,768,1050,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`Window overflow at ${width}`);}
  await page.setViewportSize({width:390,height:1000});await page.locator('.telemetry-tabs').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-trace-window-mobile.png'});
  await page.setViewportSize({width:1440,height:1100});await page.locator('.telemetry-tabs').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-trace-window-desktop.png'});
  // The older single-ride Route Lab chart remains a whole-ride view.
  await page.evaluate(()=>{routeLabMode='review';navigate('explore');});
  assert.equal(await plot.count(),1);assert.equal(await plot.getAttribute('aria-valuemax'),'3600');
  await page.evaluate(()=>navigate('detail'));assert.equal(await plot.getAttribute('aria-valuemax'),'1830');
  await page.evaluate(()=>{current().signals=current().signals.filter(p=>p[0]<30);render();});await page.getByText('No samples in this window',{exact:true}).waitFor();assert.equal(await page.locator('[data-trace-window="0"]').isEnabled(),true);
  await page.locator('[data-trace-window="0"]').click();assert.equal(await plot.count(),1);
  await page.evaluate(()=>{const r=current();r.track=[];r.gpsRows=r.accepted=0;r.duration=120;r.signals=Array.from({length:120},(_,i)=>[i,i===60?2.7:1,.1,.2,1]);render();});
  assert.equal(await page.locator('#telemetry-speed').textContent(),'—');assert.equal(await page.locator('#sample-acceleration').textContent(),'1.00 g');assert.equal(await page.evaluate(()=>trackTime),0);
  await plot.focus();await plot.press('PageUp');assert.equal(await page.evaluate(()=>trackTime),10);await page.evaluate(()=>seekTrackTime(60));assert.equal(await page.locator('#sample-acceleration').textContent(),'2.70 g');assert.equal(await page.locator('#sample-time').textContent(),'GPS recording gap');
  await page.locator('[data-trace-window="15"]').click();assert.equal(await range.textContent(),'0:52 – 1:07');await plot.focus();await plot.press('End');assert.equal(await page.evaluate(()=>trackTime),67);assert.equal(await page.locator('[data-sample-step="1"]').isDisabled(),true);
  await page.evaluate(()=>{const next={...current(),id:'synthetic-short-window',duration:12,track:current().track.slice(0,13),signals:[]};rides.unshift(next);selected=next.id;render();});assert.equal(await page.locator('.telemetry-window').isVisible(),false);
  assert.equal(posts,0);assert.deepEqual(errors,[]);console.log('PASS: focused time ranges, edge clipping, original values in GPS gaps, replay/canvas retention, keyboard/click mapping, pan/recenter, whole-ride summaries, empty windows and responsive layout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
