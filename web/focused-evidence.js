/* Bounded, location-free summaries of a selected trace window. Source arrays remain unchanged. */
(function(root){
'use strict';
const definitions=[
 {id:'acceleration',index:1,unit:'g',measure:'Complete 1s bin peaks; includes gravity'},
 {id:'linear_acceleration',index:2,unit:'g',measure:'Complete 1s bin peaks; estimated gravity removed'},
 {id:'rotation',index:3,unit:'rad/s',measure:'Complete 1s bin medians; phone angular speed'}
];
const round=value=>Number.isFinite(value)?Number(value.toFixed(3)):null;
const quantile=(values,p)=>{if(!values.length)return null;const t=(values.length-1)*p,i=Math.floor(t),f=t-i;return round(f?values[i]*(1-f)+values[i+1]*f:values[i]);};
function summarize(ride,selection){
 if(!ride||!selection||!['speed','altitude','motion'].includes(selection.channel)||![ride.duration,selection.start,selection.end].every(Number.isFinite)||selection.start<0||selection.end>ride.duration||selection.end<=selection.start||selection.end-selection.start>300.000001)return null;
 const start=Math.ceil(selection.start),end=Math.floor(selection.end);if(end<=start)return null;
 const imported=ride.source==='GPX export',rows=new Map(),seen=new Set();
 if(!imported)for(const row of ride.signals||[]){const t=row?.[0];if(!Number.isInteger(t)||t<start||t>=end)continue;if(seen.has(t)){rows.delete(t);continue;}seen.add(t);rows.set(t,row);}
 const channels=definitions.map(d=>{const values=[...rows.values()].map(row=>row[d.index]).filter(v=>Number.isFinite(v)&&v>=0&&v<=1000).sort((a,b)=>a-b);return {channel:d.id,bins:values.length,median:quantile(values,.5),p95:quantile(values,.95),maximum:values.length?round(values.at(-1)):null};});
 const track=ride.track||[];let observed=0,integral=0,peak=null,lastEnd=-Infinity,altCount=0,altMin=null,altMax=null;
 for(let i=0;i<track.length;i++){
  const b=track[i];if(Number.isFinite(b[2])&&b[2]>=start&&b[2]<=end&&Number.isFinite(b[5])&&b[5]>=-1000&&b[5]<=10000){altCount++;altMin=altMin===null?b[5]:Math.min(altMin,b[5]);altMax=altMax===null?b[5]:Math.max(altMax,b[5]);}
  if(!i)continue;const a=track[i-1],dt=b[2]-a[2],first=imported?b[3]:a[3],last=b[3];
  if(![a[2],b[2]].every(Number.isFinite)||a[2]<0||b[2]>ride.duration||a[2]<lastEnd||a[7]!==b[7]||!(dt>0&&dt<=(imported?30:3))||![first,last].every(v=>Number.isFinite(v)&&v>=0&&v<252))continue;
  lastEnd=b[2];const left=Math.max(start,a[2]),right=Math.min(end,b[2]);if(right<=left)continue;
  const v0=first+(last-first)*(left-a[2])/dt,v1=first+(last-first)*(right-a[2])/dt;
  observed+=right-left;integral+=(v0+v1)/2*(right-left);peak=Math.max(peak??0,v0,v1);
 }
 const observedSeconds=round(Math.min(end-start,observed));
 return {start_second:start,end_second:end,selected_channel:selection.channel,
  speed:{source:imported?'gpx_interval_estimate':'phone_gps',observed_seconds:observedSeconds,average_kmh:observedSeconds?round(integral/observed):null,peak_kmh:observedSeconds?round(peak):null},
  source_altitude:{samples:altCount,minimum_m:round(altMin),maximum_m:round(altMax)},channels};
}
const api={definitions,summarize};root.OdoFocusedEvidence=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
