/* Odo evidence pipeline v1. No model calls; no raw-sample uploads. */
(function(root){
'use strict';
const G=9.80665, num=v=>v===''||v==null?null:(Number.isFinite(+v)?+v:null);
const median=a=>{const b=a.filter(Number.isFinite).sort((x,y)=>x-y);return b.length?b[Math.floor(b.length/2)]:null;};
const quantile=(a,p)=>{const b=a.filter(Number.isFinite).sort((x,y)=>x-y);return b.length?b[Math.floor((b.length-1)*p)]:null;};
const distance=(a,b)=>{const d=Math.PI/180,p=(b[1]-a[1])*d,q=(b[0]-a[0])*d;return 12742000*Math.asin(Math.min(1,Math.sqrt(Math.sin(p/2)**2+Math.cos(a[1]*d)*Math.cos(b[1]*d)*Math.sin(q/2)**2)));};
function csv(s){const lines=s.replace(/^\uFEFF/,'').trim().split(/\r?\n/);const keys=lines.shift().split(',');return lines.filter(Boolean).map(l=>{const v=l.split(',');if(v.length!==keys.length)throw Error('Malformed CSV row');return Object.fromEntries(keys.map((k,i)=>[k,v[i]]));});}
function analyze(files,name='Recording'){
 const json=f=>JSON.parse(files[f]), meta=json('metadata.json'), summary=json('summary.json');
 if(!Number.isFinite(meta.started_epoch_ms)||!Number.isFinite(meta.started_elapsed_ns))throw Error('Unsupported recording metadata');
 const duration=(summary.ended_epoch_ms-meta.started_epoch_ms)/1000;
 if(!(duration>0&&duration<=86400))throw Error('Invalid recording duration');
 const gps=csv(files['gps.csv']), motion=csv(files['motion.csv']), groups={}, bins=new Map();
 const warnings=[], stats=[], start=meta.started_elapsed_ns;
 for(const r of motion){const type=+r.type,t=(+r.sensor_elapsed_ns-start)/1e9,x=num(r.x),y=num(r.y),z=num(r.z);if(x===null||!Number.isFinite(t))continue;
  const magnitude=(type===5||type===6)?x:Math.hypot(x,y??0,z??0);
  const a=groups[type]||(groups[type]={n:0,first:t,last:t,gap:0,bad:0,values:[],clipped:0,accuracy:{}});
  if(a.n&&t<=a.last){a.bad++;continue;}if(a.n)a.gap=Math.max(a.gap,t-a.last);a.n++;a.last=t;a.values.push(magnitude);a.accuracy[r.accuracy]=(a.accuracy[r.accuracy]||0)+1;
  const range=meta.sensors?.find(s=>s.type===type)?.maximum_range;
  if(range&&[1,4,10].includes(type)&&[x,y,z].filter(v=>v!==null).some(v=>Math.abs(v)>=range*.995))a.clipped++;
  const second=Math.floor(t);if(second<0||second>duration)continue;
  if([1,4,10].includes(type)){const b=bins.get(second)||{t:second,acc:[],lin:[],gyro:[]};b[type===1?'acc':type===10?'lin':'gyro'].push(magnitude);bins.set(second,b);}
 }
 for(const [type,a] of Object.entries(groups)){const scalar=['5','6'].includes(type);stats.push({type:+type,label:meta.sensors?.find(s=>s.type===+type)?.label||type,n:a.n,hz:a.last>a.first?(a.n-1)/(a.last-a.first):0,maxGap:a.gap,nonMonotonic:a.bad,median:median(a.values),p95:quantile(a.values,.95),peak:quantile(a.values,1),clipped:a.clipped,accuracy:a.accuracy,unit:scalar?(type==='5'?'lx':'hPa'):type==='4'?'rad/s':type==='2'?'µT':type==='11'?'unitless':'m/s²'});}
 let lastTime=-Infinity,segment=0,accepted=0,duplicates=0,movingSeconds=0,observedSeconds=0,stoppedSeconds=0,speedIntegral=0;
 const track=[];
 for(const r of gps){const t=(+r.fix_elapsed_ns-start)/1e9,lat=num(r.latitude_deg),lon=num(r.longitude_deg),acc=num(r.accuracy_m),speed=num(r.speed_mps),sa=num(r.speed_accuracy_mps);
  const ok=Number.isFinite(t)&&t>=0&&t<=duration&&r.accepted==='true'&&r.mock!=='true'&&lat!==null&&Math.abs(lat)<=90&&lon!==null&&Math.abs(lon)<=180&&acc!==null&&acc>=0&&acc<=30&&num(r.age_seconds)!==null&&+r.age_seconds>=0&&+r.age_seconds<=15;
  if(!ok){segment++;continue;}if(t<=lastTime){duplicates++;segment++;continue;}if(t-lastTime>3)segment++;lastTime=t;accepted++;
  const sp=speed!==null&&speed>=0&&speed<70&&(sa===null||sa<=2)?speed*3.6:null;
  track.push([lon,lat,t,sp,acc,num(r.altitude_m),num(r.bearing_deg),segment,sa]);
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
 let off=0,screenOffAt=null;
 if(files['events.csv'])for(const e of csv(files['events.csv'])){const t=(+e.elapsed_ns-start)/1e9;if(e.event.endsWith('screen_off')){if(screenOffAt===null)screenOffAt=Math.max(0,t);}else if(e.event.endsWith('screen_on')&&screenOffAt!==null){off+=Math.max(0,Math.min(duration,t)-screenOffAt);screenOffAt=null;}}
 if(screenOffAt!==null)off+=duration-screenOffAt;
 const isWalk=meta.activity_type==='walk'||/walk/i.test(name),isRide=meta.activity_type==='ride'||/rideoffice|homerigid|mount/i.test(name),quality=gps.length?accepted/gps.length:0;
 if(summary.gps_samples!==gps.length||summary.motion_samples!==motion.length)warnings.push('File counts disagree with the recorder summary.');
 if(summary.end_reason!=='user_stopped')warnings.push('Recording did not finish with a normal Stop.');
 if(quality<.9)warnings.push('GPS gaps or poor fixes reduce route and distance confidence.');
 if(isWalk)warnings.push('The original jitter filter can substantially undercount walking distance.');
 if(stats.some(s=>s.nonMonotonic||s.maxGap>1&&![5,6].includes(s.type)))warnings.push('Motion timing needs review.');
 if(stats.some(s=>s.clipped))warnings.push('Some sensor axes approached their reported range. Peaks may be clipped.');
 warnings.push(mounted?'Handlebar vibration and mount movement are mixed with road motion; bike lean is not calibrated.':'Pocket/body motion cannot establish motorcycle lean or road impacts.');
 const rawKm=Number(summary.estimated_distance_m)/1000;
 return {schema:1,algorithm:'odo-evidence-1',id:String(meta.started_epoch_ms),title:isWalk?'Office walk':/home.*rigid|mount/i.test(name)?'The ride home':/rideoffice/i.test(name)?'Home → office':name.replace(/\.zip$/i,''),kind:isWalk?'walk':isRide?'ride':'unclassified',recurring:isWalk?'Office walk':'',placement:meta.placement||'Unknown',device:meta.device,bike_id:typeof meta.ride_context?.bike_id==='string'?meta.ride_context.bike_id.slice(0,100):'',bike_type:meta.ride_context?.bike_type||'Unknown',mount_condition:meta.ride_context?.mount_condition||'Unknown',started:meta.started_epoch_ms,duration,distanceKm:Number.isFinite(rawKm)?rawKm:null,distanceReliable:!isWalk&&isRide&&quality>=.9&&summary.gps_samples===gps.length&&summary.motion_samples===motion.length,averageSpeed:rawKm/(duration/3600),maxSpeed:quantile(track.map(p=>p[3]),1),quality:quality*100,medianAccuracy:median(track.map(p=>p[4])),gpsRows:gps.length,motionRows:motion.length,accepted,duplicates,screenOffSeconds:off,movingSeconds,stoppedSeconds,observedSeconds,speedIntegratedKm:speedIntegral/1000,track,signals,events:events.sort((a,b)=>a.t-b.t),stats,warnings,notes:'',finalized:summary.end_reason==='user_stopped',altitudeDatum:'Android GPS altitude; no vertical accuracy logged',maxAltitude:quantile(track.map(p=>p[5]),1),lean:null};
}
function repeatLocations(rides){const clusters=[];for(const ride of rides.filter(r=>r.recurring&&r.kind==='ride'))for(const e of ride.events){let c=clusters.find(c=>c.kind===e.kind&&c.group===ride.recurring&&c.placement===ride.placement&&distance([c.lon,c.lat],[e.lon,e.lat])<40&&distance(c.start,ride.track[0])<200&&distance(c.end,ride.track.at(-1))<200);if(!c){c={kind:e.kind,group:ride.recurring,placement:ride.placement,lon:e.lon,lat:e.lat,start:ride.track[0],end:ride.track.at(-1),rides:[],evidence:[]};clusters.push(c);}if(!c.rides.includes(ride.id)){c.rides.push(ride.id);c.evidence.push({rideId:ride.id,eventId:e.id});}}return clusters.filter(c=>c.rides.length>=3);}
function safeShare(r){return {title:'A ride with Odo',activity:r.kind,distanceKm:r.distanceReliable?Math.round(r.distanceKm*10)/10:null,durationMinutes:Math.round(r.duration/60),note:'Private route, speed and sensor data excluded.'};}
function validateBackup(x){
 if(x?.type!=='odo-backup'||x.version!==1||!Array.isArray(x.rides)||x.rides.length>300)throw Error('Unsupported backup.');
 const finite=(v,min=-1e12,max=1e15)=>Number.isFinite(v)&&v>=min&&v<=max;
 for(const r of x.rides){
  if(!/^\d{10,24}$/.test(r.id)||!finite(r.started,0)||!finite(r.duration,0,86400)||!['ride','walk','unclassified'].includes(r.kind)||!Array.isArray(r.track)||r.track.length>50000||!Array.isArray(r.signals)||r.signals.length>86401||!Array.isArray(r.stats)||r.stats.length>20||!Array.isArray(r.events)||r.events.length>20000||!Array.isArray(r.warnings)||r.warnings.length>100)throw Error('Invalid ride in backup.');
  for(const key of ['distanceKm','averageSpeed','maxSpeed','quality','medianAccuracy','gpsRows','motionRows','accepted','duplicates','screenOffSeconds','movingSeconds','stoppedSeconds','observedSeconds','speedIntegratedKm','maxAltitude'])if(r[key]!==null&&!finite(r[key]))throw Error('Invalid measurement in backup.');
  for(const p of r.track)if(!Array.isArray(p)||p.length!==9||!finite(p[0],-180,180)||!finite(p[1],-90,90)||p.some(v=>v!==null&&!finite(v)))throw Error('Invalid track in backup.');
  for(const p of r.signals)if(!Array.isArray(p)||p.length!==5||p.some(v=>v!==null&&!finite(v)))throw Error('Invalid signal in backup.');
  for(const e of r.events)if(!/^[a-z0-9-]+$/i.test(e.id)||!['impact','braking','acceleration'].includes(e.kind)||!finite(e.t)||!finite(e.g)||!finite(e.lon,-180,180)||!finite(e.lat,-90,90))throw Error('Invalid event in backup.');
  for(const s of r.stats)if(![s.type,s.n,s.hz,s.maxGap,s.nonMonotonic,s.median,s.p95,s.peak,s.clipped].every(v=>finite(v)))throw Error('Invalid sensor summary in backup.');
 }
 return x;
}
const api={analyze,csv,median,distance,repeatLocations,safeShare,validateBackup};if(typeof module!=='undefined')module.exports=api;root.OdoAnalysis=api;
})(typeof self!=='undefined'?self:globalThis);
