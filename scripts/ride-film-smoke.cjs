const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright'),{seed}=require('./track-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],remote=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:4178|blob:|data:)/.test(r.url()))remote.push(r.url());});
  await p.goto('http://127.0.0.1:4178');await p.waitForSelector('.studio-hero');await p.evaluate(seed);await p.evaluate(()=>seekTrackTime(123));
  await p.getByRole('button',{name:'Make clip',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#film-status').textContent.includes('24 fps'));
  assert.equal(await p.evaluate(()=>trackScene),null);assert(!(await p.locator('#film-route').isChecked()));assert(!(await p.locator('#film-speed').isChecked()));assert(await p.locator('#film-render').isDisabled());
  const initial=await p.locator('#film-canvas').evaluate(c=>c.toDataURL());await p.locator('#film-timeline').fill('500');assert.notEqual(await p.locator('#film-canvas').evaluate(c=>c.toDataURL()),initial);
  await p.locator('#film-headline').fill('SYNTHETIC / CIRCUIT STUDY');await p.locator('#film-accent').selectOption('ice');
  await p.screenshot({path:'/tmp/odo-film-editor-desktop.png'});
  await p.setViewportSize({width:390,height:844});await p.locator('#modal').evaluate(d=>d.scrollTop=0);await p.screenshot({path:'/tmp/odo-film-editor-mobile.png'});
  for(const width of [320,390,650,768,1440]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width,`Film editor overflow at ${width}px`);assert(await p.locator('#modal').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
  await p.locator('#film-route').check();await p.locator('#film-render').click();await p.waitForFunction(()=>document.querySelector('#film-progress').value>0);await p.locator('#film-cancel').click();await p.waitForFunction(()=>document.querySelector('#film-cancel').hidden);assert(await p.locator('#film-save').isDisabled());assert.match(await p.locator('#film-status').textContent(),/cancelled/);
  await p.locator('#film-render').click();await p.waitForFunction(()=>document.querySelector('#film-progress').value>0);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await p.waitForFunction(()=>document.querySelector('#film-cancel').hidden);assert.match(await p.locator('#film-status').textContent(),/background/);await p.evaluate(()=>{delete document.hidden;});
  await p.locator('#film-render').click();await p.waitForFunction(()=>!document.querySelector('#film-save').disabled||document.querySelector('#film-cancel').hidden,{},{timeout:190000});
  assert(!(await p.locator('#film-save').isDisabled()),await p.locator('#film-status').textContent());
  await p.locator('#film-video').evaluate(async video=>{if(video.readyState<1)await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=reject;});});
  assert.deepEqual(await p.locator('#film-video').evaluate(v=>[v.videoWidth,v.videoHeight,Math.round(v.duration)]),[720,1280,12]);
  const download=p.waitForEvent('download');await p.locator('#film-save').click();const file=await download;assert.equal(file.suggestedFilename(),'odo-ride.mp4');await file.saveAs('/tmp/odo-ride-film-synthetic.mp4');
  const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type,width,height,nb_frames,avg_frame_rate','-of','json','/tmp/odo-ride-film-synthetic.mp4'],{encoding:'utf8'}));
  assert.equal(meta.streams.length,1);assert.equal(meta.streams[0].codec_name,'h264');assert.equal(meta.streams[0].avg_frame_rate,'24/1');assert.equal(+meta.streams[0].nb_frames,288);assert.equal(+meta.format.duration,12);assert(+meta.format.size<12*1024*1024);
  execFileSync('ffmpeg',['-y','-v','error','-ss','6','-i','/tmp/odo-ride-film-synthetic.mp4','-frames:v','1','/tmp/odo-film-mid-synthetic.png']);
  await p.evaluate(()=>{window.RideNative={shareClip(id,data){window.clipHeader=data.slice(0,22);window.clipBytes=data.length;setTimeout(()=>window.odoClipShared(id,null),20);}};});
  await p.locator('#film-save').click();await p.waitForFunction(()=>document.querySelector('#film-status').textContent.startsWith('Share sheet opened'));assert.match(await p.evaluate(()=>window.clipHeader),/^data:video\/mp4;base64,/);assert((await p.evaluate(()=>window.clipBytes))>1000);
  await p.evaluate(()=>{window.RideNative.shareClip=(id)=>setTimeout(()=>window.odoClipShared(id,'Synthetic native rejection'),20);});await p.locator('#film-save').click();await p.waitForFunction(()=>document.querySelector('#film-status').textContent==='Synthetic native rejection');assert(!(await p.locator('#film-save').isDisabled()));
  await p.getByRole('button',{name:'Close motion studio',exact:true}).click();await p.waitForSelector('#map-canvas[data-renderer=webgl] canvas');assert.equal(await p.evaluate(()=>trackTime),123);assert.equal(await p.locator('.film-render-host').count(),0);
  // Old APKs cannot silently fall through to an unsupported WebView download.
  await p.evaluate(()=>{window.RideNative={shareStory(){}};});await p.getByRole('button',{name:'Make clip',exact:true}).click();assert.match(await p.locator('#film-status').textContent(),/Update the Android app/);assert(await p.locator('#film-render').isDisabled());await p.getByRole('button',{name:'Close motion studio',exact:true}).click();
  await p.evaluate(()=>{delete window.RideNative;OdoRideFilm.encoder=async()=>null;});await p.getByRole('button',{name:'Make clip',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#film-status').textContent.startsWith('Video encoding is unavailable'));assert(await p.locator('#film-render').isDisabled());
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await p.locator('.film-render-host').count(),0);assert.equal(await p.evaluate(()=>trackScene),null);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  console.log('PASS: explicit route/speed sharing, frame-by-frame 24 fps H.264, exact duration, cancellation/background cleanup, responsive editor, native success/error callbacks, legacy/unsupported states and no external requests');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
