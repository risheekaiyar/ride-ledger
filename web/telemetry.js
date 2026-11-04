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
 let altitudeMin=null,altitudeMax=null;for(const p of track){const v=p[5];if(!Number.isFinite(v)||v< -1000||v>10000)continue;altitudeMin=altitudeMin===null?v:Math.min(altitudeMin,v);altitudeMax=altitudeMax===null?v:Math.max(altitudeMax,v);}
 return {imported,seconds,bands,observed,unobserved:Math.max(0,duration-observed),coverage:duration?Math.min(1,observed/duration):0,lowSpeed:seconds[0],moving:observed-seconds[0],average:observed?integral/observed:null,peak,distanceKm:observed?integral/3600:null,gaps,segments:track.length?segments+1:0,altitudeMin,altitudeMax};
}
function series(ride,kind='speed'){
 if(kind==='speed'&&ride.source==='GPX export')return (ride.track||[]).flatMap((b,i,track)=>{if(!i)return [];const a=track[i-1],dt=b[2]-a[2];return a[7]===b[7]&&dt>0&&dt<=30&&Number.isFinite(b[3])?[[a[2],b[3],b[7]],[b[2],b[3],b[7]]]:[[b[2],null,b[7]]];});
 if(kind==='motion')return (ride.signals||[]).map(p=>[p[0],Number.isFinite(p[1])?p[1]:null,0]);
 return (ride.track||[]).map(p=>[p[2],Number.isFinite(p[kind==='altitude'?5:3])?p[kind==='altitude'?5:3]:null,p[7]]);
}
function path(points,duration,width=600,height=130,maxGap=3,zeroBased=true){
 width=Math.max(16,Math.min(2048,Math.floor(width)||600));
 const empty={d:'',dots:'',gaps:'',min:null,max:null,aggregated:false,gapColumns:0,count:0};if(!(duration>0)||!Number.isFinite(duration))return empty;
 let min=Infinity,max=-Infinity,last=null;const valid=[],intervals=[];
 for(const p of points){
  if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<0||p[0]>duration){last=null;continue;}
  const connected=!!(last&&last[2]===p[2]&&p[0]>last[0]&&p[0]-last[0]<=maxGap);
  valid.push({time:p[0],value:p[1],connected});min=Math.min(min,p[1]);max=Math.max(max,p[1]);if(connected)intervals.push([last[0],p[0]]);last=p;
 }
 if(!valid.length)return empty;if(zeroBased)min=Math.min(0,min);
 const span=Math.max(1,max-min),x=time=>time/duration*width,y=value=>height-10-(value-min)/span*(height-20),aggregated=valid.length>width*2;let d='',dots='';
 if(aggregated){
  const buckets=Array.from({length:width},()=>({min:Infinity,max:-Infinity}));
  for(const p of valid){const b=buckets[Math.min(width-1,Math.floor(x(p.time)))];b.min=Math.min(b.min,p.value);b.max=Math.max(b.max,p.value);}
  for(let i=0;i<width;i++){const b=buckets[i];if(b.min===Infinity)continue;d+=`M${i+.5},${y(b.max).toFixed(3)}V${y(b.min).toFixed(3)} `;if(b.min===b.max)dots+=`M${i+.1},${y(b.min).toFixed(3)}h.8 `;}
 }else{
  for(let i=0;i<valid.length;i++){const p=valid[i],px=x(p.time),py=y(p.value);d+=`${p.connected?'L':'M'}${px.toFixed(2)},${py.toFixed(2)} `;if(!p.connected&&!valid[i+1]?.connected)dots+=`M${(px-.8).toFixed(2)},${py.toFixed(2)}h1.6 `;}
 }
 // Merge observed intervals before marking gaps, including duplicate GPX interval boundaries.
 intervals.sort((a,b)=>a[0]-b[0]);const merged=[];
 for(const interval of intervals){const previous=merged.at(-1);if(previous&&interval[0]<=previous[1])previous[1]=Math.max(previous[1],interval[1]);else merged.push([...interval]);}
 const missing=new Uint8Array(width);let end=0;
 const mark=(a,b)=>{if(b-a<1e-8)return;const left=Math.max(0,Math.floor(x(a))),right=Math.min(width,Math.ceil(x(b)));for(let i=left;i<right;i++)missing[i]=1;};
 for(const interval of merged){mark(end,interval[0]);end=interval[1];}mark(end,duration);
 let gaps='',gapColumns=0,start=null;for(let i=0;i<=width;i++){const gap=i<width&&missing[i];if(gap)gapColumns++;if(gap&&start===null)start=i;if(!gap&&start!==null){gaps+=`M${start},0H${i} `;start=null;}}
 return {d,dots,gaps,min,max,aggregated,gapColumns,count:valid.length};
}
function windowRange(duration,span,center=0){
 if(!(duration>0)||!Number.isFinite(duration))return {start:0,end:0};
 const length=Number.isFinite(span)&&span>0?Math.min(duration,span):duration;
 const start=Math.max(0,Math.min(duration-length,Math.floor((Number.isFinite(center)?center:0)-length/2)));
 return {start,end:start+length};
}
function windowPath(points,duration,start,end,width=600,height=150,maxGap=3,zeroBased=true){
 if(!(duration>0)||!Number.isFinite(duration))return path([],0,width,height,maxGap,zeroBased);
 start=Math.max(0,Number.isFinite(start)?start:0);end=Math.min(duration,Number.isFinite(end)?end:duration);
 if(!(end>start))return path([],0,width,height,maxGap,zeroBased);
 if(start===0&&end===duration)return path(points,duration,width,height,maxGap,zeroBased);
 // Clip existing connected line segments for display only. Inspection/statistics retain source samples.
 const clipped=[];let last=null,group=0;
 const append=(time,value)=>{const previous=clipped.at(-1),relative=time-start;if(previous&&previous[0]===relative&&previous[1]===value&&previous[2]===group)return;clipped.push([relative,value,group]);};
 for(const point of points){
  if(!Number.isFinite(point[0])||!Number.isFinite(point[1])||point[0]<0||point[0]>duration){last=null;group++;continue;}
  const connected=last&&last[2]===point[2]&&point[0]>last[0]&&point[0]-last[0]<=maxGap;
  if(connected){
   const left=Math.max(start,last[0]),right=Math.min(end,point[0]);
   if(right>left){const value=time=>time===last[0]?last[1]:time===point[0]?point[1]:last[1]+(point[1]-last[1])*(time-last[0])/(point[0]-last[0]);append(left,value(left));append(right,value(right));}
   else if(point[0]>=start&&point[0]<=end)append(point[0],point[1]);
  }else{group++;if(point[0]>=start&&point[0]<=end)append(point[0],point[1]);}
  last=point;
 }
 return path(clipped,end-start,width,height,maxGap,zeroBased);
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
const api={analyze,series,path,windowRange,windowPath,nearest,inspect};root.OdoTelemetry=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
