const test=require('node:test'),assert=require('node:assert/strict'),compare=require('../web/ride-compare.js'),{ride}=require('./compare-fixture.cjs'),{evidence,comparable}=require('../web/companion.js'),{packet,createRuntime}=require('./muse-runtime.cjs'),insights=require('../web/ride-insights.js');
test('comparison screens complete matching native recordings without calling them calibrated',()=>{
 const a=ride(),b=ride(1),pair=compare.compare(a,b);assert(pair.setupMatched);assert.equal(pair.route.matched,true);assert.equal(pair.channels.length,3);
 for(const c of pair.channels){assert(c.eligible);assert(c.delta>0);assert.equal(c.first.bins,60);assert.equal(c.first.coverage,1);assert(c.first.median<=c.first.p95);}
});
test('unknown, inconsistent and different setups withhold change claims',()=>{
 const a=ride();for(const fields of [{device:''},{bike_id:'Different bike'},{bike_type:'Unknown'},{placement:'Unknown'},{mount_condition:'Slipping'},{recurring:''},{finalized:false},{kind:'walk'},{source:'GPX export'}]){
  const pair=compare.compare(a,{...ride(1),...fields});assert.equal(pair.setupMatched,false);assert(pair.channels.every(c=>c.delta===null));
 }
 assert.equal(compare.setupMatched({...a,placement:'Pocket',mount_condition:'Not mounted'},{...ride(1),placement:'Pocket',mount_condition:'Not mounted'}),true);
 assert.equal(comparable({...a,placement:'Bag',mount_condition:'Stable'},{...ride(1),placement:'Bag',mount_condition:'Stable'}),false);
});
test('coarse route screening detects changed roads and reversed travel',()=>{
 const a=ride(),shifted=ride(1),reverse=ride(1);shifted.track=shifted.track.map(p=>[p[0]+.02,...p.slice(1)]);
 reverse.track=reverse.track.map((p,i)=>[...reverse.track[reverse.track.length-1-i].slice(0,2),...p.slice(2)]);
 assert.equal(compare.routes(a,shifted).matched,false);assert.equal(compare.routes(a,reverse).matched,false);
 const sparse={...a,track:a.track.filter((_,i)=>i%10===0)};assert.equal(compare.routes(a,sparse).matched,null);
});
test('route screening unwraps the date line and avoids reversing a loop',()=>{
 const a=ride(),b=ride(1);a.track=a.track.map((p,i)=>[i<30?179.9985+i*.00005:-180+(i-30)*.00005,...p.slice(1)]);b.track=a.track.map(p=>[...p]);assert.equal(compare.routes(a,b).matched,true);
 for(const r of [a,b])r.track=r.track.map((p,i)=>[77+.003*Math.cos(i/60*Math.PI*2),12+.003*Math.sin(i/60*Math.PI*2),...p.slice(2)]);
 b.track=b.track.map((p,i)=>[...b.track[60-i].slice(0,2),...p.slice(2)]);assert.equal(compare.routes(a,b).matched,false);
});
test('channel diagnostics gate clipping, gaps, missing status, range changes and rate mismatch',()=>{
 const a=ride();for(const [change,reason] of [[{clipped:1},'clipping'],[{maximumRange:null},'range_unknown'],[{maximumRange:100},'range_changed'],[{maxGap:2},'gaps'],[{accuracy:{unknown:600}},'status'],[{hz:20},'rate'],[{diagnosticsVersion:undefined},'diagnostics']]){
  const b=ride(1);Object.assign(b.stats.find(s=>s.type===1),change);const c=compare.compare(a,b).channels[0];assert(c.reasons.includes(reason));assert.equal(c.delta,null);
 }
});
test('one-second summaries preserve zero, discard ambiguous duplicate bins and exclude partial final seconds',()=>{
 const a={...ride(),duration:60.5};a.signals=[[0,1,1,0,0],[1,1,1,0,0],[1,1,1,9,9],[2,1,1,3,3],[2,1,1,null,null],[59,1,1,2,2],[60,1,1,99,99]];
 const profile=compare.profile(a,compare.definitions[0]);assert.deepEqual(profile.points,[[0,0],[59,2]]);assert.equal(profile.median,1);assert.equal(profile.bins,2);assert.equal(profile.completeSeconds,60);
});
test('Meta comparison packets exclude routes, source labels, identifiers and private notes',()=>{
 const a=ride(),b=ride(1),context=compare.packet(compare.compare(a,b)),body={question:'Explain',rides:[evidence(a),evidence(b)],comparison:context},clean=packet(body);
 assert(clean.comparison.channels.every(c=>c.eligible));for(const value of ['Private','longitude','latitude','points'])assert(!JSON.stringify(clean).includes(value));
 assert.equal(clean.comparison.channels[0].measure,'1s medians · includes gravity');
 const max=packet({...body,rides:[a,b].map(r=>evidence(r,insights.summary(r,insights.analyze(r)))),question:'x'.repeat(500),history:Array.from({length:4},()=>({role:'user',content:'x'.repeat(600)}))});assert(JSON.stringify(max).length<10000);
});
test('server bounds comparison summaries and derives failed checks from sensor evidence',()=>{
 const a=ride(),b=ride(1),body={question:'Explain',rides:[evidence(a),evidence(b)],comparison:compare.packet(compare.compare(a,b))};
 for(const edit of [x=>x.rides.pop(),x=>x.comparison.setup_checks.phone='yes',x=>x.comparison.channels[0].first.bins=999,x=>x.comparison.channels[0].first.p95=-1,x=>x.comparison.channels[0].channel='private',x=>x.comparison.channels[0].reasons=['invented'],x=>x.rides[1].placement='Bag']){const copy=structuredClone(body);edit(copy);assert.throws(()=>packet(copy),/comparison|Comparison/);}
 const clipped=structuredClone(body);clipped.rides[0].sensor_health[0].near_range_samples=1;assert.equal(packet(clipped).comparison.channels[0].eligible,false);assert(packet(clipped).comparison.channels[0].reasons.includes('clipping'));
});
test('mock Meta provider receives both screened summaries and limitations',async()=>{
 const a=ride(),b=ride(1);let calls=0;const runtime=createRuntime({key:'synthetic',maxCalls:1,provider:async(url,opt)=>{
  calls++;const request=JSON.parse(opt.body),input=JSON.parse(request.input);assert.equal(input.comparison.channels[0].eligible,true);assert.equal(input.evidence.length,2);assert.match(request.instructions,/eligible=false/);assert.match(request.instructions,/not better riding/);
  return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'The phone signals differ within matching recorded setups.',observations:[{text:'This does not identify a road or rider cause.',evidence_ids:['trip_1','trip_2']}],question:null})}]}]})};
 }});await runtime.ask({question:'Explain',rides:[evidence(a),evidence(b)],comparison:compare.packet(compare.compare(a,b))});assert.equal(calls,1);
});
