const assert=require('node:assert/strict'),{chromium}=require('playwright'),{ride}=require('./compare-fixture.cjs'),{packet}=require('./muse-runtime.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/muse/status',r=>r.fulfill({json:{enabled:true,configured:true,remaining:5}}));
  await page.route('**/api/muse/insights',r=>{const body=r.request().postDataJSON();packet(body);requests.push(body);return r.fulfill({json:{model:'muse-spark-1.3',summary:'Compare the recorded phone signals within their limits.',observations:[{text:'The second recording needs the same context.',evidence_ids:['trip_2']}],question:null,remaining:4}});});
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');
  await page.evaluate(()=>navigate('explore'));assert.equal(await page.locator('.compare-empty').count(),1);
  const records=[ride(),ride(1),{...ride(2),placement:'Bag',mount_condition:'Not mounted'}];
  await page.evaluate(async records=>{for(const r of records)await saveRide(r);selected=records[0].id;navigate('explore');},records);
  assert.equal(await page.locator('.compare-channel-state.qualified').count(),3);assert.equal(await page.locator('.compare-relief svg').count(),2);
  for(const width of [320,390,650,768,1050,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`Comparison overflow at ${width}`);}
  await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'/tmp/odo-compare-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/odo-compare-mobile.png'});
  await page.locator('.compare-channel').first().evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-compare-signals.png'});
  await page.getByRole('button',{name:'Ask Odo about these rides',exact:true}).click();assert.equal(requests.length,0);
  const context=JSON.parse(await page.locator('.odo-comparison-payload').textContent());assert.equal(context.route_matched,true);
  await page.getByRole('button',{name:'Send to Meta',exact:true}).click();await page.locator('.companion-turn').waitFor();assert.equal(requests.length,1);assert.equal(requests[0].comparison.channels.length,3);assert(!JSON.stringify(requests[0]).includes('Private'));
  await page.locator('[data-companion-trip="1"]').click();assert.equal(await page.evaluate(()=>selected),records[1].id);
  await page.evaluate(id=>{selected=id;navigate('explore');},records[0].id);
  // Identical summaries from a different ride must not inherit the previous conversation.
  await page.evaluate(async original=>{const copy={...original,id:String(Number(original.id)-86400000*10),title:'Synthetic · identical evidence, different ride'};await saveRide(copy);compareRideId=copy.id;render();},records[1]);
  await page.getByRole('button',{name:'Ask Odo about these rides',exact:true}).click();assert.equal(await page.locator('.companion-turn').count(),0);await page.getByRole('button',{name:'Close companion',exact:true}).click();
  await page.locator('#compare-ride').selectOption(records[2].id);assert.equal(await page.locator('.compare-channel-state.qualified').count(),0);assert.match(await page.locator('.compare-delta').first().textContent(),/withheld/);
  await page.getByRole('button',{name:'Ask Odo about these rides',exact:true}).click();assert.equal(await page.locator('.companion-turn').count(),0);await page.getByRole('button',{name:'Close companion',exact:true}).click();
  await page.locator(`[data-compare-context="${records[2].id}"]`).click();assert(await page.locator('[name="mount_condition"]').isDisabled());
  await page.locator('[name="recurring"]').fill('  Changed direction  ');await page.getByRole('button',{name:'Save context',exact:true}).click();await page.waitForFunction(id=>selected===id,records[0].id);
  assert.equal(await page.evaluate(id=>rides.find(r=>r.id===id).recurring,records[2].id),'Changed direction');
  await page.locator(`[data-compare-context="${records[2].id}"]`).click();await page.locator('[name="placement"]').selectOption('Rigid mount');assert.equal(await page.locator('[name="mount_condition"]').inputValue(),'Unknown');await page.locator('[name="placement"]').selectOption('Pocket');assert.equal(await page.locator('[name="mount_condition"]').inputValue(),'Not mounted');await page.getByRole('button',{name:'Save context',exact:true}).click();
  await page.getByRole('button',{name:'Ride review',exact:true}).click();await page.waitForSelector('[data-action="muse"]');assert.equal(await page.locator('.comparison-page').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: comparison gates, local route relief, explicit paired Meta evidence, citation navigation, context editing, original review and 320–1440px layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
