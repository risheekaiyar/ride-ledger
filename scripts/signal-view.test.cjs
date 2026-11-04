const test=require('node:test'),assert=require('node:assert/strict'),{plot,inspect}=require('../web/signal-view.js');
test('short traces retain samples, isolated zeros and explicit gaps',()=>{
 const p=plot([[0,0],[1,1],[4,2],[6,0]],8,{columns:16,height:100,maximum:2});
 assert.equal(p.aggregated,false);assert.equal((p.d.match(/M/g)||[]).length,3);assert.equal((p.d.match(/L/g)||[]).length,1);assert.equal((p.dots.match(/M/g)||[]).length,2);
 assert.equal(p.gaps,'M4,0H8 M10,0H12 M14,0H16 ');assert.equal(p.maximum,2);
});
test('a full day remains bounded and retains min/max without drawing connecting lines',()=>{
 const points=Array.from({length:86400},(_,i)=>[i,1]);points[40000][1]=12;points[40001][1]=0;
 const p=plot(points,86400,{columns:640,height:160});assert(p.aggregated);assert.equal(p.maximum,12);assert.equal(p.count,86400);assert.equal(p.gaps,'');
 assert(p.d.includes(',8.000V152.000'));assert(!/[LH]/.test(p.d));assert.equal((p.d.match(/M/g)||[]).length,640);assert(p.d.length+p.dots.length<40000);
});
test('subpixel gaps stay marked in aggregated ranges and fractional endpoints remain unknown',()=>{
 const points=Array.from({length:3600},(_,i)=>[i,1]).filter(p=>p[0]!==1234),p=plot(points,3600.5,{columns:600});
 assert(p.aggregated);assert.match(p.gaps,/M205,0H206/);assert.match(p.gaps,/M599,0H600/);
 const incomplete=plot([[0,1],[1,1]],2.5,{columns:20});assert.equal(incomplete.gaps,'M16,0H20 ');
});
test('missing channels are empty with a full gap rail and zero channels stay finite',()=>{
 const empty=plot([],60);assert.equal(empty.d,'');assert.equal(empty.gaps,'M0,0H640 ');
 const zero=plot([[0,0],[1,0]],2);assert(!/NaN|Infinity/.test(JSON.stringify(zero)));assert.equal(zero.gaps,'');
 assert.equal(plot([[0,1]],0).d,'');
});
test('inspection selects original bins without interpolation and respects the full ride end',()=>{
 const points=[[0,0],[1,3],[4,9]];assert.deepEqual(inspect(points,5,.9),{time:0,end:1,value:0});assert.equal(inspect(points,5,2.5).value,null);
 assert.deepEqual(inspect(points,5,5),{time:4,end:5,value:9});assert.deepEqual(inspect(points,5.5,5.5),{time:5,end:5.5,value:null});
 assert.equal(inspect(points,5,-1).time,null);assert.equal(inspect(points,5,6).value,null);assert.equal(inspect(points,5,NaN).value,null);
});
test('display reduction does not mutate the original one-second evidence',()=>{
 const points=Array.from({length:10000},(_,i)=>[i,Math.sin(i)**2]),original=JSON.stringify(points);plot(points,10000,{columns:320});assert.equal(JSON.stringify(points),original);
 assert.equal(inspect(points,10000,4567.9).value,points[4567][1]);
});
