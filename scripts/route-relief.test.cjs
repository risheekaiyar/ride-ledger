const test=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../web/route-relief.js');
const {project}=require('../web/route-geometry.js');
const point=(lon,lat,segment=0,altitude=null)=>[lon,lat,0,null,null,altitude,null,segment,null];

test('relief fits its rim and full extrusion inside the thumbnail',()=>{
 const shape=build([point(77,12),point(77.001,12.002),point(77.004,12.001),point(77,12)]);
 assert(shape.faces.length>0);
 assert.equal(shape.faces.length,3);
 for(const p of shape.points){assert(p.x>=10-1e-6&&p.x<=110+1e-6);assert(p.y>=10-1e-6&&p.y+shape.depth<=76+1e-6);}
 assert.equal(shape.top.match(/M/g).length,1);
 assert(shape.faces.every((face,i,faces)=>Number.isFinite(face.shade)&&face.shade>=.35&&face.shade<=1&&(!i||face.order>=faces[i-1].order)));
});
test('disconnected segments keep separate rims and side walls',()=>{
 const shape=build([point(77,12),point(77.001,12.002),point(77.002,12.003,1),point(77.003,12.005,1)]);
 assert.equal(shape.top.match(/M/g).length,2);
 assert.equal(shape.shadow.match(/M/g).length,2);
 assert.equal(shape.faces.length,2);
 assert.equal(shape.ends.length,4);
});
test('dateline relief has the same local proportions as an ordinary route',()=>{
 const across=build([point(179.99,10),point(-179.995,10.005),point(-179.98,10.02)]);
 const local=build([point(-.01,10),point(.005,10.005),point(.02,10.02)]);
 across.points.forEach((p,i)=>{assert(Math.abs(p.x-local.points[i].x)<1e-6);assert(Math.abs(p.y-local.points[i].y)<1e-6);});
});
test('preview extrusion is a visual treatment independent of source altitude',()=>{
 const track=[point(77,12),point(77.001,12.002),point(77.004,12.001)];
 const elevated=track.map((p,i)=>{const copy=[...p];copy[5]=1000+i*400;return copy;});
 assert.deepEqual(build(elevated),build(track));
});
test('empty and stationary routes cannot generate invalid side geometry',()=>{
 assert.equal(build([]).faces.length,0);
 for(const track of [[point(77,12)],[point(77,12),point(77,12)]]){
  const shape=build(track);assert.equal(shape.faces.length,0);assert(!/NaN|Infinity/.test(shape.top));
  assert(shape.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
});
test('large projections avoid argument-limit failures and can omit unused path strings',()=>{
 const track=Array.from({length:150000},(_,i)=>point(77+i*1e-7,12+Math.sin(i/500)*.001));
 const shape=project(track,{includePath:false});
 assert.equal(shape.points.length,track.length);assert.equal(shape.path,'');
 assert(shape.points.every(p=>p.every(Number.isFinite)));
});
