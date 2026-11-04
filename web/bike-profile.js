(function(root){
'use strict';
const models=[
 ['xpulse-200','Hero','Xpulse 200 2V','Adventure','rally','lcd','#e74738'],['xpulse-200-4v','Hero','Xpulse 200 4V','Adventure','rally','lcd','#f1eee4'],
 ['r1300gs','BMW','R 1300 GS','Adventure','adventure','tft','#477b65'],['himalayan-450','Royal Enfield','Himalayan 450','Adventure','adventure','round','#d4c29b'],
 ['390-adventure','KTM','390 Adventure','Adventure','adventure','tft','#ef7135'],['390-duke','KTM','390 Duke','Roadster','naked','tft','#ed7137'],
 ['r15','Yamaha','R15','Sport','sport','lcd','#4265d8'],['mt15','Yamaha','MT-15','Roadster','naked','lcd','#75c6d1'],
 ['ninja-650','Kawasaki','Ninja 650','Sport','sport','tft','#80b942'],['panigale-v4','Ducati','Panigale V4','Sport','sport','tft','#d73732'],
 ['cb350','Honda','CB350','Roadster','classic','round','#843c3c'],['classic-350','Royal Enfield','Classic 350','Cruiser','classic','round','#a6aa91'],
 ['vstrom-250','Suzuki','V-Strom SX','Adventure','adventure','lcd','#e8c84c'],['goldwing','Honda','Gold Wing','Touring','touring','tft','#9d3642'],
 ['custom','Your bike','Custom motorcycle','Unknown','naked','tft','#ed9a6c']
].map(([id,make,name,type,family,cluster,color])=>({id,make,name,type,family,cluster,color}));
const families=['adventure','rally','sport','naked','classic','touring','scooter'];
function resolve(bike={}){const name=String(bike.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');const found=models.find(m=>m.id===bike.modelId)||models.find(m=>m.id!=='custom'&&name.includes(m.name.toLowerCase().replace(/[^a-z0-9]/g,'')))||models.at(-1);return {...found,family:families.includes(bike.visualFamily)?bike.visualFamily:found.id==='custom'?({Adventure:'adventure',Sport:'sport',Touring:'touring',Cruiser:'classic','Off-road':'rally',Scooter:'scooter',Roadster:'naked'}[bike.type]||found.family):found.family,color:/^#[0-9a-f]{6}$/i.test(bike.color||'')?bike.color:found.color};}
function forRide(ride,bike={}){const matches=!ride.bike_id||ride.bike_id===bike.name;return resolve({...(matches?bike:{}),name:ride.bike_id||bike.name,modelId:ride.bike_model|| (matches?bike.modelId:undefined),type:ride.bike_type||(matches?bike.type:undefined),visualFamily:ride.bike_family||(matches?bike.visualFamily:undefined),color:ride.bike_color||(matches?bike.color:undefined)});}
function forRecording(name,type,bike){const current=resolve(bike);if(name===bike.name&&type===(bike.type||current.type))return current;const result=resolve({name,type});return {...result,family:type!=="Unknown"&&type!==result.type?resolve({type}).family:result.family};}
function distanceState(bike,rides,now=Date.now()){
 const a=bike.odoAnchor,manual=bike.odometer!==''&&bike.odometer!==null&&bike.odometer!==undefined?Number(bike.odometer):null;
 if(!a||!Number.isFinite(a.reading)||!Number.isFinite(a.at)||a.bikeName!==bike.name)return {anchor:null,actual:Number.isFinite(manual)?manual:null,estimate:Number.isFinite(manual)?manual:null,distance:0,count:0,unknown:0,factor:1,rides:[]};
 const trips=rides.filter(r=>r.kind==='ride'&&r.bike_id===bike.name&&r.started>=a.at&&r.started+r.duration*1000<=now),known=trips.filter(r=>r.distanceReliable&&Number.isFinite(r.distanceKm)&&r.distanceKm>=0);
 const factor=Number.isFinite(bike.distanceFactor)&&bike.distanceFactor>=.8&&bike.distanceFactor<=1.2?bike.distanceFactor:1,distance=known.reduce((n,r)=>n+r.distanceKm,0);
 return {anchor:a,actual:a.reading,estimate:a.reading+distance*factor,distance,count:known.length,unknown:trips.length-known.length,factor,rides:known};
}
function reconcile(bike,rides,reading,complete,now=Date.now()){
 if(!Number.isFinite(reading)||reading<0||reading>2000000)throw Error('Enter a valid odometer reading.');const state=distanceState(bike,rides,now),delta=state.anchor?reading-state.actual:null;
 if(delta!==null&&delta<0)throw Error('A lower reading needs a new baseline. Choose Reset baseline if the meter or bike changed.');
 const reasons=[];if(!state.anchor)reasons.push('first_reading');if(!complete)reasons.push('travel_not_confirmed');if(state.distance<5)reasons.push('short_interval');if(state.unknown)reasons.push('missing_distance');
 const setup=state.rides.map(r=>[r.device,r.placement,r.mount_condition,r.bike_type]);if(!setup.length||setup.some(x=>x.some(v=>!v||v==='Unknown'))||setup.some(x=>JSON.stringify(x)!==JSON.stringify(setup[0])))reasons.push('setup_not_matched');
 const ratio=delta!==null&&state.distance>0?delta/state.distance:null;if(ratio!==null&&(ratio<.8||ratio>1.2))reasons.push('large_discrepancy');const eligible=reasons.length===0;
 return {odometer_delta_km:delta,gps_distance_km:state.distance,recordings:state.count,missing_recordings:state.unknown,all_travel_confirmed:!!complete,eligible,reasons,factor:eligible?ratio:null};
}
const api={models,families,resolve,forRide,forRecording,distanceState,reconcile};root.OdoBikeProfile=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
