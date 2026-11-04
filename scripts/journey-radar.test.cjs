const test=require('node:test'),assert=require('node:assert/strict'),track=require('../web/track-model.js'),radar=require('../web/journey-radar.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
const p=(lon,lat,time,segment=0)=>[lon,lat,time,36,3,100,90,segment];
test('radar rotation preserves GPS shape and a full turn returns to the same projection',()=>{
 const a={x:123,z:-87},b={x:-42,z:16},length=Math.hypot(a.x-b.x,a.z-b.z);
 for(const yaw of [0,.4,Math.PI,2*Math.PI,9*Math.PI]){const pa=radar.project(a,yaw),pb=radar.project(b,yaw);near(Math.hypot(pa.x-pb.x,pa.y-pb.y),length);}
 near(radar.project(a,2*Math.PI).x,a.x);near(radar.project(a,2*Math.PI).y,a.z);
 const overhead=radar.project(a,.8),iso=radar.project(a,.8,.68);near(iso.x,overhead.x);near(iso.y,overhead.y*.68);
});
test('path direction follows the actual next GPS edge at turns, including the final edge',()=>{
 const model=track.build([p(77,12,0),p(77.001,12,1),p(77.001,12.001,2),p(77,12.001,3)]);
 assert(radar.heading(model,.5).x>0);near(radar.heading(model,.5).z,0);
 near(radar.heading(model,1.5).x,0);assert(radar.heading(model,1.5).z<0);
 assert(radar.heading(model,3).x<0);
});
test('recording gaps have no heading and resumed segments get their own direction',()=>{
 const model=track.build([p(77,12,0),p(77.001,12,1),p(77.002,12,10,1),p(77.002,12.001,11,1)],{gapLimit:3});
 assert.equal(radar.heading(model,5),null);assert.equal(radar.heading(model,-1),null);assert.equal(radar.heading(model,12),null);
 const resumed=radar.heading(model,10);near(resumed.x,0);assert(resumed.z<0);
});
test('stationary isolated segments do not inherit an unrelated heading',()=>{
 const model=track.build([p(77,12,0),p(77,12,1),p(77.001,12,10,1),p(77.002,12,11,1)],{gapLimit:3});
 assert.equal(radar.heading(model,.5),null);
});
test('dateline crossing remains a short connected path with an eastbound arrow',()=>{
 const model=track.build([p(179.999,12,0),p(-179.999,12,1),p(-179.998,12.001,2)]);
 assert.equal(model.points.length,3);assert(radar.heading(model,.5).x>0);assert(model.width<=300.000001);
});
