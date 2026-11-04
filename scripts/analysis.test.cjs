const test=require('node:test'),assert=require('node:assert/strict'),{analyze,repeatLocations,safeShare,validateBackup,distanceSupported,editRide,locationTimeCoverage}=require('../web/analysis.js');
const base={
 'metadata.json':JSON.stringify({started_epoch_ms:100000,started_elapsed_ns:1000000000,placement:'Pocket',device:'synthetic',sensors:[{type:5,label:'Light',maximum_range:65535}]}),
 'summary.json':JSON.stringify({ended_epoch_ms:110000,estimated_distance_m:30,gps_samples:3,motion_samples:3,end_reason:'user_stopped'}),
 'gps.csv':'fix_elapsed_ns,latitude_deg,longitude_deg,accuracy_m,speed_mps,speed_accuracy_mps,bearing_deg,altitude_m,accepted,mock,age_seconds\n2000000000,12,77,2,10,0.2,90,500,true,false,0\n3000000000,12,77.0001,100,60,0.2,90,500,false,false,0\n4000000000,12,77.0002,2,11,0.2,90,500,true,false,0',
 'motion.csv':'sensor_elapsed_ns,type,x,y,z,accuracy\n2000000000,5,10,8000,9000,3\n2100000000,1,0,0,9.80665,3\n2200000000,1,0,0,9.80665,3',
 'events.csv':'elapsed_ns,epoch_ms,event\n2000000000,101000,screen_off\n9000000000,108000,screen_on'
};
test('rejects poor GPS, splits route gaps and excludes bad speeds',()=>{const r=analyze(base,'rideoffice.zip');assert.equal(r.accepted,2);assert.equal(r.maxSpeed,39.6);assert.notEqual(r.track[0][7],r.track[1][7]);assert.equal(r.observedSeconds,0);});
test('scalar light ignores vendor extra channels',()=>assert.equal(analyze(base).stats.find(s=>s.type===5).peak,10));
test('screen-off duration and no calibrated lean',()=>{const r=analyze(base);assert.equal(r.screenOffSeconds,7);assert.equal(r.lean,null);assert(!r.events.some(e=>e.kind==='impact'));});
test('walking distance is visibly unreliable',()=>assert.equal(analyze(base,'officewalk.zip').distanceReliable,false));
test('safe share excludes route speed timestamps sensor values',()=>{const s=safeShare(analyze(base,'rideoffice'));assert.deepEqual(Object.keys(s).sort(),['activity','distanceKm','durationMinutes','note','title']);assert(!JSON.stringify(s).includes('77.000'));});
test('recurrence counts unique rides and separates direction and placement',()=>{const r=analyze(base,'rideoffice');r.recurring='Office';r.events=[{id:'one',kind:'braking',lon:77,lat:12},{id:'two',kind:'braking',lon:77,lat:12}];assert.equal(repeatLocations([r,r,r]).length,0);const a={...r,id:'a'},b={...r,id:'b'},c={...r,id:'c'};assert.equal(repeatLocations([a,b,c]).length,1);assert.equal(repeatLocations([a,b,{...c,placement:'Rigid mount'}]).length,0);});
test('invalid time base fails closed',()=>assert.throws(()=>analyze({...base,'metadata.json':'{}'}),/metadata/));
test('nonmonotonic sensor data is surfaced',()=>{const r=analyze({...base,'motion.csv':base['motion.csv']+'\n2100000000,1,0,0,8,3'});assert.equal(r.stats.find(s=>s.type===1).nonMonotonic,1);assert(r.warnings.some(x=>x.includes('timing')));});
test('backup rejects markup in IDs and measurements',()=>{const r=analyze(base,'rideoffice');r.id='1793676718164';assert.equal(validateBackup({type:'odo-backup',version:1,rides:[r]}).rides.length,1);assert.throws(()=>validateBackup({type:'odo-backup',version:1,rides:[{...r,id:'" onmouseover="alert(1)'}]}));assert.throws(()=>validateBackup({type:'odo-backup',version:1,rides:[{...r,duration:'<img>'}]}));});
test('unlabelled legacy recording does not inflate motorcycle totals',()=>assert.equal(analyze(base,'20261103-014736-389.zip').kind,'unclassified'));
test('recording-time bike and mount context survives the evidence pipeline',()=>{const meta=JSON.parse(base['metadata.json']);meta.ride_context={bike_id:'My bike',bike_type:'Adventure',mount_condition:'Slipping'};const r=analyze({...base,'metadata.json':JSON.stringify(meta)});assert.equal(r.bike_id,'My bike');assert.equal(r.mount_condition,'Slipping');assert.equal(r.bike_type,'Adventure');});
test('GPS timestamps outside the recording cannot enter distance or event evidence',()=>{const files={...base,'gps.csv':base['gps.csv']+'\n999999999999,12,77,2,10,0.2,90,500,true,false,0\n0,12,77,2,10,0.2,90,500,true,false,0'};const r=analyze(files);assert(r.track.every(p=>p[2]>=0&&p[2]<=r.duration));assert.equal(r.accepted,2);});
test('monotonic end timestamps determine duration through wall-clock adjustments',()=>{
 for(const ended_epoch_ms of [90000,8000000]){
  const summary={...JSON.parse(base['summary.json']),ended_epoch_ms,ended_elapsed_ns:11500000000,elapsed_seconds:10,gps_samples:4};
  const r=analyze({...base,'summary.json':JSON.stringify(summary),'gps.csv':base['gps.csv']+'\n11400000000,12,77.0003,2,10,0.2,90,500,true,false,0'});
  assert.equal(r.duration,10.5);assert.equal(r.timeBasis,'elapsed-realtime');assert.equal(r.track.at(-1)[2],10.4);assert(r.warnings.some(w=>/durations disagree/.test(w)));
 }
});
test('legacy duration is explicit and malformed monotonic clocks do not silently fall back',()=>{
 const legacy=analyze(base);assert.equal(legacy.duration,10);assert.equal(legacy.timeBasis,'wall-clock-fallback');assert(legacy.warnings.some(w=>/Legacy export/.test(w)));
 for(const end of [0,'11000000000',null])assert.throws(()=>analyze({...base,'summary.json':JSON.stringify({...JSON.parse(base['summary.json']),ended_elapsed_ns:end})}),/duration/);
});
test('motion summaries exclude out-of-window, incomplete and unknown channels',()=>{
 const invalid=['0,1,0,0,100,3','999999999999,1,0,0,100,3','2300000000,1,1,,9.8,3','2400000000,1,1,2,,3','2500000000,999,1,2,3,3','2600000000,5,-1,,,3','2700000000,1,1.7e308,1.7e308,1.7e308,3'];
 const r=analyze({...base,'motion.csv':base['motion.csv']+'\n'+invalid.join('\n')});
 assert.equal(r.motionExcluded,7);const accelerometer=r.stats.find(s=>s.type===1);assert.equal(accelerometer.n,2);assert.equal(accelerometer.peak,9.80665);assert(Math.abs(accelerometer.hz-10)<1e-8);assert.equal(r.signals.length,1);assert.equal(r.signals[0][1],1);assert(r.warnings.some(w=>/missing vector axes/.test(w)));
});
test('invalid optional GPS measurements cannot become speed or altitude evidence',()=>{
 const gps=base['gps.csv'].replace('10,0.2,90,500','10,-1,450,99999');const r=analyze({...base,'gps.csv':gps});
 assert.equal(r.track[0][3],null);assert.equal(r.track[0][5],null);assert.equal(r.track[0][6],null);assert.equal(r.track[0][8],null);assert.equal(r.accepted,2);
});
test('new timing diagnostics remain optional for legacy backups and validated when present',()=>{
 const r=analyze(base);r.id='1793676718164';const backup=ride=>({type:'odo-backup',version:1,rides:[ride]});
 const legacy={...r};delete legacy.timeBasis;delete legacy.motionExcluded;assert.equal(validateBackup(backup(legacy)).rides.length,1);
 assert.throws(()=>validateBackup(backup({...r,timeBasis:'invented'})),/time basis/);assert.throws(()=>validateBackup(backup({...r,motionExcluded:-1})),/exclusion/);
});
function intactFiles(activity='ride'){
 return {...base,'metadata.json':JSON.stringify({...JSON.parse(base['metadata.json']),activity_type:activity}),
  'summary.json':JSON.stringify({...JSON.parse(base['summary.json']),ended_epoch_ms:102000}),
  'gps.csv':base['gps.csv'].replace('2000000000,12','1000000000,12').replace('3000000000,12,77.0001,100,60','2000000000,12,77.0001,2,10').replace('4000000000,12','3000000000,12').replace('false,false,0','true,false,0')};
}
test('editing annotations cannot repair a source count-integrity failure',()=>{
 const files=intactFiles();files['summary.json']=JSON.stringify({...JSON.parse(files['summary.json']),motion_samples:999});
 const ride=analyze(files);assert.equal(ride.quality,100);assert.equal(ride.distanceIntegrity,false);assert.equal(ride.distanceReliable,false);
 const edited=editRide(ride,{title:'New title',kind:'ride',notes:'A smooth ride',distanceIntegrity:true,distanceReliable:true});
 assert.equal(edited.title,'New title');assert.equal(edited.distanceIntegrity,false);assert.equal(edited.distanceReliable,false);
 assert.equal(require('../web/companion.js').evidence(edited).distance_km,null);assert.equal(safeShare(edited).distanceKm,null);
});
test('classification can use intact source evidence and can be reversed without losing it',()=>{
 const ride=analyze(intactFiles('unclassified'),'mount-commute.zip');assert.equal(ride.kind,'unclassified');assert.equal(ride.distanceReliable,false);assert.equal(ride.distanceIntegrity,true);
 const classified=editRide(ride,{kind:'ride'});assert.equal(classified.distanceReliable,true);
 const walk=editRide(classified,{kind:'walk'});assert.equal(walk.distanceReliable,false);assert.equal(editRide(walk,{kind:'ride'}).distanceReliable,true);
});
test('missing, malformed, negative and impossible recorder distances remain unknown',()=>{
 for(const value of [null,undefined,'',false,'30',-1,Infinity,1000000]){
  const files=intactFiles();files['summary.json']=JSON.stringify({...JSON.parse(files['summary.json']),estimated_distance_m:value});
  const ride=analyze(files);assert.equal(ride.distanceKm,null);assert.equal(ride.averageSpeed,null);assert.equal(ride.distanceIntegrity,false);assert.equal(ride.distanceReliable,false);
 }
 const files=intactFiles();files['summary.json']=JSON.stringify({...JSON.parse(files['summary.json']),estimated_distance_m:0});const zero=analyze(files);assert.equal(zero.distanceKm,0);assert.equal(zero.averageSpeed,0);assert.equal(zero.distanceReliable,true);
});
test('explicit native activity wins over filename heuristics',()=>{
 assert.equal(analyze(intactFiles('ride'),'boardwalk.zip').kind,'ride');
 assert.equal(analyze(intactFiles('walk'),'rideoffice.zip').kind,'walk');
 assert.equal(analyze(intactFiles('unclassified'),'rideoffice.zip').kind,'unclassified');
});
test('accepted-fix percentage does not imply full-ride GPS time coverage',()=>{
 const files=intactFiles();files['summary.json']=JSON.stringify({...JSON.parse(files['summary.json']),ended_epoch_ms:110000});const ride=analyze(files);
 assert.equal(ride.quality,100);assert.equal(locationTimeCoverage(ride.track,ride.duration),.2);assert.equal(ride.distanceReliable,false);
 const t=(time,segment=0)=>[77,12,time,null,2,null,null,segment,null];
 assert.equal(locationTimeCoverage([t(0),t(1),t(8,1),t(10,1)],10),.3);
 assert.equal(locationTimeCoverage([t(0),t(1),t(0),t(1)],10),.1);
});
test('abnormal finalization and legacy uncertainty survive annotation edits',()=>{
 const files=intactFiles();files['summary.json']=JSON.stringify({...JSON.parse(files['summary.json']),end_reason:'storage_error'});const interrupted=analyze(files);
 assert.equal(interrupted.distanceReliable,false);assert.equal(editRide(interrupted,{kind:'ride'}).distanceReliable,false);
 const legacy=analyze(intactFiles());delete legacy.distanceIntegrity;legacy.distanceReliable=false;assert.equal(editRide(legacy,{kind:'ride'}).distanceReliable,false);
 legacy.distanceReliable=true;assert.equal(editRide(legacy,{notes:'Renamed'}).distanceReliable,true);
});
test('backups retain integrity evidence and reject contradictory confidence',()=>{
 const ride=analyze(intactFiles());ride.id='1793676718164';const backup=r=>({type:'odo-backup',version:1,rides:[r]});
 assert.equal(validateBackup(backup(ride)).rides[0].distanceIntegrity,true);
 assert.throws(()=>validateBackup(backup({...ride,distanceIntegrity:'true'})),/integrity/);
 assert.throws(()=>validateBackup(backup({...ride,distanceIntegrity:false})),/confidence/);
 assert.throws(()=>validateBackup(backup({...ride,finalized:false})),/confidence/);
 assert.throws(()=>validateBackup(backup({...ride,distanceReliable:'false'})),/confidence/);
 assert.equal(distanceSupported({...ride,source:'GPX export'}),false);
});

test('legacy backup recheck preserves measurements and notes while reducing unsupported confidence',()=>{
 const ride=analyze(intactFiles());ride.id='1793676718164';delete ride.distanceIntegrity;ride.duration=100;ride.distanceReliable=true;ride.notes='Keep this note';
 const restored=validateBackup({type:'odo-backup',version:1,rides:[ride]}).rides[0];
 assert.equal(restored.distanceReliable,false);assert.equal(restored.distanceKm,.03);assert.equal(restored.notes,'Keep this note');assert.equal(restored.track.length,3);
});
