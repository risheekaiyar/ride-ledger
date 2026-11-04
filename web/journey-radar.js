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
function create(host,ride,{pixelRatio=Math.min(root.devicePixelRatio||1,2),onState=()=>{}}={}){
 const model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'});if(!model?.segments.length)throw Error('This recording needs a connected route.');
 const canvas=document.createElement('canvas'),c=canvas.getContext('2d');
 if(!c)throw Error('Canvas graphics are unavailable.');canvas.tabIndex=0;canvas.dataset.renderer='journey-radar';canvas.dataset.marker='arrow';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Raised GPS silhouette with a directional racing arrow. Drag horizontally or use arrow keys to rotate the map.');canvas.style.touchAction='pan-y';host.append(canvas);
 let time=ride.track[0][2],yaw=0,view='isometric',zoom=1,disposed=false,drag=null,played=new Path2D(),playedIndex=-1,width=0,height=0,marker=null,reliefKey='',reliefWall=null;
 const extent=model.points.reduce((n,p)=>Math.max(n,Math.hypot(p.x,p.z)),1),route=new Path2D();model.points.forEach((p,i)=>{if(!i||p.segment!==model.points[i-1].segment)route.moveTo(p.x,p.z);else route.lineTo(p.x,p.z);});
 function completed(index){if(index<playedIndex){played=new Path2D();playedIndex=-1;}for(let i=playedIndex+1;i<=index;i++){const p=model.points[i];if(!i||p.segment!==model.points[i-1].segment)played.moveTo(p.x,p.z);else played.lineTo(p.x,p.z);}playedIndex=index;}
 function ellipse(x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 function text(value,x,y,size=10,color='#b0bac2',align='center'){c.font=`500 ${size}px ui-monospace, SFMono-Regular, Consolas, monospace`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y);}
 function draw(){
  if(disposed)return canvas;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),dpr=Math.min(2,Math.max(.5,pixelRatio));if(width!==w||height!==h){width=w;height=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const tilt=view==='isometric'?.68:1,r=Math.max(10,Math.min(w/2-18,(h-18)/(2*tilt+0.08))),cx=w/2,cy=h/2-3,scale=r*.70/extent*zoom;
  const state=OdoTrackModel.atTime(model,time),p=project(state,yaw,tilt),screen=q=>{const s=project(q,yaw,tilt);return {x:cx+s.x*scale,y:cy+s.y*scale};};
  const fill=c.createRadialGradient(cx-r*.2,cy-r*.25,r*.1,cx,cy,r);fill.addColorStop(0,'#24282d');fill.addColorStop(.7,'#191c20');fill.addColorStop(1,'#111316');
  c.save();c.shadowColor='#08090b';c.shadowBlur=20;c.shadowOffsetY=7;ellipse(cx,cy+4,r+2,r*tilt+2,'#111316',null);c.restore();
  ellipse(cx,cy,r,r*tilt,fill,'#59636b',1);ellipse(cx,cy,r-5,(r-5)*tilt,null,'#343a41',1);
  c.save();c.beginPath();c.ellipse(cx,cy,r-7,(r-7)*tilt,0,0,TAU);c.clip();
  // Quiet range rings and grid are a display aid, not invented surrounding roads.
  c.save();c.translate(cx,cy);c.scale(1,tilt);for(const part of [.35,.68])ellipse(0,0,r*part,r*part,null,'#343a412b',1);c.strokeStyle='#59636b16';c.lineWidth=.8;for(let v=-r;v<=r;v+=r/4){c.beginPath();c.moveTo(-r,v);c.lineTo(r,v);c.moveTo(v,-r);c.lineTo(v,r);c.stroke();}c.restore();
  c.save();c.translate(cx,cy);c.scale(scale,scale*tilt);c.rotate(yaw);c.lineCap='round';c.lineJoin='round';
  // Project the same path at two heights: shaded vertical walls under a white top edge.
  // Only display depth is added. Horizontal GPS coordinates and recording gaps are unchanged.
  c.restore();
  const relief=view==='isometric'?18:9,key=[w,h,yaw,view,zoom].join('/');
  if(key!==reliefKey){reliefWall=new Path2D();reliefKey=key;model.points.forEach((q,i)=>{if(!i||q.segment!==model.points[i-1].segment)return;const a=screen(model.points[i-1]),b=screen(q);reliefWall.moveTo(a.x,a.y);reliefWall.lineTo(b.x,b.y);reliefWall.lineTo(b.x,b.y+relief);reliefWall.lineTo(a.x,a.y+relief);reliefWall.closePath();});}
  c.save();c.translate(cx,cy+relief);c.scale(scale,scale*tilt);c.rotate(yaw);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#08090b99';c.lineWidth=9/scale;c.shadowColor='#08090b';c.shadowBlur=10;c.stroke(route);c.restore();
  const wallShade=c.createLinearGradient(0,cy-r,0,cy+r);wallShade.addColorStop(0,'#b0bac2');wallShade.addColorStop(.5,'#59636b');wallShade.addColorStop(1,'#24282d');c.fillStyle=wallShade;c.fill(reliefWall);
  c.save();c.translate(cx,cy);c.scale(scale,scale*tilt);c.rotate(yaw);c.lineCap='round';c.lineJoin='round';
  c.strokeStyle='#191c20';c.lineWidth=7/scale;c.stroke(route);c.strokeStyle='#f5f7f8';c.lineWidth=4.4/scale;c.stroke(route);
  const index=state.gap?state.index:model.points[state.index].time<=time?state.index:state.index-1;completed(Math.max(-1,index));
  function progressStroke(color,line,glow=0){c.strokeStyle=color;c.lineWidth=line/scale;c.shadowColor='#3bd8e6';c.shadowBlur=glow;c.stroke(played);if(!state.gap&&state.index>playedIndex&&playedIndex>=0&&model.points[playedIndex].segment===state.segment){c.beginPath();c.moveTo(model.points[playedIndex].x,model.points[playedIndex].z);c.lineTo(state.x,state.z);c.stroke();}c.shadowBlur=0;}
  progressStroke('#3bd8e640',9,13);progressStroke('#3bd8e6',4);progressStroke('#9beaf0',.8);c.restore();
  const start=screen(model.points[0]),end=screen(model.points.at(-1));ellipse(start.x,start.y,4,4,'#f5f7f8','#24282d',2);ellipse(end.x,end.y,5.5,5.5,'#191c20','#dce2e7',1.8);c.fillStyle='#dce2e7';c.fillRect(end.x-2,end.y-2,2,2);c.fillRect(end.x,end.y,2,2);
  marker=null;
  function arrow(x,y,angle,opacity=1,size=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.globalAlpha=opacity;c.shadowColor='#3bd8e6';c.shadowBlur=opacity===1?16:0;c.beginPath();c.moveTo(17,0);c.lineTo(-12,-11);c.lineTo(-6,0);c.lineTo(-12,11);c.closePath();c.fillStyle='#f5f7f8';c.fill();c.shadowBlur=0;c.strokeStyle=opacity===1?'#3bd8e6':'#b0bac2';c.lineWidth=1.5;c.stroke();c.beginPath();c.moveTo(17,0);c.lineTo(-6,0);c.lineTo(-12,11);c.closePath();c.fillStyle='#b0bac2';c.fill();c.restore();}
  if(!state.gap){
   const x=cx+p.x*scale,y=cy+p.y*scale,direction=heading(model,time),vector=direction?project(direction,yaw,tilt):null,angle=vector?Math.atan2(vector.y,vector.x):null;
   marker={x,y,index:state.index,time,type:'arrow',heading:angle};
   // Ghost arrows use prior connected GPS positions, never invented extrapolated movement.
   if(angle!==null){let last={x,y};for(let i=1;i<=4;i++){const t=time-i*Math.max(.6,ride.duration*.006),q=OdoTrackModel.atTime(model,t),d=heading(model,t);if(q.gap||q.segment!==state.segment||!d)break;const old=screen(q);if(Math.hypot(old.x-last.x,old.y-last.y)<12)continue;const v=project(d,yaw,tilt);arrow(old.x,old.y,Math.atan2(v.y,v.x),.4-i*.06,.55);last=old;}arrow(x,y,angle);}
   else ellipse(x,y,7,7,'#f5f7f8','#3bd8e6',2);
  }
  c.restore();
  for(let i=0;i<72;i++){const a=i*TAU/72-Math.PI/2,len=i%6===0?6:2.5;c.beginPath();c.moveTo(cx+Math.cos(a)*(r-10),cy+Math.sin(a)*(r-10)*tilt);c.lineTo(cx+Math.cos(a)*(r-10-len),cy+Math.sin(a)*(r-10-len)*tilt);c.strokeStyle=i%6===0?'#89949d7d':'#89949d40';c.lineWidth=1;c.stroke();}
  for(const [label,x,z] of [['N',0,-1],['E',1,0],['S',0,1],['W',-1,0]]){const q=project({x:x*(r-25),z:z*(r-25)},yaw,tilt);const tx=cx+q.x,ty=cy+q.y;c.fillStyle='#191c20e0';c.fillRect(tx-8,ty-9,16,18);text(label,tx,ty,11,label==='N'?'#f5f7f8':'#89949d');}
  c.save();c.globalAlpha=.75;text('GPS',cx,cy+r*tilt-42,8,'#89949d');c.restore();
  if(state.gap){c.fillStyle='#191c20ee';c.fillRect(cx-65,cy-15,130,30);text('RECORDING GAP',cx,cy,10,'#ff8993');}
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
