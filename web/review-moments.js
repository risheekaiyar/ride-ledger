/* Existing screened candidates, ordered for inspection. No new event detection. */
(function(root){
'use strict';
const kinds={
 impact:{channel:'motion',title:'Phone peak candidate',source:'PHONE · RAW PEAK',description:'Includes gravity, engine vibration and mount movement. The cause is unverified.'},
 braking:{channel:'speed',title:'Speed reduction',source:'GPS · SPEED CHANGE',description:'A speed-change estimate. Traffic, turns and planned stops can produce similar signals.'},
 acceleration:{channel:'speed',title:'Speed increase',source:'GPS · SPEED CHANGE',description:'A speed-change estimate, without a verified road or riding cause.'}
};
function list(ride){
 if(!ride||ride.source==='GPX export'||!Number.isFinite(ride.duration)||ride.duration<=0)return [];
 const rows=new Map(),seen=new Set();
 for(const e of ride.events||[]){
  if(!e||typeof e.id!=='string'||!e.id||e.id.length>80)continue;
  if(seen.has(e.id)){rows.delete(e.id);continue;}seen.add(e.id);
  if(!Object.hasOwn(kinds,e.kind)||!Number.isFinite(e.t)||e.t<0||e.t>ride.duration||e.kind==='impact'&&e.t>=ride.duration||!Number.isFinite(e.g)||e.g<0||e.g>1000)continue;
  rows.set(e.id,{id:e.id,kind:e.kind,t:e.t,g:e.g,...kinds[e.kind]});
 }
 return [...rows.values()].sort((a,b)=>a.t-b.t||a.id.localeCompare(b.id));
}
const api={list};root.OdoReviewMoments=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
