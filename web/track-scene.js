/* Offline, lit 3D route diorama. No imagery service, map tiles or synthetic ride measurements. */
(function(root){
'use strict';
function sceneryFor(ride, preferred){
 if(['open','city','hills'].includes(preferred))return preferred;
 const label=[ride.title,ride.recurring].filter(Boolean).join(' ');
 if(/\b(ghat|ghats|hills|mountain|mountains)\b/i.test(label))return 'hills';
 if(/\b(commute|office|city)\b/i.test(label))return 'city';
 return 'open';
}
function create(container,ride,{onState=()=>{},onUnavailable=()=>{},autoRender=true,transparent=false,pixelRatio=Math.min(devicePixelRatio,2),scenery=sceneryFor(ride,typeof prefs==='undefined'?null:prefs.replayScenery)}={}){
 const T=root.THREE,model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'});if(!T||!model||!model.segments.length)throw Error('This recording needs a connected route to build its track preview.');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.max(.5,Math.min(pixelRatio,2)));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 renderer.domElement.setAttribute('aria-label','Interactive 3D route model. Drag to orbit; use camera buttons or arrow keys.');renderer.domElement.tabIndex=0;container.append(renderer.domElement);
 const scene=new T.Scene();scene.background=transparent?null:new T.Color('#101116');scene.fog=new T.Fog('#101116',950,2000);
 const camera=new T.PerspectiveCamera(36,1,.5,1800);let azimuth=-.68,polar=.98,radius=560,mode='orbit',elevation=false,disposed=false,frame=0,last=0,time=ride.track[0][2],target=new T.Vector3(0,0,0),followOffset=0;
 scene.add(new T.HemisphereLight('#d5e6ff','#18232a',1.5));
 const key=new T.DirectionalLight('#fff2db',3);key.position.set(-120,260,140);scene.add(key);
 const rim=new T.DirectionalLight('#8daaff',1.5);rim.position.set(150,100,-220);scene.add(rim);
 const warm=new T.PointLight('#ff784b',1200,500,2);warm.position.set(-180,65,120);scene.add(warm);
 const plane=new T.Mesh(new T.PlaneGeometry(6000,6000),new T.MeshStandardMaterial({color:'#101116',roughness:1}));plane.rotation.x=-Math.PI/2;plane.position.y=-7;plane.receiveShadow=true;plane.visible=!transparent;scene.add(plane);
 const stage=new T.Group();scene.add(stage);
 const baseW=Math.max(90,model.width+24),baseD=Math.max(90,model.depth+24);
 const roadGroup=new T.Group();stage.add(roadGroup);
 const roadTop=1,roadHalf=1.9;
 const roadMaterial=new T.MeshBasicMaterial({color:'#365d60',side:T.DoubleSide,depthTest:false});
 const lineMaterial=new T.LineBasicMaterial({color:'#9de7d7',depthTest:false});
 const bike=OdoBikeVisual.profile(ride,typeof prefs==='undefined'?{}:prefs.bike);
 const rider=OdoBikeVisual.build(T,bike);
 rider.scale.setScalar(2.5);rider.renderOrder=5;stage.add(rider);
 const spot=new T.Mesh(new T.RingGeometry(3.6,4.1,32),new T.MeshBasicMaterial({color:bike.color,transparent:true,opacity:.8,side:T.DoubleSide,depthTest:false}));
 spot.rotation.x=-Math.PI/2;spot.renderOrder=4;stage.add(spot);
 function height(p){return elevation?p.y:0;}
 const paths=[];
 for(const point of model.points){
  if(!paths.length||point.segment!==paths.at(-1)[0].segment)paths.push([]);
  paths.at(-1).push(point);
 }
 function rebuild(){
  for(const child of [...roadGroup.children]){child.geometry.dispose();roadGroup.remove(child);}
  for(const path of paths){
   const points=path.filter((p,i)=>!i||p.x!==path[i-1].x||p.z!==path[i-1].z);
   if(points.length<2)continue;
   const vertices=[],indices=[],center=[];
   points.forEach((p,i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
    const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1,y=height(p)+roadTop;
    center.push(p.x,y+.03,p.z);
    for(const offset of [-roadHalf,roadHalf])vertices.push(p.x-dz/d*offset,y,p.z+dx/d*offset);
    if(i){const j=i*2;indices.push(j-2,j-1,j,j-1,j+1,j);}
   });
   const road=new T.BufferGeometry();road.setAttribute('position',new T.Float32BufferAttribute(vertices,3));road.setIndex(indices);
   const ribbon=new T.Mesh(road,roadMaterial);ribbon.renderOrder=2;roadGroup.add(ribbon);
   const line=new T.BufferGeometry();line.setAttribute('position',new T.Float32BufferAttribute(center,3));
   const trace=new T.Line(line,lineMaterial);trace.renderOrder=3;roadGroup.add(trace);
  }
 }
 const backdrop=new T.Group();stage.add(backdrop);
 function setScenery(value){
  for(const item of [...backdrop.children]){item.geometry.dispose();item.material.dispose();backdrop.remove(item);}
  scenery=value;
  if(!['city','hills'].includes(scenery))return;
  const urban=scenery==='city';
  for(let i=0;i<36;i++){
   const x=((i*61)%317)-158,z=((i*109)%307)-153;
   if(model.points.some(p=>Math.hypot(p.x-x,p.z-z)<(urban?19:42)))continue;
   const h=urban?9+(i*7)%18:12+(i*11)%31;
   const shape=urban?new T.BoxGeometry(7+(i%4),h,7+(i%5)):new T.ConeGeometry(19+i%9,h,6);
   const material=new T.MeshStandardMaterial({color:urban?'#303d48':'#263b35',roughness:.95});
   const item=new T.Mesh(shape,material);item.position.set(x,h/2-5,z);item.renderOrder=1;backdrop.add(item);
  }
 }
 setScenery(scenery);rebuild();
 function headingAt(p){
  const i=p.index;
  for(let n=0;n<18;n++){
   const a=model.points[Math.max(0,i-n-1)],b=model.points[Math.min(model.points.length-1,i+n)];
   if(a.segment===p.segment&&b.segment===p.segment&&Math.hypot(b.x-a.x,b.z-a.z)>.02)return Math.atan2(b.x-a.x,b.z-a.z);
  }
  return rider.rotation.y;
 }
 function setTime(value){
  time=value;const p=OdoTrackModel.atTime(model,time);
  rider.position.set(p.x,height(p)+roadTop+.2,p.z);rider.rotation.y=headingAt(p);
  rider.visible=!p.gap;spot.visible=!p.gap;spot.position.set(p.x,height(p)+roadTop+.22,p.z);
  onState({time,speed:p.gap?null:p.speed,gap:p.gap,elevation});
 }
 // Fit the whole diorama to both viewport dimensions, including portrait phones.
 function fit(){
  const forward=new T.Vector3(Math.sin(polar)*Math.sin(azimuth),Math.cos(polar),Math.sin(polar)*Math.cos(azimuth));
  const right=new T.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth)),up=new T.Vector3().crossVectors(forward,right);
  const vf=Math.tan(camera.fov*Math.PI/360),hf=vf*camera.aspect;let distance=0;
  const maxY=(elevation?model.height:0)+roadTop+30;
  for(const x of [-baseW/2-3,baseW/2+3])for(const z of [-baseD/2-3,baseD/2+3])for(const y of [0,maxY]){
   const p=new T.Vector3(x,y,z).sub(target),depth=p.dot(forward);
   distance=Math.max(distance,depth+Math.abs(p.dot(right))/hf,depth+Math.abs(p.dot(up))/vf);
  }
  return distance*1.045;
 }
 function size(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(mode==='orbit')polar=camera.aspect>1.6?1.08:.98;if(mode==='orbit'||mode==='top')radius=fit();}
 function reset(){mode='orbit';azimuth=-.68;polar=camera.aspect>1.6?1.08:.98;target.set(0,0,0);radius=fit();}
 function preset(name){mode=name;if(name==='top'){polar=.03;azimuth=0;target.set(0,0,0);radius=fit();}else if(name==='orbit'){reset();}else if(name==='follow'||name==='cinematic'){mode='follow';polar=.95;radius=54;followOffset=0;target.copy(rider.position);azimuth=rider.rotation.y+Math.PI;}else if(name==='poster'){polar=camera.aspect<1?.62:camera.aspect<1.6?.86:1.04;azimuth=-.45;target.set(0,0,0);radius=fit();}}
 const observer=new ResizeObserver(size);observer.observe(container);size();
 function placeCamera(){camera.position.set(target.x+radius*Math.sin(polar)*Math.sin(azimuth),target.y+radius*Math.cos(polar),target.z+radius*Math.sin(polar)*Math.cos(azimuth));camera.lookAt(target);}
 function followCamera(){target.copy(rider.position);target.y+=2;azimuth=rider.rotation.y+Math.PI+followOffset;}
 function animate(now){
  if(disposed)return;
  frame=requestAnimationFrame(animate);
  if(document.hidden||!container.isConnected||now-last<30)return;
  last=now;if(mode==='follow')followCamera();
  placeCamera();renderer.render(scene,camera);
  const north=container.parentElement.querySelector('.track-north span');if(north)north.style.transform=`rotate(${Math.atan2(Math.sin(azimuth),Math.cos(polar)*Math.cos(azimuth))}rad)`;
 }
 const pointers=new Map();let pinch=0;
 const down=e=>{renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);}};
 const move=e=>{const prev=pointers.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev[0],dy=e.clientY-prev[1];pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch>0)radius=Math.max(26,Math.min(1100,radius*pinch/distance));pinch=distance;}else{if(mode==='follow')followOffset-=dx*.008;else{mode='manual';azimuth-=dx*.006;}polar=Math.max(.12,Math.min(1.35,polar+dy*.005));}};
 const up=e=>{pointers.delete(e.pointerId);};
 const wheel=e=>{e.preventDefault();radius=Math.max(26,Math.min(1100,radius*Math.exp(e.deltaY*.001)));};
 const keyboard=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','0'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const step=e.key==='ArrowLeft'?-.12:.12;if(mode==='follow')followOffset+=step;else azimuth+=step;}if(e.key==='ArrowUp')polar=Math.max(.12,polar-.08);if(e.key==='ArrowDown')polar=Math.min(1.35,polar+.08);if(e.key==='+')radius=Math.max(26,radius*.9);if(e.key==='-')radius=Math.min(1100,radius*1.1);if(e.key==='0')reset();}};
 const lost=e=>{e.preventDefault();if(!disposed)onUnavailable();};
 const canvas=renderer.domElement;canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',keyboard);canvas.style.touchAction='none';preset('follow');setTime(time);if(autoRender)frame=requestAnimationFrame(animate);
 function renderFrame(value){
  if(disposed)throw Error('The route renderer is closed.');
  setTime(value);if(mode!=='follow')preset('follow');followCamera();placeCamera();renderer.render(scene,camera);return canvas;
 }
 function snapshot(){
  placeCamera();renderer.render(scene,camera);
  const scale=Math.min(1,2160/canvas.width,3840/canvas.height);if(scale===1)return canvas.toDataURL('image/png');
  const output=document.createElement('canvas');output.width=Math.max(1,Math.round(canvas.width*scale));output.height=Math.max(1,Math.round(canvas.height*scale));output.getContext('2d').drawImage(canvas,0,0,output.width,output.height);return output.toDataURL('image/png');
 }
 return {setTime,preset,model,snapshot,renderFrame,setScenery,resize:size,setElevation(value){elevation=Boolean(value&&model.elevationAvailable);rebuild();if(mode==='orbit'||mode==='top')radius=fit();setTime(time);},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',keyboard);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const material of Array.isArray(o.material)?o.material:[o.material]){material.map?.dispose();material.dispose();}}});renderer.dispose();renderer.forceContextLoss();canvas.remove();}};
}
root.OdoTrackScene={create,sceneryFor};
})(window);
