(function(root){
'use strict';
const round=(value,digits=1)=>Number.isFinite(value)?Number(value.toFixed(digits)):null;
const analysis=typeof module!=='undefined'?require('./analysis.js'):root.OdoAnalysis;
function sensorHealth(ride){
 const names={1:'acceleration',4:'rotation',10:'linear_acceleration'},seen=new Set();
 return (Array.isArray(ride.stats)?ride.stats:[]).filter(s=>names[s?.type]).flatMap(s=>{
  const d=analysis.sensorDiagnostics(s,ride.duration);if(!d||seen.has(s.type))return [];seen.add(s.type);
  return [{channel:names[s.type],accepted_samples:d.samples,mean_rate_hz:d.sampleRateHz<=100000?(round(d.sampleRateHz,3)||null):null,largest_gap_seconds:round(d.maxGapSeconds,3),leading_gap_seconds:round(d.leadingGapSeconds,3),trailing_gap_seconds:round(d.trailingGapSeconds,3),near_range_samples:d.nearRangeSamples,status_counts:d.statusCounts}];
 });
}
function comparable(a,b){
 const compare=typeof module!=='undefined'?require('./ride-compare.js'):root.OdoCompare;return !!(a&&b&&compare.setupMatched(a,b));
}
function evidence(ride,insights){
 const imported=ride.source==='GPX export',screenKnown=!imported&&Number.isFinite(ride.screenObservedSeconds)&&Number.isFinite(ride.screenOffSeconds)&&ride.screenOffSeconds>=0&&ride.screenOffSeconds<=ride.screenObservedSeconds&&ride.screenObservedSeconds<=ride.duration;
 const result={kind:ride.kind,placement:['Pocket','Bag','Rigid mount'].includes(ride.placement)?ride.placement:'Unknown',bike_type:ride.bike_type||'Unknown',mount_condition:ride.mount_condition||'Unknown',rider_observations:Object.values(ride.roadMemory||{}).filter(x=>['Speed breaker','Rough patch','Pothole','Phone moved','Other'].includes(x)).slice(0,20),duration_seconds:round(ride.duration,3),distance_km:ride.distanceReliable?round(ride.distanceKm,2):null,gps_accepted_percent:imported?null:round(ride.quality),gps_accuracy_m:imported?null:round(ride.medianAccuracy),screen_off_seconds:screenKnown?round(ride.screenOffSeconds,3):null,screen_observed_seconds:screenKnown?round(ride.screenObservedSeconds,3):null};
 if(!imported&&insights)result.route_profile=insights;
 if(!imported)result.sensor_health=sensorHealth(ride);
 return result;
}
root.OdoCompanion={comparable,evidence};if(typeof module!=='undefined')module.exports=root.OdoCompanion;
})(globalThis);
