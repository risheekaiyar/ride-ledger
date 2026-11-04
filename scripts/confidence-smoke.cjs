const assert=require('node:assert/strict'),{chromium}=require('playwright'),{zipSync,strToU8}=require('../web/vendor/fflate.js');
const files={
 'metadata.json':JSON.stringify({started_epoch_ms:1700000000000,started_elapsed_ns:1000000000,activity_type:'ride',placement:'Pocket',device:'Synthetic',sensors:[{type:1,label:'Accelerometer'}]}),
 'summary.json':JSON.stringify({ended_epoch_ms:1700000003000,ended_elapsed_ns:4000000000,estimated_distance_m:30,gps_samples:4,motion_samples:2,end_reason:'user_stopped'}),
 'gps.csv':'fix_elapsed_ns,latitude_deg,longitude_deg,accuracy_m,speed_mps,speed_accuracy_mps,bearing_deg,altitude_m,accepted,mock,age_seconds\n'+Array.from({length:4},(_,i)=>`${1000000000+i*1000000000},12,${77+i*.0001},2,10,0.2,90,800,true,false,0`).join('\n'),
 'motion.csv':'sensor_elapsed_ns,type,x,y,z,accuracy\n2000000000,1,0,0,9.80665,3'
};
const input=()=>({name:'synthetic-integrity.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([key,value])=>[key,strToU8(value)]))))});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4178');await p.waitForSelector('.studio-hero');
 await p.locator('#zip-input').setInputFiles(input());await p.waitForSelector('[data-ride]');await p.locator('[data-ride]').first().click();
 await p.getByRole('button',{name:'Edit journey',exact:true}).click();await p.locator('#ride-form [name=title]').fill('Keep my title');await p.locator('#ride-form [name=notes]').fill('Keep my observations');await p.getByRole('button',{name:'Save journey',exact:true}).click();
 await p.waitForFunction(()=>!document.querySelector('#modal').open);
 let state=await p.evaluate(()=>({integrity:current().distanceIntegrity,confidence:current().distanceReliable,distance:totalStats().distance,meta:OdoCompanion.evidence(current()).distance_km}));
 assert.deepEqual(state,{integrity:false,confidence:false,distance:null,meta:null});assert.equal(await p.locator('.ride-distance strong').textContent(),'—');
 await p.reload();await p.waitForSelector('.rides-experience');assert.equal(await p.evaluate(()=>rides[0].notes),'Keep my observations');assert.equal(await p.evaluate(()=>rides[0].distanceReliable),false);
 // Reimporting an intact original can establish evidence; editing annotations cannot.
 files['summary.json']=JSON.stringify({...JSON.parse(files['summary.json']),motion_samples:1});await p.locator('#zip-input').setInputFiles(input());await p.waitForFunction(()=>!importBusy&&rides[0].distanceIntegrity===true);
 assert.equal(await p.evaluate(()=>rides.length),1);assert.equal(await p.evaluate(()=>rides[0].title),'Keep my title');assert.equal(await p.evaluate(()=>rides[0].notes),'Keep my observations');assert.equal(await p.evaluate(()=>rides[0].distanceReliable),true);assert.equal(await p.evaluate(()=>totalStats().distance),.03);assert.equal(await p.evaluate(()=>totalStats().distanceRides),1);
 await p.evaluate(async()=>{const r=rides[0];delete r.distanceIntegrity;r.duration=100;r.distanceReliable=true;await dbRequest('readwrite',s=>s.put(r));});
 await p.reload();await p.waitForSelector('.rides-experience');assert.equal(await p.evaluate(()=>rides[0].distanceReliable),false);assert.equal(await p.evaluate(()=>rides[0].distanceKm),.03);assert.equal(await p.evaluate(()=>rides[0].notes),'Keep my observations');
 assert.deepEqual(errors,[]);console.log('PASS: import integrity survives actual edit/save/reload, unsupported distance stays out of totals/Meta, corrected original restores confidence without losing notes, legacy coverage recheck');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
