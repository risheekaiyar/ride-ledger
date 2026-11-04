/* Local measurements drive every graphic. Meta selects and interprets this bounded fact catalog. */
(function(root){
'use strict';
const definitions={
 g_peak:{label:'Peak estimated load',unit:'g',max:3},g_braking:{label:'Braking estimate',unit:'g',max:2},g_acceleration:{label:'Acceleration estimate',unit:'g',max:2},g_lateral:{label:'Lateral estimate',unit:'g',max:2},g_observed:{label:'Load coverage',unit:'s',max:1000000},
 slowing:{label:'Speed reductions',unit:'candidates',max:100000},picking_up:{label:'Speed increases',unit:'candidates',max:100000},
 elapsed:{label:'Recorded time',unit:'s',max:1000000},distance:{label:'Recorded distance',unit:'km',max:1000000},
 observed:{label:'Speed observed',unit:'s',max:1000000},moving:{label:'Moving ≥ 5 km/h',unit:'s',max:1000000},low:{label:'Below 5 km/h',unit:'s',max:1000000},missing:{label:'Unobserved time',unit:'s',max:1000000},
 average:{label:'Observed average',unit:'km/h',max:252},peak:{label:'Observed peak',unit:'km/h',max:252},
 dominant_share:{label:'Time in leading band',unit:'%',max:100},longest:{label:'Longest observed moving stretch',unit:'s',max:1000000},
 altitude_min:{label:'Lowest source altitude',unit:'m',min:-1000,max:10000},altitude_max:{label:'Highest source altitude',unit:'m',min:-1000,max:10000},altitude_span:{label:'Source altitude range',unit:'m',max:11000}
};
const scenes={
 gforce:{label:'G-force lab',title:'Every change has a place.',facts:['g_peak','g_braking','g_lateral','g_acceleration'],note:'Estimated from GPS speed and course. Phone sensor axes are not calibrated to the motorcycle. A missing lateral reading stays unknown.'},
 quality:{label:'Recording quality',title:'Make the next recording clearer.',facts:['observed','missing'],note:'Missing observations cannot establish what happened on the road.'},
 flow:{label:'Ride flow',title:'The moments that changed your pace.',facts:['slowing','picking_up','observed'],note:'GPS speed-change candidates, grouped into time bins. They do not establish braking technique, a road cause, or riding safety.'},
 route:{label:'The journey',title:'Every turn. Yours again.',facts:['distance','elapsed','average'],note:'GPS route radar · cyan traces the replayed section. Drag to rotate; the arrow shows path direction. Bike artwork follows your saved garage style.'},
 pace:{label:'Your pace',title:'Find your rhythm.',facts:['average','peak','dominant_share'],note:'Time-weighted speed distribution. Gaps are excluded; speed alone cannot establish riding skill or safety.'},
 rhythm:{label:'Time well spent',title:'Every minute has a story.',facts:['moving','low','missing','longest'],note:'Below 5 km/h includes crawling and stops. Missing time is never counted as stationary.'},
 elevation:{label:'The vertical story',title:'A different perspective.',facts:['altitude_span','altitude_max','altitude_min'],note:'Source altitude, with unverified datum and accuracy. This is a range, not accumulated climbing or road grade.'}
};
const round=n=>Math.round(n*1000)/1000;
function percentages(values){const total=values.reduce((n,v)=>n+v,0);if(!total)return values.map(()=>0);const exact=values.map(v=>v/total*100),whole=exact.map(Math.floor),order=exact.map((n,i)=>({i,f:n-whole[i]})).sort((a,b)=>b.f-a.f);const remaining=100-whole.reduce((a,b)=>a+b,0);for(let n=0;n<remaining;n++)whole[order[n].i]++;return whole;}
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
 const available=[];if(intervals.length){available.unshift('pace');const first=track[0],hasShape=first&&track.some(p=>Math.hypot((((p[0]-first[0]+540)%360)-180)*Math.cos(first[1]*Math.PI/180),p[1]-first[1])*111320>=1);if(hasShape)available.unshift('route');}if(facts.altitude_span>.5)available.push('elevation');
 const momentsModule=root.OdoReviewMoments||(typeof require==='function'?require('./review-moments.js'):null);
 const moments=t.imported?[]:momentsModule.list(ride).filter(m=>m.kind!=='impact').map(m=>({...m,speed:telemetry.inspect(ride,m.t).speed})).filter(m=>m.speed!==null);
 if(moments.length&&t.observed>0){facts.slowing=moments.filter(m=>m.kind==='braking').length;facts.picking_up=moments.length-facts.slowing;for(const m of moments){const b=speedBins[Math.min(95,Math.floor(m.t/facts.elapsed*96))];const key=m.kind==='braking'?'slowing':'picking_up';b[key]++;b[key+'Speed']=Math.max(b[key+'Speed']??0,m.speed);}}
 for(const b of speedBins){b.complete=b.covered>=b.end-b.start-.001&&b.covered>0;b.value=b.covered?b.integral/b.covered:null;}
 const dynamicsApi=root.OdoRideDynamics||(typeof require==='function'?require('./ride-dynamics.js'):null),dynamics=dynamicsApi.analyze(ride),sections=dynamicsApi.sections(ride,dynamics);
 if(dynamics.samples.length){for(const [id,key] of [['g_peak','peak'],['g_braking','braking'],['g_acceleration','acceleration'],['g_lateral','lateral'],['g_observed','observed']])if(dynamics[key]!==null)facts[id]=round(dynamics[key]);available.splice(available.includes('elevation')?available.indexOf('elevation'):available.length,0,'gforce');}
 if(!available.length)available.push('quality');
 const band=t.seconds.indexOf(Math.max(...t.seconds)),bandLabel=band===6?'100+':`${t.bands[band]}–${t.bands[band+1]}`;
 const insights={
  gforce:'Follow the live load marker beside your route. The trail shows the last few seconds; scrub or slow playback to inspect a braking or cornering estimate in its actual location.',
  quality:'This recording does not contain enough connected GPS information for a useful ride replay. Check location access and phone placement while parked before recording again.',
  flow:'Your recorded speed changes become moments to revisit. Review the signal and your memory of the ride before assigning a cause.',
  route:`${t.imported?'An imported route':'A recorded journey'}, reconstructed from its connected fixes. Watch your bike trace every turn. Cyan marks the replayed route; gaps remain visible.`,
  pace:`Your most-observed speed band was ${bandLabel} km/h. Use this distribution as a baseline for future rides with comparable conditions.`,
  rhythm:t.unobserved>1?'Some of this trip is unobserved. The dark section keeps that uncertainty visible instead of calling it a stop.':'The recording separates time in motion from low-speed intervals. Your longest connected moving stretch is highlighted below.',
  elevation:'The recorded altitude has its own silhouette. Gaps stay open, and vertical scale is exaggerated to make the shape readable.'
 };
 return {ride,dynamics,sections,facts,bandPercentages:percentages(t.seconds),telemetry:t,altitude,speedBins,moments,band,bandLabel,available,source:t.imported?'gpx_interval_estimate':'phone_gps',chapters:available.map(scene=>({scene,headline:scenes[scene].title,insight:insights[scene],fact_ids:scenes[scene].facts.filter(id=>facts[id]!==undefined)}))};
}
function packet(data){return {source:data.source,scenes:data.available,facts:{...data.facts},speed_band_seconds:data.telemetry.seconds.map(round),sections:data.sections};}
function validatePacket(value,ride){
 if(!value||!['phone_gps','gpx_interval_estimate'].includes(value.source)||!Array.isArray(value.scenes)||!value.scenes.length||value.scenes.length>7||new Set(value.scenes).size!==value.scenes.length||value.scenes.some(s=>!Object.hasOwn(scenes,s))||!value.facts||typeof value.facts!=='object')throw Error('Invalid visual recap context.');
 const facts={};for(const [id,v] of Object.entries(value.facts)){const d=definitions[id];if(!Object.hasOwn(definitions,id)||!Number.isFinite(v)||v<(d.min||0)||v>d.max)throw Error('Invalid recap fact.');facts[id]=v;}
 const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.02;
 if(!['elapsed','observed','moving','low','missing','longest'].every(id=>Number.isFinite(facts[id]))||!near(facts.elapsed,ride.duration_seconds)||!near(facts.moving+facts.low,facts.observed)||!near(facts.observed+facts.missing,facts.elapsed)||facts.longest>facts.moving+.02||facts.distance!==undefined&&!(value.source==='gpx_interval_estimate'&&ride.distance_km===null)&&!near(facts.distance,ride.distance_km))throw Error('Recap timing or distance contradicts ride evidence.');
 if((facts.slowing!==undefined||facts.picking_up!==undefined)&&(value.source!=='phone_gps'||!Number.isInteger(facts.slowing)||!Number.isInteger(facts.picking_up)))throw Error('Invalid speed-change candidate counts.');
 const bands=value.speed_band_seconds;if(!Array.isArray(bands)||bands.length!==7||bands.some(n=>!Number.isFinite(n)||n<0)||!near(bands.reduce((a,b)=>a+b,0),facts.observed)||!near(bands[0],facts.low))throw Error('Invalid recap speed bands.');
 if(facts.observed>0&&(!near(facts.dominant_share,Math.max(...bands)/facts.observed*100)||!Number.isFinite(facts.average)||!Number.isFinite(facts.peak)||facts.average>facts.peak))throw Error('Invalid recap speed summary.');
 if(value.scenes.some(s=>s==='gforce'&&(!Number.isFinite(facts.g_peak)||!(facts.g_observed>0)||facts.g_observed>facts.elapsed+.02)||s==='pace'&&!(facts.observed>0)||s==='route'&&!(facts.observed>0)||s==='flow'&&(value.source!=='phone_gps'||!Number.isInteger(facts.slowing)||!Number.isInteger(facts.picking_up)||facts.slowing+facts.picking_up<1||!(facts.observed>0))||s==='elevation'&&(!near(facts.altitude_max-facts.altitude_min,facts.altitude_span))))throw Error('Recap scene lacks measurements.');
 const sections=value.sections||[];if(!Array.isArray(sections)||sections.length>6||sections.some((s,i)=>!s||s.id!=='section_'+(i+1)||!['slow','load'].includes(s.kind)||!Number.isFinite(s.start_second)||!Number.isFinite(s.end_second)||s.start_second<0||s.end_second<=s.start_second||s.end_second>facts.elapsed+.002||s.peak_load_g!==undefined&&(!Number.isFinite(s.peak_load_g)||s.peak_load_g<0||s.peak_load_g>3)))throw Error('Invalid map-linked sections.');
 const rider=value.rider_context||{section_id:null,reason:'Unknown',weather:'Unknown'};if(![null,...sections.map(s=>s.id)].includes(rider.section_id)||!['Unknown','Fuel stop','Traffic','Rest stop','Road condition','Navigation','Other'].includes(rider.reason)||!['Unknown','Dry','Light rain','Heavy rain','Fog'].includes(rider.weather))throw Error('Invalid rider section context.');
 return {source:value.source,scenes:[...value.scenes],facts,speed_band_seconds:[...bands],sections:sections.map(s=>({id:s.id,kind:s.kind,start_second:s.start_second,end_second:s.end_second,...(s.peak_load_g!==undefined?{peak_load_g:s.peak_load_g}:{})})),rider_context:{section_id:rider.section_id,reason:rider.reason,weather:rider.weather}};
}
function validateReply(value,context){
 const prose=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max&&!/\d/.test(s);
 if(!value||!prose(value.title,70)||!prose(value.takeaway,350)||!Array.isArray(value.chapters)||value.chapters.length!==context.scenes.length)throw Error('Meta recap failed validation.');
 const seen=new Set();for(const c of value.chapters){if(!c||!context.scenes.includes(c.scene)||seen.has(c.scene)||!prose(c.headline,70)||!prose(c.insight,350)||!Array.isArray(c.fact_ids)||c.fact_ids.length<1||c.fact_ids.length>4||new Set(c.fact_ids).size!==c.fact_ids.length||c.fact_ids.some(id=>!scenes[c.scene].facts.includes(id)||context.facts[id]===undefined))throw Error('Meta recap referenced unavailable facts or scenes.');if(c.section_id!==undefined&&c.section_id!==null&&!(context.sections||[]).some(s=>s.id===c.section_id))throw Error('Meta referenced an unavailable map section.');seen.add(c.scene);}
 const follow=value.follow_up??null;if(follow!==null&&(!prose(follow.text,250)||!(context.sections||[]).some(s=>s.id===follow.section_id)))throw Error('Meta follow-up needs a valid map section.');
 return {title:value.title,takeaway:value.takeaway,follow_up:follow,chapters:value.chapters.map(c=>({scene:c.scene,headline:c.headline,insight:c.insight,fact_ids:[...c.fact_ids],section_id:c.section_id??null}))};
}
const api={percentages,definitions,scenes,analyze,packet,validatePacket,validateReply};root.OdoInsightReel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
