(function(root){
'use strict';
const bands=[0,5,20,40,60,80,100,Infinity];
function analyze(ride){
 const track=ride.track||[],imported=ride.source==='GPX export',limit=imported?30:3;
 const seconds=Array(bands.length-1).fill(0);let observed=0,integral=0,peak=null,segments=0,gaps=0,lastEnd=-Infinity;
 for(let i=1;i<track.length;i++){
  const a=track[i-1],b=track[i],dt=b[2]-a[2];
  if(a[7]!==b[7])segments++;
  const start=imported?b[3]:a[3],end=b[3];
  if(a[2]<0||b[2]>ride.duration||a[2]<lastEnd||a[7]!==b[7]||!(dt>0&&dt<=limit)||![start,end].every(v=>Number.isFinite(v)&&v>=0&&v<252)){if(dt>0)gaps+=dt;continue;}
  lastEnd=b[2];observed+=dt;integral+=(start+end)/2*dt;peak=Math.max(peak??0,start,end);
  // Split intervals at speed-band crossings, so a changing sample does not count as one fixed speed.
  const cuts=[0,1];if(start!==end)for(const threshold of bands.slice(1,-1)){const t=(threshold-start)/(end-start);if(t>0&&t<1)cuts.push(t);}cuts.sort((x,y)=>x-y);
  for(let j=1;j<cuts.length;j++){const value=start+(end-start)*(cuts[j]+cuts[j-1])/2;const band=bands.findIndex((edge,k)=>k<bands.length-1&&value>=edge&&value<bands[k+1]);if(band>=0)seconds[band]+=dt*(cuts[j]-cuts[j-1]);}
 }
 const duration=Number.isFinite(ride.duration)&&ride.duration>0?ride.duration:0;
 const altitude=track.map(p=>p[5]).filter(v=>Number.isFinite(v)&&v>=-1000&&v<=10000);
 return {imported,seconds,bands,observed,unobserved:Math.max(0,duration-observed),coverage:duration?Math.min(1,observed/duration):0,lowSpeed:seconds[0],moving:observed-seconds[0],average:observed?integral/observed:null,peak,distanceKm:observed?integral/3600:null,gaps,segments:track.length?segments+1:0,altitudeMin:altitude.length?Math.min(...altitude):null,altitudeMax:altitude.length?Math.max(...altitude):null};
}
function series(ride,kind='speed'){
 if(kind==='speed'&&ride.source==='GPX export')return (ride.track||[]).flatMap((b,i,track)=>{if(!i)return [];const a=track[i-1],dt=b[2]-a[2];return a[7]===b[7]&&dt>0&&dt<=30&&Number.isFinite(b[3])?[[a[2],b[3],b[7]],[b[2],b[3],b[7]]]:[[b[2],null,b[7]]];});
 if(kind==='motion')return (ride.signals||[]).map(p=>[p[0],Number.isFinite(p[1])?p[1]:null,0]);
 return (ride.track||[]).map(p=>[p[2],Number.isFinite(p[kind==='altitude'?5:3])?p[kind==='altitude'?5:3]:null,p[7]]);
}
function path(points,duration,width=600,height=130,maxGap=3,zeroBased=true){
 const values=points.map(p=>p[1]).filter(Number.isFinite);if(!values.length||!(duration>0))return {d:'',min:null,max:null};
 const min=zeroBased?Math.min(0,...values):Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);let d='',last=null;
 for(const p of points){if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<0||p[0]>duration){last=null;continue;}const connected=last&&last[2]===p[2]&&p[0]>last[0]&&p[0]-last[0]<=maxGap;d+=`${connected?'L':'M'}${(p[0]/duration*width).toFixed(2)},${(height-10-(p[1]-min)/span*(height-20)).toFixed(2)} `;last=p;}
 return {d,min,max};
}
function nearest(track,time){if(!track.length)return -1;let low=0,high=track.length-1;while(low<high){const mid=Math.floor((low+high)/2);if(track[mid][2]<time)low=mid+1;else high=mid;}return low>0&&Math.abs(track[low-1][2]-time)<=Math.abs(track[low][2]-time)?low-1:low;}
function inspect(ride,time){
 const track=ride.track||[],index=nearest(track,time),point=track[index],imported=ride.source==='GPX export';
 let upper=0,high=track.length;while(upper<high){const mid=(upper+high)>>1;if(track[mid][2]<time)upper=mid+1;else high=mid;}
 const before=track[upper-1],after=track[upper],exact=point&&point[2]===time;
 const gap=!point||!Number.isFinite(time)||time<0||time>ride.duration||(!exact&&(!before||!after||before[7]!==after[7]||after[2]-before[2]>(imported?30:3)));
 const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max?v:null;
 const sample=gap?null:point,signals=ride.signals||[],second=Math.floor(time);let low=0;high=signals.length;
 while(low<high){const mid=(low+high)>>1;if(signals[mid][0]<second)low=mid+1;else high=mid;}
 const motion=signals[low]?.[0]===second&&time>=0&&time<=ride.duration?signals[low]:null;
 return {index,gap,imported,sampleTime:sample?.[2]??null,motionTime:motion?.[0]??null,
  speed:finite(sample?.[3],0,251.999),accuracy:imported?null:finite(sample?.[4],0,100000),
  speedAccuracy:imported?null:finite(sample?.[8],0,1000),altitude:finite(sample?.[5],-1000,10000),
  course:imported?null:finite(sample?.[6],0,359.999999),
  acceleration:finite(motion?.[1],0,100000),linearAcceleration:finite(motion?.[2],0,100000),angularSpeed:finite(motion?.[3],0,100000)};
}
const api={analyze,series,path,nearest,inspect};root.OdoTelemetry=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
