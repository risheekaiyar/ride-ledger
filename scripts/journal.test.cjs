'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const J=require('../web/field-journal.js'),route=require('../web/journal-route.js'),frame=require('./field-frame.cjs'),{createRuntime}=require('./muse-runtime.cjs');
const [mountain,coast]=J.demoTrips(require('../web/portable.js'));
const assets=path.join(__dirname,'../web/assets'),jpeg=fs.readFileSync(path.join(assets,'field-overlook.jpg')),receipt=require('../web/assets/field-spark-review.json');
const baseFacts=J.facts(mountain,5100);
const packet=()=>({consent:'one-frame-v1',facts:{...baseFacts},jpeg:jpeg.toString('base64')});
const reply=(values=receipt.review)=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(values)}]}],usage:{input_tokens:540,output_tokens:558}});
test('scenic pause is a measured interval with an open cause; verified receipt matches the packaged evidence',()=>{
  assert.equal(baseFacts.low_seconds,180);assert.equal(baseFacts.speed_kmh,0);assert.equal(J.nextQuestion(baseFacts),'pause');
  assert.deepEqual(baseFacts,receipt.facts);assert.equal(crypto.createHash('sha256').update(jpeg).digest('hex'),receipt.frame_sha256);
  assert.equal(receipt.kind,'saved-live-synthetic');assert.equal(receipt.requests,1);assert.equal(receipt.model,'muse-spark-1.3');
});
test('a station visible in a frame does not confirm refuelling; unsafe claims and forged evidence are rejected',()=>{
  const v={visual_cue:'fuel_station',question_intent:'fuel',evidence_ids:['frame']};assert.deepEqual(frame.extract(reply(v),baseFacts),v);assert.match(J.cueLabels.fuel_station,/visible/);
  assert.throws(()=>frame.extract(reply({...v,visual_cue:'fuel_purchased'}),baseFacts));assert.throws(()=>frame.extract(reply({...v,evidence_ids:['rider_confirmed']}),baseFacts));
});
test('a rough-looking surface and quiet phone evidence can coexist without a surface verdict',()=>{
  const v={visual_cue:'uneven_surface',question_intent:'surface',evidence_ids:['frame']};assert.deepEqual(frame.extract(reply(v),baseFacts),v);
  assert.match(J.cueLabels.uneven_surface,/appears/);assert.ok(!baseFacts.phone_peak_candidate);
});
test('a vibration peak is attributed to the phone and the rider can identify mount movement',()=>{
  const f=J.facts({duration:99,track:[],events:[{kind:'impact',t:55,g:1.8}]},55);
  assert.equal(f.phone_peak_candidate,true);assert.match(J.measuredText(f),/source is unknown/);assert.ok(J.prompts[J.nextQuestion(f)][1].includes('Phone mount moved'));
});
test('two supplied synthetic plans each yield one candidate; identical plans yield none',()=>{
  for(const trip of [mountain,coast]){const result=route.compare(trip,route.samplePlan(trip));assert.equal(result.candidates.length,1);assert.ok(result.candidates[0].meters>300);
    assert.equal(route.compare(trip,[trip.track.map(p=>p.slice(0,2))]).candidates.length,0);}
});
test('an absent plan, an absent trace and a gap do not establish a detour',()=>{
  assert.equal(route.compare(mountain,null).state,'no-plan');assert.equal(route.compare({track:[]},[[[1,2],[1,3]]]).state,'no-coverage');
  const trip={source:'GPX export',track:[[1,1,0,0,0,null,0,0],[1.01,1,500,0,0,null,0,0]]};
  assert.equal(route.compare(trip,[[[0,0],[0,.1]]]).state,'no-coverage');
});
test('uncertain video alignment requires an explicit valid ride time, independent of clip time',()=>{
  assert.equal(J.parseTime('1:25:00'),5100);assert.equal(J.parseTime('0:03'),3);assert.ok(Number.isNaN(J.parseTime('1:92')));
  assert.ok(Number.isNaN(J.parseTime('-1')));assert.throws(()=>J.facts(mountain,1e7));assert.throws(()=>J.facts(mountain,NaN));
});
test('dated conflicting reports subdivide route coverage without double counting or filling unknown distance',()=>{
  assert.deepEqual(route.coverage(205,route.demoReports),{smooth:9,rough:6,conflict:9,unknown:181});
  assert.deepEqual(route.coverage(187,[]),{smooth:0,rough:0,conflict:0,unknown:187});assert.notEqual(route.demoReports[0].date,route.demoReports[1].date);
});
test('missing channels, elevation and route gaps remain unknown in journal facts',()=>{
  const r={duration:200,track:[[1,1,0,18,0,null,0,0],[2,2,200,30,0,null,0,1]],events:[]};
  assert.equal(J.rowAt(r,90),-1);assert.equal(J.facts(r,90).speed_kmh,null);assert.equal(J.facts(r,0).elevation_m,null);
  const no=J.facts({duration:30,track:[]},2);assert.throws(()=>frame.extract(reply(),no));assert.equal(J.nextQuestion(no),'open');
});
test('two-day totals use timed tracks and preserve overlapping collection membership without double counting',()=>{
  const data=J.distanceSummary([mountain,coast]);assert.equal(Math.round(data.km),392);assert.equal(data.known,2);
  assert.notEqual(mountain.id,coast.id);assert.ok(mountain.tags.includes('Mountains'));assert.ok(coast.tags.includes('Beaches'));assert.ok([mountain,coast].every(r=>r.tags.includes('Monsoon rides')));
  assert.deepEqual(J.distanceSummary([{distanceKm:999,distanceReliable:false}]),{km:null,known:0,total:1});
});
test('frame route strictly allowlists consent, facts, one small JPEG, and no location, raw media or metadata',()=>{
  assert.ok(frame.validate(packet()));assert.throws(()=>frame.validate({...packet(),consent:false}));
  assert.throws(()=>frame.validate({...packet(),facts:{...baseFacts,lon:73}}));assert.throws(()=>frame.validate({...packet(),filename:'private.mp4'}));
  assert.throws(()=>frame.validate({...packet(),jpeg:'https://example.com/pic'}));
  const annotated=Buffer.concat([jpeg.subarray(0,2),Buffer.from([255,225,0,6,69,120,105,102]),jpeg.subarray(2)]);
  assert.throws(()=>frame.validate({...packet(),jpeg:annotated.toString('base64')}),/metadata/);
  assert.throws(()=>frame.validate({...packet(),jpeg:Buffer.concat([jpeg,jpeg]).toString('base64')}));
  assert.equal(J.cleanCanvasJpeg('data:image/jpeg;base64,'+annotated.toString('base64')),'data:image/jpeg;base64,'+jpeg.toString('base64'));
});
test('frame generation and ordinary companion share a single allowance; invalid packets spend nothing',async()=>{
  let calls=0;const runtime=createRuntime({key:'test',maxCalls:1,provider:async(url,options)=>{
    calls++;const b=JSON.parse(options.body);assert.equal(url,'https://api.meta.ai/v1/responses');assert.equal(b.store,false);assert.equal(b.model,'muse-spark-1.3');
    assert.deepEqual(b.input[0].content.map(x=>x.type),['input_text','input_image']);assert.deepEqual(JSON.parse(b.input[0].content[0].text),{ride_window:baseFacts});
    return {ok:true,json:async()=>reply()};}});
  await assert.rejects(runtime.askFrame({...packet(),latitude:1}));assert.equal(runtime.status().remaining,1);
  const all=await Promise.allSettled([runtime.askFrame(packet()),runtime.askFrame(packet())]);assert.equal(all.filter(v=>v.status==='fulfilled').length,1);assert.equal(calls,1);
  assert.equal(runtime.status().remaining,0);
});
test('offline and failed upstream requests yield no simulated AI result and are never retried',async()=>{
  const off=createRuntime({maxCalls:1,provider:()=>assert.fail()});await assert.rejects(off.askFrame(packet()),/not configured/);
  let calls=0;const fail=createRuntime({key:'test',maxCalls:2,provider:async()=>{calls++;return {ok:false,status:503};}});
  await assert.rejects(fail.askFrame(packet()),/503/);assert.equal(calls,1);assert.equal(fail.status().remaining,1);
  assert.throws(()=>frame.extract({status:'incomplete'},baseFacts),/incomplete/);
});
