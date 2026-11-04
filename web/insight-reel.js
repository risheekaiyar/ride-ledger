/* Local measurements drive every graphic. Meta selects and interprets this bounded fact catalog. */
(function(root){
'use strict';
const definitions={
 slowing:{label:'Speed reductions',unit:'candidates',max:100000},picking_up:{label:'Speed increases',unit:'candidates',max:100000},
 g_samples:{label:'GPS acceleration intervals',unit:'intervals',max:1000000},
 elapsed:{label:'Recorded time',unit:'s',max:1000000},distance:{label:'Recorded distance',unit:'km',max:1000000},
 observed:{label:'Speed observed',unit:'s',max:1000000},moving:{label:'Moving ≥ 5 km/h',unit:'s',max:1000000},low:{label:'Below 5 km/h',unit:'s',max:1000000},missing:{label:'Unobserved time',unit:'s',max:1000000},
 average:{label:'Observed average',unit:'km/h',max:252},peak:{label:'Observed peak',unit:'km/h',max:252},
 dominant_share:{label:'Time in leading band',unit:'%',max:100},longest:{label:'Longest observed moving stretch',unit:'s',max:1000000},
 altitude_min:{label:'Lowest source altitude',unit:'m',min:-1000,max:10000},altitude_max:{label:'Highest source altitude',unit:'m',min:-1000,max:10000},altitude_span:{label:'Source altitude range',unit:'m',max:11000}
};
const scenes={
 flow:{label:'G trace',title:'How the pace changed.',facts:['slowing','picking_up','g_samples','observed'],note:'Longitudinal G uses GPS speed change. Lateral G uses GPS heading change and speed. Missing axes stay blank.'},
 route:{label:'The journey',title:'Your ride. In another dimension.',facts:['distance','elapsed','average'],note:'Route shape from your recording. Road width and surroundings are illustrative.'},
 pace:{label:'Your pace',title:'Find your rhythm.',facts:['average','peak','dominant_share'],note:'Time-weighted speed distribution. Gaps are excluded; speed alone cannot establish riding skill or safety.'},
 rhythm:{label:'Pauses & gaps',title:'Where the ride paused.',facts:['low','missing','moving','longest'],note:'Low-speed windows include pauses and crawling. Check the map and add context if you remember the reason.'},
 elevation:{label:'The vertical story',title:'A different perspective.',facts:['altitude_span','altitude_max','altitude_min'],note:'Source altitude, with unverified datum and accuracy. This is a range, not accumulated climbing or road grade.'}
};
const round=n=>Math.round(n*1000)/1000;
const weatherLabels={clear:'Clear',light_rain:'Light rain',heavy_rain:'Heavy rain'};
const pauseLabels={fuel:'Fuel stop',rest:'Rest stop',traffic:'Waiting in traffic',other:'Other rider-confirmed pause'};
function pauses(intervals){
 const result=[];
 let window=null;
 function finish(){if(window&&window.end-window.start>=8)result.push(window);window=null;}
 for(const [start,end,a,b] of intervals){
  if(a>=5||b>=5){finish();continue;}
  if(window&&Math.abs(start-window.end)>.001)finish();
  if(!window)window={start,end};
  else window.end=end;
 }
 finish();
 return result.sort((a,b)=>(b.end-b.start)-(a.end-a.start)).slice(0,5)
  .map(({start,end})=>({start_second:round(start),end_second:round(end)}));
}
function analyze(ride){
 const telemetry=root.OdoTelemetry||(typeof require==='function'?require('./telemetry.js'):null),t=telemetry.analyze(ride),facts={elapsed:round(Math.max(0,ride.duration||0)),observed:round(t.observed),moving:round(t.moving),low:round(t.lowSpeed),missing:round(t.unobserved)};
 if((ride.distanceReliable||t.imported)&&Number.isFinite(ride.distanceKm)&&ride.distanceKm>=0)facts.distance=round(ride.distanceKm);
 if(t.average!==null){facts.average=round(t.average);facts.peak=round(t.peak);facts.dominant_share=round(Math.max(...t.seconds)/t.observed*100);}
 let run=0,longest=0,lastEnd=-Infinity;const intervals=[],altitude=[],track=ride.track||[],limit=t.imported?30:3;
 // Keep all gaps in the visual envelope; bounded display bins never change the metrics.
 const speedBins=Array.from({length:96},(_,i)=>({start:i*facts.elapsed/96,end:(i+1)*facts.elapsed/96,covered:0,integral:0,slowing:0,picking_up:0}));
 const bins=Array.from({length:96},(_,i)=>({start:i*facts.elapsed/96,end:(i+1)*facts.elapsed/96,min:null,max:null,covered:0}));
 for(let i=1;i<track.length;i++){
  const a=track[i-1],b=track[i],dt=b[2]-a[2],start=t.imported?b[3]:a[3];
  const connected=a[2]>=0&&b[2]<=facts.elapsed+.001&&a[2]>=lastEnd&&a[7]===b[7]&&dt>0&&dt<=limit;
  const valid=connected&&[start,b[3]].every(v=>Number.isFinite(v)&&v>=0&&v<252);
  if(valid){lastEnd=b[2];const aboveA=start>=5,aboveB=b[3]>=5;
   if(aboveA&&aboveB)run+=dt;else if(aboveB){run=dt*(b[3]-5)/(b[3]-start);}else if(aboveA){run+=dt*(start-5)/(start-b[3]);longest=Math.max(longest,run);run=0;}else run=0;
   longest=Math.max(longest,run);intervals.push([a[2],b[2],start,b[3]]);
   const first=Math.max(0,Math.floor(a[2]/facts.elapsed*96)),last=Math.min(95,Math.ceil(b[2]/facts.elapsed*96)-1);
   for(let k=first;k<=last;k++){const bin=speedBins[k],left=Math.max(a[2],bin.start),right=Math.min(b[2],bin.end);if(right<=left)continue;const value=x=>start+(b[3]-start)*(x-a[2])/dt;bin.integral+=(value(left)+value(right))/2*(right-left);bin.covered+=right-left;}

  }else run=0;
  if(connected&&[a[5],b[5]].every(v=>Number.isFinite(v)&&v>=-1000&&v<=10000)&&facts.elapsed>0){
   const first=Math.max(0,Math.floor(a[2]/facts.elapsed*96)),last=Math.min(95,Math.ceil(b[2]/facts.elapsed*96)-1);
   for(let k=first;k<=last;k++){const bin=bins[k],left=Math.max(a[2],bin.start),right=Math.min(b[2],bin.end);if(right<=left)continue;const value=x=>a[5]+(b[5]-a[5])*(x-a[2])/dt,lo=Math.min(value(left),value(right)),hi=Math.max(value(left),value(right));bin.min=bin.min===null?lo:Math.min(bin.min,lo);bin.max=bin.max===null?hi:Math.max(bin.max,hi);bin.covered+=right-left;}
  }
 }
 facts.longest=round(longest);
 for(const bin of bins)altitude.push({...bin,complete:bin.covered>=bin.end-bin.start-.001&&bin.min!==null});
 if(altitude.some(b=>b.complete)&&t.altitudeMin!==null){facts.altitude_min=round(t.altitudeMin);facts.altitude_max=round(t.altitudeMax);facts.altitude_span=round(t.altitudeMax-t.altitudeMin);}
 const pauseWindows=pauses(intervals);
 const available=!intervals.length||pauseWindows.length||facts.missing>=10||facts.low>=10?['rhythm']:[];
 if(intervals.length){available.unshift('pace');const first=track[0],hasShape=first&&track.some(p=>Math.hypot((((p[0]-first[0]+540)%360)-180)*Math.cos(first[1]*Math.PI/180),p[1]-first[1])*111320>=1);if(hasShape)available.unshift('route');}if(facts.altitude_span!==undefined)available.push('elevation');
 const momentsModule=root.OdoReviewMoments||(typeof require==='function'?require('./review-moments.js'):null);
 const moments=t.imported?[]:momentsModule.list(ride).filter(m=>m.kind!=='impact').map(m=>({...m,speed:telemetry.inspect(ride,m.t).speed})).filter(m=>m.speed!==null);
 const instruments=root.OdoReplayInstruments||(typeof require==='function'?require('./replay-instruments.js'):null);
 const gSamples=instruments?.dynamics(ride).length||0;
 if(t.observed>0&&(moments.length||gSamples)){
  facts.slowing=moments.filter(m=>m.kind==='braking').length;facts.picking_up=moments.length-facts.slowing;
  if(gSamples)facts.g_samples=gSamples;
  available.splice(available.includes('elevation')?available.indexOf('elevation'):available.length,0,'flow');
  for(const m of moments){const b=speedBins[Math.min(95,Math.floor(m.t/facts.elapsed*96))];const key=m.kind==='braking'?'slowing':'picking_up';b[key]++;b[key+'Speed']=Math.max(b[key+'Speed']??0,m.speed);}
 }
 for(const b of speedBins){b.complete=b.covered>=b.end-b.start-.001&&b.covered>0;b.value=b.covered?b.integral/b.covered:null;}
 const band=t.seconds.indexOf(Math.max(...t.seconds)),bandLabel=band===6?'100+':`${t.bands[band]}–${t.bands[band+1]}`;
 const insights={
  flow:gSamples?'Follow the dot to see where GPS picked up acceleration, braking or a turn. A blank axis means no usable observation.':'The route includes speed-change markers. Open a moment to check what was recorded there.',
  route:`${t.imported?'An imported route':'A recorded journey'}, reconstructed from its connected fixes. Play it back from a fresh angle.`,
  pace:`Your most-observed speed band was ${bandLabel} km/h. Use this distribution as a baseline for future rides with comparable conditions.`,
  rhythm:pauseWindows.length?'Check the longest low-speed window on the route to see where time was spent. Add a reason if you remember the stop.':'Speed was missing for part of this recording. That time stays separate from pauses so it does not distort the recap.',
  elevation:'The recorded altitude has its own silhouette. Gaps stay open, and vertical scale is exaggerated to make the shape readable.'
 };
 return {facts,telemetry:t,altitude,speedBins,moments,band,bandLabel,available,pauseWindows,source:t.imported?'gpx_interval_estimate':'phone_gps',chapters:available.map(scene=>({scene,headline:scenes[scene].title,insight:insights[scene],fact_ids:scenes[scene].facts.filter(id=>facts[id]!==undefined).slice(0,4)}))};
}
function packet(data,riderContext){
 return {source:data.source,scenes:data.available,facts:{...data.facts},speed_band_seconds:data.telemetry.seconds.map(round),
  pause_windows:data.pauseWindows,...(riderContext?{rider_context:riderContext}:{})};
}
function validatePacket(value,ride){
 if(!value||!['phone_gps','gpx_interval_estimate'].includes(value.source)||!Array.isArray(value.scenes)||!value.scenes.length||value.scenes.length>5||new Set(value.scenes).size!==value.scenes.length||value.scenes.some(s=>!Object.hasOwn(scenes,s))||!value.facts||typeof value.facts!=='object')throw Error('Invalid visual recap context.');
 const facts={};for(const [id,v] of Object.entries(value.facts)){const d=definitions[id];if(!Object.hasOwn(definitions,id)||!Number.isFinite(v)||v<(d.min||0)||v>d.max)throw Error('Invalid recap fact.');facts[id]=v;}
 const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.02;
 if(!['elapsed','observed','moving','low','missing','longest'].every(id=>Number.isFinite(facts[id]))||!near(facts.elapsed,ride.duration_seconds)||!near(facts.moving+facts.low,facts.observed)||!near(facts.observed+facts.missing,facts.elapsed)||facts.longest>facts.moving+.02||facts.distance!==undefined&&!(value.source==='gpx_interval_estimate'&&ride.distance_km===null)&&!near(facts.distance,ride.distance_km))throw Error('Recap timing or distance contradicts ride evidence.');
 if((facts.slowing!==undefined||facts.picking_up!==undefined)&&(value.source!=='phone_gps'||!Number.isInteger(facts.slowing)||!Number.isInteger(facts.picking_up)))throw Error('Invalid speed-change candidate counts.');
 const bands=value.speed_band_seconds;if(!Array.isArray(bands)||bands.length!==7||bands.some(n=>!Number.isFinite(n)||n<0)||!near(bands.reduce((a,b)=>a+b,0),facts.observed)||!near(bands[0],facts.low))throw Error('Invalid recap speed bands.');
 if(facts.observed>0&&(!near(facts.dominant_share,Math.max(...bands)/facts.observed*100)||!Number.isFinite(facts.average)||!Number.isFinite(facts.peak)||facts.average>facts.peak))throw Error('Invalid recap speed summary.');
 if(facts.g_samples!==undefined&&(!Number.isInteger(facts.g_samples)||facts.g_samples<1||value.source!=='phone_gps'))throw Error('Invalid GPS acceleration coverage.');
 if(value.scenes.some(s=>s==='pace'&&!(facts.observed>0)||s==='route'&&!(facts.observed>0)||s==='flow'&&(value.source!=='phone_gps'||!Number.isInteger(facts.slowing)||!Number.isInteger(facts.picking_up)||!(facts.slowing+facts.picking_up||facts.g_samples)||!(facts.observed>0))||s==='elevation'&&(!near(facts.altitude_max-facts.altitude_min,facts.altitude_span))))throw Error('Recap scene lacks measurements.');
 const windows=value.pause_windows??[];
 if(!Array.isArray(windows)||windows.length>5)throw Error('Invalid low-speed windows.');
 const cleanWindows=windows.map(window=>{
  const start=window?.start_second,end=window?.end_second;
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>facts.elapsed+.001||end-start<7.999)throw Error('Invalid low-speed window.');
  return {start_second:start,end_second:end};
 });
 const chronological=[...cleanWindows].sort((a,b)=>a.start_second-b.start_second);
 if(chronological.some((w,i)=>i>0&&w.start_second<chronological[i-1].end_second)||
  cleanWindows.reduce((sum,w)=>sum+w.end_second-w.start_second,0)>facts.low+.02)throw Error('Low-speed windows contradict recorded time.');
 const input=value.rider_context;
 let context;
 if(input!==undefined){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['weather','pause'].includes(k)))throw Error('Invalid rider context.');
  context={};
  if(input.weather!==undefined){
   if(typeof input.weather!=='string'||!Object.hasOwn(weatherLabels,input.weather))throw Error('Invalid rider weather.');
   context.weather=input.weather;
  }
  if(input.pause!==undefined){
   const p=input.pause;
   if(!p||!Number.isInteger(p.window)||!cleanWindows[p.window]||typeof p.reason!=='string'||!Object.hasOwn(pauseLabels,p.reason))throw Error('Invalid rider pause label.');
   context.pause={window:p.window,reason:p.reason};
  }
 }
 return {source:value.source,scenes:[...value.scenes],facts,speed_band_seconds:[...bands],pause_windows:cleanWindows,...(context?{rider_context:context}:{})};
}
function validateReply(value,context){
 const prose=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/\d/.test(s);
 if(!value||!prose(value.title,70)||!prose(value.takeaway,350)||!Array.isArray(value.chapters)||value.chapters.length!==context.scenes.length)throw Error('Meta recap failed validation.');
 const seen=new Set();for(const c of value.chapters){if(!c||!context.scenes.includes(c.scene)||seen.has(c.scene)||!prose(c.headline,70)||!prose(c.insight,350)||!Array.isArray(c.fact_ids)||c.fact_ids.length<1||c.fact_ids.length>4||new Set(c.fact_ids).size!==c.fact_ids.length||c.fact_ids.some(id=>!scenes[c.scene].facts.includes(id)||context.facts[id]===undefined))throw Error('Meta recap referenced unavailable facts or scenes.');seen.add(c.scene);}
 const pause=value.pause_window??null;
 if(pause!==null&&(!Number.isInteger(pause)||!context.pause_windows?.[pause]))throw Error('Meta recap referenced an unavailable low-speed window.');
 return {title:value.title,takeaway:value.takeaway,...(pause===null?{}:{pause_window:pause}),chapters:value.chapters.map(c=>({scene:c.scene,headline:c.headline,insight:c.insight,fact_ids:[...c.fact_ids]}))};
}
const api={definitions,scenes,weatherLabels,pauseLabels,analyze,packet,validatePacket,validateReply};root.OdoInsightReel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
