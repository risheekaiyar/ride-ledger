const test=require('node:test'),assert=require('node:assert/strict');
const {build,atTime}=require('../web/track-model.js');
const p=(x,y,t,{alt=null,speed=40,segment=0}={})=>[x,y,t,speed,null,alt,null,segment,null];
test('track model keeps geographic proportions across the date line',()=>{
 const m=build([p(179.99,0,0),p(-179.99,.01,10)]);
 assert(Math.abs(m.width/m.depth-2)<.01);assert.equal(m.width,300);
 assert.equal(m.elevationAvailable,false);assert.equal(m.height,0);
});
test('elevation keeps source scale and vertical extrema on a straight route',()=>{
 const m=build([p(0,0,0,{alt:100}),p(.001,0,10,{alt:120}),p(.002,0,20,{alt:100})]);
 assert.equal(m.segments[0].points.length,3);assert.equal(m.height,20*m.scale);
 assert.equal(m.altitudeBase,100);assert.equal(m.elevationAvailable,true);
 const incomplete=build([p(0,0,0,{alt:0}),p(.001,0,10)]);
 assert.equal(incomplete.elevationAvailable,false);assert.equal(incomplete.height,0);
});
test('explicit and elapsed-time gaps split meshes and hide interpolated speed',()=>{
 const m=build([p(0,0,0),p(.001,0,2),p(.002,0,10),p(.003,0,12)],{gapLimit:3});
 assert.equal(m.segments.length,2);assert.equal(atTime(m,6).gap,true);
 assert.equal(atTime(m,6).speed,null);assert.equal(atTime(m,6).x,m.points[1].x);
 assert.equal(atTime(m,10).gap,false);assert.equal(atTime(m,10).x,m.points[2].x);
 const explicit=build([p(0,0,0),p(.001,0,2,{segment:1}),p(.002,0,3,{segment:1})]);
 assert.equal(explicit.segments.length,1);assert(atTime(explicit,1).gap);
});
test('GPX interval speed is not smoothed into a different speed estimate',()=>{
 const track=[p(0,0,0,{speed:null}),p(.001,0,10,{speed:20}),p(.002,0,20,{speed:60})];
 const m=build(track,{speedMode:'interval'});
 assert.equal(atTime(m,0).speed,null);assert.equal(atTime(m,5).speed,20);assert.equal(atTime(m,15).speed,60);
 assert.equal(atTime(build(track),15).speed,40);
});
test('invalid, stationary and non-monotonic recordings decline 3D rendering',()=>{
 for(const track of [[],[p(0,0,0)],[p(0,0,0),p(0,0,2)],[p(0,0,2),p(.001,0,1)],[p(0,0,0),p(181,0,2)],[[null],p(0,0,2)]])assert.equal(build(track),null);
});
test('large straight recordings retain endpoints without thousands of mesh vertices',()=>{
 const m=build(Array.from({length:50000},(_,i)=>p(77+i/1000000,12,i)));
 assert.equal(m.segments[0].points.length,2);assert.equal(m.points.length,50000);
 assert.equal(atTime(m,24999.5).index,25000);
});
test('seeking beyond recorded GPS bounds shows a gap instead of an endpoint measurement',()=>{
 const m=build([p(77,12,2),p(77.001,12,5)]);
 for(const t of [0,6,NaN]){assert.equal(atTime(m,t).gap,true);assert.equal(atTime(m,t).speed,null);}
 assert.equal(atTime(m,2).gap,false);assert.equal(atTime(m,5).gap,false);
});
