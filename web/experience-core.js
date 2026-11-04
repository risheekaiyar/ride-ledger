/* Organization and event selection. Source recordings remain unchanged. */
(function(root){
'use strict';
const finite=Number.isFinite;
const names={braking:'Braking',acceleration:'Acceleration',left:'Left turn',right:'Right turn',slow:'Long pause'};
const colors={braking:'#ff7169',acceleration:'#8bd6b7',left:'#90b6ff',right:'#d5a7f5',slow:'#e7c184'};
function unique(rides){return [...new Map(rides.map(r=>[r.id,r])).values()];}
function aggregate(rides){
 const list=unique(rides),result={count:list.length,distance:0,distanceCount:0,elapsed:0,observed:0,moving:0,low:0,missing:0,estimated:false};
 for(const r of list){const a=root.OdoInsightReel.analyze(r),f=a.facts;for(const k of ['elapsed','observed','moving','low','missing'])result[k]+=f[k]||0;if(finite(f.distance)){result.distance+=f.distance;result.distanceCount++;}if(r.source==='GPX export')result.estimated=true;}
 if(!result.distanceCount)result.distance=null;return result;
}
function organize(value={},links=[]){
 if(!value||typeof value!=='object'||Array.isArray(value))value={};
 const s={schema:1,journeys:[],memberships:{},dashboard:value.dashboard==='all'?'all':'latest',widgets:Array.isArray(value.widgets)?value.widgets.filter(x=>['distance','elapsed','moving','count'].includes(x)):['distance','elapsed','moving','count'],context:value.context&&typeof value.context==='object'?value.context:{}};
 s.widgets=[...new Set(s.widgets)].slice(0,4);if(!s.widgets.length)s.widgets=['distance','elapsed','moving','count'];
 s.context=Object.fromEntries(Object.entries(s.context).filter(([k,v])=>k.length<=300&&typeof v==='string'&&v.length<=420).slice(0,5000));
 for(const j of (Array.isArray(value.journeys)?value.journeys:[]).slice(0,1000))if(j&&typeof j.id==='string'&&j.id.length<=120&&typeof j.name==='string'&&j.name.trim()&&!s.journeys.some(x=>x.id===j.id))s.journeys.push({id:j.id,name:j.name.slice(0,80)});
 for(const [id,j] of Object.entries(value.memberships||{}))if(id.length<=160&&!['__proto__','constructor','prototype'].includes(id)&&s.journeys.some(x=>x.id===j))s.memberships[id]=j;
 if(value.schema!==1)for(const row of links){if(!row.journey||row.trip.startsWith('demo-field-'))continue;let j=s.journeys.find(x=>x.name===row.journey);if(!j){j={id:'migrated-'+s.journeys.length,name:row.journey};s.journeys.push(j);}s.memberships[row.trip]=j.id;}
 return s;
}
function majorEvents(ride,threshold=.08){
 const d=root.OdoRideDynamics.analyze(ride),list=[];
 for(const p of d.samples){let kind=p.forward<0?'braking':'acceleration',strength=Math.abs(p.forward);if(p.lateral!==null&&Math.abs(p.lateral)>strength){kind=p.lateral<0?'left':'right';strength=Math.abs(p.lateral);}if(strength<threshold)continue;
  const last=list.at(-1);if(last&&last.kind===kind&&p.start-last.end<=2){last.end=p.end;last.peak=Math.max(last.peak,strength);}else list.push({kind,start:p.start,end:p.end,peak:strength,index:p.index});
 }
 return list.sort((a,b)=>b.peak-a.peak).filter((e,i,all)=>!all.slice(0,i).some(x=>Math.abs(x.start-e.start)<15)).slice(0,8).sort((a,b)=>a.start-b.start).map(e=>({...e,id:e.kind+'-'+e.start}));
}
function pauses(ride){return root.OdoRideDynamics.sections(ride,root.OdoRideDynamics.analyze(ride)).filter(s=>s.kind==='slow'&&s.end_second-s.start_second>=60).sort((a,b)=>(b.end_second-b.start_second)-(a.end_second-a.start_second)).slice(0,2).map(s=>({id:'pause-'+s.start_second,kind:'slow',start:s.start_second,end:s.end_second}));}
function bearing(a,b){return Math.atan2((b[0]-a[0])*Math.cos(a[1]*Math.PI/180),b[1]-a[1])*180/Math.PI;}
function recurring(rides){
 const clusters=[];
 for(const r of unique(rides).filter(r=>r.recurring&&r.kind==='ride'))for(const s of pauses(r)){
  const i=r.track.findIndex(p=>p[2]>=s.start),p=r.track[i],a=r.track[Math.max(0,i-2)],b=r.track[Math.min(r.track.length-1,i+2)];
  if(!p||!a||!b||a[7]!==b[7]||root.OdoAnalysis.distance(a,b)<10)continue;
  const heading=bearing(a,b);let c=clusters.find(c=>c.label===r.recurring&&root.OdoAnalysis.distance(c.point,p)<50&&Math.abs(((heading-c.heading+540)%360)-180)<35);
  if(!c){c={id:r.id+'-'+s.id,label:r.recurring,point:p,heading,matches:[]};clusters.push(c);}if(!c.matches.some(x=>x.ride===r.id))c.matches.push({ride:r.id,start:s.start,end:s.end});
 }
 return clusters.filter(c=>c.matches.length>=3).sort((a,b)=>b.matches.length-a.matches.length);
}
const api={unique,aggregate,organize,majorEvents,pauses,recurring,names,colors};root.OdoExperienceCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
