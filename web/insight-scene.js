/* Sculpted telemetry: real proportions, bounded geometry, a single explicit render loop. */
(function(root){
'use strict';
function create3D(host,data,{onUnavailable=()=>{},onSeek=()=>{}}={}){
 const T=root.THREE,renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const canvas=renderer.domElement,output=document.createElement('canvas'),ink=output.getContext('2d');output.setAttribute('role','img');host.append(output);const lost=e=>{e.preventDefault();onUnavailable();};canvas.addEventListener('webglcontextlost',lost);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,2000),group=new T.Group();scene.add(group);
 scene.add(new T.HemisphereLight(0xffffff,0x08090b,1.5));const key=new T.DirectionalLight(0xffffff,4);key.position.set(-70,140,70);scene.add(key);const rim=new T.PointLight(0xffffff,18000);rim.position.set(90,40,-40);scene.add(rim);
 const palette=['#89949d','#89949d','#3bd8e6','#9beaf0','#f5f7f8','#f5f7f8','#ff4655'];
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.3,metalness:.35,...extra});
 let mode='',objects=[],resources=[],disposed=false,cursor=null,elevationScale=null,angle=0,lastProgress=0,lastReveal=1,range=null,rangeMesh=null;
 const remember=obj=>{group.add(obj);resources.push(obj);return obj;};
 function clear(){for(const obj of resources){group.remove(obj);obj.traverse(n=>{n.geometry?.dispose();for(const m of [n.material].flat()){m?.map?.dispose();m?.dispose();}});}resources=[];objects=[];}
 function label(text,x,y,z,{color='#dce2e7',width=32}={}){const c=document.createElement('canvas');c.width=Math.max(128,text.length*44);c.height=96;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.font='500 64px monospace';ctx.fillText(text,c.width/2,72);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.position.set(x,y,z);sprite.scale.set(width,width*96/c.width,1);remember(sprite);}
 function box(w,h,d,x,y,z,color){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);if(y<0){mesh.material.roughness=.9;mesh.material.metalness=.05;}remember(mesh);return mesh;}
 function setup(next){
  if(mode===next)return;clear();mode=next;cursor=null;rangeMesh=null;group.rotation.set(0,0,0);
  if(mode==='pace'){
   const max=Math.max(...data.telemetry.seconds,1);box(218,3,59,0,-4,0,'#24282d');
   for(let i=0;i<7;i++){const seconds=data.telemetry.seconds[i],height=seconds/max*87,x=(i-3)*28;const mesh=box(19,Math.max(.2,height),28,x,height/2,0,seconds===0?'#343a41':i===data.band?'#f5f7f8':palette[i]);objects.push({mesh,height,delay:i*.055});label(i===6?'100+':`${data.telemetry.bands[i]}–${data.telemetry.bands[i+1]}`,x,-3,26,{width:(i===6?4:String(data.telemetry.bands[i]).length+String(data.telemetry.bands[i+1]).length+1)*4.7});if(seconds>0)label(Math.round(seconds/data.telemetry.observed*100)+'%',x,height+9,0,{width:24,color:i===data.band?'#f5f7f8':'#3bd8e6'});}
   label('SPEED / km/h',0,-4,45,{width:60});
  }else if(mode==='rhythm'){
   const values=[data.facts.moving,data.facts.low,data.facts.missing],colors=['#9beaf0','#ff4655','#343a41'];let angle=.22;
   for(let i=0;i<values.length;i++){const span=data.facts.elapsed>0?values[i]/data.facts.elapsed*Math.PI*2:0;if(span<=0)continue;const arc=span>Math.PI*2-.0001?span:Math.max(.001,span-Math.min(.025,span*.06));const mesh=new T.Mesh(new T.TorusGeometry(59,12,16,Math.max(4,Math.ceil(arc*30)),arc),material(colors[i]));if(arc<Math.PI*2-.0001)for(const [a,direction] of [[0,-1],[arc,1]]){const cap=new T.Mesh(new T.CircleGeometry(12,16),material(colors[i]));cap.position.set(59*Math.cos(a),59*Math.sin(a),0);cap.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(-Math.sin(a)*direction,Math.cos(a)*direction,0));mesh.add(cap);}mesh.rotation.set(-Math.PI/2,0,angle);mesh.position.y=i===0?8:3;remember(mesh);objects.push({mesh,delay:i*.12,ring:true});angle+=span;}
   const base=new T.Mesh(new T.CylinderGeometry(80,83,4,96),material('#24282d'));base.position.y=-12;remember(base);
   const inner=new T.Mesh(new T.CylinderGeometry(29,29,2,64),material('#343a41'));inner.position.y=-3;remember(inner);label(data.facts.elapsed>0?Math.round(data.facts.observed/data.facts.elapsed*100)+'%':'—',0,27,0,{width:48,color:'#f5f7f8'});label('OBSERVED',0,-1,0,{width:32});
  }else if(mode==='flow'){
   box(228,3,60,0,-4,0,'#24282d');const max=Math.max(1,data.facts.peak,...data.speedBins.map(b=>Math.max(b.slowingSpeed||0,b.picking_upSpeed||0)));let points=[];
   const finish=()=>{if(points.length>1){const path=new T.CurvePath();for(let i=1;i<points.length;i++)path.add(new T.LineCurve3(points[i-1],points[i]));remember(new T.Mesh(new T.TubeGeometry(path,points.length*3,1.2,7,false),material('#dce2e7',{emissive:'#59636b',emissiveIntensity:.4})));}points=[];};
   data.speedBins.forEach((b,i)=>{const x=(i/95-.5)*214;if(b.complete)points.push(new T.Vector3(x,8+b.value/max*75,0));else finish();for(const [id,z,color] of [['slowing',13,'#ff4655'],['picking_up',-13,'#3bd8e6']]){if(!b[id])continue;const y=8+b[id+'Speed']/max*75;box(.7,y,1,x,y/2,z,'#59636b');const dot=new T.Mesh(new T.SphereGeometry(2.5,10,8),material(color,{emissive:color,emissiveIntensity:.35}));dot.position.set(x,y,z);remember(dot);}});finish();
   cursor=box(.6,92,35,-107,46,0,'#9beaf0');cursor.material.transparent=true;cursor.material.opacity=.16;label('START',-96,-2,37,{width:28});label('TIME / GPS SPEED',0,-2,37,{width:65});label('FINISH',96,-2,37,{width:30});
  }else if(mode==='elevation'){
   const S=OdoElevationScale;elevationScale=S.create(data.telemetry.altitudeMin,data.telemetry.altitudeMax);
   const y=value=>7+S.height(value,elevationScale)*80;
   // A continuous envelope of observed bin peaks. Missing intervals split the surface.
   for(let run of S.runs(data.altitude)){
    if(run.length===1)run=[{...run[0],index:run[0].index-.45},{...run[0],index:run[0].index+.45}];
    const positions=[],colors=[],indices=[],color=new T.Color();
    run.forEach((b,i)=>{const x=(b.index/95-.5)*210;for(const [height,z] of [[7,-13],[y(b.max),-13],[7,13],[y(b.max),13]]){positions.push(x,height,z);color.set(S.color(b.max,elevationScale));colors.push(color.r,color.g,color.b);}if(i){const a=(i-1)*4,k=i*4;indices.push(a,a+1,k,a+1,k+1,k,a+2,k+2,a+3,a+3,k+2,k+3,a+1,a+3,k+1,a+3,k+3,k+1);}});
    const n=(run.length-1)*4;indices.push(0,2,1,1,2,3,n,n+1,n+2,n+1,n+3,n+2);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);for(let i=1;i<run.length;i++){geo.addGroup((i-1)*18,12,0);geo.addGroup((i-1)*18+12,6,1);}geo.addGroup((run.length-1)*18,12,0);geo.computeVertexNormals();remember(new T.Mesh(geo,[new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1,metalness:0}),new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false})]));
   }
   rangeMesh=box(1,92,35,0,46,0,'#8bd6b7');rangeMesh.material.transparent=true;rangeMesh.material.opacity=.12;rangeMesh.visible=false;
   cursor=box(.6,92,35,-107,46,0,'#8bd6b7');cursor.material.transparent=true;cursor.material.opacity=.3;
   const axis=[];function line(a,b){axis.push(...a,...b);}
   line([-119,7,17],[-119,87,17]);line([-119,7,17],[109,7,17]);
   for(const tick of elevationScale.ticks){const h=y(tick);line([-121,h,17],[-116,h,17]);line([-119,h,-16],[109,h,-16]);}
   const lines=new T.BufferGeometry();lines.setAttribute('position',new T.Float32BufferAttribute(axis,3));remember(new T.LineSegments(lines,new T.LineBasicMaterial({color:'#89949d',transparent:true,opacity:.4})));

  }
 }
 function draw(next,progress,reveal=1){if(disposed)return;lastProgress=progress;lastReveal=reveal;setup(next);const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
  camera.aspect=width/height;const wide=camera.aspect>1.45,distance=(wide?285:Math.max(360,315/camera.aspect))*(next==='elevation'&&!wide?1.18:1),azimuth=(next==='rhythm'?.12:.20)+Math.sin(progress*Math.PI*2)*.11;camera.position.set(Math.sin(next==='elevation'?.16+angle:azimuth)*distance,distance*.64,Math.cos(next==='elevation'?.16+angle:azimuth)*distance);camera.lookAt(0,next==='rhythm'?0:27,0);camera.updateProjectionMatrix();
  if(next==='elevation'){
   // Fit the actual meter labels too, including negative and five-digit source altitudes.
   ink.font=`500 ${Math.max(10,Math.min(13,width/48))}px ui-monospace, monospace`;
   const target=new T.Vector3(0,27,0);
   for(let fit=0;fit<10;fit++){
    camera.updateMatrixWorld();let left=Infinity;
    for(const value of elevationScale.ticks){const point=new T.Vector3(-124,7+OdoElevationScale.height(value,elevationScale)*80,17).project(camera);left=Math.min(left,(point.x+1)*width/2-4-ink.measureText(OdoElevationScale.format(value)).width);}
    if(left>=14)break;camera.position.sub(target).multiplyScalar(1.07).add(target);camera.lookAt(target);
   }
  }
  for(const o of objects){const t=Math.max(0,Math.min(1,(reveal-o.delay)/.55)),ease=1-Math.pow(1-t,3);if(o.ring){o.mesh.scale.setScalar(.75+ease*.25);o.mesh.position.y=(o.mesh.material.color.getHexString()==='9beaf0'?8:3)+(1-ease)*20;}else{o.mesh.scale.y=Math.max(.001,ease);o.mesh.position.y=o.height*ease/2;}}
  if(rangeMesh){rangeMesh.visible=!!range;if(range){rangeMesh.position.x=((range[0]+range[1])/2-.5)*210;rangeMesh.scale.x=Math.max(1,(range[1]-range[0])*210);}}if(cursor)cursor.position.x=(progress-.5)*214;group.scale.y=next==='flow'?Math.max(.01,1-Math.pow(1-Math.min(1,reveal),3)):1;group.rotation.y=next==='rhythm'?Math.sin(progress*Math.PI*2)*.12:0;renderer.render(scene,camera);
  if(output.width!==canvas.width||output.height!==canvas.height){output.width=canvas.width;output.height=canvas.height;}ink.clearRect(0,0,output.width,output.height);output.style.width=width+'px';output.style.height=height+'px';ink.drawImage(canvas,0,0);
  if(next==='elevation'){
   const S=OdoElevationScale,dpr=renderer.getPixelRatio(),sc=elevationScale;ink.save();ink.scale(dpr,dpr);
   const screen=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2};};
   const font=Math.max(10,Math.min(13,width/48)),write=(text,x,y,align='left',color='#b0bac2')=>{ink.font=`500 ${font}px ui-monospace, monospace`;ink.textAlign=align;ink.fillStyle=color;ink.fillText(text,x,y);};
   let axisLeft=Infinity;for(const value of sc.ticks){const p=screen(-124,7+S.height(value,sc)*80,17),label=S.format(value);write(label,p.x-4,p.y+4,'right');axisLeft=Math.min(axisLeft,p.x-4-ink.measureText(label).width);}output.dataset.elevationAxisLeft=String(axisLeft);
   const axis=screen(-119,94,17);write('m',axis.x-6,axis.y,'right','#f5f7f8');
   const a=screen(-105,4,25),b=screen(105,4,25);write('START',a.x,a.y+15,'left');write('FINISH',b.x,b.y+15,'right');
   const left=width*.21,right=width*.88,ly=height-38,gradient=ink.createLinearGradient(left,0,right,0);S.stops.forEach((color,i)=>gradient.addColorStop(i/2,color));ink.fillStyle=gradient;ink.fillRect(left,ly,right-left,5);
   for(const [value,t] of [[sc.min,0],[(sc.min+sc.max)/2,.5],[sc.max,1]]){const x=left+t*(right-left);write(S.format(value)+' m',x,ly+21,t===0?'left':t===1?'right':'center');}
   write('ELEVATION · BIN PEAK',left,ly-11,'left','#f5f7f8');
   ink.restore();output.dataset.elevationMin=String(sc.min);output.dataset.elevationMax=String(sc.max);output.dataset.elevationTicks=sc.ticks.join(',');output.setAttribute('aria-label',`Elevation in meters. Axis ${sc.floor} to ${sc.ceiling} meters. Cyan ${S.format(sc.min)} meters, white ${S.format((sc.min+sc.max)/2)} meters, red ${S.format(sc.max)} meters. Missing intervals remain open.`);
  }
  return output;
 }
 function dispose(){if(disposed)return;disposed=true;clear();canvas.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();output.remove();}
 let drag=null,downX=0;output.style.touchAction='pan-y';output.onpointerdown=e=>{drag=e.clientX;downX=e.clientX;output.setPointerCapture(e.pointerId);};output.onpointermove=e=>{if(drag===null||mode!=='elevation')return;angle=Math.max(-1.05,Math.min(1.05,angle+(e.clientX-drag)*.008));drag=e.clientX;draw(mode,lastProgress,lastReveal);};output.onpointercancel=()=>drag=null;output.onpointerup=e=>{drag=null;if(mode!=='elevation'||Math.abs(e.clientX-downX)>5)return;const rect=output.getBoundingClientRect(),mx=(e.clientX-rect.left)/rect.width*2-1,my=1-(e.clientY-rect.top)/rect.height*2;let nearest=null,best=Infinity;data.altitude.forEach((b,i)=>{if(!b.complete)return;const v=new T.Vector3((i/95-.5)*210,7+OdoElevationScale.height(b.max,elevationScale)*80,0).project(camera),d=(v.x-mx)**2+(v.y-my)**2;if(d<best){best=d;nearest=(b.start+b.end)/2/data.ride.duration;}});if(nearest!==null)onSeek(nearest);};
 return {draw,dispose,setRange(value){range=value;},rotate(degrees){angle=degrees*Math.PI/180;}};
}
function create(host,data,options){let current=null,mode='',range=null;return {draw(kind,progress,reveal){const next=['pace','gforce','quality'].includes(kind)?'instrument':'3d';if(next!==mode){current?.dispose();current=next==='instrument'?OdoRideInstruments.create(host,data):create3D(host,data,options);mode=next;}current.setRange?.(range);return current.draw(kind,progress,reveal);},setRange(value){range=value;current?.setRange?.(value);},rotate(degrees){current?.rotate?.(degrees);},dispose(){current?.dispose();current=null;mode='';}};}
root.OdoInsightScene={create};
})(globalThis);
