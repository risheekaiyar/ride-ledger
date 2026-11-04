const test=require('node:test'),assert=require('node:assert/strict'),{analyze,path,nearest,series}=require('../web/telemetry.js');
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
test('long traces preserve every column extreme with bounded paths and original sample lookup',()=>{
 const points=Array.from({length:50000},(_,i)=>[i,30,0]);points[20000][1]=0;points[20001][1]=150;
 const result=path(points,49999,600,150);assert(result.aggregated);assert.equal(result.max,150);assert.equal(result.count,50000);assert(result.d.includes(',10.000V140.000'));assert(result.d.length+result.dots.length<40000);assert(!/[LH]/.test(result.d));assert.equal(result.gaps,'');
});
test('trace reduction marks subpixel segment gaps and missing sample intervals',()=>{
 const points=Array.from({length:50000},(_,i)=>[i,30,i<20000?0:1]).filter(p=>p[0]!==30000);
 const result=path(points,50000,600,150,1);assert(result.gapColumns>0);assert.match(result.gaps,/M239,0H240/);assert.match(result.gaps,/M359,0H361/);assert.match(result.gaps,/M599,0H600/);
});
test('outside-window values cannot distort chart limits and isolated values remain visible',()=>{
 const result=path([[-1,999,0],[0,20,0],[1,null,0],[2,0,0],[4,999,0]],3);assert.equal(result.max,20);assert.equal((result.dots.match(/M/g)||[]).length,2);assert.equal(result.gaps,'M0,0H600 ');
});
test('large elevation arrays avoid argument-stack overflow while keeping source extrema',()=>{
 const track=Array.from({length:150000},(_,i)=>p(i*.5,20,0,800+Math.sin(i/30)));track[45678][5]=1234;
 const result=analyze({duration:75000,track});assert.equal(result.altitudeMax,1234);assert(result.altitudeMin>=799);assert(result.altitudeMin<800);
 const plotted=path(track.map(p=>[p[2],p[5],p[7]]),75000,600,150,3,false);assert.equal(plotted.max,1234);assert(plotted.d.length<30000);
});
const {windowRange,windowPath}=require('../web/telemetry.js');
test('time windows retain their span at the ride edges and handle short or invalid durations',()=>{
 assert.deepEqual(windowRange(3600,60,1800),{start:1770,end:1830});assert.deepEqual(windowRange(3600,60,3599),{start:3540,end:3600});assert.deepEqual(windowRange(3600,60,0),{start:0,end:60});
 assert.deepEqual(windowRange(10,15,4),{start:0,end:10});assert.deepEqual(windowRange(100,null,60),{start:0,end:100});assert.deepEqual(windowRange(NaN,60,5),{start:0,end:0});
});
test('focused traces clip existing lines at boundaries without changing source samples',()=>{
 const points=[[0,0,0],[2,20,0],[4,40,0]],original=structuredClone(points),focused=windowPath(points,4,1,3,600,150,3,false);
 assert.equal(focused.min,10);assert.equal(focused.max,30);assert.match(focused.d,/M0.00,140.00 L300.00,75.00 L600.00,10.00/);assert.equal(focused.gaps,'');assert.deepEqual(points,original);
 assert.deepEqual(windowPath(points,4,0,4),path(points,4,600,150));
});
test('zoom never joins a recording gap, missing value, reversed time or segment boundary',()=>{
 for(const points of [[[0,10,0],[10,30,0]],[[0,10,0],[1,20,1]],[[0,10,0],[.5,null,0],[1,20,0]],[[1,10,0],[0,20,0]]]){
  const result=windowPath(points,12,.25,.75,600,150,3);assert.equal(result.d,'');
 }
 const result=windowPath([[0,20,0],[1,0,0],[2,null,0],[3,30,0],[4,30,0]],5,.5,4.5,600,150,1);
 assert.equal(result.min,0);assert.match(result.gaps,/M75,0H375/);assert.match(result.gaps,/M525,0H600/);
});
test('focused GPX steps preserve interval estimates and long-window extrema stay bounded',()=>{
 const steps=[[0,20,0],[10,20,0],[10,40,0],[20,40,0]],step=windowPath(steps,20,5,15,600,150,30);
 assert.equal((step.d.match(/M/g)||[]).length,2);assert.equal(step.gaps,'');assert.equal(step.max,40);
 const points=Array.from({length:50000},(_,i)=>[i,1,0]);points[24000][1]=4;points[100][1]=90;
 const result=windowPath(points,50000,20000,30000,600,150,1);assert(result.aggregated);assert.equal(result.max,4);assert(result.d.length<40000);
 assert.equal(windowPath(points,50000,24000,24000).d,'');
});
test('phone-only inspection retains measured zero while GPS fields remain unavailable',()=>{
 const sample=inspect({duration:3,track:[],signals:[[1,0,0,0,1]]},1.5);
 assert.equal(sample.gap,true);assert.equal(sample.index,-1);assert.equal(sample.sampleTime,null);assert.equal(sample.speed,null);assert.equal(sample.accuracy,null);assert.equal(sample.motionTime,1);
 assert.equal(sample.acceleration,0);assert.equal(sample.linearAcceleration,0);assert.equal(sample.angularSpeed,0);
});
test('individual phone traces retain each recorded measure, missing bins and measured zero',()=>{
 const ride={duration:5,track:[],signals:[[0,1,.1,.2],[1,0,0,0],[3,2,null,.4],[4,-1,Infinity,'0']]},before=JSON.stringify(ride);
 assert.deepEqual(series(ride,'motion'),[[0,1,0],[1,0,0],[3,2,0],[4,null,0]]);
 assert.deepEqual(series(ride,'linear_acceleration'),[[0,.1,0],[1,0,0],[3,null,0],[4,null,0]]);
 assert.deepEqual(series(ride,'rotation'),[[0,.2,0],[1,0,0],[3,.4,0],[4,null,0]]);
 const trace=path(series(ride,'rotation'),ride.duration,600,150,1);assert.equal((trace.d.match(/M/g)||[]).length,2);assert.equal((trace.d.match(/L/g)||[]).length,1);
 assert.equal(inspect(ride,1.5).angularSpeed,0);assert.equal(inspect(ride,2.5).angularSpeed,null);assert.equal(JSON.stringify(ride),before);
});
test('GPX inspection cannot inherit native phone traces or motion readouts',()=>{
 const ride={duration:5,source:'GPX export',track:[],signals:[[1,2,.2,.3]]};
 for(const kind of ['motion','linear_acceleration','rotation'])assert.deepEqual(series(ride,kind),[]);
 const sample=inspect(ride,1);assert.equal(sample.motionTime,null);assert.equal(sample.acceleration,null);assert.equal(sample.linearAcceleration,null);assert.equal(sample.angularSpeed,null);
});
test('sub-unit phone signals use their own readable vertical range while zero traces stay finite',()=>{
 const trace=path([[0,0,0],[1,.2,0]],1,600,150,1);assert.equal(trace.max,.2);assert.match(trace.d,/M0.00,140.00 L600.00,10.00/);
 const zero=path([[0,0,0],[1,0,0]],1,600,150,1);assert(!/NaN|Infinity/.test(zero.d));assert.match(zero.d,/L600.00,140.00/);
});
