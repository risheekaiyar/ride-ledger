const test=require('node:test'),assert=require('node:assert/strict'),{analyze,path,nearest}=require('../web/telemetry.js');
const p=(t,speed,segment=0,altitude=null)=>[0,0,t,speed,2,altitude,0,segment,1];
test('speed histogram weights elapsed time and splits band crossings',()=>{const t=analyze({duration:3,track:[p(0,0),p(2,20),p(3,20)]});assert.equal(t.observed,3);assert.equal(t.seconds[0],.5);assert.equal(t.seconds[1],1.5);assert.equal(t.seconds[2],1);assert.equal(t.seconds.reduce((a,b)=>a+b,0),3);assert.equal(t.average,40/3);});
test('gaps and segment boundaries never become speed coverage or stopped time',()=>{const t=analyze({duration:30,track:[p(0,0),p(1,0),p(2,60,1),p(30,60,1)]});assert.equal(t.observed,1);assert.equal(t.unobserved,29);assert.equal(t.lowSpeed,1);assert.equal(t.moving,0);});
test('GPX uses the interval estimate at its ending sample',()=>{const t=analyze({source:'GPX export',duration:10,track:[p(0,null),p(10,36)]});assert.equal(t.observed,10);assert.equal(t.average,36);assert.equal(t.distanceKm,.1);});
test('missing values remain unknown and altitude is not accumulated as ascent',()=>{const t=analyze({duration:10,track:[p(0,null,0,100),p(10,null,0,102)]});assert.equal(t.peak,null);assert.equal(t.average,null);assert.equal(t.altitudeMin,100);assert.equal(t.altitudeMax,102);assert.equal(t.ascent,undefined);});
test('plot never bridges a segment boundary, missing sample or excessive gap',()=>{const r=path([[0,10,0],[1,20,0],[2,25,1],[3,null,1],[4,10,1],[10,20,1]],10);assert.equal((r.d.match(/M/g)||[]).length,4);assert.equal((r.d.match(/L/g)||[]).length,1);assert.equal(path([],10).d,'');});
test('timeline seek chooses nearest existing sample and handles edges',()=>{const track=[p(0,10),p(4,10),p(10,10)];assert.equal(nearest(track,-1),0);assert.equal(nearest(track,6),1);assert.equal(nearest(track,100),2);assert.equal(nearest([],0),-1);});
test('out-of-ride timestamps and overlapping intervals do not inflate coverage',()=>{const t=analyze({duration:3,track:[p(-1,20),p(0,20),p(2,20),p(1,20),p(3,20),p(5,20)]});assert.equal(t.observed,2);assert.equal(t.unobserved,1);});
test('elevation plots can use their actual range without inventing ascent',()=>{const r=path([[0,820,0],[1,825,0]],1,600,130,3,false);assert.equal(r.min,820);assert.equal(r.max,825);});
const {inspect}=require('../web/telemetry.js');
test('sample inspector preserves zeros, units and each source timestamp',()=>{
 const ride={duration:4,track:[[77,12,0,0,0,0,0,0,0],[77.001,12,2,40,4,800,90,0,.4]],signals:[[0,1.2,.3,.07,1]]};
 const a=inspect(ride,.4);assert.equal(a.sampleTime,0);assert.equal(a.accuracy,0);assert.equal(a.altitude,0);assert.equal(a.speedAccuracy,0);assert.equal(a.course,0);assert.equal(a.acceleration,1.2);assert.equal(a.motionTime,0);
 assert.equal(inspect(ride,1.1).motionTime,null);assert.equal(inspect(ride,1.1).acceleration,null);
 assert.equal(inspect(ride,2).speedAccuracy,.4);
});
test('GPS gaps never fill sample fields, even if phone motion exists at that time',()=>{
 const ride={duration:10,track:[p(0,20),p(1,30),p(8,40,1)],signals:[[4,1.3,.2,.08,1]]};
 const a=inspect(ride,4.3);assert.equal(a.gap,true);assert.equal(a.sampleTime,null);assert.equal(a.accuracy,null);assert.equal(a.course,null);assert.equal(a.acceleration,1.3);
 assert.equal(inspect(ride,8).gap,false);assert.equal(inspect(ride,9).gap,true);assert.equal(inspect(ride,-1).gap,true);
});
test('GPX provenance and invalid optional measurements remain unknown in inspection',()=>{
 const point=[77,12,0,30,2,900,45,0,.4];const imported=inspect({duration:1,source:'GPX export',track:[point]},0);
 assert.equal(imported.accuracy,null);assert.equal(imported.speedAccuracy,null);assert.equal(imported.course,null);assert.equal(imported.altitude,900);
 const invalid=inspect({duration:1,track:[[77,12,0,30,-1,99999,450,0,-1]],signals:[[0,-1,null,-1,null]]},0);
 for(const field of ['accuracy','speedAccuracy','altitude','course','acceleration','linearAcceleration','angularSpeed'])assert.equal(invalid[field],null);
});
