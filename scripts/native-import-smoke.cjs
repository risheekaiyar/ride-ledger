const assert=require('node:assert/strict'),{chromium}=require('playwright'),{zipSync,strToU8}=require('../web/vendor/fflate.js');
const files={
 'metadata.json':JSON.stringify({schema_version:4,started_epoch_ms:1700000000000,started_elapsed_ns:1000000000,activity_type:'ride',placement:'Rigid mount',device:'Synthetic test device',ride_context:{bike_id:'Synthetic bike',bike_type:'Adventure',mount_condition:'Stable'},sensors:[{type:1,label:'Accelerometer',maximum_range:39.2}]}),
 'summary.json':JSON.stringify({schema_version:3,ended_epoch_ms:1699996400000,ended_elapsed_ns:12000000000,elapsed_seconds:11,estimated_distance_m:36,gps_samples:4,motion_samples:6,end_reason:'user_stopped'}),
 'gps.csv':'fix_elapsed_ns,latitude_deg,longitude_deg,accuracy_m,speed_mps,speed_accuracy_mps,bearing_deg,altitude_m,accepted,mock,age_seconds\n1000000000,12,77,2,10,0.2,90,800,true,false,0\n2000000000,12,77.0001,2,11,0.2,90,800,true,false,0\n3000000000,12,77.0002,2,12,0.2,90,801,true,false,0\n4000000000,12,77.0003,2,13,0.2,90,802,true,false,0',
 'motion.csv':'sensor_elapsed_ns,type,x,y,z,accuracy\n2000000000,1,0,0,9.80665,3\n2040000000,1,0,0,9.80665,3\n2080000000,1,0,0,9.80665,3\n2120000000,1,0,0,,3\n0,1,0,0,100,3\n13000000000,1,0,0,100,3'
};
const zip=Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([key,value])=>[key,strToU8(value)]))));
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4178');await p.waitForSelector('.studio-hero');
 const input={name:'synthetic-clock-change.zip',mimeType:'application/zip',buffer:zip};await p.locator('#zip-input').setInputFiles(input);await p.waitForFunction(()=>rides.length===1);
 const data=await p.evaluate(()=>({duration:rides[0].duration,basis:rides[0].timeBasis,excluded:rides[0].motionExcluded,stats:rides[0].stats[0].n,algorithm:rides[0].algorithm}));
 assert.deepEqual(data,{duration:11,basis:'elapsed-realtime',excluded:3,stats:3,algorithm:'odo-evidence-2'});
 await p.locator('[data-ride]').first().click();assert.match(await p.locator('.sample-note').textContent(),/Android monotonic clock/);await p.evaluate(()=>seekTrackTime(1));assert.equal(await p.locator('#sample-acceleration').textContent(),'1.00 g');
 await p.evaluate(async()=>{current().title='Preserve my title';current().notes='Private annotation';await saveRide(current());});await p.locator('#zip-input').setInputFiles(input);await p.waitForFunction(()=>!importBusy);assert.equal(await p.evaluate(()=>rides.length),1);assert.equal(await p.evaluate(()=>rides[0].title),'Preserve my title');assert.equal(await p.evaluate(()=>rides[0].notes),'Private annotation');
 await p.reload();await p.waitForSelector('.studio-hero');assert.equal(await p.evaluate(()=>rides[0].timeBasis),'elapsed-realtime');assert.deepEqual(errors,[]);
 console.log('PASS: native ZIP worker, monotonic duration through wall-clock rollback, rejected motion rows, preserved annotations and persistent diagnostics');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
