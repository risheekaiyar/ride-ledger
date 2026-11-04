const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];let tiles=0,posts=0;
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts++;});
  await page.route('https://tile.openstreetmap.org/**',r=>{tiles++;return r.abort();});
  await page.goto('http://127.0.0.1:4178');await page.locator('.overview-welcome').waitFor();
  await page.evaluate(async()=>{
   for(let n=0;n<47;n++){
    const points=Array.from({length:60},(_,i)=>({lon:77+Math.cos(i/10)*.006*(1+.25*Math.sin(i/3+n)),lat:12+Math.sin(i/10)*.004+i*.00005,time:Date.UTC(2026,10,1,8)-n*86400000+i*10000,segment:0}));
    const ride=OdoPortable.fromPoints(points,`Synthetic ${n%3===0?'dawn':'evening'} journey ${n}`);
    ride.bike_id=n%2===0?'Triumph T120':'Honda CB500X';ride.recurring=n%4===0?'Harbour loop':'';ride.kind=n%5===0?'walk':n%5===1?'unclassified':'ride';await saveRide(ride);
   }
   navigate('journeys');window.originalRow=document.querySelector('.library-ride');window.originalStatus=document.querySelector('#library-load-status');
  });
  const count=()=>page.locator('.library-ride').count(),more=page.locator('[data-library-more]'),search=page.locator('#library-search'),toggle=page.locator('[data-library-filter]');
  assert.equal(await count(),20);assert.equal(await page.locator('#library-count').textContent(),'47 saved journeys');assert.equal(tiles,0);
  await more.click();assert.equal(await count(),40);
  assert.equal(await page.evaluate(()=>document.querySelector('.library-ride')===window.originalRow),true,'Existing route previews remain mounted');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.ride===rides[20].id),true);
  await more.click();assert.equal(await count(),47);assert.equal(await more.isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.dataset.ride===rides[40].id),true);
  assert.equal(await page.evaluate(()=>document.querySelector('#library-load-status')===window.originalStatus),true,'Live status node survives loading');
  assert.equal(await page.evaluate(()=>{const ids=Array.from(document.querySelectorAll('.route-relief [id]'),x=>x.id);return new Set(ids).size===ids.length;}),true);
  await page.evaluate(()=>{selected=rides[0].id;navigate('detail');navigate('journeys');});assert.equal(await count(),47,'Loaded batch survives navigation');
  await page.reload();await page.locator('.rides-experience').waitFor();assert.equal(await count(),20,'Reload starts with one batch');
  await toggle.click();await search.fill(' DAWN ');assert.equal(await count(),16);assert.equal(await search.evaluate(el=>document.activeElement===el),true);
  assert.equal(await page.locator('#library-count').textContent(),'16 matching journeys');assert.match(await page.locator('.library-match').first().textContent(),/Title: Synthetic dawn/);
  await page.locator('[data-filter=walk]').click();assert.equal(await count(),4);assert.equal(await page.locator('[data-filter=walk]').getAttribute('aria-pressed'),'true');
  await toggle.click();assert.equal(await search.isVisible(),false);assert.match(await page.locator('#library-criteria').textContent(),/Walks · Search: “DAWN”/);
  await page.locator('[data-library-reset]').click();assert.equal(await count(),20);assert.equal(await search.isVisible(),true);assert.equal(await search.evaluate(el=>document.activeElement===el),true);
  await search.fill('tRiUmPh');assert.equal(await count(),20);assert.equal(await page.locator('#library-count').textContent(),'24 matching journeys');await more.click();assert.equal(await count(),24);
  await page.locator('.library-ride').first().click();await page.locator('.track-studio').waitFor();await page.evaluate(()=>navigate('journeys'));
  assert.equal(await count(),24);assert.equal(await search.inputValue(),'tRiUmPh');assert.equal(await search.isVisible(),true,'Search and its loaded window survive ride review');
  await search.fill('HARBOUR');assert.equal(await count(),12);assert.match(await page.locator('.library-match').first().textContent(),/Route: Harbour loop/);await page.locator('[data-filter=recurring]').click();assert.equal(await count(),12);
  await page.locator('[data-library-reset]').click();await search.fill('No such journey');assert.equal(await count(),0);await toggle.click();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();assert.equal(await count(),20);assert.equal(await search.isVisible(),true);assert.equal(await search.evaluate(el=>document.activeElement===el),true);
  // Composing text must not replace the list mid-composition; completion applies it once.
  await search.evaluate(el=>{el.value='dawn';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});assert.equal(await count(),20);
  await search.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));assert.equal(await count(),16);
  await search.evaluate(el=>{el.focus();el.setSelectionRange(1,3);el.dispatchEvent(new InputEvent('input',{bubbles:true}));});assert.deepEqual(await search.evaluate(el=>[el.selectionStart,el.selectionEnd]),[1,3]);
  await page.locator('#library-search-clear').click();
  // Consent a real MapLibre instance, with tile requests blocked by the test.
  await page.getByRole('button',{name:'Map background',exact:true}).click();await page.getByRole('button',{name:'Load map',exact:true}).click();
  await page.waitForFunction(()=>libraryMap!==null&&document.querySelector('#library-map-status').textContent.startsWith('Map unavailable'));
  await page.evaluate(()=>window.originalLibraryMap=libraryMap);assert(tiles>0);
  await more.click();await search.fill('dawn');await page.locator('[data-filter=ride]').click();
  assert.equal(await page.evaluate(()=>libraryMap===window.originalLibraryMap),true,'Search, filters and batches preserve the consented map');
  assert.equal(await page.locator('.library-ride').count(),9);
  await page.locator('[data-library-reset]').click();
  // A late import can reorder results between render and the next batch request.
  await page.evaluate(()=>{rides.unshift({...rides[0],id:'synthetic-late-import',started:rides[0].started+1});});await more.click();
  assert.equal(await count(),20);assert.equal(await page.locator('.library-ride').first().getAttribute('data-ride'),'synthetic-late-import');assert.equal(await page.locator('#library-count').textContent(),'48 saved journeys');
  assert.match(await page.locator('#library-load-status').textContent(),/Journal updated/);assert.equal(await page.evaluate(()=>libraryMap===window.originalLibraryMap),true);
  // Thousands of already-analyzed journal entries must not produce thousands of SVGs.
  const elapsed=await page.evaluate(()=>{
   disposeLibraryMap();libraryMapEnabled=false;
   const templates=rides.slice(0,47);rides=Array.from({length:1200},(_,i)=>({...templates[i%47],track:templates[i%47].track.map(p=>[...p]),id:`synthetic-large-${i}`,started:Date.UTC(2026,10,1)-i*3600000}));
   libraryLimit=20;const before=performance.now();render();return performance.now()-before;
  });
  assert.equal(await count(),20);assert.equal(await page.locator('.route-thumbnail svg').count(),20);assert.equal(await page.locator('#library-count').textContent(),'1200 saved journeys');
  await search.fill('x'.repeat(120));
  for(const width of [320,390,650,768,1050,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`Search overflow at ${width}`);}
  await page.locator('[data-library-reset]').click();await search.fill('Triumph');
  await page.setViewportSize({width:390,height:844});await page.locator('.rides-sheet-head').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/odo-library-search-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/tmp/odo-library-search-desktop.png'});
  await page.setViewportSize({width:390,height:844});await more.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/odo-library-batch-mobile.png'});
  await more.click();assert.equal(await count(),40);
  assert.equal(posts,0,'Browsing never sends ride data or model requests');assert.deepEqual(errors,[]);
  console.log(`PASS: 20-row batches, stable SVG/status/map nodes, focus, search/filter/composition, navigation, stale-order recovery, 320–1440px; 1200-entry in-memory render ${elapsed.toFixed(0)}ms`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
