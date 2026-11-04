// Synthetic channel diagnostics. Never loaded by the product.
exports.files=()=>({
 'metadata.json':JSON.stringify({started_epoch_ms:Date.UTC(2026,10,4,1,30),started_elapsed_ns:1e9,activity_type:'ride',placement:'Rigid mount',device:'Synthetic phone',ride_context:{bike_id:'Synthetic bike',bike_type:'Adventure',mount_condition:'Slipping'},sensors:[{type:1,label:'Accelerometer',maximum_range:20,reporting_mode:0},{type:4,label:'Gyroscope',maximum_range:10,reporting_mode:0},{type:10,label:'Linear acceleration',maximum_range:20,reporting_mode:0},{type:5,label:'Light',maximum_range:1000,reporting_mode:1},{type:11,label:'Orientation',maximum_range:1,reporting_mode:0}]}),
 'summary.json':JSON.stringify({ended_epoch_ms:Date.UTC(2026,10,4,1,30,20),ended_elapsed_ns:21e9,estimated_distance_m:200,gps_samples:21,motion_samples:16,end_reason:'user_stopped'}),
 'gps.csv':'fix_elapsed_ns,latitude_deg,longitude_deg,accuracy_m,speed_mps,speed_accuracy_mps,bearing_deg,altitude_m,accepted,mock,age_seconds\n'+Array.from({length:21},(_,i)=>`${1e9+i*1e9},12,${77+i*.0001},2,10,0.2,90,800,true,false,0`).join('\n'),
 'motion.csv':'sensor_elapsed_ns,type,x,y,z,accuracy\n'+[
  '3000000000,1,15,15,0,3','4000000000,1,19.9,0,0,0','5000000000,1,-20,0,0,-1',
  '6000000000,1,0,0,9.8,1','7000000000,1,0,0,9.8,2','8000000000,1,0,0,9.8,',
  '9000000000,1,0,0,9.8,__proto__','10000000000,1,0,0,9.8, ','13000000000,1,0,0,9.8,99',
  '13000000000,1,0,0,9.8,3','99000000000,1,0,0,9.8,3',
  '3000000000,4,0,0,1,3','4000000000,4,0,0,2,3',
  '3000000000,10,0,0,.2,3','3000000000,5,1100,,,3','3000000000,11,0,0,1,3'
 ].join('\n')
});
