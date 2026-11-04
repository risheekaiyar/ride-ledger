// Consistent synthetic phone recordings for comparison checks; never product defaults.
const {analyze}=require('../web/analysis.js');
exports.ride=(index=0)=>{
 const start=Date.UTC(2026,10,4-index,1,30),rows=[];
 for(let i=0;i<600;i++){const t=1e9+i*1e8,factor=1+index*.04;
  rows.push(`${t},1,0,0,${9.80665*(1+.025*Math.sin(i/30))*factor},3`,`${t},4,0,0,${(.12+.02*Math.sin(i/25))*factor},3`,`${t},10,0,0,${(.3+.1*Math.sin(i/20))*factor},3`);
 }
 const files={
  'metadata.json':JSON.stringify({started_epoch_ms:start,started_elapsed_ns:1e9,device:'Private synthetic phone',activity_type:'ride',placement:'Rigid mount',ride_context:{bike_id:'Private synthetic bike',bike_type:'Adventure',mount_condition:'Stable'},sensors:[{type:1,maximum_range:39.2266,reporting_mode:0},{type:4,maximum_range:20,reporting_mode:0},{type:10,maximum_range:19.6133,reporting_mode:0}]}),
  'summary.json':JSON.stringify({ended_epoch_ms:start+60000,ended_elapsed_ns:61e9,estimated_distance_m:360,gps_samples:61,motion_samples:rows.length,end_reason:'user_stopped'}),
  'motion.csv':'sensor_elapsed_ns,type,x,y,z,accuracy\n'+rows.join('\n'),
  'gps.csv':'fix_elapsed_ns,latitude_deg,longitude_deg,accuracy_m,speed_mps,speed_accuracy_mps,bearing_deg,altitude_m,accepted,mock,age_seconds\n'+Array.from({length:61},(_,i)=>`${1e9+i*1e9},${12+.0001*Math.sin(i/9)},${77+i*.00005},2,6,.2,90,800,true,false,0`).join('\n')
 };
 return {...analyze(files,`Synthetic · ${index?'another morning':'the morning loop'}.zip`),recurring:'Private route label',notes:'Private annotation'};
};
