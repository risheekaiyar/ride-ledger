const assert=require('node:assert/strict'),{chromium}=require('playwright'),{seed}=require('./studio-fixture.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4178');await p.locator('.overview-welcome').waitFor();await p.evaluate(seed);
  await p.locator('[data-open-insights]').click();await p.getByRole('button',{name:'Pause insights',exact:true}).click();await p.locator('#reel-timeline').fill('440');await p.locator('#reel-timeline').dispatchEvent('input');
  assert.equal(await p.locator('#reel-scene canvas').getAttribute('data-renderer'),'journey-radar');
  await p.screenshot({path:'/tmp/odo-radar-desktop.png'});
  await p.locator('#reel-route-view').selectOption('isometric');await p.screenshot({path:'/tmp/odo-radar-iso.png'});await p.locator('#reel-route-view').selectOption('radar');
  for(const width of [320,390,650,768,1440]){
   await p.setViewportSize({width,height:844});await p.waitForFunction(()=>{const h=document.querySelector('#reel-scene'),c=h.querySelector('canvas');return Math.abs(c.clientWidth-h.clientWidth)<1&&Math.abs(c.clientHeight-h.clientHeight)<1;});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);assert(await p.locator('#modal').evaluate(d=>d.scrollWidth<=d.clientWidth+1));
   await p.locator('#modal').evaluate(d=>d.scrollTop=0);const map=await p.locator('#reel-scene canvas').boundingBox(),controls=await p.locator('#reel-route-tools').boundingBox();assert(map.y+map.height<=controls.y+2,`Map must not intersect its controls at ${width}px: ${JSON.stringify({map,controls})}`);
   if(width===390)await p.screenshot({path:'/tmp/odo-radar-mobile.png'});
  }
  await p.getByRole('button',{name:'Close ride insights'}).click();
  const result=await p.evaluate(()=>{
   const host=document.createElement('div');Object.assign(host.style,{position:'fixed',inset:'0',width:'390px',height:'360px',zIndex:9999});document.body.append(host);
   const ride=current(),before=JSON.stringify(ride),scene=OdoJourneyRadar.create(host,ride,{pixelRatio:1}),model=scene.model;
   const connected=model.points.find((q,i)=>i>5&&q.segment===model.points[i-1].segment),time=connected.time-.5;scene.renderFrame(time);const initial=scene.snapshot(),marker=scene.markerState();
   scene.rotate(360);const fullTurn=scene.markerState();scene.rotate(90);const quarter=scene.markerState();scene.reset();const reset=scene.snapshot();
   scene.renderFrame(ride.duration);scene.renderFrame(time);const reverse=scene.snapshot();
   const gap=model.points.find((q,i)=>i&&q.segment!==model.points[i-1].segment);scene.renderFrame((model.points[gap.index-1].time+gap.time)/2);const hidden=scene.markerState()===null;scene.renderFrame(gap.time);const resumed=scene.markerState()!==null;
   const sample=model.points[connected.index],previous=model.points[connected.index-1],at=OdoTrackModel.atTime(model,time);const interpolation=Math.abs(at.x-(previous.x+sample.x)/2)<1e-8&&Math.abs(at.z-(previous.z+sample.z)/2)<1e-8;
   const count=model.points.length,unchanged=JSON.stringify(ride)===before;scene.dispose();scene.dispose();const removed=host.childElementCount===0;
   // Family art and color must affect rendered pixels, including when no WebGL context exists.
   const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='2d'?getContext.call(this,type,...args):null;};
   const variants=[];try{for(const family of ['adventure','sport','naked','rally','touring','classic','scooter']){const s=OdoJourneyRadar.create(host,ride,{pixelRatio:1,bikeProfile:{family,color:'#ed3344'}});s.renderFrame(time);variants.push(s.snapshot());s.dispose();}const s=OdoJourneyRadar.create(host,ride,{pixelRatio:1,bikeProfile:{family:'sport',color:'#347aff'}});s.renderFrame(time);variants.push(s.snapshot());s.dispose();}finally{HTMLCanvasElement.prototype.getContext=getContext;host.remove();}
   return {marker,fullTurn,quarter,sameReset:initial===reset,sameReverse:initial===reverse,hidden,resumed,interpolation,count,expected:ride.track.length,unchanged,removed,unique:new Set(variants).size};
  });
  assert.equal(result.marker.family,'rally');assert.equal(result.marker.color,'#e74738');assert(Math.abs(result.marker.x-result.fullTurn.x)<1e-8);assert(Math.abs(result.marker.y-result.fullTurn.y)<1e-8);assert(Math.hypot(result.marker.x-result.quarter.x,result.marker.y-result.quarter.y)>1);
  for(const key of ['sameReset','sameReverse','hidden','resumed','interpolation','unchanged','removed'])assert(result[key],key);assert.equal(result.count,result.expected);assert.equal(result.unique,8);assert.deepEqual(errors,[]);
  console.log('PASS: GPS radar, all seven bike families and paint, exact sample interpolation, gaps, 360° rotation, reverse scrubbing, 320–1440px layout, cleanup and Canvas-only rendering.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
