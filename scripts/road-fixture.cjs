// Fictional road-shaped journey for screenshots and demo exports. Never loaded by the product.
exports.seed=async()=>{
 const junctions=[[-.78,.72],[-.78,.12],[-.52,.12],[-.52,-.15],[-.79,-.15],[-.79,-.52],[-.44,-.52],[-.44,-.86],[-.23,-.93],[.07,-.90],[.12,-.69],[.33,-.60],[.16,-.43],[.47,-.32],[.34,-.12],[.63,-.04],[.79,-.20],[.88,-.42],[.95,-.19],[.86,.09],[.94,.26],[.79,.49],[.78,.73],[.48,.86],[.27,.76],[.26,.49],[-.03,.49],[-.03,.23],[.25,.23],[.25,.02],[-.23,.02],[-.23,.72],[-.78,.72]];
 const path=[junctions[0]],lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 // Straight city blocks with small rounded junctions, then sweeping hill-road bends.
 for(let i=1;i<junctions.length-1;i++){
  const a=junctions[i-1],b=junctions[i],d=junctions[i+1],ab=Math.hypot(b[0]-a[0],b[1]-a[1]),bc=Math.hypot(d[0]-b[0],d[1]-b[1]),radius=Math.min(i>=7&&i<=24?.065:.025,ab*.18,bc*.18),entry=lerp(b,a,radius/ab),exit=lerp(b,d,radius/bc);
  path.push(entry);for(let j=1;j<=8;j++){const t=j/8;path.push(lerp(lerp(entry,b,t),lerp(b,exit,t),t));}
 }
 path.push(junctions.at(-1));const metersPerUnit=700,lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths.at(-1)+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1])*metersPerUnit);
 const distance=lengths.at(-1),duration=720,weights=[0];for(let i=1;i<=duration;i++){const stop=i>=220&&i<=242,approach=i<220?Math.min(1,(220-i)/15):Math.min(1,(i-242)/15);weights.push(weights.at(-1)+(stop?0:(.86+.18*Math.sin(i/54))*Math.max(0,approach)));}
 const local=[];let edge=1;for(let i=0;i<=duration;i++){const s=weights[i]/weights.at(-1)*distance;while(edge<path.length-1&&lengths[edge]<s)edge++;const a=path[edge-1],b=path[edge],t=(s-lengths[edge-1])/(lengths[edge]-lengths[edge-1]);local.push({p:lerp(a,b,t),s});}
 const track=local.map(({p,s},i)=>{const before=local[Math.max(0,i-1)],after=local[Math.min(duration,i+1)],dt=Math.min(duration,i+1)-Math.max(0,i-1),speed=(after.s-before.s)/dt*3.6,course=(Math.atan2(after.p[0]-before.p[0],before.p[1]-after.p[1])*180/Math.PI+360)%360;return [77.59+p[0]*metersPerUnit/(111320*Math.cos(12.97*Math.PI/180)),12.97-p[1]*metersPerUnit/111320,i,speed,3,640+160*Math.sin(Math.PI*s/distance)**2+24*Math.sin(s/430),course,0,.2];});
 const ride={id:'road-demo-synthetic',title:'Demo · the long way home',source:'Synthetic demo',kind:'ride',started:Date.UTC(2026,10,4,1,30),duration,track,signals:[],events:[],stats:[],warnings:[],distanceKm:distance/1000,distanceIntegrity:true,quality:100,finalized:true,bike_id:prefs.bike.name,bike_type:'Adventure',device:'Synthetic phone',placement:'Rigid mount',mount_condition:'Stable',notes:'Fictional continuous road journey for visual demonstration, not a real recording.'};
 await saveRide(ride);selected=ride.id;navigate('detail');
};
