const test=require('node:test'),assert=require('node:assert/strict'),{project}=require('../web/route-geometry.js');
const p=(lon,lat,segment=0)=>[lon,lat,0,null,null,null,null,segment,null];
test('dateline crossing keeps local route proportions',()=>{const r=project([p(179.99,0),p(-179.99,.01)]);const [a,b]=r.points;assert(Math.abs(b[0]-a[0])>50);assert(Math.abs(b[1]-a[1])>20);assert(Math.abs(r.point([-179.99,.01])[0]-b[0])<.001);});
test('route thumbnails preserve gaps and fit their viewport',()=>{const r=project([p(77,12),p(77.01,12.01),p(77.02,12.02,1)]);assert.equal((r.path.match(/M/g)||[]).length,2);for(const [x,y] of r.points){assert(x>=8&&x<=112);assert(y>=8&&y<=64);}});
test('empty and stationary routes stay finite',()=>{assert.equal(project([]).path,'');const r=project([p(77,12),p(77,12)]);assert(r.points.flat().every(Number.isFinite));assert.deepEqual(r.points[0],[60,36]);});
