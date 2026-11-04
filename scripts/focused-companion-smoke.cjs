const assert=require('node:assert/strict'),{chromium}=require('playwright'),{ride}=require('./compare-fixture.cjs'),{packet}=require('./muse-runtime.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:1000}}),errors=[],requests=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/muse/status',r=>r.fulfill({json:{enabled:true,configured:true,remaining:10}}));
  await page.route('**/api/muse/insights',r=>{
   const body=r.request().postDataJSON();packet(body);requests.push(body);
   return r.fulfill({json:{model:'muse-spark-1.3',summary:'The selected phone signal needs context.',observations:[{text:'Phone motion is observed while GPS coverage is incomplete.',evidence_ids:['trip_1']}],question:'Was the mount stable?',remaining:10-requests.length}});
  });
  await page.goto('http://127.0.0.1:4178');await page.locator('.overview-welcome').waitFor();
  await page.evaluate(async base=>{
   const r={...base,id:'private-focus-ride',title:'Synthetic · a moment to review',duration:120.5,stats:[],notes:'private-secret',started:Date.UTC(2026,10,1)};
   r.track=Array.from({length:121},(_,i)=>[77+i*.00001,12+Math.sin(i/12)*.001,i,30+i/10,2,800+i,90,0,.2]).filter(p=>p[2]<55||p[2]>64);
   r.signals=Array.from({length:120},(_,i)=>[i,i===60?3.8:1,.1,.2,1]).filter(p=>p[0]!==61&&p[0]!==62);
   await saveRide({...r,id:'private-comparable-ride',started:r.started-86400000});await saveRide(r);selected=r.id;navigate('detail');
  },ride());
  const ask=page.getByRole('button',{name:'Ask Odo about this window',exact:true});assert(await ask.isDisabled());
  await page.evaluate(()=>seekTrackTime(60));await page.locator('[data-channel=motion]').click();await page.locator('[data-trace-window="15"]').click();assert(!(await ask.isDisabled()));
  await page.locator('.telemetry-window').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-focused-entry-mobile.png'});
  await ask.click();await page.waitForFunction(()=>!document.querySelector('#companion-send').disabled);assert.equal(requests.length,0,'Opening and inspecting evidence never sends a model request');
  assert.equal(await page.locator('.companion-focus strong').textContent(),'0:52 – 1:07');
  const focus=JSON.parse(await page.locator('.odo-focus-payload').textContent());assert.equal(focus.channels[0].maximum,3.8);assert.equal(focus.channels[0].bins,13);assert.equal(focus.speed.observed_seconds,4);assert.equal(focus.source_altitude.samples,6);
  assert.equal(JSON.parse(await page.locator('.odo-payload').textContent()).length,1,'Focused review excludes an automatically compatible second ride');
  await page.screenshot({path:'/tmp/odo-focused-companion-mobile.png'});
  for(const width of [320,390,650,768,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert(await page.locator('#modal').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
  await page.screenshot({path:'/tmp/odo-focused-companion-desktop.png'});await page.locator('#companion-send').click();await page.locator('.companion-turn').waitFor();assert.equal(requests.length,1);
  assert.equal(requests[0].rides.length,1);assert.equal(requests[0].comparison,undefined);assert.equal(requests[0].focus.start_second,52);assert.equal(requests[0].focus.selected_channel,'motion');assert(!/private-focus-ride|private-secret|private-comparable-ride|"track"|"device"|"started"/.test(JSON.stringify(requests[0])));
  await page.locator('#companion-form [name=question]').fill('The phone may have moved. How does that change the interpretation?');await page.locator('#companion-send').click();await page.waitForFunction(()=>document.querySelectorAll('.companion-turn').length===2);assert.equal(requests[1].history.length,2);assert.deepEqual(requests[1].focus,requests[0].focus);
  await page.locator('[data-companion-trip]').last().click();assert.equal(await page.locator('#modal').evaluate(d=>d.open),false);assert.equal(await page.locator('#telemetry-window-range').textContent(),'0:52 – 1:07');assert.equal(await page.locator('[data-telemetry-plot]').getAttribute('data-trace-kind'),'motion');assert.equal(await page.evaluate(()=>trackTime),59.5);
  await page.locator('[data-window-step="1"]').click();await ask.click();assert.equal(await page.locator('.companion-turn').count(),0,'Moving the focused window cannot reuse stale interpretations');await page.getByRole('button',{name:'Close companion',exact:true}).click();
  await page.evaluate(()=>seekTrackTime(120.3));await page.locator('[data-trace-window="15"]').click();await ask.click();assert.equal(await page.locator('.companion-focus strong').textContent(),'1:46 – 2:00');
  await page.waitForFunction(()=>!document.querySelector('#companion-send').disabled);await page.locator('#companion-send').click();await page.locator('.companion-turn').waitFor();assert.equal(requests[2].focus.end_second-requests[2].focus.start_second,14);assert.equal(requests[2].rides[0].duration_seconds,120.5);
  await page.locator('[data-companion-trip]').click();assert.equal(await page.locator('#telemetry-window-range').textContent(),'1:46 – 2:00');
  // A normal debrief still uses the existing paired-ride workflow without a hidden focus context.
  await page.evaluate(()=>museSetup());assert.equal(await page.locator('.companion-focus').count(),0);assert.equal(JSON.parse(await page.locator('.odo-payload').textContent()).length,2);assert.equal(await page.locator('.companion-turn').count(),0);await page.getByRole('button',{name:'Close companion',exact:true}).click();
  await page.evaluate(()=>{current().track=[];current().stats=[];render();seekTrackTime(60);});await page.locator('[data-trace-window="15"]').click();await ask.click();const noGps=JSON.parse(await page.locator('.odo-focus-payload').textContent());assert.equal(noGps.speed.observed_seconds,0);assert.equal(noGps.speed.peak_kmh,null);assert.equal(noGps.channels[0].maximum,3.8);
  assert.equal(requests.length,3);assert.deepEqual(errors,[]);console.log('PASS: explicit focused Meta request, private-field exclusion, compatible-pair suppression, bounded evidence, history scoping, citation restoration, fractional endpoints, zero-GPS motion and responsive payload review; model mocked');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
