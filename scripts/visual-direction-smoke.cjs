const assert=require('node:assert/strict'),{chromium}=require('playwright'),{seed}=require('./studio-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4178');await p.locator('.overview-welcome').waitFor();await p.evaluate(seed);
  assert.equal(await p.locator('#map-canvas canvas').getAttribute('data-marker'),'arrow');
  await p.locator('[data-open-insights]').click();await p.getByRole('button',{name:'Pause insights',exact:true}).click();await p.locator('#reel-timeline').fill('440');await p.locator('#reel-timeline').dispatchEvent('input');
  assert.equal(await p.locator('#reel-scene canvas').getAttribute('data-marker'),'arrow');assert.equal(await p.locator('#reel-route-view').inputValue(),'isometric');
  await p.screenshot({path:'/tmp/odo-arrow-mobile.png'});
  await p.locator('[data-reel-chapter="3"]').click();await p.locator('#reel-timeline').fill('400');await p.locator('#reel-timeline').dispatchEvent('input');
  await p.locator('#modal').evaluate(d=>d.scrollTop=0);
  const domain=await p.evaluate(()=>{const d=OdoInsightReel.analyze(current()),c=document.querySelector('#reel-scene canvas');return {min:d.telemetry.altitudeMin,max:d.telemetry.altitudeMax,legendMin:Number(c.dataset.elevationMin),legendMax:Number(c.dataset.elevationMax),ticks:c.dataset.elevationTicks.split(',').map(Number),label:c.getAttribute('aria-label')};});
  assert.equal(domain.min,domain.legendMin);assert.equal(domain.max,domain.legendMax);assert(domain.ticks[0]<=domain.min);assert(domain.ticks.at(-1)>=domain.max);assert.match(domain.label,/Cyan .* meters, white .* meters, red .* meters/);
  for(const width of [320,390,650,768,1440]){await p.setViewportSize({width,height:900});await p.locator('#modal').evaluate(d=>d.scrollTop=0);await p.waitForFunction(()=>{const h=document.querySelector('#reel-scene'),c=h.querySelector('canvas');return Math.abs(h.clientWidth-c.clientWidth)<1;});assert(await p.locator('#modal').evaluate(d=>d.scrollWidth<=d.clientWidth+1));assert(Number(await p.locator('#reel-scene canvas').getAttribute('data-elevation-axis-left'))>=0,`Meter ticks clipped at ${width}px`);const box=await p.locator('#reel-scene').boundingBox(),hero=await p.locator('.reel-hero-metric').boundingBox();assert(box.y>=hero.y+hero.height-1,'Elevation canvas must clear the distance header');}
  await p.screenshot({path:'/tmp/odo-axis-desktop.png'});await p.setViewportSize({width:390,height:844});await p.locator('#modal').evaluate(d=>d.scrollTop=0);await p.waitForTimeout(100);await p.screenshot({path:'/tmp/odo-axis-mobile.png'});
  await p.getByRole('button',{name:'Close ride insights'}).click();
  const wideLabels=await p.evaluate(()=>{
   const host=document.createElement('div');Object.assign(host.style,{position:'fixed',left:'-1000px',width:'310px',height:'356px'});document.body.append(host);
   const ride=structuredClone(current());ride.track.forEach((point,i)=>point[5]=-1000+11000*i/(ride.track.length-1));
   const scene=OdoInsightScene.create(host,OdoInsightReel.analyze(ride)),canvas=scene.draw('elevation',.4,1),left=Number(canvas.dataset.elevationAxisLeft);scene.dispose();host.remove();return left;
  });assert(wideLabels>=0,'Negative and five-digit meter labels must fit');
  for(const page of ['overview','rides','garage','community','settings']){
   await p.evaluate(page=>navigate(page),page);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390,`${page} overflow`);
   const palette=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement),body=getComputedStyle(document.body);return {cyan:s.getPropertyValue('--odo-cyan').trim(),red:s.getPropertyValue('--odo-red').trim(),background:body.backgroundColor};});
   assert.equal(palette.cyan,'#3bd8e6');assert.equal(palette.red,'#ff4655');assert.equal(palette.background,'rgb(8, 9, 11)');await p.screenshot({path:`/tmp/odo-theme-${page}-mobile.png`});
  }
  await p.setViewportSize({width:1440,height:1100});await p.evaluate(()=>navigate('overview'));await p.screenshot({path:'/tmp/odo-theme-overview-desktop.png'});assert.deepEqual(errors,[]);
  console.log('PASS: racing arrows in both route renderers, 3D default, numeric elevation axis and matching legend, responsive graph layout, and shared dark palette across app pages.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
