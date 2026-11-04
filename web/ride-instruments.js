/* Canvas instruments share the same source values in the interactive recap and exported film. */
(function(root){
'use strict';
const colors=['#59636b','#89949d','#3bd8e6','#9beaf0','#f5f7f8','#ff8993','#ff4655'];
function create(host,data){
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');host.append(canvas);const ctx=canvas.getContext('2d');let disposed=false;
 const ride=data.ride,project=OdoRouteGeometry.project(ride.track||[],{width:208,height:210,padding:14,includePath:false}),model=ride.track?.length>1?OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'}):null;
 const mapLayer=document.createElement('canvas');mapLayer.width=416;mapLayer.height=420;const mapCtx=mapLayer.getContext('2d');mapCtx.scale(2,2);mapCtx.strokeStyle='#59636b';mapCtx.lineWidth=2.5;mapCtx.lineJoin='round';mapCtx.beginPath();const points=ride.track||[],gapLimit=ride.source==='GPX export'?30:3;project.points.forEach(([x,y],i)=>{if(!i||points[i][7]!==points[i-1][7]||points[i][2]-points[i-1][2]>gapLimit)mapCtx.moveTo(x,y);else mapCtx.lineTo(x,y);});mapCtx.stroke();
 function text(value,x,y,size=16,color='#dce2e7',align='center',weight='400'){size=Math.max(15,size);ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${weight} ${size}px ${size<16?'monospace':'sans-serif'}`;ctx.fillText(value,x,y);}
 const arc=(x,y,r,a,b,color,width)=>{ctx.beginPath();ctx.arc(x,y,r,a,b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='butt';ctx.stroke();};
 function pace(progress,reveal){
  const cx=360,cy=246,r=173,start=Math.PI*.75,span=Math.PI*1.5,scale=Math.max(120,Math.ceil((data.facts.peak||0)/20)*20),speed=model?OdoTrackModel.atTime(model,progress*ride.duration).speed:null;
  arc(cx,cy,r,start,start+span,'#343a41',17);for(let i=0;i<7;i++){const lo=data.telemetry.bands[i],hi=Math.min(scale,data.telemetry.bands[i+1]);if(lo>=scale)continue;arc(cx,cy,r,start+lo/scale*span+.01,start+hi/scale*span-.01,colors[i],10);}
  for(let v=0;v<=scale;v+=5){const a=start+v/scale*span,major=v%20===0;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(r-18),cy+Math.sin(a)*(r-18));ctx.lineTo(cx+Math.cos(a)*(r-(major?31:25)),cy+Math.sin(a)*(r-(major?31:25)));ctx.strokeStyle=major?'#f5f7f8':'#89949d';ctx.lineWidth=major?2:1;ctx.stroke();if(major)text(String(v),cx+Math.cos(a)*(r-49),cy+Math.sin(a)*(r-49)+5,15,'#dce2e7');}
  if(speed!==null){const a=start+Math.min(scale,speed)/scale*span;ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.shadowBlur=14;ctx.shadowColor='#dce2e7';ctx.beginPath();ctx.moveTo(-18,-5);ctx.lineTo(r-36,0);ctx.lineTo(-18,5);ctx.closePath();ctx.fillStyle='#f5f7f8';ctx.fill();ctx.restore();}
  ctx.beginPath();ctx.arc(cx,cy,13,0,Math.PI*2);ctx.fillStyle='#f5f7f8';ctx.fill();ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fillStyle='#24282d';ctx.fill();
  text(speed===null?'—':Math.round(speed),cx,cy+58,49,'#f5f7f8','center','500');text('km/h · replay',cx,cy+80,13,'#b0bac2');
  const values=data.telemetry.seconds,observed=data.telemetry.observed;for(let i=0;i<7;i++){const x=74+i*95;ctx.fillStyle=colors[i];ctx.fillRect(x-18,400,36,3);text((observed?data.bandPercentages[i]:0)+'%',x,433,21,'#f5f7f8','center','600');text(i===6?'100+':data.telemetry.bands[i]+'–'+data.telemetry.bands[i+1],x,456,12,'#b0bac2');}
  text('SHARE OF OBSERVED TIME / km/h',360,486,11,'#89949d');
 }
 function miniMap(time){
  const x=480,y=111;ctx.save();ctx.translate(x,y);ctx.drawImage(mapLayer,0,0,208,210);const track=ride.track||[];
  if(model){const p=OdoTrackModel.atTime(model,time);if(!p.gap){const index=Math.max(0,p.index),b=track[index],a=track[Math.max(0,index-1)],t=b[2]>a[2]?Math.max(0,Math.min(1,(time-a[2])/(b[2]-a[2]))):0,pa=project.points[Math.max(0,index-1)],pb=project.points[index],px=pa[0]+(pb[0]-pa[0])*t,py=pa[1]+(pb[1]-pa[1])*t;ctx.beginPath();ctx.arc(px,py,6,0,Math.PI*2);ctx.fillStyle='#ff8993';ctx.fill();ctx.strokeStyle='#f5f7f8';ctx.lineWidth=2;ctx.stroke();}}
  ctx.restore();text('YOUR GPS TRAIL',584,94,11,'#b0bac2');
 }
 function gforce(progress){
  const time=progress*ride.duration,d=data.dynamics,s=OdoRideDynamics.atTime(d,time),cx=234,cy=237,r=151,scale=d.scale;
  for(let i=1;i<=3;i++){arc(cx,cy,r*i/3,0,Math.PI*2,'#59636b',1);text((scale*i/3).toFixed(2)+'g',cx+8,cy-r*i/3+16,10,'#89949d','left');}
  ctx.setLineDash([3,6]);ctx.strokeStyle='#59636b';ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.lineTo(cx+r,cy);ctx.moveTo(cx,cy-r);ctx.lineTo(cx,cy+r);ctx.stroke();ctx.setLineDash([]);
  text('ACCEL',cx,cy-r-20,13,'#9beaf0');text('BRAKE',cx,cy+r+27,13,'#ff8993');text('L',cx-r-24,cy+5,14,'#9beaf0');text('R',cx+r+24,cy+5,14,'#9beaf0');
  const trail=OdoRideDynamics.recent(d,time);let last=null;for(const p of trail){const px=cx+(p.lateral||0)/scale*r,py=cy-p.forward/scale*r;if(p.lateral!==null&&last&&last.lateral!==null&&p.start<=last.end+.001){ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(px,py);ctx.lineWidth=2.5;ctx.strokeStyle=`rgba(59,216,230,${.12+(1-(time-p.end)/5)*.55})`;ctx.stroke();}last={x:px,y:py,end:p.end,lateral:p.lateral};}
  if(s){const x=cx+(s.lateral||0)/scale*r,y=cy-s.forward/scale*r;ctx.shadowBlur=20;ctx.shadowColor=s.forward<0?'#ff4655':'#3bd8e6';ctx.fillStyle=s.forward<0?'#ff8993':'#9beaf0';ctx.beginPath();if(s.lateral===null){ctx.moveTo(cx-22,y);ctx.lineTo(cx+22,y);ctx.shadowBlur=0;ctx.strokeStyle='#ff8993';ctx.lineWidth=4;ctx.stroke();}else{ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#f5f7f8';ctx.lineWidth=2;ctx.stroke();}}else text('SIGNAL GAP',cx,cy+5,13,'#89949d');
  miniMap(time);text(s?Math.abs(s.forward).toFixed(2)+' g':'—',581,350,30,'#f5f7f8','center','500');text(s&&s.forward<0?'BRAKING ESTIMATE':'ACCELERATION ESTIMATE',581,373,10,'#b0bac2');text(s?.lateral!==null&&s?Math.abs(s.lateral).toFixed(2)+' g':'—',581,415,27,'#dce2e7');text(!s||s.lateral===null?'LATERAL UNAVAILABLE':s&&s.lateral<0?'LEFT / GPS ESTIMATE':'RIGHT / GPS ESTIMATE',581,438,10,'#b0bac2');text('GPS-DERIVED · NOT BIKE IMU',234,457,11,'#89949d');
 }
 function quality(){text('A clearer recording starts here.',360,205,31,'#f5f7f8');text('GPS observations cover '+Math.round(data.telemetry.coverage*100)+'% of this trip.',360,250,19,'#b0bac2');text('Check location permission and phone placement before the next ride.',360,295,15,'#89949d');}
 return {draw(kind,progress,reveal=1){if(disposed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),dpr=Math.min(devicePixelRatio,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const s=Math.min(w/720,h/500);ctx.translate((w-720*s)/2,(h-500*s)/2);ctx.scale(s,s);if(kind==='pace')pace(progress,reveal);else if(kind==='gforce')gforce(progress);else quality();return canvas;},dispose(){disposed=true;canvas.remove();}};
}
root.OdoRideInstruments={create,colors};
})(globalThis);
