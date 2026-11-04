/* Local comparison screening. Matching context is not a calibration or a causal experiment. */
(function(root){
'use strict';
const analysis=typeof module!=='undefined'?require('./analysis.js'):root.OdoAnalysis;
const definitions=[{id:'acceleration',type:1,index:4,label:'Phone acceleration',unit:'g',measure:'1s medians · includes gravity'},{id:'rotation',type:4,index:3,label:'Phone rotation',unit:'rad/s',measure:'1s medians · angular speed'},{id:'linear_acceleration',type:10,index:2,label:'Linear acceleration',unit:'g',measure:'1s peaks · estimated gravity removed'}];
const checkLabels={distinct:'Different recordings',activity:'Motorcycle rides',native:'Phone sensor sources',finalized:'Normal recording stop',bike:'Same saved bike',phone:'Same phone model label',bike_type:'Same bike type',placement:'Same phone placement',mount:'Consistent mount context',route_label:'Same recurring route label'};
const reasons={setup:'Setup checks need attention',route:'Saved tracks need review',missing:'Channel not supplied',short:'At least 30 complete seconds needed',coverage:'Fewer than 90% of seconds contain samples',diagnostics:'Reimport for source diagnostics',gaps:'Sample gaps exceed one second',range_unknown:'Reported range is missing',range_changed:'Reported ranges differ',clipping:'Samples approach the sensor range',status:'Vendor status is missing or needs review',rate:'Sample rates differ by more than 25%'};
const known=v=>typeof v==='string'&&v.trim()&&!/^(unknown|not supplied)$/i.test(v.trim());
const same=(a,b)=>!known(a)||!known(b)?null:a.trim()===b.trim();
const all=checks=>Object.values(checks).every(v=>v===true);
function setup(a,b){
 const placement=same(a.placement,b.placement),mounted=a.placement==='Rigid mount'&&b.placement==='Rigid mount';
 return {distinct:!!a.id&&!!b.id&&a.id!==b.id,activity:a.kind==='ride'&&b.kind==='ride',native:a.source!=='GPX export'&&b.source!=='GPX export',finalized:a.finalized===true&&b.finalized===true,bike:same(a.bike_id,b.bike_id),phone:same(a.device,b.device),bike_type:same(a.bike_type,b.bike_type),placement:placement===true&&['Pocket','Bag','Rigid mount'].includes(a.placement)?true:placement===false?false:null,mount:!known(a.mount_condition)||!known(b.mount_condition)?null:mounted?a.mount_condition==='Stable'&&b.mount_condition==='Stable':placement===true&&['Pocket','Bag'].includes(a.placement)&&a.mount_condition==='Not mounted'&&b.mount_condition==='Not mounted',route_label:same(a.recurring,b.recurring)};
}
const wrap=n=>((n+180)%360+360)%360-180;
function routeSamples(ride){
 if(!analysis.distanceSupported(ride)||ride.track.length<2)return null;
 const track=ride.track;if(track.some((p,i)=>![p[0],p[1],p[2]].every(Number.isFinite)||Math.abs(p[0])>180||Math.abs(p[1])>90||i&&p[2]<=track[i-1][2]))return null;
 const distances=[0];for(let i=1;i<track.length;i++){const a=track[i-1],b=track[i];distances.push(distances.at(-1)+(a[7]===b[7]&&b[2]-a[2]<=3?analysis.distance(a,b):0));}
 const total=distances.at(-1);if(total<100)return null;
 const samples=[];let cursor=1;
 for(let i=0;i<33;i++){
  if(i===0){samples.push(track[0].slice(0,2));continue;}if(i===32){samples.push(track.at(-1).slice(0,2));continue;}
  const target=total*i/32;while(cursor<track.length-1&&distances[cursor]<target)cursor++;
  const a=track[cursor-1],b=track[cursor],span=distances[cursor]-distances[cursor-1],p=span>0?(target-distances[cursor-1])/span:0;
  samples.push([wrap(a[0]+wrap(b[0]-a[0])*p),a[1]+(b[1]-a[1])*p]);
 }
 return samples;
}
const quantile=(a,p)=>{if(!a.length)return null;const t=(a.length-1)*p,i=Math.floor(t),f=t-i;return f?(1-f)*a[i]+f*a[i+1]:a[i];};
const percentile=(values,p)=>quantile([...values].sort((a,b)=>a-b),p);
function routes(a,b){
 const first=routeSamples(a),second=routeSamples(b);if(!first||!second)return {matched:null,medianMeters:null,p90Meters:null};
 const distances=first.map((p,i)=>analysis.distance(p,second[i])),medianMeters=percentile(distances,.5),p90Meters=percentile(distances,.9);
 return {matched:distances[0]<=100&&distances.at(-1)<=100&&medianMeters<=50&&p90Meters<=100,medianMeters,p90Meters};
}
function profile(ride,definition){
 const completeSeconds=Number.isFinite(ride.duration)?Math.floor(ride.duration):0,bins=new Map(),seen=new Set();
 for(const row of Array.isArray(ride.signals)?ride.signals:[]){
  const t=row?.[0],value=row?.[definition.index];if(!Number.isInteger(t)||t<0||t>=completeSeconds)continue;
  if(seen.has(t)){bins.delete(t);continue;}seen.add(t);
  if(Number.isFinite(value)&&value>=0&&value<=1000)bins.set(t,value);
 }
 const points=[...bins].sort((a,b)=>a[0]-b[0]),values=points.map(p=>p[1]).sort((a,b)=>a-b),stats=ride.stats?.find(s=>s.type===definition.type),diagnostics=analysis.sensorDiagnostics(stats,ride.duration);
 return {points,bins:points.length,completeSeconds,coverage:completeSeconds?points.length/completeSeconds:0,median:quantile(values,.5),p95:quantile(values,.95),diagnostics};
}
function compare(a,b){
 const checks=setup(a,b),route=routes(a,b),setupMatched=all(checks);
 const channels=definitions.map(definition=>{
  const first=profile(a,definition),second=profile(b,definition),issues=[];
  if(!setupMatched)issues.push('setup');if(route.matched!==true)issues.push('route');
  if(!first.bins||!second.bins)issues.push('missing');
  if(first.bins<30||second.bins<30)issues.push('short');if(first.coverage<.9||second.coverage<.9)issues.push('coverage');
  const x=first.diagnostics,y=second.diagnostics;
  if(!x?.detailed||!y?.detailed)issues.push('diagnostics');
  if([x,y].some(d=>d&&[d.maxGapSeconds,d.leadingGapSeconds,d.trailingGapSeconds].some(v=>v===null||v>1)))issues.push('gaps');
  if([x,y].some(d=>d?.nearRangeSamples===null||!d))issues.push('range_unknown');
  if(x?.maximumRange&&y?.maximumRange&&Math.max(x.maximumRange,y.maximumRange)/Math.min(x.maximumRange,y.maximumRange)>1.01)issues.push('range_changed');
  if([x,y].some(d=>d?.nearRangeSamples>0))issues.push('clipping');
  if([x,y].some(d=>!d||d.statusCounts.no_contact+d.statusCounts.unreliable+d.statusCounts.unknown>0))issues.push('status');
  if(!x?.sampleRateHz||!y?.sampleRateHz||Math.max(x.sampleRateHz,y.sampleRateHz)/Math.min(x.sampleRateHz,y.sampleRateHz)>1.25)issues.push('rate');
  const eligible=issues.length===0;
  return {...definition,first,second,reasons:issues,eligible,delta:eligible?second.median-first.median:null};
 });
 return {checks,route,setupMatched,channels};
}
function packet(pair){
 const summary=p=>({bins:p.bins,complete_seconds:p.completeSeconds,median:p.median===null?null:+p.median.toFixed(3),p95:p.p95===null?null:+p.p95.toFixed(3)});
 return {setup_checks:{...pair.checks},route_matched:pair.route.matched,channels:pair.channels.map(c=>({channel:c.id,first:summary(c.first),second:summary(c.second),reasons:[...c.reasons]}))};
}
const api={definitions,checkLabels,reasons,setup,profile,routes,compare,packet,setupMatched:(a,b)=>all(setup(a,b))};root.OdoCompare=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
