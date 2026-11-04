(function(root){
'use strict';
const wrap=d=>((d+180)%360+360)%360-180;
// Coordinates are scaled uniformly in the horizontal plane. Road width is illustrative.
function build(track,{span=300,gapLimit=30,speedMode='samples'}={}){
 if(!Array.isArray(track)||track.length<2||!Number.isFinite(span)||span<=0||!(gapLimit>0))return null;
 const valid=track.every((p,i)=>Array.isArray(p)&&Number.isFinite(p[0])&&Math.abs(p[0])<=180&&Number.isFinite(p[1])&&Math.abs(p[1])<=90&&Number.isFinite(p[2])&&(!i||p[2]>track[i-1][2]));if(!valid)return null;
 let longitude=track[0][0],group=0;const lat0=track.reduce((s,p)=>s+p[1],0)/track.length,cos=Math.max(.001,Math.cos(lat0*Math.PI/180));
 const raw=track.map((p,i)=>{if(i){longitude+=wrap(p[0]-longitude);if(p[7]!==track[i-1][7]||p[2]-track[i-1][2]>gapLimit)group++;}return {x:longitude*111320*cos,z:-p[1]*111320,alt:p[5],time:p[2],segment:group,index:i,speed:p[3]};});
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(const p of raw){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);}
 const extent=Math.max(maxX-minX,maxZ-minZ);if(extent<1)return null;
 const scale=span/extent,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
 const elevationAvailable=raw.every(p=>Number.isFinite(p.alt)&&p.alt>=-1000&&p.alt<=10000),base=elevationAvailable?raw.reduce((n,p)=>Math.min(n,p.alt),Infinity):0;
 const points=raw.map(p=>({...p,x:(p.x-cx)*scale,z:(p.z-cz)*scale,y:elevationAvailable?(p.alt-base)*scale:0}));
 const groups=[];for(const p of points){if(!groups.length||p.segment!==groups.at(-1).segment)groups.push({segment:p.segment,points:[]});groups.at(-1).points.push(p);}
 // Bound mesh complexity while retaining turn vertices with a Douglas–Peucker simplifier.
 function simplify(items,tolerance=.12){if(items.length<3)return items;const keep=new Set([0,items.length-1]),stack=[[0,items.length-1]];while(stack.length){const [a,b]=stack.pop(),first=items[a],last=items[b],dx=last.x-first.x,dy=last.y-first.y,dz=last.z-first.z,den=dx*dx+dy*dy+dz*dz;let best=tolerance*tolerance,index=-1;for(let i=a+1;i<b;i++){const p=items[i],t=den?Math.max(0,Math.min(1,((p.x-first.x)*dx+(p.y-first.y)*dy+(p.z-first.z)*dz)/den)):0,d=(p.x-first.x-t*dx)**2+(p.y-first.y-t*dy)**2+(p.z-first.z-t*dz)**2;if(d>best){best=d;index=i;}}if(index>=0){keep.add(index);stack.push([a,index],[index,b]);}}return [...keep].sort((a,b)=>a-b).map(i=>items[i]);}
 const segments=groups.filter(g=>g.points.length>=2).map(g=>({segment:g.segment,points:simplify(g.points)}));
 return {points,segments,scale,width:(maxX-minX)*scale,depth:(maxZ-minZ)*scale,elevationAvailable,altitudeBase:base,height:points.reduce((h,p)=>Math.max(h,p.y),0),speedMode};
}
function atTime(model,time){const points=model.points;if(!Number.isFinite(time)||time<points[0].time||time>points.at(-1).time)return {...(time>points.at(-1).time?points.at(-1):points[0]),speed:null,gap:true};let lo=0,hi=points.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(points[mid].time<time)lo=mid+1;else hi=mid;}const b=points[lo],a=points[Math.max(0,lo-1)];if(a.segment!==b.segment){const gap=time>a.time&&time<b.time;return {...(time<b.time?a:b),speed:gap?null:(time<b.time?a.speed:b.speed),gap};}const t=b.time>a.time?Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time))):0;return {...b,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,speed:model.speedMode==='interval'?(Number.isFinite(b.speed)?b.speed:null):(Number.isFinite(a.speed)&&Number.isFinite(b.speed)?a.speed+(b.speed-a.speed)*t:null),gap:false};}
const api={build,atTime};root.OdoTrackModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
