const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../web/track-model.js'),film=require('../web/ride-film.js');
const point=(t,segment,speed)=>[77+t*.0001,12,t,speed,2,null,null,segment,null];
const ride={duration:12,distanceKm:.3,distanceReliable:true,track:[point(1,0,10),point(2,0,20),point(9,1,30),point(10,1,40)]};
const track=model.build(ride.track,{gapLimit:3});
test('film speed is opt-in and GPS gaps remain unknown across the full recorded duration',()=>{
 assert.equal(film.frame(ride,track,1.5/12).speed,null);
 assert.equal(film.frame(ride,track,1.5/12,true).speed,15);
 for(const time of [0,5,12]){const f=film.frame(ride,track,time/12,true);assert.equal(f.gap,true);assert.equal(f.speed,null);}
 assert.equal(film.frame(ride,track,1,true).time,12);
});
test('film distances and speed labels retain native versus imported provenance',()=>{
 assert.equal(film.frame({...ride,distanceReliable:false},track,.1).distance,null);
 const imported={...ride,source:'GPX export',distanceReliable:false},m=model.build(imported.track,{gapLimit:30,speedMode:'interval'});
 const f=film.frame(imported,m,1.5/12,true);assert.equal(f.distance,.3);assert.equal(f.speed,20);assert.equal(f.speedLabel,'GPX EST. SPEED');assert.equal(f.distanceLabel,'GPX EST. KM');
});
test('film progress is bounded without fabricating out-of-range speeds',()=>{
 assert.equal(film.frame(ride,track,-1).time,0);assert.equal(film.frame(ride,track,2).time,12);assert.equal(film.frame(ride,track,NaN).time,0);
 const m=model.build([point(0,0,999),point(12,0,999)],{gapLimit:30});assert.equal(film.frame(ride,m,.5,true).speed,null);
});
test('video negotiation prefers MP4 and preserves WebM as a labelled fallback',()=>{
 const all={isTypeSupported:()=>true};assert.equal(film.encoding(all).extension,'mp4');
 const webm={isTypeSupported:m=>m.startsWith('video/webm')};assert.equal(film.encoding(webm).extension,'webm');
 assert.equal(film.encoding({isTypeSupported:()=>false}),null);assert.equal(film.encoding({}),null);
});
test('cancelled or invalid exports never start a capture stream',async()=>{
 let captures=0;const canvas={captureStream(){captures++;}},controller=new AbortController();controller.abort();
 await assert.rejects(film.record(canvas,()=>{},{codec:{mode:'realtime',mime:'video/mp4'},signal:controller.signal}),{name:'AbortError'});
 await assert.rejects(film.record(canvas,()=>{},{codec:{mode:'realtime',mime:'video/mp4'},duration:300}),/12 or 18/);assert.equal(captures,0);
});
