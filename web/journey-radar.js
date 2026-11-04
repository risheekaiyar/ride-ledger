/* Road-map story playback. Source fixes stay intact; missing positions have display-only connectors. */
(function(root){
'use strict';
const TAU=Math.PI*2;
function project(point,yaw=0,tilt=1){return {x:point.x*Math.cos(yaw)-point.z*Math.sin(yaw),y:(point.x*Math.sin(yaw)+point.z*Math.cos(yaw))*tilt};}
function heading(model,time){
 const at=root.OdoTrackModel||(typeof require==='function'?require('./track-model.js'):null),p=at.atTime(model,time);if(p.gap)return null;
 // The arrow describes the direction of the recorded path, never measured lean or bike attitude.
 for(let step=0;step<20;step++){const i=Math.min(model.points.length-1,p.index+step),b=model.points[i],a=model.points[Math.max(0,i-1)];if(b.segment!==p.segment)break;if(a.segment!==p.segment)continue;if(Math.hypot(b.x-a.x,b.z-a.z)>.005)return {x:b.x-a.x,z:b.z-a.z};}
 for(let i=p.index;i>Math.max(0,p.index-20);i--){const b=model.points[i],a=model.points[i-1];if(a.segment!==p.segment||b.segment!==p.segment)break;if(Math.hypot(b.x-a.x,b.z-a.z)>.005)return {x:b.x-a.x,z:b.z-a.z};}return null;
}
function create(host,ride,{pixelRatio=Math.min(root.devicePixelRatio||1,2),onState=()=>{}}={}){
 const model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'});if(!model?.segments.length)throw Error('This recording needs a connected route.');
 const canvas=document.createElement('canvas'),c=canvas.getContext('2d');
 if(!c)throw Error('Canvas graphics are unavailable.');canvas.tabIndex=0;canvas.dataset.renderer='journey-radar';canvas.dataset.marker='arrow';canvas.dataset.mapStyle='road';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Raised GPS silhouette with a directional racing arrow. Drag horizontally or use arrow keys to rotate the map.');canvas.style.touchAction='pan-y';host.append(canvas);
 let time=ride.track[0][2],yaw=0,view='isometric',zoom=1,disposed=false,drag=null,played=new Path2D(),playedIndex=-1,width=0,height=0,marker=null,reliefKey='',reliefWall=null,fitKey='',fitBounds={rx:1,ry:1};
 const route=new Path2D();model.points.forEach((p,i)=>{if(!i)route.moveTo(p.x,p.z);else route.lineTo(p.x,p.z);});
 function completed(index){if(index<playedIndex){played=new Path2D();playedIndex=-1;}for(let i=playedIndex+1;i<=index;i++){const p=model.points[i];if(!i)played.moveTo(p.x,p.z);else played.lineTo(p.x,p.z);}playedIndex=index;}
 function ellipse(x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 function text(value,x,y,size=10,color='#b0bac2',align='center'){c.font=`500 ${size}px ui-monospace, SFMono-Regular, Consolas, monospace`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y);}
 function draw(){
  if(disposed)return canvas;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),dpr=Math.min(2,Math.max(.5,pixelRatio));if(width!==w||height!==h){width=w;height=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const tilt=view==='isometric'?.82:1,cx=w/2,cy=h/2-2;
  const fit=yaw+':'+tilt;if(fit!==fitKey){let rx=1,ry=1;for(const point of model.points){const p=project(point,yaw,tilt);rx=Math.max(rx,Math.abs(p.x));ry=Math.max(ry,Math.abs(p.y));}fitBounds={rx,ry};fitKey=fit;}const scale=Math.min(Math.max(1,w-70)/(fitBounds.rx*2),Math.max(1,h-66)/(fitBounds.ry*2))*zoom;
  const state=OdoRoutePresentation.atTime(model,time),p=project(state,yaw,tilt),screen=q=>{const s=project(q,yaw,tilt);return {x:cx+s.x*scale,y:cy+s.y*scale};};
  // Full-width map composition; the road is the focal point, without a radar bezel.
  const fill=c.createRadialGradient(cx,cy,20,cx,cy,Math.max(w,h)*.65);fill.addColorStop(0,'#1b2024');fill.addColorStop(1,'#0b0d10');c.fillStyle=fill;c.fillRect(0,0,w,h);
  c.save();c.beginPath();c.rect(8,8,w-16,h-16);c.clip();
  c.strokeStyle='#ffffff05';c.lineWidth=.5;for(let v=24;v<w;v+=52){c.beginPath();c.moveTo(v,0);c.lineTo(v,h);c.stroke();}for(let v=24;v<h;v+=52){c.beginPath();c.moveTo(0,v);c.lineTo(w,v);c.stroke();}
  const relief=view==='isometric'?6:2,key=[w,h,yaw,view,zoom].join('/');
  if(key!==reliefKey){reliefWall=new Path2D();reliefKey=key;model.points.forEach((q,i)=>{if(!i)return;const a=screen(model.points[i-1]),b=screen(q);reliefWall.moveTo(a.x,a.y);reliefWall.lineTo(b.x,b.y);reliefWall.lineTo(b.x,b.y+relief);reliefWall.lineTo(a.x,a.y+relief);reliefWall.closePath();});}
  c.save();c.translate(cx,cy+relief);c.scale(scale,scale*tilt);c.rotate(yaw);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#08090b99';c.lineWidth=7/scale;c.shadowColor='#08090b';c.shadowBlur=7;c.stroke(route);c.restore();
  const wallShade=c.createLinearGradient(0,0,0,h);wallShade.addColorStop(0,'#b0bac2');wallShade.addColorStop(.5,'#59636b');wallShade.addColorStop(1,'#24282d');c.fillStyle=wallShade;c.fill(reliefWall);
  c.save();c.translate(cx,cy);c.scale(scale,scale*tilt);c.rotate(yaw);c.lineCap='round';c.lineJoin='round';
  c.strokeStyle='#08090b';c.lineWidth=7/scale;c.stroke(route);c.strokeStyle='#f5f7f8';c.lineWidth=3.5/scale;c.stroke(route);
  const index=model.points[state.index].time<=time?state.index:state.index-1;completed(Math.max(-1,index));
  function progressStroke(color,line,glow=0){c.strokeStyle=color;c.lineWidth=line/scale;c.shadowColor='#3bd8e6';c.shadowBlur=glow;c.stroke(played);if((!state.gap||state.interpolated)&&state.index>playedIndex&&playedIndex>=0){c.beginPath();c.moveTo(model.points[playedIndex].x,model.points[playedIndex].z);c.lineTo(state.x,state.z);c.stroke();}c.shadowBlur=0;}
  progressStroke('#3bd8e625',7,7);progressStroke('#3bd8e6',3.5);progressStroke('#9beaf0',.8);c.restore();
  const start=screen(model.points[0]),end=screen(model.points.at(-1));ellipse(start.x,start.y,4,4,'#f5f7f8','#24282d',2);ellipse(end.x,end.y,5.5,5.5,'#191c20','#dce2e7',1.8);c.fillStyle='#dce2e7';c.fillRect(end.x-2,end.y-2,2,2);c.fillRect(end.x,end.y,2,2);
  marker=null;
  function arrow(x,y,angle,opacity=1,size=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.globalAlpha=opacity;c.shadowColor='#3bd8e6';c.shadowBlur=opacity===1?16:0;c.beginPath();c.moveTo(17,0);c.lineTo(-12,-11);c.lineTo(-6,0);c.lineTo(-12,11);c.closePath();c.fillStyle='#f5f7f8';c.fill();c.shadowBlur=0;c.strokeStyle=opacity===1?'#3bd8e6':'#b0bac2';c.lineWidth=1.5;c.stroke();c.beginPath();c.moveTo(17,0);c.lineTo(-6,0);c.lineTo(-12,11);c.closePath();c.fillStyle='#b0bac2';c.fill();c.restore();}
  if(!state.gap||state.interpolated){
   const x=cx+p.x*scale,y=cy+p.y*scale,direction=OdoRoutePresentation.direction(model,state),vector=direction?project(direction,yaw,tilt):null,angle=vector?Math.atan2(vector.y,vector.x):null;
   marker={x,y,index:state.index,time,type:'arrow',heading:angle,interpolated:state.interpolated};
   // Ghost arrows use prior connected GPS positions, never invented extrapolated movement.
   if(angle!==null){let last={x,y};for(let i=1;i<=4;i++){const t=time-i*Math.max(.6,ride.duration*.006),q=OdoTrackModel.atTime(model,t),d=heading(model,t);if(q.gap||q.segment!==state.segment||!d)break;const old=screen(q);if(Math.hypot(old.x-last.x,old.y-last.y)<12)continue;const v=project(d,yaw,tilt);arrow(old.x,old.y,Math.atan2(v.y,v.x),.4-i*.06,.55);last=old;}arrow(x,y,angle);}
   else ellipse(x,y,7,7,'#f5f7f8','#3bd8e6',2);
  }
  c.restore();
  // Compact north marker replaces the circular instrument rim.
  const north=project({x:0,z:-1},yaw,1);c.save();c.translate(w-26,28);c.rotate(Math.atan2(north.y,north.x)+Math.PI/2);c.beginPath();c.moveTo(0,-9);c.lineTo(-4,4);c.lineTo(0,1);c.lineTo(4,4);c.closePath();c.fillStyle='#f5f7f8';c.fill();c.restore();text('N',w-26,47,8);
  const metersPerPixel=1/(scale*model.scale),target=60*metersPerPixel,power=10**Math.floor(Math.log10(target)),meters=[1,2,5,10].map(v=>v*power).find(v=>v>=target),bar=meters/metersPerPixel;
  c.strokeStyle='#89949d';c.lineWidth=1;c.beginPath();c.moveTo(20,h-24);c.lineTo(20+bar,h-24);c.stroke();text(meters>=1000?(meters/1000)+' km':Math.round(meters)+' m',20,h-12,8,'#89949d','left');
  return canvas;
 }
 function setTime(value){time=value;const state=OdoTrackModel.atTime(model,time);onState({time,speed:state.gap?null:state.speed,gap:state.gap});return state;}
 const down=e=>{drag=e.clientX;canvas.setPointerCapture(e.pointerId);},move=e=>{if(drag===null)return;yaw+=(e.clientX-drag)*.012;drag=e.clientX;draw();},up=()=>drag=null;
 const key=e=>{if(['ArrowLeft','ArrowRight','0','+','-'].includes(e.key)){e.preventDefault();if(e.key==='0'){yaw=0;zoom=1;}else if(e.key==='+')zoom=Math.min(2.5,zoom*1.1);else if(e.key==='-')zoom=Math.max(.75,zoom/1.1);else yaw+=e.key==='ArrowLeft'?-.12:.12;draw();}};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('keydown',key);
 const observer=new ResizeObserver(draw);observer.observe(host);draw();
 return {model,renderFrame(value){setTime(value);return draw();},draw,setTime,resize:draw,snapshot:()=>{draw();return canvas.toDataURL('image/png');},preset(name){view=name==='isometric'?'isometric':'radar';zoom=1;draw();},rotate(degrees){yaw=degrees*Math.PI/180;draw();},reset(){yaw=0;zoom=1;draw();},cameraState:()=>({yaw,view,zoom}),markerState:()=>marker&&({...marker}),dispose(){if(disposed)return;disposed=true;observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('keydown',key);canvas.remove();}};
}
const api={create,project,heading};root.OdoJourneyRadar=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
