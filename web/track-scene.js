/* Offline, lit 3D route diorama. No imagery service, map tiles or synthetic ride measurements. */
(function(root){
'use strict';
function create(container,ride,{onState=()=>{},onUnavailable=()=>{}}={}){
 const T=root.THREE,model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3,speedMode:ride.source==='GPX export'?'interval':'samples'});if(!T||!model||!model.segments.length)throw Error('This recording needs a connected route to build its track preview.');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 renderer.domElement.setAttribute('aria-label','Interactive 3D route model. Drag to orbit; use camera buttons or arrow keys.');renderer.domElement.tabIndex=0;container.append(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#0b1018');scene.fog=new T.Fog('#0b1018',950,2000);
 const camera=new T.PerspectiveCamera(36,1,.5,1800);let azimuth=-.68,polar=.74,radius=560,mode='orbit',elevation=false,disposed=false,frame=0,last=0,time=ride.track[0][2],target=new T.Vector3(0,0,0),dragging=false;
 scene.add(new T.HemisphereLight('#d5e6ff','#18232a',1.5));
 const key=new T.DirectionalLight('#fff2db',3);key.position.set(-120,260,140);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-250,right:250,top:250,bottom:-250,near:1,far:700});key.shadow.bias=-.0004;key.shadow.normalBias=.3;scene.add(key);
 const rim=new T.DirectionalLight('#8daaff',1.5);rim.position.set(150,100,-220);scene.add(rim);
 const warm=new T.PointLight('#ff784b',1200,500,2);warm.position.set(-180,65,120);scene.add(warm);
 const plane=new T.Mesh(new T.PlaneGeometry(6000,6000),new T.MeshStandardMaterial({color:'#0b1018',roughness:1}));plane.rotation.x=-Math.PI/2;plane.position.y=-7;plane.receiveShadow=true;scene.add(plane);
 const stage=new T.Group();scene.add(stage);
 function roundedRect(w,h,r){const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
 const baseW=Math.max(90,model.width+40),baseD=Math.max(90,model.depth+40);
 const base=new T.Mesh(new T.ExtrudeGeometry(roundedRect(baseW,baseD,14),{depth:7,bevelEnabled:true,bevelSize:2,bevelThickness:2,bevelSegments:3,steps:1}),new T.MeshStandardMaterial({color:'#16232c',roughness:.85,metalness:.12}));base.rotation.x=-Math.PI/2;base.position.y=-7;base.receiveShadow=true;base.castShadow=true;stage.add(base);
 const gridPositions=[];
 for(let x=-baseW/2+14;x<baseW/2-10;x+=14)gridPositions.push(x,2.1,-baseD/2+12,x,2.1,baseD/2-12);
 for(let z=-baseD/2+14;z<baseD/2-10;z+=14)gridPositions.push(-baseW/2+12,2.1,z,baseW/2-12,2.1,z);
 const gridGeometry=new T.BufferGeometry();gridGeometry.setAttribute('position',new T.Float32BufferAttribute(gridPositions,3));
 stage.add(new T.LineSegments(gridGeometry,new T.LineBasicMaterial({color:'#71909c',transparent:true,opacity:.065})));
 const roadGroup=new T.Group();stage.add(roadGroup);
 const asphalt=new T.MeshStandardMaterial({color:'#131a1d',roughness:.96,metalness:.08,side:T.DoubleSide});
 const wallMat=new T.MeshStandardMaterial({color:'#1b222e',roughness:.8,side:T.DoubleSide});
 const white=new T.MeshStandardMaterial({color:'#f2eadb',roughness:.8,side:T.DoubleSide});const red=new T.MeshStandardMaterial({color:'#f45437',roughness:.75,side:T.DoubleSide});
 const edgeMaterial=new T.MeshStandardMaterial({color:'#c9dddc',emissive:'#527b82',emissiveIntensity:.18,roughness:.7,side:T.DoubleSide});
 const makeMesh=(geometry,material,parent=roadGroup)=>{const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 function surface(points,left,right,raise,material,batch){const positions=[],uv=[],indices=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz)||1,nx=-dz/n,nz=dx/n;for(const offset of [left,right]){positions.push(p.x+nx*offset,p.y+raise,p.z+nz*offset);uv.push(i/(points.length-1),offset===left?0:1);}if(i){const k=i*2;indices.push(k-2,k-1,k,k-1,k+1,k);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();if(batch){batch.push(g);return;}return makeMesh(g,material);}
 function sides(points,offset){const positions=[],indices=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],n=Math.hypot(b.x-a.x,b.z-a.z)||1,x=p.x-(b.z-a.z)/n*offset,z=p.z+(b.x-a.x)/n*offset;positions.push(x,p.y+11,z,x,p.y+2,z);if(i){const k=i*2;indices.push(k-2,k,k-1,k-1,k,k+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();makeMesh(g,wallMat);}
 function clearRoad(){while(roadGroup.children.length){const child=roadGroup.children[0];child.traverse(o=>{o.geometry?.dispose();if(o.userData.ownMaterial){o.material?.map?.dispose();o.material?.dispose();}});roadGroup.remove(child);}}
 function height(p){return elevation?p.y:0;}
 function marker(point,label,color){const group=new T.Group();group.position.set(point.x,height(point)+12,point.z);const post=new T.Mesh(new T.CylinderGeometry(.38,.38,17,8),new T.MeshStandardMaterial({color:'#b8c8d4',metalness:.6,roughness:.3}));post.position.y=8;post.position.x=10;post.userData.ownMaterial=true;group.add(post);const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#151c29';ctx.fillRect(0,0,256,80);ctx.fillStyle=color;ctx.fillRect(0,0,7,80);ctx.fillStyle='#f7f0e3';ctx.font=label.length>9?'600 20px monospace':'600 26px monospace';ctx.fillText(label,24,48);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(28,8.75,1);sprite.position.set(10,20,0);sprite.userData.ownMaterial=true;group.add(sprite);roadGroup.add(group);}
 // Batch alternating kerbs into two draw calls, including long routes.
 function mergeSurfaces(parts,material){if(!parts.length)return;const positions=[],normals=[];for(const g of parts){const flat=g.toNonIndexed();positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);flat.dispose();g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));makeMesh(g,material);}
 function rebuild(){clearRoad();const redKerbs=[],whiteKerbs=[];
 for(const segment of model.segments){
  const input=segment.points.filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.z-a[i-1].z)>.025);if(input.length<2)continue;
  const curve=new T.CatmullRomCurve3(input.map(p=>new T.Vector3(p.x,height(p),p.z)),false,'centripetal');
  const count=Math.min(2000,Math.max(24,Math.ceil(curve.getLength()/1.4))),pts=curve.getSpacedPoints(count);
  surface(pts,-6.4,6.4,11,asphalt);sides(pts,-6.4);sides(pts,6.4);
  surface(pts,-6.2,-5.9,11.06,white);surface(pts,5.9,6.2,11.06,white);
  for(let i=0;i<pts.length-1;i+=3){const chunk=pts.slice(i,Math.min(i+4,pts.length)),batch=Math.floor(i/3)%2?redKerbs:whiteKerbs;surface(chunk,-8,-6.5,11.14,null,batch);surface(chunk,6.5,8,11.14,null,batch);}
  surface(pts,-6.6,-6.45,4,edgeMaterial);surface(pts,6.45,6.6,4,edgeMaterial);
 }
 mergeSurfaces(redKerbs,red);mergeSurfaces(whiteKerbs,white);
 const first=model.points[0],finish=model.points.at(-1);if(Math.hypot(finish.x-first.x,finish.z-first.z)<12)marker(finish,'START / FINISH','#ff7858');else{marker(first,'START','#7cdbb8');marker(finish,'FINISH','#ff7858');}
 const neighbor=model.points.at(-2),angle=Math.atan2(finish.x-neighbor.x,finish.z-neighbor.z);const flag=new T.Group();flag.position.set(finish.x,height(finish)+11.18,finish.z);flag.rotation.y=angle;for(let x=0;x<8;x++)for(let z=0;z<3;z++){const tile=new T.Mesh(new T.PlaneGeometry(1.25,1.25),((x+z)%2)?wallMat:white);tile.rotation.x=-Math.PI/2;tile.position.set((x-3.5)*1.25,0,(z-1)*1.25);flag.add(tile);}roadGroup.add(flag);
 }
 rebuild();
 // Stylized rider token. Its lean is not computed or shown as a motorcycle measurement.
 const rider=new T.Group();const body=new T.Mesh(new T.BoxGeometry(1.7,1.3,3.6),new T.MeshStandardMaterial({color:'#ff7852',roughness:.35,metalness:.2}));body.position.y=1.2;rider.add(body);const helmet=new T.Mesh(new T.SphereGeometry(.8,16,12),white);helmet.position.set(0,2.4,-.3);rider.add(helmet);for(const z of [-1.45,1.45]){const wheel=new T.Mesh(new T.CylinderGeometry(.65,.65,.5,12),wallMat);wheel.rotation.z=Math.PI/2;wheel.position.set(0,.55,z);rider.add(wheel);}stage.add(rider);
 const spot=new T.Mesh(new T.RingGeometry(3.6,4.1,48),new T.MeshBasicMaterial({color:'#ffb28f',transparent:true,opacity:.8,side:T.DoubleSide}));spot.rotation.x=-Math.PI/2;stage.add(spot);
 function setTime(value){time=value;const p=OdoTrackModel.atTime(model,time),next=OdoTrackModel.atTime(model,Math.min(model.points.at(-1).time,time+1));rider.position.set(p.x,height(p)+11.2,p.z);rider.visible=!p.gap;spot.visible=!p.gap;spot.position.set(p.x,height(p)+11.22,p.z);if(Math.hypot(next.x-p.x,next.z-p.z)>.001)rider.rotation.y=Math.atan2(next.x-p.x,next.z-p.z);onState({time,speed:p.gap?null:p.speed,gap:p.gap,elevation});}
 // Fit the whole diorama to both viewport dimensions, including portrait phones.
 function fit(){
  const forward=new T.Vector3(Math.sin(polar)*Math.sin(azimuth),Math.cos(polar),Math.sin(polar)*Math.cos(azimuth));
  const right=new T.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth)),up=new T.Vector3().crossVectors(forward,right);
  const vf=Math.tan(camera.fov*Math.PI/360),hf=vf*camera.aspect;let distance=0;
  const maxY=elevation?model.height+30:30;
  for(const x of [-baseW/2-3,baseW/2+3])for(const z of [-baseD/2-3,baseD/2+3])for(const y of [0,maxY]){
   const p=new T.Vector3(x,y,z).sub(target),depth=p.dot(forward);
   distance=Math.max(distance,depth+Math.abs(p.dot(right))/hf,depth+Math.abs(p.dot(up))/vf);
  }
  return distance*1.045;
 }
 function size(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(mode==='orbit'||mode==='top')radius=fit();}
 function reset(){mode='orbit';azimuth=-.68;polar=.74;target.set(0,0,0);radius=fit();}
 function preset(name){mode=name;if(name==='top'){polar=.03;azimuth=0;target.set(0,0,0);radius=fit();}else if(name==='orbit'){reset();}else if(name==='follow'){polar=.96;radius=85;}}
 const observer=new ResizeObserver(size);observer.observe(container);size();
 function animate(now){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||!container.isConnected||now-last<30)return;const dt=Math.min(.1,(now-last)/1000);last=now;if(mode==='follow'){target.lerp(new T.Vector3(rider.position.x,rider.position.y,rider.position.z),.09);azimuth+=Math.atan2(Math.sin(rider.rotation.y+Math.PI-azimuth),Math.cos(rider.rotation.y+Math.PI-azimuth))*.045;}else if(mode==='cinematic'&&!dragging&&!matchMedia('(prefers-reduced-motion: reduce)').matches){azimuth+=dt*.075;target.lerp(new T.Vector3(0,0,0),.05);radius+=(fit()-radius)*.03;polar+=(.95-polar)*.03;}
 camera.position.set(target.x+radius*Math.sin(polar)*Math.sin(azimuth),target.y+radius*Math.cos(polar),target.z+radius*Math.sin(polar)*Math.cos(azimuth));camera.lookAt(target);renderer.render(scene,camera);const north=container.parentElement.querySelector('.track-north span');if(north)north.style.transform=`rotate(${-azimuth}rad)`;}
 const pointers=new Map();let pinch=0;
 const down=e=>{renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);dragging=true;if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);}};
 const move=e=>{const prev=pointers.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev[0],dy=e.clientY-prev[1];pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch>0)radius=Math.max(65,Math.min(1100,radius*pinch/distance));pinch=distance;}else{mode='manual';azimuth-=dx*.006;polar=Math.max(.12,Math.min(1.35,polar+dy*.005));}};
 const up=e=>{pointers.delete(e.pointerId);dragging=pointers.size>0;};
 const wheel=e=>{e.preventDefault();radius=Math.max(65,Math.min(1100,radius*Math.exp(e.deltaY*.001)));};
 const keyboard=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','0'].includes(e.key)){e.preventDefault();mode='manual';if(e.key==='ArrowLeft')azimuth-=.12;if(e.key==='ArrowRight')azimuth+=.12;if(e.key==='ArrowUp')polar=Math.max(.12,polar-.08);if(e.key==='ArrowDown')polar=Math.min(1.35,polar+.08);if(e.key==='+')radius=Math.max(65,radius*.9);if(e.key==='-')radius=Math.min(1100,radius*1.1);if(e.key==='0')reset();}};
 const lost=e=>{e.preventDefault();if(!disposed)onUnavailable();};
 const canvas=renderer.domElement;canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',keyboard);canvas.style.touchAction='none';reset();setTime(time);frame=requestAnimationFrame(animate);
 return {setTime,preset,model,snapshot:()=>{renderer.render(scene,camera);return canvas.toDataURL('image/png');},setElevation(value){elevation=Boolean(value&&model.elevationAvailable);rebuild();if(mode==='orbit'||mode==='top')radius=fit();setTime(time);},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',keyboard);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const material of Array.isArray(o.material)?o.material:[o.material]){material.map?.dispose();material.dispose();}}});renderer.dispose();renderer.forceContextLoss();canvas.remove();}};
}
root.OdoTrackScene={create};
})(window);
