/* Visual continuity for story playback. Never used to calculate ride measurements. */
(function(root){
'use strict';
function atTime(model,time){
 const source=root.OdoTrackModel||(typeof require==='function'?require('./track-model.js'):null),observed=source.atTime(model,time),points=model.points;
 if(!observed.gap)return {...observed,interpolated:false};
 if(!Number.isFinite(time)||time<points[0].time||time>points.at(-1).time)return {...observed,interpolated:false};
 let lo=0,hi=points.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(points[mid].time<time)lo=mid+1;else hi=mid;}
 const b=points[lo],a=points[Math.max(0,lo-1)],t=(time-a.time)/(b.time-a.time);
 return {...b,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,speed:null,gap:true,interpolated:true};
}
function direction(model,state){
 const points=model.points,index=state.index;
 // Both measured edges and display connectors use the same endpoint direction.
 for(let i=Math.max(1,index);i<Math.min(points.length,index+20);i++){const a=points[i-1],b=points[i];if(Math.hypot(b.x-a.x,b.z-a.z)>.005)return {x:b.x-a.x,z:b.z-a.z};}
 return null;
}
const api={atTime,direction};root.OdoRoutePresentation=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
