const assert=require('node:assert/strict'),{chromium}=require('playwright'),{seed}=require('./road-fixture.cjs'),{seed:gapSeed}=require('./studio-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:4178');await p.locator('.overview-welcome').waitFor();await p.evaluate(seed);
  await p.locator('[data-open-insights]').click();await p.getByRole('button',{name:'Pause insights',exact:true}).click();await p.locator('#reel-timeline').fill('440');await p.locator('#reel-timeline').dispatchEvent('input');
  assert.equal(await p.locator('#reel-scene canvas').getAttribute('data-renderer'),'webgl-route');
  await p.screenshot({path:'/tmp/odo-diorama-desktop.png'});
  const perspective=await p.locator('#reel-scene canvas').screenshot();await p.locator('#reel-route-view').selectOption('radar');assert.notDeepEqual(await p.locator('#reel-scene canvas').screenshot(),perspective);await p.locator('#reel-route-view').selectOption('isometric');
  for(const width of [320,390,650,768,1440]){
   await p.setViewportSize({width,height:844});await p.waitForFunction(()=>{const h=document.querySelector('#reel-scene'),c=h.querySelector('canvas');return Math.abs(c.clientWidth-h.clientWidth)<1&&Math.abs(c.clientHeight-h.clientHeight)<1;});
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);assert(await p.locator('#modal').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
   await p.locator('#modal').evaluate(d=>d.scrollTop=0);const map=await p.locator('#reel-scene canvas').boundingBox(),controls=await p.locator('#reel-route-tools').boundingBox();assert(map.y+map.height<=controls.y+2,`Map overlaps controls at ${width}px`);
   if(width===390)await p.screenshot({path:'/tmp/odo-diorama-mobile.png'});
  }
  await p.getByRole('button',{name:'Close ride insights'}).click();await p.evaluate(gapSeed);
  const result=await p.evaluate(()=>{
   const host=document.createElement('div');Object.assign(host.style,{position:'fixed',inset:'0',width:'500px',height:'400px',zIndex:9999});document.body.append(host);
   const ride=current(),before=JSON.stringify(ride),scene=OdoTrackScene.create(host,ride,{autoRender:false,transparent:true,continuous:true,pixelRatio:1}),model=scene.model;
   scene.rotate(0);scene.renderFrame(ride.duration*.4);const initial=scene.snapshot(),marker=scene.markerState();
   scene.rotate(360);const fullTurn=scene.snapshot();scene.rotate(90);const quarter=scene.snapshot();scene.renderFrame(ride.duration*.5);const preserved=Math.abs(scene.cameraState().yaw-Math.PI/2)<1e-8;
   scene.rotate(0);scene.renderFrame(ride.duration);scene.renderFrame(ride.duration*.4);const reverse=scene.snapshot();scene.reset();const resetYaw=scene.cameraState().yaw;
   const gap=model.points.find((q,i)=>i&&q.segment!==model.points[i-1].segment),gapTime=(model.points[gap.index-1].time+gap.time)/2;
   scene.renderFrame(gapTime);const gapMarker=scene.markerState(),source=OdoTrackModel.atTime(model,gapTime),presentation=OdoRoutePresentation.atTime(model,gapTime);
   scene.renderFrame(ride.duration*.1);const firstFrame=scene.snapshot();scene.renderFrame(ride.duration*.9);const lastFrame=scene.snapshot();
   const count=model.points.length,unchanged=JSON.stringify(ride)===before;scene.dispose();scene.dispose();const removed=host.childElementCount===0;
   // The technical inspection view still exposes unavailable measured intervals.
   const technical=OdoTrackScene.create(host,ride,{autoRender:false,pixelRatio:1});technical.renderFrame(gapTime);const technicalGap=!technical.markerState().visible;technical.dispose();host.remove();
   return {marker,fullTurn:initial===fullTurn,quarter:initial!==quarter,reverse:initial===reverse,preserved,resetYaw,gapMarker,source,presentation,count,expected:ride.track.length,unchanged,removed,technicalGap,animated:firstFrame!==lastFrame};
  });
  for(const key of ['fullTurn','quarter','reverse','preserved','unchanged','removed','technicalGap','animated'])assert(result[key],key);
  assert.equal(result.marker.type,'arrow');assert.equal(result.resetYaw,-.62);assert(result.gapMarker.visible&&result.gapMarker.interpolated);assert.equal(result.gapMarker.x,result.presentation.x);assert.equal(result.gapMarker.z,result.presentation.z);assert.equal(result.source.speed,null);assert.equal(result.count,result.expected);
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
  await fallback.goto('http://127.0.0.1:4178');await fallback.locator('.overview-welcome').waitFor();await fallback.evaluate(seed);await fallback.locator('[data-open-insights]').click();assert(await fallback.locator('#reel-fallback').isVisible());assert.match(await fallback.locator('#reel-facts').textContent(),/6.7/);
  assert.deepEqual(errors,[]);console.log('PASS: real WebGL diorama, live and reverse replay, 360° camera, exact source vertices, continuous story marker, measured gap integrity, 320–1440px layout, GPU cleanup and readable no-WebGL fallback.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
