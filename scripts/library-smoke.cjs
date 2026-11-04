const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata'});
  page.setDefaultTimeout(15000);
  const errors=[];let tiles=0;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://tile.openstreetmap.org/**',route=>{tiles++;return route.abort();});
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');
  await page.evaluate(async()=>{
   for(let n=0;n<3;n++){
    const points=Array.from({length:n===2?81:25},(_,i)=>{const a=i/80*Math.PI*2;return {lon:77+(n===2?Math.cos(a)*.008*(1+.18*Math.sin(a*3)):Math.sin(i/4+n)*.01),lat:12+(n===2?Math.sin(a)*.007:i*.0008),time:Date.UTC(2026,10,1,1,30)+n*86400000+i*10000,segment:0};});
    const ride=OdoPortable.fromPoints(points,['Synthetic · morning bends','Synthetic · the long way home','Synthetic · a deliberately long journey title to test wrapping'][n]);await saveRide(ride);
   }
   navigate('journeys');
  });
  assert.equal(await page.locator('.route-thumbnail svg').count(),3);
  assert.equal(await page.locator('#nav button:visible').count(),3);
  assert.equal(await page.locator('.library-source').first().textContent(),'GPX import');
  assert.equal(await page.locator('.library-peak').first().textContent(),'EST. PEAK');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  assert.equal(tiles,0,'Library must not load map tiles without consent');
  await page.screenshot({path:'/tmp/odo-library-mobile.png',fullPage:true});
  await page.screenshot({path:'/tmp/odo-library-viewport.png'});
  await page.setViewportSize({width:1440,height:1100});
  assert.equal(await page.locator('#nav button:visible').count(),6);
  await page.screenshot({path:'/tmp/odo-library-desktop.png',fullPage:true});
  for(const width of [320,650,680,768]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`Overflow at ${width}px`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Open rider menu',exact:true}).click();
  await page.locator('[data-rider-destination=settings]').click();
  assert.equal(await page.locator('#modal').evaluate(d=>d.open),false);
  assert.equal(await page.evaluate(()=>window.scrollY),0);
  await page.evaluate(()=>navigate('journeys'));
  await page.getByRole('button',{name:'Search and filter journeys',exact:true}).click();
  await page.locator('[data-filter=ride]').click();
  assert.equal(await page.locator('[data-ride]').count(),0);
  await page.getByText('No journeys in this view.',{exact:true}).waitFor();
  await page.locator('[data-filter=all]').click();
  assert.equal(await page.locator('[data-ride]').count(),3);
  await page.getByRole('button',{name:'Map background',exact:true}).click();
  await page.getByRole('button',{name:'Keep offline',exact:true}).click();
  assert.equal(tiles,0);
  await page.getByRole('button',{name:'Map background',exact:true}).click();
  await page.getByRole('button',{name:'Load map',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#library-map-status').textContent.startsWith('Map unavailable'));
  assert(tiles>0,'The consented map attempted tiles');
  assert.equal(await page.locator('#library-atlas').evaluate(el=>el.classList.contains('with-geography')),false);
  await page.getByRole('button',{name:'Hide map',exact:true}).click();
  assert.equal(await page.locator('#library-map canvas').count(),0);
  await page.getByText('Your latest route · offline',{exact:true}).waitFor();
  await page.locator('[data-ride]').first().click();
  await page.locator('[data-track-view="2d"]').click();await page.locator('#map-canvas svg').waitFor();
  assert(!/NaN|Infinity/.test(await page.locator('#map-canvas').innerHTML()));
  // An imported ride with no calculable speed must not acquire a zero or invented peak.
  await page.evaluate(()=>{rides[0].track=rides[0].track.map(p=>{const copy=[...p];copy[3]=null;return copy;});navigate('journeys');});
  assert.equal(await page.locator('.library-peak').first().textContent(),'NO SPEED');
  assert.equal(await page.locator('.ride-values strong').first().textContent(),'—');
  assert.deepEqual(errors,[]);
  console.log('PASS: raised route previews, responsive library, source labels, missing speed, filters, rider menu, map consent/fallback and detail navigation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
