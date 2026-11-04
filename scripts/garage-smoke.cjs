const assert=require('node:assert/strict'),{chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata'}),errors=[];
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  let posts=0;page.on('request',r=>{if(r.method()==='POST')posts++;});
  await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');
  await page.evaluate(()=>navigate('garage'));
  assert.match(await page.locator('.garage-odometer strong').textContent(),/—/);
  assert.match(await page.locator('.garage-log-stats').textContent(),/0 of 0 rides/);
  assert.equal(await page.locator('[data-garage-debrief]').count(),0);
  await page.getByRole('button',{name:'Edit bike details',exact:true}).click();
  const field=name=>page.locator(`#bike-form [name=${name}]`);
  await field('name').fill('   ');await page.getByRole('button',{name:'Save bike details',exact:true}).click();
  assert.equal(await page.evaluate(()=>prefs.bike.name),'Hero Xpulse 200 2V','Whitespace cannot erase the bike identity');
  await field('name').fill('  Synthetic · Sunday machine  ');await field('type').selectOption('Adventure');
  await field('odometer').fill('0');await field('plate').fill('Private nickname');await field('notes').fill('Synthetic luggage setup');
  await page.getByRole('button',{name:'Save bike details',exact:true}).click();
  assert.equal(await page.locator('.garage-odometer strong').textContent(),'0 km');
  await page.reload();await page.waitForSelector('.studio-hero');await page.evaluate(()=>navigate('garage'));
  assert.deepEqual(await page.evaluate(()=>[prefs.bike.name,prefs.bike.type,prefs.bike.odometer,prefs.bike.plate,prefs.bike.notes]),['Synthetic · Sunday machine','Adventure','0','Private nickname','Synthetic luggage setup']);
  await page.evaluate(async()=>{
   const points=Array.from({length:31},(_,i)=>({lon:77+i*.0001,lat:12+Math.sin(i/3)*.0001,time:Date.UTC(2026,10,3,1,30)+i*2000,segment:0}));
   const r=OdoPortable.fromPoints(points,'Synthetic · Sunday bends');
   Object.assign(r,{id:'garage-supported',source:'Ride Ledger ZIP',kind:'ride',bike_id:prefs.bike.name,placement:'Pocket',mount_condition:'Not mounted',device:'Synthetic phone',finalized:true,quality:100,distanceIntegrity:true,distanceKm:.3});
   await saveRide(r);
   await saveRide({...r,id:'garage-uncertain',started:r.started+86400000,title:'Synthetic · latest setup',placement:'Rigid mount',mount_condition:'Slipping',distanceIntegrity:false,distanceKm:99});
   await saveRide({...r,id:'garage-other-bike',started:r.started+2*86400000,bike_id:'Different bike',distanceKm:88});
   await saveRide({...r,id:'garage-walk',started:r.started+3*86400000,kind:'walk',distanceKm:77});
   selected='garage-other-bike';navigate('garage');
  });
  const values=page.locator('.garage-log-stats strong');
  assert.equal(await values.nth(0).textContent(),'2');assert.equal(await values.nth(2).textContent(),'0.3 km');
  assert.match(await page.locator('.garage-log-stats').textContent(),/1 of 2 rides support distance/);
  assert.match(await page.locator('.garage-setup-facts').textContent(),/Rigid mount/);
  assert.equal(await page.locator('.garage-odometer strong').textContent(),'0 km','GPS never increments the manual reading');
  await page.getByRole('button',{name:'Debrief this ride',exact:true}).click();
  assert.equal(await page.evaluate(()=>selected),'garage-uncertain');assert.match(await page.locator('#modal').innerText(),/Synthetic · latest setup/);
  assert.equal(posts,0,'Opening the debrief does not send evidence');
  await page.getByRole('button',{name:'Close companion',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/tmp/odo-garage-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1100});await page.evaluate(()=>render());
  await page.screenshot({path:'/tmp/odo-garage-desktop.png',fullPage:true});
  for(const width of [320,390,650,768,900,1050,1440]){
   await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'Edit bike details',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`Garage overflow at ${width}px`);
  }
  // A tall synthetic fixture proves both image dimensions are bounded, and same-file re-selection works.
  const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1000;c.height=3000;const ctx=c.getContext('2d');ctx.fillStyle='#3d343d';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#ead9c0';ctx.font='80px sans-serif';ctx.fillText('SYNTHETIC',100,300);return c.toDataURL('image/png').split(',')[1];});
  const photo={name:'synthetic-garage.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
  await page.locator('#photo-input').setInputFiles(photo);await page.locator('.garage-hero-visual img').waitFor();
  const dimensions=await page.locator('.garage-hero-visual img').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight];});
  assert.deepEqual(dimensions,[300,900]);assert.equal(await page.locator('#photo-input').inputValue(),'');
  await page.getByRole('button',{name:'Edit bike details',exact:true}).click();await page.getByRole('button',{name:'Remove saved photo',exact:true}).click();
  assert.equal(await page.locator('.garage-hero-visual img').count(),0);
  await page.locator('#photo-input').setInputFiles(photo);await page.locator('.garage-hero-visual img').waitFor();
  await page.reload();await page.waitForSelector('.studio-hero');await page.evaluate(()=>navigate('garage'));await page.locator('.garage-hero-visual img').waitFor();
  await page.getByRole('button',{name:'Edit bike details',exact:true}).click();await field('name').fill('Another nickname');await field('type').selectOption('Unknown');
  await page.getByRole('button',{name:'Save bike details',exact:true}).click();
  assert.equal(await values.nth(0).textContent(),'0');assert.equal(await values.nth(2).textContent(),'— km');
  assert.equal(await page.evaluate(()=>rides.find(r=>r.id==='garage-supported').bike_id),'Synthetic · Sunday machine');
  await page.evaluate(()=>{prefs.recordingSetup={bike_type:'Sport'};window.RideNative={recordingCapabilities(){return JSON.stringify({schema:1,gps_enabled:true,sensors:[]})}};});
  await page.getByRole('button',{name:'Record this bike',exact:true}).click();
  assert.equal(await page.locator('#record-form [name=bike_type]').inputValue(),'Unknown','Explicit profile choice takes priority over previous recording');
  assert.equal(await page.locator('#record-form [name=bike_id]').inputValue(),'Another nickname');
  await page.getByRole('button',{name:'Close recording setup',exact:true}).click();
  await page.evaluate(()=>{window.stops=0;window.RideNative.stop=()=>window.stops++;recording=true;});
  await page.getByRole('button',{name:'Record this bike',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.stops),0,'A stale record action must not stop an active journey');
  assert.match(await page.locator('#toast').textContent(),/already recording/);
  assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: garage profile persistence/zero reading, bike-specific evidence totals, correct debrief selection, responsive editor, bounded local photo/remove/reselect and recording context');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
