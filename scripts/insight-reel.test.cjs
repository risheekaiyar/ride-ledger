const test=require('node:test'),assert=require('node:assert/strict'),reel=require('../web/insight-reel.js'),companion=require('../web/companion.js'),{packet,createRuntime}=require('./muse-runtime.cjs');
const ride={kind:'ride',placement:'Rigid mount',bike_type:'Adventure',mount_condition:'Stable',duration:6,distanceReliable:true,distanceKm:.1,stats:[],track:[[77,12,0,0,3,10,0,0],[77.001,12,1,10,3,12,0,0],[77.002,12,2,10,3,14,0,0],[77.003,12,4,10,3,20,0,1],[77.004,12,5,0,3,22,0,1],[77.005,12,6,0,3,24,0,1]],notes:'private home',id:'private-id'};
const body=(r=ride)=>({question:'Find the story.',rides:[companion.evidence(r)],recap:reel.packet(reel.analyze(r))});
function reply(context){return {title:'Your ride, in perspective.',takeaway:'Keep the phone placement consistent next time and note the conditions after parking.',chapters:[...context.scenes].reverse().map(scene=>({scene,headline:'A closer look.',insight:'The observed pattern is a useful baseline; missing intervals remain unknown.',fact_ids:reel.scenes[scene].facts.filter(id=>context.facts[id]!==undefined)}))};}
test('recap partitions actual observed time and interpolates moving stretches without bridging gaps',()=>{
 const r=reel.analyze(ride);assert.equal(r.facts.observed,4);assert.equal(r.facts.moving,2);assert.equal(r.facts.low,2);assert.equal(r.facts.missing,2);assert.equal(r.facts.longest,1.5);assert.equal(r.facts.average,5);assert.equal(r.facts.peak,10);assert.equal(r.facts.altitude_span,14);assert.equal(r.altitude.length,96);assert.equal(r.altitude.filter(b=>b.complete).length,64);assert.deepEqual(ride.track[2],[77.002,12,2,10,3,14,0,0]);
});
test('exact threshold is moving, zero speed is real, and missing speed is unknown',()=>{
 const r={...ride,duration:2,track:ride.track.slice(0,3).map(p=>[...p.slice(0,3),5,...p.slice(4)])};assert.equal(reel.analyze(r).facts.longest,2);assert.equal(reel.analyze(r).facts.moving,2);
 r.track=r.track.map(p=>[...p.slice(0,3),null,...p.slice(4)]);const d=reel.analyze(r);assert.equal(d.facts.observed,0);assert.equal(d.facts.missing,2);assert.equal(d.facts.average,undefined);assert(!d.available.includes('pace'));
});
test('GPX uses ending interval estimates, allows estimated mapped distance and does not acquire phone facts',()=>{
 const r={...ride,source:'GPX export',distanceReliable:false};const b=body(r),p=packet(b);assert.equal(p.recap.source,'gpx_interval_estimate');assert.equal(p.recap.facts.average,5);assert.equal(p.evidence[0].distance_km,null);assert(!p.evidence[0].sensor_health);assert(!JSON.stringify(p).includes('private'));assert(!JSON.stringify(p).includes('77.00'));
});
test('recap context rejects incoherent time, bands, units and unavailable scenes before consuming model allowance',async()=>{
 const b=body();packet(b);for(const change of [x=>x.recap.facts.moving=6,x=>x.recap.facts.elapsed=8,x=>x.recap.facts.distance=9,x=>x.recap.facts.longest=5,x=>x.recap.facts.safety_score=99,x=>x.recap.speed_band_seconds[0]=10,x=>x.recap.scenes.push('pace'),x=>x.recap.facts.altitude_span=900,x=>x.recap.facts.dominant_share=99,x=>x.recap.scenes=['constructor'],x=>x.recap.facts.constructor=9]){const bad=structuredClone(b);change(bad);assert.throws(()=>packet(bad));}
 const runtime=createRuntime({key:'test-only',maxCalls:1,provider:()=>assert.fail('Invalid context reached provider')});const bad=structuredClone(b);bad.recap.facts.moving=-1;await assert.rejects(runtime.ask(bad));assert.equal(runtime.status().remaining,1);
});
test('Meta directs chapter order and fact emphasis through a strict Meta-only runtime schema',async()=>{
 const b=body(),expected=reply(b.recap);let sent;const runtime=createRuntime({key:'synthetic-test',maxCalls:1,provider:async(url,options)=>{assert.equal(url,'https://api.meta.ai/v1/responses');sent=JSON.parse(options.body);return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(expected)}]}]})};}});
 const actual=await runtime.ask(b);assert.equal(actual.model,'muse-spark-1.3');assert.equal(actual.chapters[0].scene,'elevation');assert.equal(actual.remaining,0);assert.equal(sent.store,false);assert.equal(sent.text.format.name,'visual_ride_recap');assert.equal(sent.text.format.strict,true);assert.match(sent.instructions,/skill score/);assert(!sent.instructions.includes('exactly these keys: summary'));assert.equal(sent.max_output_tokens,4096);
});
test('unverified numbers, cross-scene facts, duplicate or missing scenes and empty narratives are rejected',()=>{
 const c=body().recap;reel.validateReply(reply(c),c);for(const change of [r=>r.title='You scored 99',r=>r.chapters[0].fact_ids=['peak'],r=>r.chapters[0].scene='pace',r=>r.chapters.pop(),r=>r.takeaway='',r=>r.chapters[0].insight='x'.repeat(351),r=>r.chapters[0].fact_ids=['altitude_max','altitude_max']]){const r=reply(c);change(r);assert.throws(()=>reel.validateReply(r,c));}
});
test('empty and stationary trips retain readable local insights without inventing a route',()=>{
 const r={...ride,duration:0,distanceKm:0,track:[]};const d=reel.analyze(r);assert.deepEqual(d.available,['rhythm']);assert.equal(d.facts.observed,0);assert.equal(d.facts.longest,0);packet(body(r));
 const stationary=reel.analyze({...ride,track:ride.track.map(p=>[77,12,...p.slice(2)])});assert(!stationary.available.includes('route'));assert(stationary.available.includes('pace'));
});
test('ride flow includes only saved speed-change candidates with available speed, and links original times locally',()=>{
 const events=[{id:'slow',kind:'braking',t:1,g:.2},{id:'up',kind:'acceleration',t:5,g:.15},{id:'gap',kind:'braking',t:3,g:.3},{id:'phone',kind:'impact',t:1,g:1.8}];
 const r={...ride,events},d=reel.analyze(r);assert(d.available.includes('flow'));assert.equal(d.facts.slowing,1);assert.equal(d.facts.picking_up,1);assert.deepEqual(d.moments.map(m=>m.t),[1,5]);assert.equal(d.speedBins.length,96);assert.equal(d.speedBins.reduce((n,b)=>n+b.slowing+b.picking_up,0),2);const sent=packet(body(r));assert(!JSON.stringify(sent).includes('slow"'));assert.equal(sent.recap.facts.slowing,1);assert(!reel.analyze({...r,source:'GPX export'}).available.includes('flow'));
 const invalid=body(r);invalid.recap.source='gpx_interval_estimate';assert.throws(()=>packet(invalid));
});
test('long rides keep bounded visual bins while all intervals contribute to measurements',()=>{
 const r={...ride,duration:7200,track:Array.from({length:7201},(_,i)=>[77+i/100000,12,i,36,3,100+i/100,0,0])},d=reel.analyze(r);assert.equal(d.speedBins.length,96);assert.equal(d.altitude.length,96);assert.equal(d.facts.observed,7200);assert.equal(d.facts.longest,7200);assert.equal(d.facts.average,36);assert(d.speedBins.every(b=>b.value===36));assert.equal(d.telemetry.seconds[2],7200);assert(JSON.stringify(reel.packet(d)).length<800);
});
