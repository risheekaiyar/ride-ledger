(function(root){
'use strict';
function fromPoints(points,name='Imported GPX'){
 if(points.length<2||points.length>50000)throw Error('A timed GPX track with 2–50,000 points is required. Route-only GPX files are not recorded rides.');
 for(let i=0;i<points.length;i++){const p=points[i];if(!Number.isFinite(p.lon)||Math.abs(p.lon)>180||!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.time)||(i&&p.time<=points[i-1].time))throw Error('GPX requires valid coordinates and strictly increasing timestamps.');}
 const start=points[0].time,duration=(points.at(-1).time-start)/1000;if(duration<=0||duration>86400)throw Error('GPX ride must be shorter than 24 hours.');
 // A namespace-separated content ID prevents GPX imports overwriting native rides with the same start time.
 let hash=14695981039346656037n;for(const p of points)for(const c of `${p.lon},${p.lat},${p.time},${p.segment};`){hash=BigInt.asUintN(64,(hash^BigInt(c.charCodeAt(0)))*1099511628211n);}
 const id='9'+hash.toString().padStart(20,'0');
 let meters=0,segment=0;const track=points.map((p,i)=>{let speed=null;if(i){const a=points[i-1],dt=(p.time-a.time)/1000,rad=Math.PI/180,dlat=(p.lat-a.lat)*rad,dlon=(p.lon-a.lon)*rad,d=12742000*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(p.lat*rad)*Math.sin(dlon/2)**2)));if(a.segment!==p.segment||dt>30||d/dt>70)segment++;else{meters+=d;speed=d/dt*3.6;}}const alt=p.altitude==null||p.altitude===''?null:Number(p.altitude);return [p.lon,p.lat,(p.time-start)/1000,speed,null,Number.isFinite(alt)?alt:null,null,segment,null];});
 return {schema:1,algorithm:'odo-gpx-1',id,title:name.replace(/\.gpx$/i,''),kind:'unclassified',source:'GPX export',recurring:'',placement:'Unknown',started:start,duration,distanceKm:meters/1000,distanceReliable:false,averageSpeed:null,maxSpeed:null,quality:null,medianAccuracy:null,gpsRows:points.length,motionRows:0,accepted:0,duplicates:0,screenOffSeconds:null,screenObservedSeconds:null,movingSeconds:0,stoppedSeconds:0,observedSeconds:0,speedIntegratedKm:0,track,signals:[],events:[],stats:[],warnings:['Imported GPX: source accuracy, filtering and phone placement are unknown. Distance is a partial geometric estimate; gaps are excluded.','No motorcycle lean, ABS, tyre pressure or raw sensor measurements were imported.'],notes:'',finalized:true,altitudeDatum:'GPX source datum unknown',maxAltitude:null,lean:null};
}
root.OdoPortable={fromPoints};if(typeof module!=='undefined')module.exports={fromPoints};
})(typeof globalThis!=='undefined'?globalThis:this);
