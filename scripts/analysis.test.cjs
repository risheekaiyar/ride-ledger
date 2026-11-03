const test=require('node:test'),assert=require('node:assert/strict'),{analyze,repeatLocations,safeShare,validateBackup}=require('../web/analysis.js');
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
