/* GPS-derived acceleration in the direction of travel. This is not calibrated motorcycle IMU data. */
(function(root){
'use strict';
const G=9.80665,wrap=d=>((d+180)%360+360)%360-180,round=n=>Math.round(n*1000)/1000;
function analyze(ride){
 const track=ride.track||[],imported=ride.source==='GPX export',limit=imported?30:3,samples=[];let observed=0,peak=0,braking=0,acceleration=0,lateralPeak=null,lastEnd=-Infinity;
 for(let i=1;i<track.length;i++){const a=track[i-1],b=track[i],dt=b[2]-a[2];if(!(dt>0&&dt<=limit)||a[7]!==b[7]||a[2]<lastEnd||a[2]<0||b[2]>ride.duration||![a[3],b[3]].every(v=>Number.isFinite(v)&&v>=0&&v<252))continue;
  if(!imported&&[a,b].some(p=>!Number.isFinite(p[4])||p[4]<0||p[4]>25||Number.isFinite(p[8])&&(p[8]<0||p[8]>3)))continue;
  const forward=(b[3]-a[3])/3.6/dt/G;let lateral=null;
  if(!imported&&Math.min(a[3],b[3])>=10&&[a,b].every(p=>Number.isFinite(p[6])&&p[6]>=0&&p[6]<360&&p[4]<=12)){const rate=wrap(b[6]-a[6])/dt;if(Math.abs(rate)<=45)lateral=(a[3]+b[3])/7.2*(rate*Math.PI/180)/G;}
  if(Math.abs(forward)>2||lateral!==null&&Math.abs(lateral)>2)continue;
  const total=Math.hypot(forward,lateral||0);samples.push({start:a[2],end:b[2],forward,lateral,total,index:i});lastEnd=b[2];observed+=dt;peak=Math.max(peak,total);braking=Math.max(braking,-forward);acceleration=Math.max(acceleration,forward);if(lateral!==null)lateralPeak=Math.max(lateralPeak??0,Math.abs(lateral));
 }
 return {samples,observed,peak:samples.length?peak:null,braking:samples.length?braking:null,acceleration:samples.length?acceleration:null,lateral:lateralPeak,source:imported?'GPX-derived change':'GPS-derived load',scale:Math.max(.25,...[.25,.5,1,2,3].filter(n=>n<peak*1.1).map(n=>n*2))};
}
function atTime(data,time){let lo=0,hi=data.samples.length;while(lo<hi){const mid=(lo+hi)>>1;if(data.samples[mid].end<time)lo=mid+1;else hi=mid;}const p=data.samples[lo];return p&&time>=p.start&&time<=p.end?p:null;}
function recent(data,time,seconds=5){let lo=0,hi=data.samples.length;while(lo<hi){const mid=(lo+hi)>>1;if(data.samples[mid].end<time-seconds)lo=mid+1;else hi=mid;}const result=[];for(let i=lo;i<data.samples.length&&data.samples[i].end<=time;i++)result.push(data.samples[i]);return result;}
function sections(ride,dynamics){
 const track=ride.track||[],limit=ride.source==='GPX export'?30:3,slow=[];let begin=null,end=null;
 function flush(){if(begin!==null&&end-begin>=10)slow.push({kind:'slow',start_second:begin,end_second:end});begin=end=null;}
 for(let i=1;i<track.length;i++){const a=track[i-1],b=track[i],dt=b[2]-a[2];if(a[7]===b[7]&&dt>0&&dt<=limit&&a[2]>=0&&b[2]<=ride.duration&&[a[3],b[3]].every(v=>Number.isFinite(v)&&v>=0&&v<5)){if(begin===null)begin=a[2];end=b[2];}else flush();}flush();
 const chosen=slow.sort((a,b)=>(b.end_second-b.start_second)-(a.end_second-a.start_second)).slice(0,3);
 for(const p of [...dynamics.samples].sort((a,b)=>b.total-a.total)){if(chosen.length>=6||p.total<.04)break;if(chosen.some(s=>p.end>=s.start_second-15&&p.end<=s.end_second+15))continue;chosen.push({kind:'load',start_second:Math.max(0,p.end-6),end_second:Math.min(ride.duration,p.end+6),peak_load_g:round(p.total)});}
 return chosen.sort((a,b)=>a.start_second-b.start_second).map((s,i)=>({id:'section_'+(i+1),...s,start_second:round(s.start_second),end_second:round(s.end_second)}));
}
const api={analyze,atTime,recent,sections};root.OdoRideDynamics=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
