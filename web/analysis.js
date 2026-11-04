/* Odo evidence pipeline v5. No model calls; no raw-sample uploads. */
(function(root){
'use strict';
const G=9.80665, num=v=>v==null||typeof v==='string'&&v.trim()===''?null:(Number.isFinite(+v)?+v:null);
const quantile=(a,p)=>{const b=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!b.length)return null;const index=(b.length-1)*p,lo=Math.floor(index),fraction=index-lo;return fraction?(1-fraction)*b[lo]+fraction*b[lo+1]:b[lo];};
const median=a=>quantile(a,.5);
const distance=(a,b)=>{const d=Math.PI/180,p=(b[1]-a[1])*d,q=(b[0]-a[0])*d;return 12742000*Math.asin(Math.min(1,Math.sqrt(Math.sin(p/2)**2+Math.cos(a[1]*d)*Math.cos(b[1]*d)*Math.sin(q/2)**2)));};
function csv(s){const lines=s.replace(/^\uFEFF/,'').trim().split(/\r?\n/);const keys=lines.shift().split(',');return lines.filter(Boolean).map(l=>{const v=l.split(',');if(v.length!==keys.length)throw Error('Malformed CSV row');return Object.fromEntries(keys.map((k,i)=>[k,v[i]]));});}
function analyze(files,name='Recording'){
 const json=f=>JSON.parse(files[f]), meta=json('metadata.json'), summary=json('summary.json');
 if(!Number.isFinite(meta.started_epoch_ms)||!Number.isFinite(meta.started_elapsed_ns))throw Error('Unsupported recording metadata');
 const wallDuration=(summary.ended_epoch_ms-meta.started_epoch_ms)/1000,hasMonotonicEnd=Object.hasOwn(summary,'ended_elapsed_ns');
 const duration=hasMonotonicEnd?(Number.isFinite(summary.ended_elapsed_ns)?(summary.ended_elapsed_ns-meta.started_elapsed_ns)/1e9:NaN):wallDuration;
 const timeBasis=hasMonotonicEnd?'elapsed-realtime':'wall-clock-fallback';
 if(!(duration>0&&duration<=86400))throw Error('Invalid recording duration');
 const gps=csv(files['gps.csv']), motion=csv(files['motion.csv']), groups={}, bins=new Map(),sensors=Array.isArray(meta.sensors)?meta.sensors:[];
 const warnings=[], stats=[], start=meta.started_elapsed_ns,knownMotionTypes=new Set([1,2,4,5,6,9,10,11]);let motionExcluded=0;
 if(!hasMonotonicEnd)warnings.push('Legacy export has no monotonic end timestamp; duration falls back to device wall-clock times.');
 else if(!Number.isFinite(wallDuration)||Math.abs(wallDuration-duration)>2)warnings.push('Wall-clock and elapsed durations disagree; the elapsed clock was used.');
 for(const r of motion){const type=+r.type,stamp=num(r.sensor_elapsed_ns),t=stamp===null?NaN:(stamp-start)/1e9,x=num(r.x),y=num(r.y),z=num(r.z);const scalar=type===5||type===6;
  if(!knownMotionTypes.has(type)||!Number.isFinite(t)||t<0||t>duration||x===null||(scalar?x<0:y===null||z===null)){motionExcluded++;continue;}
  const magnitude=scalar?x:Math.hypot(x,y,z);if(!Number.isFinite(magnitude)){motionExcluded++;continue;}
  const a=groups[type]||(groups[type]={n:0,first:t,last:t,gap:0,bad:0,values:[],clipped:0,accuracy:{}});
  if(a.n&&t<=a.last){a.bad++;motionExcluded++;continue;}if(a.n)a.gap=Math.max(a.gap,t-a.last);a.n++;a.last=t;a.values.push(magnitude);
  const accuracy=num(r.accuracy),status=Number.isInteger(accuracy)&&accuracy>=-1&&accuracy<=3?String(accuracy):'unknown';a.accuracy[status]=(a.accuracy[status]||0)+1;
  const range=sensors.find(s=>s?.type===type)?.maximum_range;
  if(Number.isFinite(range)&&range>0&&[1,4,10].includes(type)&&[x,y,z].some(v=>Math.abs(v)>=range*.995))a.clipped++;
  const second=Math.floor(t);if(second<0||second>duration)continue;
  if([1,4,10].includes(type)){const b=bins.get(second)||{t:second,acc:[],lin:[],gyro:[]};b[type===1?'acc':type===10?'lin':'gyro'].push(magnitude);bins.set(second,b);}
 }
 for(const [type,a] of Object.entries(groups)){
  const scalar=['5','6'].includes(type),sensor=sensors.find(s=>s?.type===+type);
  stats.push({type:+type,label:sensor?.label||type,n:a.n,hz:a.last>a.first?(a.n-1)/(a.last-a.first):0,maxGap:a.gap,nonMonotonic:a.bad,median:median(a.values),p95:quantile(a.values,.95),peak:quantile(a.values,1),clipped:a.clipped,accuracy:a.accuracy,unit:scalar?(type==='5'?'lx':'hPa'):type==='4'?'rad/s':type==='2'?'µT':type==='11'?'unitless':'m/s²',diagnosticsVersion:1,firstSeconds:a.first,lastSeconds:a.last,maximumRange:Number.isFinite(sensor?.maximum_range)&&sensor.maximum_range>0?sensor.maximum_range:null,reportingMode:[0,1,2,3].includes(sensor?.reporting_mode)?sensor.reporting_mode:null});
 }
 let lastTime=-Infinity,segment=0,accepted=0,duplicates=0,movingSeconds=0,observedSeconds=0,stoppedSeconds=0,speedIntegral=0;
 const track=[];
 for(const r of gps){const stamp=num(r.fix_elapsed_ns),t=stamp===null?NaN:(stamp-start)/1e9,lat=num(r.latitude_deg),lon=num(r.longitude_deg),acc=num(r.accuracy_m),speed=num(r.speed_mps),sa=num(r.speed_accuracy_mps);
  const ok=Number.isFinite(t)&&t>=0&&t<=duration&&r.accepted==='true'&&r.mock!=='true'&&lat!==null&&Math.abs(lat)<=90&&lon!==null&&Math.abs(lon)<=180&&acc!==null&&acc>=0&&acc<=30&&num(r.age_seconds)!==null&&+r.age_seconds>=0&&+r.age_seconds<=15;
  if(!ok){segment++;continue;}if(t<=lastTime){duplicates++;segment++;continue;}if(t-lastTime>3)segment++;lastTime=t;accepted++;
  const sp=speed!==null&&speed>=0&&speed<70&&(sa===null||(sa>=0&&sa<=2))?speed*3.6:null;
  const altitude=num(r.altitude_m),course=num(r.bearing_deg);
  track.push([lon,lat,t,sp,acc,altitude!==null&&altitude>=-1000&&altitude<=10000?altitude:null,course!==null&&course>=0&&course<360?course:null,segment,sa!==null&&sa>=0?sa:null]);
 }
 for(let i=1;i<track.length;i++){const a=track[i-1],b=track[i],dt=b[2]-a[2];if(a[7]!==b[7]||dt>3||a[3]===null||b[3]===null)continue;observedSeconds+=dt;const v=(a[3]+b[3])/2;speedIntegral+=v/3.6*dt;if(v>5)movingSeconds+=dt;else stoppedSeconds+=dt;}
 const toG=v=>v===null?null:v/G;
 const signals=[...bins.values()].sort((a,b)=>a.t-b.t).map(b=>[b.t,toG(quantile(b.acc,1)),toG(quantile(b.lin,1)),median(b.gyro),toG(median(b.acc))]);
 const events=[];
 // Three-second speed medians, then centered three-second derivative. GPS-based estimate only.
 const speeds=track.map((p,i)=>median(track.slice(Math.max(0,i-1),i+2).filter(q=>q[7]===p[7]&&Math.abs(q[2]-p[2])<=2).map(q=>q[3])));
 for(let i=2;i<track.length-2;i++){const a=track[i-2],b=track[i+2],p=track[i],dt=b[2]-a[2];if(a[7]!==b[7]||dt<2||dt>6||p[4]>10||a[3]===null||b[3]===null||p[8]===null||p[8]>1||p[3]<10)continue;
  const accel=(speeds[i+2]-speeds[i-2])/3.6/dt;
  if(Math.abs(accel)>=1.5&&(!events.length||p[2]-events[events.length-1].t>8))events.push({id:'gps-'+i,kind:accel<0?'braking':'acceleration',t:p[2],g:Math.abs(accel)/G,lon:p[0],lat:p[1],confidence:'GPS estimate',reason:'Smoothed speed change ≥1.5 m/s²; not a safety judgement.'});
 }
 const mounted=/mount/i.test(meta.placement||'');
 if(mounted){let last=-100;for(const s of [...signals].sort((a,b)=>b[1]-a[1])){if(s[1]<3||events.filter(e=>e.kind==='impact').length>=12)break;if(events.some(e=>e.kind==='impact'&&Math.abs(e.t-s[0])<8))continue;const p=track.reduce((a,b)=>!a||Math.abs(b[2]-s[0])<Math.abs(a[2]-s[0])?b:a,null);if(!p||Math.abs(p[2]-s[0])>2||p[4]>10||p[3]<10)continue;events.push({id:'motion-'+s[0],kind:'impact',t:s[0],g:s[1],lon:p[0],lat:p[1],confidence:'Unverified phone impact',reason:'Raw resultant includes gravity. Engine, mount slip and road inputs are mixed; not a confirmed pothole.'});}}
 let screen={off:null,observed:null,excluded:0,ambiguous:false};
 if(files['events.csv'])try{screen=screenTiming(csv(files['events.csv']),start,duration);}catch{screen.ambiguous=true;}
 if(screen.ambiguous)warnings.push('Screen-event timing is malformed or contradictory; screen-state durations remain unknown.');
 else if(screen.observed===null)warnings.push('No usable screen-state interval was supplied.');
 if(screen.excluded)warnings.push(`Ignored ${screen.excluded} unsupported, duplicate or invalid screen event${screen.excluded===1?'':'s'}.`);
 const namedActivity=['ride','walk','unclassified'].includes(meta.activity_type);
 const isWalk=meta.activity_type==='walk'||(!namedActivity&&/walk/i.test(name)),isRide=meta.activity_type==='ride'||(!namedActivity&&/rideoffice|homerigid|mount/i.test(name)),quality=gps.length?accepted/gps.length:0;
 if(summary.gps_samples!==gps.length||summary.motion_samples!==motion.length)warnings.push('File counts disagree with the recorder summary.');
 if(summary.end_reason!=='user_stopped')warnings.push('Recording did not finish with a normal Stop.');
 if(quality<.9)warnings.push('GPS gaps or poor fixes reduce route and distance confidence.');
 const locationCoverage=locationTimeCoverage(track,duration);
 if(locationCoverage<.9)warnings.push('Connected GPS fixes cover less than 90% of the recording time; full-ride distance remains uncertain.');
 if(isWalk)warnings.push('The original jitter filter can substantially undercount walking distance.');
 if(motionExcluded)warnings.push(`Excluded ${motionExcluded} invalid, out-of-window or nonmonotonic motion row${motionExcluded===1?'':'s'}; missing vector axes are not filled with zero.`);
 if(stats.some(s=>s.nonMonotonic||s.maxGap>1&&![5,6].includes(s.type)))warnings.push('Motion timing needs review.');
 if(stats.some(s=>s.clipped))warnings.push('Some sensor axes approached their reported range. Peaks may be clipped.');
 warnings.push(mounted?'Handlebar vibration and mount movement are mixed with road motion; bike lean is not calibrated.':'Pocket/body motion cannot establish motorcycle lean or road impacts.');
 // The recorder rejects distance steps at >=70 m/s. Allow one metre for summary rounding.
 const rawMeters=summary.estimated_distance_m,rawKm=Number.isFinite(rawMeters)&&rawMeters>=0&&rawMeters<=duration*70+1?rawMeters/1000:null;
 const distanceIntegrity=rawKm!==null&&summary.gps_samples===gps.length&&summary.motion_samples===motion.length;
 if(rawKm===null)warnings.push('Recorder distance is missing or invalid; distance and its full-trip average remain unknown.');
 const ride={schema:1,algorithm:'odo-evidence-5',id:String(meta.started_epoch_ms),title:isWalk?'Office walk':/home.*rigid|mount/i.test(name)?'The ride home':/rideoffice/i.test(name)?'Home → office':name.replace(/\.zip$/i,''),kind:isWalk?'walk':isRide?'ride':'unclassified',recurring:isWalk?'Office walk':'',placement:meta.placement||'Unknown',device:meta.device,bike_id:typeof meta.ride_context?.bike_id==='string'?meta.ride_context.bike_id.slice(0,100):'',bike_type:meta.ride_context?.bike_type||'Unknown',bike_model:typeof meta.ride_context?.bike_model==='string'?meta.ride_context.bike_model.slice(0,60):'',bike_color:/^#[0-9a-f]{6}$/i.test(meta.ride_context?.bike_color||'')?meta.ride_context.bike_color:'',bike_family:typeof meta.ride_context?.bike_family==='string'?meta.ride_context.bike_family.slice(0,20):'',mount_condition:meta.ride_context?.mount_condition||'Unknown',started:meta.started_epoch_ms,duration,timeBasis,motionExcluded,distanceIntegrity,distanceKm:rawKm,distanceReliable:false,averageSpeed:rawKm===null?null:rawKm/(duration/3600),maxSpeed:quantile(track.map(p=>p[3]),1),quality:quality*100,medianAccuracy:median(track.map(p=>p[4])),gpsRows:gps.length,motionRows:motion.length,accepted,duplicates,screenOffSeconds:screen.off,screenObservedSeconds:screen.observed,screenEventsExcluded:screen.excluded,movingSeconds,stoppedSeconds,observedSeconds,speedIntegratedKm:speedIntegral/1000,track,signals,events:events.sort((a,b)=>a.t-b.t),stats,warnings,notes:'',finalized:summary.end_reason==='user_stopped',altitudeDatum:'Android GPS altitude; no vertical accuracy logged',maxAltitude:quantile(track.map(p=>p[5]),1),lean:null};
 ride.distanceReliable=distanceSupported(ride);return ride;
}
// Normalize persisted summaries for both the UI and the location-free model packet.
// Missing range/timing metadata in legacy journals stays unknown until reimport.
function sensorDiagnostics(s,duration){
 const knownTypes=[1,2,4,5,6,9,10,11],count=v=>Number.isInteger(v)&&v>=0&&v<=100000000;
 if(!s||!knownTypes.includes(s.type)||!count(s.n)||!s.n||!Number.isFinite(duration)||duration<=0)return null;
 const detailed=s.diagnosticsVersion===1;
 if(detailed&&(!Number.isFinite(s.firstSeconds)||s.firstSeconds<0||!Number.isFinite(s.lastSeconds)||s.lastSeconds<s.firstSeconds||s.lastSeconds>duration||s.maximumRange!==null&&(!Number.isFinite(s.maximumRange)||s.maximumRange<=0)||s.reportingMode!==null&&![0,1,2,3].includes(s.reportingMode)))return null;
 const statusCounts={no_contact:0,unreliable:0,low:0,medium:0,high:0,unknown:0},keys={'-1':'no_contact','0':'unreliable','1':'low','2':'medium','3':'high'};
 let total=0,invalid=false;
 for(const [code,n] of Object.entries(s.accuracy&&typeof s.accuracy==='object'&&!Array.isArray(s.accuracy)?s.accuracy:{})){
  if(!count(n)||total+n>s.n){invalid=true;break;}total+=n;statusCounts[Object.hasOwn(keys,code)?keys[code]:'unknown']+=n;
 }
 if(invalid){for(const key in statusCounts)statusCounts[key]=0;total=0;}
 statusCounts.unknown+=s.n-total;
 const range=detailed?s.maximumRange:null,nearRange=range!==null&&[1,4,10].includes(s.type)&&count(s.clipped)&&s.clipped<=s.n?s.clipped:null;
 return {type:s.type,samples:s.n,sampleRateHz:s.n>1&&Number.isFinite(s.hz)&&s.hz>0?s.hz:null,maxGapSeconds:s.n>1&&Number.isFinite(s.maxGap)&&s.maxGap>=0&&s.maxGap<=duration?s.maxGap:null,firstSeconds:detailed?s.firstSeconds:null,lastSeconds:detailed?s.lastSeconds:null,leadingGapSeconds:detailed?s.firstSeconds:null,trailingGapSeconds:detailed?Math.max(0,duration-s.lastSeconds):null,maximumRange:range,nearRangeSamples:nearRange,statusCounts,detailed};
}
function screenTiming(rows,start,duration){
 const states={initial_screen_on:false,initial_screen_off:true,screen_on:false,screen_off:true};
 let state=null,last=null,off=0,observed=0,excluded=0,ambiguous=false;
 for(const row of rows){
  if(!Object.hasOwn(states,row.event)){excluded++;continue;}
  const raw=row.elapsed_ns,elapsed=typeof raw==='string'&&raw.trim()===''?NaN:Number(raw),t=(elapsed-start)/1e9;
  if(raw===null||raw===undefined||!Number.isFinite(t)){excluded++;ambiguous=true;continue;}
  if(t<0||t>duration){excluded++;continue;}
  const next=states[row.event];
  if(last!==null&&t<=last){excluded++;if(t<last||next!==state)ambiguous=true;continue;}
  if(last!==null){const span=t-last;observed+=span;if(state)off+=span;}
  state=next;last=t;
 }
 if(last!==null){observed+=duration-last;if(state)off+=duration-last;}
 if(ambiguous||last===null)return {off:null,observed:null,excluded,ambiguous};
 return {off:observed>0?off:null,observed,excluded,ambiguous};
}
function locationTimeCoverage(track,duration){
 if(!Array.isArray(track)||!Number.isFinite(duration)||duration<=0)return 0;
 let observed=0,lastEnd=0;
 for(let i=1;i<track.length;i++){const a=track[i-1],b=track[i],start=a[2],end=b[2],dt=end-start;if(!Number.isFinite(start)||!Number.isFinite(end)||a[7]!==b[7]||dt<=0||dt>3||start<0||end>duration||start<lastEnd)continue;observed+=dt;lastEnd=end;}
 return Math.min(1,observed/duration);
}
function distanceSupported(r){return r.source!=='GPX export'&&r.kind==='ride'&&r.finalized===true&&Number.isFinite(r.quality)&&r.quality>=90&&r.quality<=100&&Number.isFinite(r.distanceKm)&&r.distanceKm>=0&&locationTimeCoverage(r.track,r.duration)>=.9&&(typeof r.distanceIntegrity==='boolean'?r.distanceIntegrity:r.distanceReliable===true);}
function editRide(r,fields){
 // Older records retain their existing confidence; annotations cannot establish missing provenance.
 const integrity=typeof r.distanceIntegrity==='boolean'?r.distanceIntegrity:distanceSupported(r);
 const result={...r,distanceIntegrity:integrity};
 for(const [key,limit] of [['title',100],['recurring',60],['notes',2000]])if(typeof fields[key]==='string')result[key]=fields[key].slice(0,limit);
 if(['ride','walk','unclassified'].includes(fields.kind))result.kind=fields.kind;
 result.distanceReliable=distanceSupported(result);return result;
}
function repeatLocations(rides){const clusters=[];for(const ride of rides.filter(r=>r.recurring&&r.kind==='ride'))for(const e of ride.events){let c=clusters.find(c=>c.kind===e.kind&&c.group===ride.recurring&&c.placement===ride.placement&&distance([c.lon,c.lat],[e.lon,e.lat])<40&&distance(c.start,ride.track[0])<200&&distance(c.end,ride.track.at(-1))<200);if(!c){c={kind:e.kind,group:ride.recurring,placement:ride.placement,lon:e.lon,lat:e.lat,start:ride.track[0],end:ride.track.at(-1),rides:[],evidence:[]};clusters.push(c);}if(!c.rides.includes(ride.id)){c.rides.push(ride.id);c.evidence.push({rideId:ride.id,eventId:e.id});}}return clusters.filter(c=>c.rides.length>=3);}
function safeShare(r){return {title:'A ride with Odo',activity:r.kind,distanceKm:r.distanceReliable?Math.round(r.distanceKm*10)/10:null,durationMinutes:Math.round(r.duration/60),note:'Private route, speed and sensor data excluded.'};}
function validateBackup(x){
 if(x?.type!=='odo-backup'||x.version!==1||!Array.isArray(x.rides)||x.rides.length>300)throw Error('Unsupported backup.');
 const finite=(v,min=-1e12,max=1e15)=>Number.isFinite(v)&&v>=min&&v<=max;
 for(const r of x.rides){
  if(!/^\d{10,24}$/.test(r.id)||!finite(r.started,0)||!finite(r.duration,0,86400)||!['ride','walk','unclassified'].includes(r.kind)||!Array.isArray(r.track)||r.track.length>50000||!Array.isArray(r.signals)||r.signals.length>86401||!Array.isArray(r.stats)||r.stats.length>20||!Array.isArray(r.events)||r.events.length>20000||!Array.isArray(r.warnings)||r.warnings.length>100)throw Error('Invalid ride in backup.');
  for(const key of ['distanceKm','averageSpeed','maxSpeed','quality','medianAccuracy','gpsRows','motionRows','accepted','duplicates','screenOffSeconds','movingSeconds','stoppedSeconds','observedSeconds','speedIntegratedKm','maxAltitude'])if(r[key]!==null&&!finite(r[key]))throw Error('Invalid measurement in backup.');
  if(r.motionExcluded!==undefined&&!finite(r.motionExcluded,0))throw Error('Invalid motion exclusion count.');
  if(r.timeBasis!==undefined&&!['elapsed-realtime','wall-clock-fallback'].includes(r.timeBasis))throw Error('Invalid recording time basis.');
  if(r.screenObservedSeconds!==undefined){
   const observed=r.screenObservedSeconds,off=r.screenOffSeconds;
   if(observed!==null&&!finite(observed,0,r.duration)||off!==null&&(!finite(off,0,r.duration)||observed===null||off>observed))throw Error('Invalid screen-state duration.');
  }
  if(r.screenEventsExcluded!==undefined&&(!Number.isInteger(r.screenEventsExcluded)||r.screenEventsExcluded<0))throw Error('Invalid screen-event exclusion count.');
  if(r.distanceIntegrity!==undefined&&typeof r.distanceIntegrity!=='boolean')throw Error('Invalid distance integrity.');
  for(const key of ['distanceReliable','finalized'])if(typeof r[key]!=='boolean')throw Error('Invalid recording confidence.');
  if(r.distanceIntegrity!==undefined&&r.distanceReliable&&!distanceSupported(r))throw Error('Distance confidence disagrees with its source evidence.');
  for(const p of r.track)if(!Array.isArray(p)||p.length!==9||!finite(p[0],-180,180)||!finite(p[1],-90,90)||p.some(v=>v!==null&&!finite(v)))throw Error('Invalid track in backup.');
  for(const p of r.signals)if(!Array.isArray(p)||p.length!==5||p.some(v=>v!==null&&!finite(v)))throw Error('Invalid signal in backup.');
  for(const e of r.events)if(!/^[a-z0-9-]+$/i.test(e.id)||!['impact','braking','acceleration'].includes(e.kind)||!finite(e.t)||!finite(e.g)||!finite(e.lon,-180,180)||!finite(e.lat,-90,90))throw Error('Invalid event in backup.');
  for(const s of r.stats){
   if(![s.type,s.n,s.hz,s.maxGap,s.nonMonotonic,s.median,s.p95,s.peak,s.clipped].every(v=>finite(v)))throw Error('Invalid sensor summary in backup.');
   if(s.diagnosticsVersion!==undefined&&(s.diagnosticsVersion!==1||!sensorDiagnostics(s,r.duration)||!Number.isInteger(s.clipped)||s.clipped<0||s.clipped>s.n))throw Error('Invalid sensor diagnostics in backup.');
  }
  // Accept old backups, preserving their measurements/annotations while rechecking display confidence.
  if(r.distanceIntegrity===undefined)r.distanceReliable=distanceSupported(r);
 }
 return x;
}
const api={analyze,csv,median,distance,repeatLocations,safeShare,validateBackup,distanceSupported,editRide,locationTimeCoverage,screenTiming,sensorDiagnostics};if(typeof module!=='undefined')module.exports=api;root.OdoAnalysis=api;
})(typeof self!=='undefined'?self:globalThis);
