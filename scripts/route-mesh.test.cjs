const test=require('node:test'),assert=require('node:assert/strict'),{build}=require('../web/route-mesh.js');
const points=[{x:0,z:0,y:0,time:0},{x:20,z:0,y:3,time:1},{x:20,z:20,y:8,time:2},{x:40,z:20,y:12,time:3}];
test('solid road preserves every source centerline and its timestamps',()=>{
 const before=JSON.stringify(points),m=build(points,{half:4,top:18,elevation:true});
 points.forEach((p,i)=>{const a=m.surface.slice(i*6,i*6+3),b=m.surface.slice(i*6+3,i*6+6);assert.equal((a[0]+b[0])/2,p.x);assert.equal((a[2]+b[2])/2,p.z);assert.equal(a[1],18+p.y);assert.deepEqual(m.times.slice(i*2,i*2+2),[p.time,p.time]);});
 assert.equal(m.indices.length,(points.length-1)*6);assert.equal(m.walls.length,((points.length-1)*2+2)*18);assert.equal(JSON.stringify(points),before);
});
test('duplicate GPS points and hairpin reversals produce bounded finite joins',()=>{
 for(const route of [[points[0],points[0],points[1],points[1],points[0]],Array(80).fill(points[0]),[]]){
  const m=build(route,{half:4});assert([...m.surface,...m.walls].every(Number.isFinite));
  route.forEach((p,i)=>{assert(Math.hypot(m.surface[i*6]-p.x,m.surface[i*6+2]-p.z)<=8.00000001);});
 }
});
test('surface faces point upward; both sidewalls and ends reach the base',()=>{
 const m=build(points);for(let i=0;i<m.indices.length;i+=3){const [a,b,c]=m.indices.slice(i,i+3).map(j=>m.surface.slice(j*3,j*3+3));const normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);assert(normalY>0);}
 assert(m.walls.filter((_,i)=>i%3===1).includes(1));assert(m.walls.filter((_,i)=>i%3===1).includes(18));
});
test('mesh construction never closes an open GPS route or crosses a caller segment boundary',()=>{
 const a=build(points.slice(0,2)),b=build(points.slice(2));assert.equal(a.indices.length,6);assert.equal(b.indices.length,6);assert.deepEqual(a.times,[0,0,1,1]);assert.deepEqual(b.times,[2,2,3,3]);
});
