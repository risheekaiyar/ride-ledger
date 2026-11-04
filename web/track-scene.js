/* A real, lit 3D road diorama. All views and story exports share this renderer. */
(function(root){
'use strict';
function create(container,ride,{onState=()=>{},onUnavailable=()=>{},autoRender=true,transparent=false,continuous=false,pixelRatio=Math.min(devicePixelRatio,2),backdrop='minimal'}={}){
 const T=root.THREE,model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'});
 if(!T||!model||!model.points.length||(!continuous&&!model.segments.length))throw Error('This recording needs a connected route.');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(2,Math.max(.5,pixelRatio)));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const canvas=renderer.domElement;canvas.dataset.renderer='webgl-route';canvas.dataset.marker='arrow';canvas.tabIndex=0;canvas.setAttribute('aria-label','3D GPS road diorama. Drag horizontally or use arrow keys for full 360 degree rotation.');canvas.style.touchAction='pan-y';container.append(canvas);
 const scene=new T.Scene();if(!transparent)scene.background=new T.Color('#111316');
 scene.add(new T.HemisphereLight('#ffffff','#26323d',2.1));
 const sun=new T.DirectionalLight('#ffffff',3.2);sun.position.set(-160,280,80);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-270,right:270,top:270,bottom:-270,near:1,far:1000});sun.shadow.bias=-.0003;sun.shadow.normalBias=.2;sun.shadow.radius=3;scene.add(sun);
 const fill=new T.DirectionalLight('#9beaf0',.65);fill.position.set(120,90,-150);scene.add(fill);
 const camera=new T.OrthographicCamera(-200,200,200,-200,.1,2000),isoPolar=Math.acos(1/Math.sqrt(3)),initialYaw=-.62;
 let yaw=initialYaw,polar=isoPolar,zoom=1,elevation=false,disposed=false,frame=0,time=model.points[0].time,drag=null,marker=null;
 const route=new T.Group(),environment=new T.Group(),flags=new T.Group();scene.add(environment,route,flags);
 const roadMaterial=new T.MeshStandardMaterial({color:'#f5f7f8',roughness:.78,side:T.DoubleSide});
 const wallMaterial=new T.MeshStandardMaterial({color:'#657482',roughness:.9,side:T.DoubleSide});
 const progressTime={value:time},progressMaterial=new T.MeshBasicMaterial({color:'#3bd8e6',side:T.DoubleSide,toneMapped:false});
 progressMaterial.onBeforeCompile=shader=>{
  shader.uniforms.replayTime=progressTime;
  shader.vertexShader='attribute float sampleTime; varying float routeTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrouteTime = sampleTime;');
  shader.fragmentShader='uniform float replayTime; varying float routeTime;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (routeTime > replayTime) discard;');
 };
 const groups=[];for(const p of model.points){if(!groups.length||(!continuous&&groups.at(-1)[0].segment!==p.segment))groups.push([]);groups.at(-1).push(p);}
 const top=18,half=3.6,baseWidth=Math.max(model.width,48)+52,baseDepth=Math.max(model.depth,48)+52,height=p=>elevation?p.y:0;
 function geometry(values,indices,times){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));if(indices)g.setIndex(indices);if(times)g.setAttribute('sampleTime',new T.Float32BufferAttribute(times,1));g.computeVertexNormals();return g;}
 function addMesh(g,material,group=scene){const m=new T.Mesh(g,material);group.add(m);return m;}
 function rebuild(){
  for(const child of [...route.children]){child.geometry.dispose();route.remove(child);}
  for(const points of groups){if(points.length<2)continue;
   const road=OdoRouteMesh.build(points,{half,top,elevation});
   const surface=addMesh(geometry(road.surface,road.indices),roadMaterial,route);surface.receiveShadow=true;surface.castShadow=true;
   const sides=addMesh(geometry(road.walls),wallMaterial,route);sides.castShadow=true;sides.receiveShadow=true;
   const progress=OdoRouteMesh.build(points,{half:half*.64,top:top+.08,elevation});
   addMesh(geometry(progress.surface,progress.indices,progress.times),progressMaterial,route);
  }
  renderer.shadowMap.needsUpdate=true;
 }
 // A beveled charcoal plinth and real receiving shadows give the route physical depth.
 const shape=new T.Shape(),w=baseWidth/2,d=baseDepth/2,r=10;
 shape.moveTo(-w+r,-d);shape.lineTo(w-r,-d);shape.quadraticCurveTo(w,-d,w,-d+r);shape.lineTo(w,d-r);shape.quadraticCurveTo(w,d,w-r,d);shape.lineTo(-w+r,d);shape.quadraticCurveTo(-w,d,-w,d-r);shape.lineTo(-w,-d+r);shape.quadraticCurveTo(-w,-d,-w+r,-d);
 const baseGeometry=new T.ExtrudeGeometry(shape,{depth:5,bevelEnabled:true,bevelSize:1.5,bevelThickness:1.1,bevelSegments:3,steps:1,curveSegments:10});baseGeometry.rotateX(-Math.PI/2);baseGeometry.translate(0,-6.1,0);
 const base=addMesh(baseGeometry,new T.MeshStandardMaterial({color:'#171d25',roughness:.9}));base.castShadow=true;base.receiveShadow=true;
 const grid=[];for(let x=Math.ceil((-w+10)/20)*20;x<w-10;x+=20)grid.push(x,.04,-d+10,x,.04,d-10);for(let z=Math.ceil((-d+10)/20)*20;z<d-10;z+=20)grid.push(-w+10,.04,z,w-10,.04,z);
 const gridLines=new T.LineSegments(geometry(grid),new T.LineBasicMaterial({color:'#7c8b9e',transparent:true,opacity:.09}));scene.add(gridLines);
 const ground=addMesh(new T.PlaneGeometry(baseWidth+130,baseDepth+130),new T.ShadowMaterial({opacity:.28}));ground.rotation.x=-Math.PI/2;ground.position.y=-8;ground.receiveShadow=true;
 rebuild();
 // Faceted racing arrow, raised above the road and pointing along its true GPS heading.
 const arrowGeometry=geometry([0,2.5,10,-6,2.5,-6,0,2.5,-2,6,2.5,-6,0,0,10,-6,0,-6,0,0,-2,6,0,-6],[0,1,2,0,2,3,0,4,1,1,4,5,1,5,2,2,5,6,2,6,3,3,6,7,3,7,0,0,7,4]);
 const arrow=addMesh(arrowGeometry,new T.MeshStandardMaterial({color:'#ffffff',roughness:.35,emissive:'#9beaf0',emissiveIntensity:.15,side:T.DoubleSide}));arrow.scale.setScalar(1.6);
 const arrowEdge=new T.LineLoop(new T.BufferGeometry().setFromPoints([new T.Vector3(0,2.6,10),new T.Vector3(-6,2.6,-6),new T.Vector3(0,2.6,-2),new T.Vector3(6,2.6,-6)]),new T.LineBasicMaterial({color:'#3bd8e6',toneMapped:false}));arrow.add(arrowEdge);
 const halo=addMesh(new T.RingGeometry(10.5,11.3,48),new T.MeshBasicMaterial({color:'#3bd8e6',side:T.DoubleSide,transparent:true,opacity:.4,toneMapped:false}));halo.rotation.x=-Math.PI/2;
 function label(text){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#10151c';ctx.fillRect(0,0,512,128);ctx.fillStyle='#3bd8e6';ctx.fillRect(0,0,8,128);ctx.fillStyle='#f5f7f8';ctx.font='600 44px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,260,65);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(32,8,1);return sprite;}
 const first=model.points[0],last=model.points.at(-1),closed=Math.hypot(first.x-last.x,first.z-last.z)<8;
 const endpoints=closed?[{p:first,text:'START / FINISH'}]:[{p:first,text:'START'},{p:last,text:'FINISH'}];
 for(const {p,text}of endpoints){const group=new T.Group();group.position.set(p.x,top,p.z);group.userData.point=p;
  const pole=addMesh(new T.CylinderGeometry(.35,.35,16,8),new T.MeshStandardMaterial({color:'#cbd4db'}),group);pole.position.y=8;
  const tag=label(text);tag.position.set(15,17,0);group.add(tag);
  const pin=addMesh(new T.CylinderGeometry(2.1,2.1,.6,24),new T.MeshBasicMaterial({color:text==='FINISH'?'#f5f7f8':'#3bd8e6',toneMapped:false}),group);pin.position.y=.4;flags.add(group);
 }
 function clearEnvironment(){for(const obj of [...environment.children]){obj.geometry?.dispose();obj.material?.dispose();environment.remove(obj);}}
 function setBackdrop(kind){clearEnvironment();backdrop=['minimal','city','hills'].includes(kind)?kind:'minimal';if(backdrop==='minimal')return;const rx=baseWidth/2-10,rz=baseDepth/2-10;for(let i=0;i<20;i++){const a=i*Math.PI*2/20,x=Math.cos(a)*rx,z=Math.sin(a)*rz,h=backdrop==='city'?4+(i*7%9):8+(i*11%12),g=backdrop==='city'?new T.BoxGeometry(7,h,7):new T.ConeGeometry(10,h,9),m=addMesh(g,new T.MeshStandardMaterial({color:'#42505f',transparent:true,opacity:.22,depthWrite:false,roughness:1}),environment);m.position.set(x,h/2,z);}}
 setBackdrop(backdrop);
 function setTime(value){
  time=value;progressTime.value=Number.isFinite(time)?time:model.points[0].time;
  const p=continuous?OdoRoutePresentation.atTime(model,time):OdoTrackModel.atTime(model,time),direction=OdoRoutePresentation.direction(model,p);
  arrow.position.set(p.x,height(p)+top+1,p.z);arrow.visible=halo.visible=!p.gap||!!p.interpolated;halo.position.set(p.x,height(p)+top+.2,p.z);
  if(direction)arrow.rotation.y=Math.atan2(direction.x,direction.z);
  marker={type:'arrow',x:p.x,y:height(p)+top+1,z:p.z,heading:arrow.rotation.y,visible:arrow.visible,interpolated:!!p.interpolated};
  onState({time,speed:p.gap?null:p.speed,gap:p.gap,elevation});return p;
 }
 function place(){
  const aspect=Math.max(.2,container.clientWidth/Math.max(1,container.clientHeight)),up=new T.Vector3(-Math.cos(polar)*Math.sin(yaw),Math.sin(polar),-Math.cos(polar)*Math.cos(yaw)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  let maxX=0,maxY=0;const high=(elevation?model.height:0)+top+24,center=(high-8)/2;
  for(const x of [-baseWidth/2-10,baseWidth/2+10])for(const z of [-baseDepth/2-10,baseDepth/2+10])for(const y of [-8,high]){const point=new T.Vector3(x,y-center,z);maxX=Math.max(maxX,Math.abs(point.dot(right)));maxY=Math.max(maxY,Math.abs(point.dot(up)));}
  const size=Math.max(maxY,maxX/aspect,45)*1.04/zoom;camera.left=-size*aspect;camera.right=size*aspect;camera.top=size;camera.bottom=-size;camera.updateProjectionMatrix();camera.position.set(600*Math.sin(polar)*Math.sin(yaw),center+600*Math.cos(polar),600*Math.sin(polar)*Math.cos(yaw));camera.lookAt(0,center,0);
 }
 function resize(){if(disposed)return;const w=container.clientWidth,h=container.clientHeight;if(w&&h)renderer.setSize(w,h,false);place();}
 function draw(){if(disposed)return;place();renderer.render(scene,camera);return canvas;}
 function renderFrame(value){setTime(value);return draw();}
 function animate(){if(disposed)return;frame=requestAnimationFrame(animate);if(!document.hidden&&container.isConnected)draw();}
 function preset(name){polar=['top','radar'].includes(name)?.001:isoPolar;if(['orbit','poster','isometric'].includes(name))yaw=initialYaw;zoom=1;draw();}
 function reset(){yaw=initialYaw;zoom=1;draw();}
 const down=e=>{drag=e.clientX;canvas.setPointerCapture(e.pointerId);},move=e=>{if(drag===null)return;yaw-=(e.clientX-drag)*.009;drag=e.clientX;draw();},up=()=>drag=null,wheel=e=>{e.preventDefault();zoom=Math.max(.7,Math.min(2.4,zoom*Math.exp(-e.deltaY*.001)));draw();},key=e=>{if(['ArrowLeft','ArrowRight','+','-','0'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='+')zoom=Math.min(2.4,zoom*1.1);if(e.key==='-')zoom=Math.max(.7,zoom/1.1);if(e.key==='0')reset();draw();}},lost=e=>{e.preventDefault();if(!disposed)onUnavailable();};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',lost);
 const observer=new ResizeObserver(()=>{resize();draw();});observer.observe(container);resize();setTime(time);draw();if(autoRender)frame=requestAnimationFrame(animate);
 return {model,setTime,preset,reset,renderFrame,resize,draw,setBackdrop,markerState:()=>({...marker}),rotate(degrees){yaw=degrees*Math.PI/180;draw();},cameraState:()=>({yaw,polar,zoom}),snapshot(){draw();return canvas.toDataURL('image/png');},setElevation(value){elevation=!!(value&&model.elevationAvailable);rebuild();for(const flag of flags.children)flag.position.y=top+height(flag.userData.point);setTime(time);draw();},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material].flat())if(m)materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}};
}
root.OdoTrackScene={create};
})(globalThis);
