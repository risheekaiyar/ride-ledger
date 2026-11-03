(function(root){
'use strict';
const round=(value,digits=1)=>Number.isFinite(value)?Number(value.toFixed(digits)):null;
function comparable(a,b){
 return a&&b&&a.id!==b.id&&a.kind==='ride'&&b.kind==='ride'&&a.recurring&&a.recurring===b.recurring&&a.bike_id&&a.bike_id===b.bike_id&&a.device&&a.device===b.device&&a.bike_type&&a.bike_type!=='Unknown'&&a.bike_type===b.bike_type&&a.placement!=='Unknown'&&a.placement===b.placement&&a.mount_condition==='Stable'&&b.mount_condition==='Stable'&&a.source!=='GPX export'&&b.source!=='GPX export';
}
function evidence(ride,insights){
 const imported=ride.source==='GPX export';
 const result={kind:ride.kind,placement:['Pocket','Bag','Rigid mount'].includes(ride.placement)?ride.placement:'Unknown',bike_type:ride.bike_type||'Unknown',mount_condition:ride.mount_condition||'Unknown',rider_observations:Object.values(ride.roadMemory||{}).filter(x=>['Speed breaker','Rough patch','Pothole','Phone moved','Other'].includes(x)).slice(0,20),duration_seconds:round(ride.duration,0),distance_km:ride.distanceReliable?round(ride.distanceKm,2):null,gps_accepted_percent:imported?null:round(ride.quality),gps_accuracy_m:imported?null:round(ride.medianAccuracy),screen_off_seconds:imported?null:round(ride.screenOffSeconds,0)};
 if(!imported&&insights)result.route_profile=insights;
 return result;
}
root.OdoCompanion={comparable,evidence};if(typeof module!=='undefined')module.exports=root.OdoCompanion;
})(globalThis);
