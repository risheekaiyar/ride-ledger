const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright'),{seed}=require('./track-fixture.cjs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4178');await page.waitForSelector('.studio-hero');await page.evaluate(seed);await page.getByRole('button',{name:'Share card',exact:true}).click();
 assert.equal(await page.locator('#story-route').isChecked(),false);await page.locator('#story-title').fill('THE LONG WAY HOME.');
 const save=async name=>fs.writeFileSync('/tmp/'+name,Buffer.from((await page.locator('#story-canvas').evaluate(c=>c.toDataURL('image/png'))).split(',')[1],'base64'));
 await save('odo-poster-typography.png');await page.locator('#story-route').check();await page.waitForFunction(()=>document.querySelector('#story-status').textContent.startsWith('3D track edition'));
 for(const [format,height] of [['story',1920],['portrait',1350],['square',1080]]){
  await page.locator('#story-format').selectOption(format);await page.waitForFunction(()=>!document.querySelector('#story-download').disabled);assert.equal(await page.locator('#story-canvas').evaluate(c=>c.height),height);await save('odo-poster-'+format+'.png');
 }
 await page.locator('#story-accent').selectOption('ice');await page.waitForFunction(()=>!document.querySelector('#story-download').disabled);await save('odo-poster-ice.png');
 await page.locator('#story-route').uncheck();assert.match(await page.locator('#story-status').textContent(),/route hidden/);
 await page.locator('#story-route').check();await page.waitForFunction(()=>!document.querySelector('#story-download').disabled);const download=page.waitForEvent('download');await page.locator('#story-download').click();assert.equal((await download).suggestedFilename(),'odo-ride.png');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:'/tmp/odo-poster-editor-mobile.png'});
 await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await page.locator('.story-modal').count(),0);assert.equal(await page.locator('body > [aria-hidden=true]').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: route opt-in, actual 3D poster, three formats, two editions, PNG download, mobile editor and resource cleanup');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
