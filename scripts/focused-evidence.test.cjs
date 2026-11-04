const test=require('node:test'),assert=require('node:assert/strict'),{summarize}=require('../web/focused-evidence.js');
const p=(time,speed,segment=0,altitude=null)=>[77,12,time,speed,2,altitude,90,segment,.2];
const selection={start:0,end:4,channel:'motion'};
test('focused evidence uses complete unique bins, retains zero and excludes partial boundary bins',()=>{
 const ride={duration:5.5,track:[],signals:[[0,99,1,1],[1,0,0,0],[2,2,null,.2],[3,3,.3,.3],[3,3,.3,.3],[4,4,.4,.4],[5,99,99,99]],notes:'secret',id:'private-id'},before=JSON.stringify(ride);
 const out=summarize(ride,{start:.2,end:5.5,channel:'motion'});assert.equal(out.start_second,1);assert.equal(out.end_second,5);
 assert.deepEqual(out.channels[0],{channel:'acceleration',bins:3,median:2,p95:3.8,maximum:4});assert.equal(out.channels[1].bins,2);assert.equal(out.channels[1].median,.2);
 assert.equal(out.speed.observed_seconds,0);assert.equal(out.speed.peak_kmh,null);assert.equal(out.source_altitude.minimum_m,null);assert.equal(JSON.stringify(ride),before);assert(!JSON.stringify(out).includes('secret'));assert(!JSON.stringify(out).includes('private-id'));
});
test('focused speed clips connected intervals, weights elapsed time and keeps source altitude separate',()=>{
 const out=summarize({duration:4,track:[p(0,0,0,0),p(2,20,0,20),p(4,40,0,40)],signals:[]},{start:1,end:3,channel:'speed'});
 assert.deepEqual(out.speed,{source:'phone_gps',observed_seconds:2,average_kmh:20,peak_kmh:30});assert.deepEqual(out.source_altitude,{samples:1,minimum_m:20,maximum_m:20});assert(out.channels.every(c=>c.bins===0&&c.maximum===null));
});
test('focused coverage excludes gaps, invalid speeds, overlapping time and segment transitions',()=>{
 const out=summarize({duration:10,track:[p(0,0),p(1,0),p(3,null),p(4,10),p(5,10,1),p(10,20,1)],signals:[]},{start:0,end:10,channel:'speed'});
 assert.equal(out.speed.observed_seconds,1);assert.equal(out.speed.average_kmh,0);assert.equal(out.speed.peak_kmh,0);
 const overlap=summarize({duration:4,track:[p(0,20),p(2,20),p(1,20),p(4,20)],signals:[]},selection);assert.equal(overlap.speed.observed_seconds,2);
});
test('GPX focus uses interval speed estimates and cannot acquire phone channels from an import',()=>{
 const out=summarize({duration:20,source:'GPX export',track:[p(0,null),p(10,36),p(20,72)],signals:[[5,3,.1,.2]]},{start:5,end:15,channel:'speed'});
 assert.deepEqual(out.speed,{source:'gpx_interval_estimate',observed_seconds:10,average_kmh:54,peak_kmh:72});assert(out.channels.every(c=>c.bins===0));
});
test('invalid or oversized focus cannot create evidence, and absent channel values remain missing',()=>{
 const ride={duration:1000,track:[],signals:[[0,'0',null,-1],[1,1001,Infinity,undefined],[2,0,0,0]]};
 for(const change of [{start:-1},{end:1001},{end:301},{start:3,end:3},{channel:'secret'},{end:NaN},{start:.1,end:.9}])assert.equal(summarize(ride,{...selection,...change}),null);
 const out=summarize(ride,selection);assert(out.channels.every(c=>c.bins===1&&c.maximum===0));
});
const {packet,createRuntime}=require('./muse-runtime.cjs'),{evidence}=require('../web/companion.js');
const base={duration:4,kind:'ride',placement:'Pocket',distanceReliable:false,track:[p(0,0),p(1,20)],signals:[[0,0,0,0],[1,2,.1,.2]],stats:[]};
const request=()=>({question:'Explain this window',rides:[evidence(base)],focus:summarize(base,selection)});
test('focused runtime packet strips private fields and derives its units and evidence identifier',()=>{
 const body=request();body.focus.latitude=77;body.focus.evidence_id='private-id';body.focus.channels[0].unit='secret';body.focus.channels[0].raw_samples='private';body.focus.speed.longitude=12;
 const out=packet(body);assert.equal(out.focus.evidence_id,'trip_1');assert.equal(out.focus.channels[0].unit,'g');assert(!JSON.stringify(out).includes('private'));assert(!JSON.stringify(out).includes('latitude'));assert(!JSON.stringify(out).includes('longitude'));
});
test('focused runtime rejects contradictory bounds, metrics and source claims',()=>{
 const mutations=[b=>b.focus.end_second=301,b=>b.focus.start_second=-1,b=>b.focus.end_second=5,b=>b.focus.selected_channel='private',b=>b.rides.push({...b.rides[0]}),b=>b.focus.channels[0].bins=5,b=>b.focus.channels[0].p95=100,b=>b.focus.channels[0].maximum=null,b=>b.focus.channels[1]={...b.focus.channels[0]},b=>b.focus.speed.observed_seconds=5,b=>b.focus.speed.average_kmh=200,b=>b.focus.speed.source='gpx_interval_estimate',b=>b.focus.source_altitude.samples=1,b=>b.focus.source_altitude.maximum_m=800];
 for(const mutate of mutations){const body=request();mutate(body);assert.throws(()=>packet(body),/focus|Focused|Invalid/);}
});
test('Meta receives focused evidence only through an explicit bounded runtime request',async()=>{
 let received;const runtime=createRuntime({key:'synthetic-test-key',maxCalls:1,provider:async(url,opt)=>{assert.equal(url,'https://api.meta.ai/v1/responses');const body=JSON.parse(opt.body);assert.equal(body.model,'muse-spark-1.3');assert.match(body.instructions,/recording-wide/);received=JSON.parse(body.input);return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'The phone signal needs context.',observations:[{text:'The selected window has incomplete GPS coverage.',evidence_ids:['trip_1']}],question:'Was the phone stable?'})}]}]})};}});
 await runtime.ask(request());assert.equal(received.focus.speed.observed_seconds,1);assert.equal(received.focus.channels[0].maximum,2);assert.equal(runtime.status().remaining,0);
});
test('fractional recording and screen timing retain precision for consistent evidence bounds',()=>{
 const out=evidence({...base,duration:4.499,screenObservedSeconds:4.4,screenOffSeconds:4.1});assert.equal(out.duration_seconds,4.499);assert.equal(out.screen_observed_seconds,4.4);assert.equal(out.screen_off_seconds,4.1);assert.doesNotThrow(()=>packet({question:'Explain',rides:[out]}));
});
test('serialized speed precision cannot contradict its observed coverage or upper bound',()=>{
 const tiny={...base,track:[p(.9999,20),p(1,20)]},tinyFocus=summarize(tiny,selection);assert.equal(tinyFocus.speed.observed_seconds,0);assert.equal(tinyFocus.speed.peak_kmh,null);assert.doesNotThrow(()=>packet({question:'Explain',rides:[evidence(tiny)],focus:tinyFocus}));
 const fast={...base,track:[p(0,251.9999),p(1,251.9999)]},fastFocus=summarize(fast,selection);assert.equal(fastFocus.speed.peak_kmh,252);assert.doesNotThrow(()=>packet({question:'Explain',rides:[evidence(fast)],focus:fastFocus}));
});
test('focused Meta evidence identifies the selected phone measure without changing its summaries',()=>{
 const raw=summarize(base,selection);
 for(const channel of ['linear_acceleration','rotation']){const focus=summarize(base,{...selection,channel});assert.equal(focus.selected_channel,channel);assert.deepEqual(focus.channels,raw.channels);assert.equal(packet({question:'Explain this channel',rides:[evidence(base)],focus}).focus.selected_channel,channel);}
});
