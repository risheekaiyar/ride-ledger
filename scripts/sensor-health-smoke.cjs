const assert=require('node:assert/strict'),{chromium}=require('playwright'),{zipSync,strToU8}=require('../web/vendor/fflate.js'),{files}=require('./sensor-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/muse/status',route=>route.fulfill({json:{enabled:true,configured:true,remaining:1}}));
  await page.route('**/api/muse/insights',route=>{requests.push(route.request().postDataJSON());return route.fulfill({json:{model:'muse-spark-1.3',summary:'Review the mounting before comparing the signal.',observations:[{text:'Some samples approach the reported sensor range.',evidence_ids:['trip_1']}],question:null,remaining:0}});});
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');
  await page.locator('#zip-input').setInputFiles({name:'Synthetic · sensor review.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync(Object.fromEntries(Object.entries(files()).map(([key,value])=>[key,strToU8(value)]))))});
  await page.waitForSelector('[data-ride]');await page.locator('[data-ride]').first().click();
  await page.locator('.ride-source-notes>summary').click();
  assert.equal(await page.locator('.sensor-health-card').count(),5);
  const acc=page.locator('[data-sensor-type="1"]'),lin=page.locator('[data-sensor-type="10"]');
  assert.equal(await acc.locator('.sensor-health-flag').textContent(),'Range review');
  assert.match(await acc.locator('.sensor-health-facts').textContent(),/Samples near range2 \/ 9/);
  assert.match(await acc.locator('.sensor-status').textContent(),/Not reported 4/);
  assert.match(await lin.locator('.sensor-health-numbers').textContent(),/— Hz/);
  assert.match(await page.locator('[data-sensor-type="11"] .sensor-channel-note').textContent(),/not an orientation/);
  await page.locator('#toast').waitFor({state:'hidden'});await acc.evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-sensor-mobile.png'});
  await page.setViewportSize({width:1440,height:1100});await page.locator('.sensor-health').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'/tmp/odo-sensor-desktop.png'});
  for(const width of [320,390,650,768,1050,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`Sensor view overflow at ${width}px`);}
  await page.getByRole('button',{name:'Check signal with Odo',exact:true}).click();
  assert.match(await page.locator('#companion-form textarea').inputValue(),/near-range/);assert.equal(requests.length,0);
  const preview=JSON.parse(await page.locator('.odo-payload').textContent());assert.equal(preview[0].sensor_health.length,3);
  await page.getByRole('button',{name:'Send to Meta',exact:true}).click();await page.locator('.companion-turn').waitFor();
  assert.equal(requests.length,1);assert.equal(requests[0].rides[0].sensor_health[0].near_range_samples,2);assert(!JSON.stringify(requests[0]).includes('Synthetic phone'));
  await page.getByRole('button',{name:'Close companion',exact:true}).click();
  // Legacy journal entries retain summaries without presenting old range counts as verified.
  await page.evaluate(()=>{for(const s of current().stats)for(const key of ['diagnosticsVersion','firstSeconds','lastSeconds','maximumRange','reportingMode'])delete s[key];render();});
  await page.locator('.ride-source-notes>summary').click();
  assert.equal(await acc.locator('.sensor-health-flag').textContent(),'Range not assessed');assert.match(await acc.locator('.sensor-health-facts').textContent(),/Before first sampleNot supplied/);
  assert.deepEqual(errors,[]);
  console.log('PASS: raw ZIP diagnostic cards, range/status provenance, scalar/one-sample handling, legacy unknowns, responsive layout and explicit mock Meta request');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
