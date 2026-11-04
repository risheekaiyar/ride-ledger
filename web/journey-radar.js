/* Racing-game inspired journey map. Every road stroke comes from the recorded GPS route. */
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
function create(host,ride,{pixelRatio=Math.min(root.devicePixelRatio||1,2),onState=()=>{},bikeProfile}={}){
 const model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'});if(!model?.segments.length)throw Error('This recording needs a connected route.');
 const profile=bikeProfile||OdoBikeProfile.forRide(ride,typeof prefs!=='undefined'?prefs.bike:{}),art=OdoBikeIllustration.create(profile),canvas=document.createElement('canvas'),c=canvas.getContext('2d');
 if(!c)throw Error('Canvas graphics are unavailable.');canvas.tabIndex=0;canvas.dataset.renderer='journey-radar';canvas.dataset.bikeFamily=profile.family;canvas.dataset.bikeColor=profile.color;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${profile.family} motorcycle on your recorded route. Drag horizontally or use arrow keys to rotate the map.`);canvas.style.touchAction='pan-y';host.append(canvas);
 let time=ride.track[0][2],yaw=0,view='radar',zoom=1,disposed=false,drag=null,played=new Path2D(),playedIndex=-1,width=0,height=0,marker=null;
 const extent=model.points.reduce((n,p)=>Math.max(n,Math.hypot(p.x,p.z)),1),route=new Path2D();model.points.forEach((p,i)=>{if(!i||p.segment!==model.points[i-1].segment)route.moveTo(p.x,p.z);else route.lineTo(p.x,p.z);});
 function completed(index){if(index<playedIndex){played=new Path2D();playedIndex=-1;}for(let i=playedIndex+1;i<=index;i++){const p=model.points[i];if(!i||p.segment!==model.points[i-1].segment)played.moveTo(p.x,p.z);else played.lineTo(p.x,p.z);}playedIndex=index;}
 function ellipse(x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 function text(value,x,y,size=10,color='#8ba8ae',align='center'){c.font=`500 ${size}px ui-monospace, SFMono-Regular, Consolas, monospace`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y);}
 function draw(){
  if(disposed)return canvas;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),dpr=Math.min(2,Math.max(.5,pixelRatio));if(width!==w||height!==h){width=w;height=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const tilt=view==='isometric'?.68:1,r=Math.max(10,Math.min(w/2-18,(h-18)/(2*tilt+0.08))),cx=w/2,cy=h/2-3,scale=r*.70/extent*zoom;
  const state=OdoTrackModel.atTime(model,time),p=project(state,yaw,tilt),screen=q=>{const s=project(q,yaw,tilt);return {x:cx+s.x*scale,y:cy+s.y*scale};};
  const fill=c.createRadialGradient(cx-r*.2,cy-r*.25,r*.1,cx,cy,r);fill.addColorStop(0,'#1c3039');fill.addColorStop(.7,'#111f28');fill.addColorStop(1,'#0b151e');
  c.save();c.shadowColor='#02080d';c.shadowBlur=20;c.shadowOffsetY=7;ellipse(cx,cy+4,r+2,r*tilt+2,'#090f17',null);c.restore();
  ellipse(cx,cy,r,r*tilt,fill,'#43545e',1);ellipse(cx,cy,r-5,(r-5)*tilt,null,'#263d48',1);
  c.save();c.beginPath();c.ellipse(cx,cy,r-7,(r-7)*tilt,0,0,TAU);c.clip();
  // Quiet range rings and grid are a display aid, not invented surrounding roads.
  c.save();c.translate(cx,cy);c.scale(1,tilt);for(const part of [.35,.68])ellipse(0,0,r*part,r*part,null,'#2a45502b',1);c.strokeStyle='#44627316';c.lineWidth=.8;for(let v=-r;v<=r;v+=r/4){c.beginPath();c.moveTo(-r,v);c.lineTo(r,v);c.moveTo(v,-r);c.lineTo(v,r);c.stroke();}c.restore();
  c.save();c.translate(cx,cy);c.scale(scale,scale*tilt);c.rotate(yaw);c.lineCap='round';c.lineJoin='round';
  // A dark casing separates the actual route from the display surface. The centerline is never smoothed.
  c.strokeStyle='#050d14';c.lineWidth=8/scale;c.stroke(route);c.strokeStyle='#b3c4ca';c.lineWidth=3.2/scale;c.stroke(route);
  const index=state.gap?state.index:model.points[state.index].time<=time?state.index:state.index-1;completed(Math.max(-1,index));
  function progressStroke(color,line,glow=0){c.strokeStyle=color;c.lineWidth=line/scale;c.shadowColor='#3be0ef';c.shadowBlur=glow;c.stroke(played);if(!state.gap&&state.index>playedIndex&&playedIndex>=0&&model.points[playedIndex].segment===state.segment){c.beginPath();c.moveTo(model.points[playedIndex].x,model.points[playedIndex].z);c.lineTo(state.x,state.z);c.stroke();}c.shadowBlur=0;}
  progressStroke('#3dd9eb40',9,13);progressStroke('#47e1ef',4);progressStroke('#ccfbfc',.8);c.restore();
  const start=screen(model.points[0]),end=screen(model.points.at(-1));ellipse(start.x,start.y,4,4,'#d9ebed','#172d36',2);ellipse(end.x,end.y,5.5,5.5,'#0c1720','#f0e4c8',1.8);c.fillStyle='#f0e4c8';c.fillRect(end.x-2,end.y-2,2,2);c.fillRect(end.x,end.y,2,2);
  marker=null;let bikeOverlay=null;
  if(!state.gap){
   const x=cx+p.x*scale,y=cy+p.y*scale,direction=heading(model,time),vector=direction?project(direction,yaw,tilt):null;
   marker={x,y,index:state.index,time,family:profile.family,color:profile.color};
   c.save();c.shadowColor='#55eaf6';c.shadowBlur=13;ellipse(x,y,8,8,'#172f3b','#8eeff3',1.5);c.restore();
   if(vector){const a=Math.atan2(vector.y,vector.x);c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(19,0);c.lineTo(9,-4);c.lineTo(10,4);c.closePath();c.fillStyle='#defbfd';c.fill();c.restore();}
   // Upright three-quarter artwork remains recognizable as the map rotates. The arrow carries path direction.
   const size=Math.min(108,Math.max(76,w*.155)),flip=vector&&vector.x>.05?-1:1;bikeOverlay={x,y,size,flip};
  }
  c.restore();
  for(let i=0;i<72;i++){const a=i*TAU/72-Math.PI/2,len=i%6===0?6:2.5;c.beginPath();c.moveTo(cx+Math.cos(a)*(r-10),cy+Math.sin(a)*(r-10)*tilt);c.lineTo(cx+Math.cos(a)*(r-10-len),cy+Math.sin(a)*(r-10-len)*tilt);c.strokeStyle=i%6===0?'#7b9ca27d':'#587b8740';c.lineWidth=1;c.stroke();}
  for(const [label,x,z] of [['N',0,-1],['E',1,0],['S',0,1],['W',-1,0]]){const q=project({x:x*(r-25),z:z*(r-25)},yaw,tilt);const tx=cx+q.x,ty=cy+q.y;c.fillStyle='#111e27e0';c.fillRect(tx-8,ty-9,16,18);text(label,tx,ty,11,label==='N'?'#d9eeec':'#7c9da6');}
  c.save();c.globalAlpha=.75;text('GPS',cx,cy+r*tilt-42,8,'#7495a0');c.restore();
  // Keep the illustration above the rim so a northbound bike is never cut in half.
  if(bikeOverlay){const {x,y,size,flip}=bikeOverlay;c.save();c.translate(x,y-4);c.scale(flip,1);c.shadowColor='#020a11bb';c.shadowBlur=6;c.shadowOffsetY=3;c.drawImage(art,-size/2,-size*.70,size,size*560/720);c.restore();}
  if(state.gap){c.fillStyle='#0b1621ee';c.fillRect(cx-65,cy-15,130,30);text('RECORDING GAP',cx,cy,10,'#e5c69c');}
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
