const test=require('node:test'),assert=require('node:assert/strict');
const {analyze,sensorDiagnostics,validateBackup}=require('../web/analysis.js'),{files}=require('./sensor-fixture.cjs');
const {evidence}=require('../web/companion.js'),{packet,createRuntime}=require('./muse-runtime.cjs');
const get=()=>analyze(files(),'Synthetic · sensor review.zip');
test('range review uses valid reported range and individual axes, excluding rejected rows',()=>{
 const r=get(),s=r.stats.find(s=>s.type===1),d=sensorDiagnostics(s,r.duration);
 assert.equal(r.motionExcluded,2);assert.equal(s.n,9);assert.equal(s.clipped,2);assert(s.peak>20,'Magnitude may exceed range even when each axis is below it');
 assert.equal(d.nearRangeSamples,2);assert.equal(d.maximumRange,20);assert.equal(d.leadingGapSeconds,2);assert.equal(d.trailingGapSeconds,8);assert.equal(d.maxGapSeconds,3);assert.equal(d.sampleRateHz,.8);
 assert.deepEqual(d.statusCounts,{no_contact:1,unreliable:1,low:1,medium:1,high:1,unknown:4});
});
test('invalid range metadata does not fabricate clipping or a clean bill of health',()=>{
 for(const range of [-20,0,null,'20',undefined]){
  const f=files(),m=JSON.parse(f['metadata.json']);m.sensors[0].maximum_range=range;f['metadata.json']=JSON.stringify(m);
  const r=analyze(f),s=r.stats.find(s=>s.type===1);assert.equal(s.clipped,0);assert.equal(sensorDiagnostics(s,r.duration).nearRangeSamples,null);
 }
 const f=files();f['metadata.json']=JSON.stringify({...JSON.parse(f['metadata.json']),sensors:{}});assert.equal(analyze(f).stats[0].maximumRange,null);
});
test('single samples and scalar/orientation channels do not acquire timing or axis checks',()=>{
 const r=get();for(const type of [5,11]){const d=sensorDiagnostics(r.stats.find(s=>s.type===type),r.duration);assert.equal(d.nearRangeSamples,null);assert.equal(d.sampleRateHz,null);assert.equal(d.maxGapSeconds,null);}
 const d=sensorDiagnostics(r.stats.find(s=>s.type===10),r.duration);assert.equal(d.nearRangeSamples,0);assert.equal(d.sampleRateHz,null);
});
test('small-sample percentiles are ordered and use interpolated medians',()=>{
 const r=get(),s=r.stats.find(s=>s.type===4);assert.equal(s.median,1.5);assert.equal(s.p95,1.95);assert.equal(s.peak,2);
 for(const channel of r.stats){assert(channel.median<=channel.p95);assert(channel.p95<=channel.peak);}
});
test('blank timestamps cannot become samples at a zero elapsed-clock origin',()=>{
 const f=files();f['metadata.json']=JSON.stringify({...JSON.parse(f['metadata.json']),started_elapsed_ns:0});
 f['motion.csv']+='\n ,1,0,0,9.8,3';f['gps.csv']+='\n ,12,77,2,10,0.2,90,800,true,false,0';
 const r=analyze(f);assert.equal(r.motionExcluded,3);assert.equal(r.accepted,21);
});
test('whitespace axes are missing, while malformed statuses leave usable samples unknown',()=>{
 const f=files();f['motion.csv']+='\n14000000000,1,0, ,9.8,3';const r=analyze(f);assert.equal(r.motionExcluded,3);assert.equal(r.stats[0].n,9);assert.equal(r.stats[0].accuracy.unknown,4);
});
test('legacy summaries retain valid status counts without inventing endpoint/range checks',()=>{
 const r=get(),s={...r.stats[0]};for(const k of ['diagnosticsVersion','firstSeconds','lastSeconds','maximumRange','reportingMode'])delete s[k];
 const d=sensorDiagnostics(s,r.duration);assert.equal(d.leadingGapSeconds,null);assert.equal(d.nearRangeSamples,null);assert.equal(d.statusCounts.high,1);
 assert.deepEqual(sensorDiagnostics({...s,accuracy:{3:100}},r.duration).statusCounts,{no_contact:0,unreliable:0,low:0,medium:0,high:0,unknown:9});
});
test('new diagnostic metadata is validated on backup restore',()=>{
 const r=get(),backup=ride=>({type:'odo-backup',version:1,rides:[ride]});assert.equal(validateBackup(backup(r)).rides.length,1);
 for(const change of [{firstSeconds:-1},{lastSeconds:99},{maximumRange:-1},{reportingMode:99},{diagnosticsVersion:2},{clipped:10}])assert.throws(()=>validateBackup(backup({...r,stats:[{...r.stats[0],...change}]})),/sensor diagnostics/);
});
test('Meta evidence exposes bounded motion diagnostics without source identifiers or raw vectors',()=>{
 const r=get(),e=evidence(r),p=packet({question:'Review the signal',rides:[e]});assert.equal(e.sensor_health.length,3);assert.equal(p.evidence[0].sensor_health[0].near_range_samples,2);
 assert.equal(e.sensor_health.find(s=>s.channel==='linear_acceleration').mean_rate_hz,null);
 for(const text of ['Synthetic phone','Synthetic bike','Accelerometer','latitude','maximumRange','peak'])assert(!JSON.stringify(e).includes(text));
 assert.equal(evidence({...r,source:'GPX export'}).sensor_health,undefined);
});
test('sensor packet rejects contradictory counts, duplicate channels and invalid intervals',()=>{
 const e=evidence(get()),health=e.sensor_health[0],body=value=>({question:'Review',rides:[{...e,sensor_health:value}]});
 for(const change of [{accepted_samples:0},{mean_rate_hz:0},{mean_rate_hz:Infinity},{near_range_samples:10},{leading_gap_seconds:21},{trailing_gap_seconds:-1},{status_counts:{...health.status_counts,high:10}},{channel:'private text'}])assert.throws(()=>packet(body([{...health,...change}])),/sensor-health|Sensor-health/);
 assert.throws(()=>packet(body([health,health])),/sensor-health/);
 const clean=packet(body([{...health,private_device:'secret'}]));assert(!JSON.stringify(clean).includes('secret'));
});
test('mock Meta runtime receives sensor evidence and interpretation limits',async()=>{
 const e=evidence(get());let calls=0;const runtime=createRuntime({key:'synthetic-test',maxCalls:1,provider:async(url,opt)=>{
  calls++;const request=JSON.parse(opt.body);assert.equal(request.model,'muse-spark-1.3');assert.equal(JSON.parse(request.input).evidence[0].sensor_health[0].status_counts.unknown,4);assert.match(request.instructions,/qualitative vendor reports/);assert.match(request.instructions,/not confirmed impacts/);
  return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'Review the mounting before comparing the signal.',observations:[{text:'Some phone samples approach the reported range.',evidence_ids:['trip_1']}],question:null})}]}]})};
 }});await runtime.ask({question:'Review the signal',rides:[e]});assert.equal(calls,1);
 const maximum=packet({question:'x'.repeat(500),rides:[e,e],history:Array.from({length:4},()=>({role:'user',content:'x'.repeat(600)}))});assert(JSON.stringify(maximum).length<10000);
});
