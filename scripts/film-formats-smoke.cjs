const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright'),{seed}=require('./track-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:390,height:1000}}),errors=[],remote=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:4178|blob:|data:)/.test(r.url()))remote.push(r.url());});
  await p.goto('http://127.0.0.1:4178');await p.waitForSelector('.studio-hero');await p.evaluate(seed);await p.getByRole('button',{name:'Make clip',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#film-status').textContent.includes('24 fps'));
  assert.equal(await p.locator('#film-format').inputValue(),'story');assert(!(await p.locator('#film-route').isChecked()));assert(!(await p.locator('#film-speed').isChecked()));
  await p.locator('#film-headline').fill('SYNTHETIC / CIRCUIT STUDY');await p.locator('#film-accent').selectOption('ice');await p.locator('#film-timeline').fill('500');
  for(const [format,height,routeHeight] of [['story',1280,548],['portrait',900,340],['square',720,276]]){
   await p.locator('#film-format').selectOption(format);await p.waitForFunction(()=>document.querySelector('#film-status').textContent.includes('24 fps'));
   assert.deepEqual(await p.locator('#film-canvas').evaluate(c=>[c.width,c.height]),[720,height]);assert.deepEqual(await p.locator('.film-render-host canvas').evaluate(c=>[c.width,c.height]),[720,routeHeight]);assert.match(await p.locator('#film-dimensions').textContent(),new RegExp('720 × '+height));assert(await p.locator('#film-render').isDisabled());
   const data=await p.locator('#film-canvas').evaluate(c=>c.toDataURL('image/png'));fs.writeFileSync('/tmp/odo-film-'+format+'-composition.png',Buffer.from(data.split(',')[1],'base64'));
   for(const width of [320,390,650,768,1440]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);assert(await p.locator('#modal').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
   await p.locator('#modal').evaluate(d=>d.scrollTop=0);await p.screenshot({path:'/tmp/odo-film-'+format+'-editor-desktop.png'});await p.setViewportSize({width:390,height:1000});await p.locator('#modal').evaluate(d=>d.scrollTop=0);await p.screenshot({path:'/tmp/odo-film-'+format+'-editor-mobile.png'});
  }
  console.log('PASS: all three compositions, scene/canvas dimensions, explicit sharing defaults and responsive previews');
  await p.locator('#film-route').check();
  for(const [format,height] of [['portrait',900],['square',720]]){
   await p.locator('#film-format').selectOption(format);await p.waitForFunction(()=>!document.querySelector('#film-render').disabled);await p.locator('#film-render').click();assert(await p.locator('#film-format').isDisabled());
   await p.waitForFunction(()=>!document.querySelector('#film-save').disabled||document.querySelector('#film-cancel').hidden,{},{timeout:190000});assert(!(await p.locator('#film-save').isDisabled()),await p.locator('#film-status').textContent());
   await p.locator('#film-video').evaluate(async video=>{if(video.readyState<1)await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=reject;});});
   assert.deepEqual(await p.locator('#film-video').evaluate(v=>[v.videoWidth,v.videoHeight,Math.round(v.duration)]),[720,height,12]);
   const downloaded=p.waitForEvent('download');await p.locator('#film-save').click();const file=await downloaded,path='/tmp/odo-film-'+format+'-synthetic.mp4';await file.saveAs(path);
   const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type,width,height,nb_frames,avg_frame_rate','-of','json',path],{encoding:'utf8'}));
   assert.equal(meta.streams.length,1);assert.equal(meta.streams[0].codec_name,'h264');assert.equal(meta.streams[0].width,720);assert.equal(meta.streams[0].height,height);assert.equal(meta.streams[0].avg_frame_rate,'24/1');assert.equal(+meta.streams[0].nb_frames,288);assert.equal(+meta.format.duration,12);assert(+meta.format.size<12*1024*1024);
   execFileSync('ffmpeg',['-y','-v','error','-ss','6','-i',path,'-frames:v','1','/tmp/odo-film-'+format+'-decoded.png']);console.log('PASS: actual '+format+' H.264 clip, 288 frames / 12 seconds, dimensions and no audio');
  }
  // A format change invalidates the old clip and ignores out-of-order support checks.
  await p.evaluate(async()=>{window.savedFilmEncoder=OdoRideFilm.encoder;window.formatCodecs=await Promise.all(['story','portrait','square'].map(f=>OdoRideFilm.encoder(f)));window.formatChecks={};OdoRideFilm.encoder=format=>new Promise(resolve=>window.formatChecks[format]=resolve);});
  await p.locator('#film-format').selectOption('story');assert(await p.locator('#film-save').isDisabled());assert(await p.locator('#film-video').evaluate(v=>v.hidden&&!v.getAttribute('src')));await p.locator('#film-format').selectOption('portrait');await p.locator('#film-format').selectOption('square');
  await p.evaluate(()=>{window.formatChecks.portrait(null);window.formatChecks.story(window.formatCodecs[0]);});assert(await p.locator('#film-render').isDisabled());assert.match(await p.locator('#film-status').textContent(),/Checking video support/);
  await p.evaluate(()=>window.formatChecks.square(window.formatCodecs[2]));await p.waitForFunction(()=>!document.querySelector('#film-render').disabled);assert.deepEqual(await p.locator('#film-canvas').evaluate(c=>[c.width,c.height]),[720,720]);
  await p.locator('#film-format').selectOption('story');await p.getByRole('button',{name:'Close motion studio',exact:true}).click();await p.evaluate(()=>window.formatChecks.story(window.formatCodecs[0]));await p.locator('.film-render-host').waitFor({state:'detached'});assert.equal(await p.locator('.film-render-host').count(),0);assert.equal(await p.locator('#modal').evaluate(d=>d.open),false);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);console.log('PASS: stale codec responses ignored, changed format invalidates rendered media, closed preview releases scene; no external requests');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
