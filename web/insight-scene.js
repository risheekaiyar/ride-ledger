/* Sculpted telemetry: real proportions, bounded geometry, a single explicit render loop. */
(function(root){
'use strict';
function create3D(host,data,{onUnavailable=()=>{}}={}){
 const T=root.THREE,renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.append(canvas);const lost=e=>{e.preventDefault();onUnavailable();};canvas.addEventListener('webglcontextlost',lost);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,2000),group=new T.Group();scene.add(group);
 scene.add(new T.HemisphereLight(0xd5f8ff,0x121521,2.1));const key=new T.DirectionalLight(0xffffff,4);key.position.set(-70,140,70);scene.add(key);const rim=new T.PointLight(0x7ef5ed,18000);rim.position.set(90,40,-40);scene.add(rim);
 const palette=['#668793','#557f8c','#7bacb4','#a3dcd9','#d6efdf','#e9e9d8','#ff704e'];
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.3,metalness:.35,...extra});
 let mode='',objects=[],resources=[],disposed=false,cursor=null;
 const remember=obj=>{group.add(obj);resources.push(obj);return obj;};
 function clear(){for(const obj of resources){group.remove(obj);obj.traverse(n=>{n.geometry?.dispose();for(const m of [n.material].flat()){m?.map?.dispose();m?.dispose();}});}resources=[];objects=[];}
 function label(text,x,y,z,{color='#c1d0cc',width=32}={}){const c=document.createElement('canvas');c.width=Math.max(128,text.length*44);c.height=96;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.font='500 64px monospace';ctx.fillText(text,c.width/2,72);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.position.set(x,y,z);sprite.scale.set(width,width*96/c.width,1);remember(sprite);}
 function box(w,h,d,x,y,z,color){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);if(y<0){mesh.material.roughness=.9;mesh.material.metalness=.05;}remember(mesh);return mesh;}
 function setup(next){
  if(mode===next)return;clear();mode=next;cursor=null;group.rotation.set(0,0,0);
  if(mode==='pace'){
   const max=Math.max(...data.telemetry.seconds,1);box(218,3,59,0,-4,0,'#253139');
   for(let i=0;i<7;i++){const seconds=data.telemetry.seconds[i],height=seconds/max*87,x=(i-3)*28;const mesh=box(19,Math.max(.2,height),28,x,height/2,0,seconds===0?'#25393d':i===data.band?'#eeeee0':palette[i]);objects.push({mesh,height,delay:i*.055});label(i===6?'100+':`${data.telemetry.bands[i]}–${data.telemetry.bands[i+1]}`,x,-3,26,{width:(i===6?4:String(data.telemetry.bands[i]).length+String(data.telemetry.bands[i+1]).length+1)*4.7});if(seconds>0)label(Math.round(seconds/data.telemetry.observed*100)+'%',x,height+9,0,{width:24,color:i===data.band?'#f7eedc':'#88bdbb'});}
   label('SPEED / km/h',0,-4,45,{width:60});
  }else if(mode==='rhythm'){
   const values=[data.facts.moving,data.facts.low,data.facts.missing],colors=['#94e1d3','#ff754e','#303d48'];let angle=.22;
   for(let i=0;i<values.length;i++){const span=data.facts.elapsed>0?values[i]/data.facts.elapsed*Math.PI*2:0;if(span<=0)continue;const arc=span>Math.PI*2-.0001?span:Math.max(.001,span-Math.min(.025,span*.06));const mesh=new T.Mesh(new T.TorusGeometry(59,12,16,Math.max(4,Math.ceil(arc*30)),arc),material(colors[i]));if(arc<Math.PI*2-.0001)for(const [a,direction] of [[0,-1],[arc,1]]){const cap=new T.Mesh(new T.CircleGeometry(12,16),material(colors[i]));cap.position.set(59*Math.cos(a),59*Math.sin(a),0);cap.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(-Math.sin(a)*direction,Math.cos(a)*direction,0));mesh.add(cap);}mesh.rotation.set(-Math.PI/2,0,angle);mesh.position.y=i===0?8:3;remember(mesh);objects.push({mesh,delay:i*.12,ring:true});angle+=span;}
   const base=new T.Mesh(new T.CylinderGeometry(80,83,4,96),material('#1c282e'));base.position.y=-12;remember(base);
   const inner=new T.Mesh(new T.CylinderGeometry(29,29,2,64),material('#293d43'));inner.position.y=-3;remember(inner);label(data.facts.elapsed>0?Math.round(data.facts.observed/data.facts.elapsed*100)+'%':'—',0,27,0,{width:48,color:'#eef1df'});label('OBSERVED',0,-1,0,{width:32});
  }else if(mode==='flow'){
   box(228,3,60,0,-4,0,'#253139');const max=Math.max(1,data.facts.peak,...data.speedBins.map(b=>Math.max(b.slowingSpeed||0,b.picking_upSpeed||0)));let points=[];
   const finish=()=>{if(points.length>1){const path=new T.CurvePath();for(let i=1;i<points.length;i++)path.add(new T.LineCurve3(points[i-1],points[i]));remember(new T.Mesh(new T.TubeGeometry(path,points.length*3,1.2,7,false),material('#d2edda',{emissive:'#376c59',emissiveIntensity:.4})));}points=[];};
   data.speedBins.forEach((b,i)=>{const x=(i/95-.5)*214;if(b.complete)points.push(new T.Vector3(x,8+b.value/max*75,0));else finish();for(const [id,z,color] of [['slowing',13,'#ff835f'],['picking_up',-13,'#7bd5c6']]){if(!b[id])continue;const y=8+b[id+'Speed']/max*75;box(.7,y,1,x,y/2,z,'#526d68');const dot=new T.Mesh(new T.SphereGeometry(2.5,10,8),material(color,{emissive:color,emissiveIntensity:.35}));dot.position.set(x,y,z);remember(dot);}});finish();
   cursor=box(.6,92,35,-107,46,0,'#b6e1c4');cursor.material.transparent=true;cursor.material.opacity=.16;label('START',-96,-2,37,{width:28});label('TIME / GPS SPEED',0,-2,37,{width:65});label('FINISH',96,-2,37,{width:30});
  }else if(mode==='elevation'){
   const minimum=data.facts.altitude_min,span=Math.max(1,data.facts.altitude_span);let run=[];
   function ribbon(){if(run.length<2){run=[];return;}const positions=[],colors=[],indices=[];const color=new T.Color();run.forEach((b,i)=>{const x=(b.index/95-.5)*214,y=7+(b.max-minimum)/span*77;for(const [height,z] of [[0,-16],[y,-16],[0,16],[y,16]]){positions.push(x,height,z);color.setHSL(.54-(b.max-minimum)/span*.28,.32,height===0?.16:.67);colors.push(color.r,color.g,color.b);}if(i){const a=(i-1)*4,k=i*4;indices.push(a,a+1,k,a+1,k+1,k,a+2,k+2,a+3,a+3,k+2,k+3,a+1,a+3,k+1,a+3,k+3,k+1);}});const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();remember(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.65,metalness:.12})));run=[];}
   data.altitude.forEach((b,index)=>{if(b.complete)run.push({...b,index});else ribbon();});ribbon();
   label('START',-96,-2,34,{width:30});label('ELAPSED TIME',0,-2,34,{width:63});label('FINISH',96,-2,34,{width:32});
  }
 }
 function draw(next,progress,reveal=1){if(disposed)return;setup(next);const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
  camera.aspect=width/height;const wide=camera.aspect>1.45,distance=wide?285:Math.max(360,315/camera.aspect),azimuth=(next==='rhythm'?.12:.20)+Math.sin(progress*Math.PI*2)*.11;camera.position.set(Math.sin(azimuth)*distance,distance*.64,Math.cos(azimuth)*distance);camera.lookAt(0,next==='rhythm'?0:27,0);camera.updateProjectionMatrix();
  for(const o of objects){const t=Math.max(0,Math.min(1,(reveal-o.delay)/.55)),ease=1-Math.pow(1-t,3);if(o.ring){o.mesh.scale.setScalar(.75+ease*.25);o.mesh.position.y=(o.mesh.material.color.getHexString()==='94e1d3'?8:3)+(1-ease)*20;}else{o.mesh.scale.y=Math.max(.001,ease);o.mesh.position.y=o.height*ease/2;}}
  if(cursor)cursor.position.x=(progress-.5)*214;group.scale.y=next==='flow'?Math.max(.01,1-Math.pow(1-Math.min(1,reveal),3)):1;group.rotation.y=next==='rhythm'?Math.sin(progress*Math.PI*2)*.12:0;renderer.render(scene,camera);return canvas;
 }
 function dispose(){if(disposed)return;disposed=true;clear();canvas.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 return {draw,dispose};
}
function create(host,data,options){let current=null,mode='';return {draw(kind,progress,reveal){const next=['pace','gforce','quality'].includes(kind)?'instrument':'3d';if(next!==mode){current?.dispose();current=next==='instrument'?OdoRideInstruments.create(host,data):create3D(host,data,options);mode=next;}return current.draw(kind,progress,reveal);},dispose(){current?.dispose();current=null;mode='';}};}
root.OdoInsightScene={create};
})(globalThis);
