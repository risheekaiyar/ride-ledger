/* Sculpted telemetry: real proportions, bounded geometry, a single explicit render loop. */
(function(root){
'use strict';
function create(host,data,{onUnavailable=()=>{},kind,ride}={}){
 if(kind==='pace'||kind==='flow')return OdoReplayInstruments.create(host,kind,data,ride);
 const T=root.THREE,renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.append(canvas);const lost=e=>{e.preventDefault();onUnavailable();};canvas.addEventListener('webglcontextlost',lost);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,2000),group=new T.Group();scene.add(group);
 scene.add(new T.HemisphereLight(0xd5f8ff,0x121521,2.1));const key=new T.DirectionalLight(0xffffff,4);key.position.set(-70,140,70);scene.add(key);const rim=new T.PointLight(0x7ef5ed,18000);rim.position.set(90,40,-40);scene.add(rim);
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.3,metalness:.35,...extra});
 let mode='',objects=[],resources=[],disposed=false;
 const remember=obj=>{group.add(obj);resources.push(obj);return obj;};
 function clear(){for(const obj of resources){group.remove(obj);obj.traverse(n=>{n.geometry?.dispose();for(const m of [n.material].flat()){m?.map?.dispose();m?.dispose();}});}resources=[];objects=[];}
 function label(text,x,y,z,{color='#c1d0cc',width=32}={}){const c=document.createElement('canvas');c.width=Math.max(128,text.length*44);c.height=96;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.font='500 64px monospace';ctx.fillText(text,c.width/2,72);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.position.set(x,y,z);sprite.scale.set(width,width*96/c.width,1);remember(sprite);}
 function box(w,h,d,x,y,z,color){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);if(y<0){mesh.material.roughness=.9;mesh.material.metalness=.05;}remember(mesh);return mesh;}
 function setup(next){
  if(mode===next)return;clear();mode=next;group.rotation.set(0,0,0);
  if(mode==='rhythm'){
   const values=[data.facts.moving,data.facts.low,data.facts.missing],colors=['#94e1d3','#ff754e','#303d48'];let angle=.22;
   for(let i=0;i<values.length;i++){const span=data.facts.elapsed>0?values[i]/data.facts.elapsed*Math.PI*2:0;if(span<=0)continue;const arc=span>Math.PI*2-.0001?span:Math.max(.001,span-Math.min(.025,span*.06));const mesh=new T.Mesh(new T.TorusGeometry(59,12,16,Math.max(4,Math.ceil(arc*30)),arc),material(colors[i]));if(arc<Math.PI*2-.0001)for(const [a,direction] of [[0,-1],[arc,1]]){const cap=new T.Mesh(new T.CircleGeometry(12,16),material(colors[i]));cap.position.set(59*Math.cos(a),59*Math.sin(a),0);cap.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(-Math.sin(a)*direction,Math.cos(a)*direction,0));mesh.add(cap);}mesh.rotation.set(-Math.PI/2,0,angle);mesh.position.y=i===0?8:3;remember(mesh);objects.push({mesh,delay:i*.12,ring:true});angle+=span;}
   const base=new T.Mesh(new T.CylinderGeometry(80,83,4,96),material('#1c282e'));base.position.y=-12;remember(base);
   const inner=new T.Mesh(new T.CylinderGeometry(29,29,2,64),material('#293d43'));inner.position.y=-3;remember(inner);label(data.facts.elapsed>0?Math.round(data.facts.observed/data.facts.elapsed*100)+'%':'—',0,27,0,{width:48,color:'#eef1df'});label('OBSERVED',0,-1,0,{width:32});
  }else if(mode==='elevation'){
   box(228,3,49,0,-4,0,'#253139');
   const min=data.facts.altitude_min,span=Math.max(1,data.facts.altitude_span);
   const positions=[],colors=[],index=[],crest=[];
   const low=new T.Color('#328b9b'),high=new T.Color('#f6be78');
   let previous=-1;
   for(let i=0;i<data.altitude.length;i++){
    const b=data.altitude[i];if(!b.complete){previous=-1;continue;}
    const proportion=Math.max(0,Math.min(1,((b.min+b.max)/2-min)/span));
    const height=7+proportion*68,x=(i/95-.5)*214,base=positions.length/3;
    const tint=low.clone().lerp(high,proportion);
    positions.push(x,0,14,x,height,14,x,height,-14);
    for(const shade of [.40,.86,1])colors.push(tint.r*shade,tint.g*shade,tint.b*shade);
    if(previous>=0){
      index.push(previous,previous+1,base,previous+1,base+1,base,
        previous+1,previous+2,base+1,previous+2,base+2,base+1);
      const old=previous*3;
      crest.push(positions[old],positions[old+4]+.4,14,x,height+.4,14);
    }
    previous=base;
   }
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(index);geometry.computeVertexNormals();
   remember(new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.66})));
   const edge=new T.BufferGeometry();edge.setAttribute('position',new T.Float32BufferAttribute(crest,3));
   remember(new T.LineSegments(edge,new T.LineBasicMaterial({color:'#f4dbac'})));
   label('START',-96,-2,34,{width:30});label('ELAPSED TIME',0,-2,34,{width:63});label('FINISH',96,-2,34,{width:32});
  }
 }
 function draw(next,progress,reveal=1){if(disposed)return;setup(next);const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);if(canvas.width!==Math.round(width*renderer.getPixelRatio())||canvas.height!==Math.round(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
  camera.aspect=width/height;const wide=camera.aspect>1.45,distance=wide?285:Math.max(360,315/camera.aspect),azimuth=(next==='rhythm'?.12:.20)+Math.sin(progress*Math.PI*2)*.11;camera.position.set(Math.sin(azimuth)*distance,distance*.64,Math.cos(azimuth)*distance);camera.lookAt(0,next==='rhythm'?0:27,0);camera.updateProjectionMatrix();
  for(const o of objects){const t=Math.max(0,Math.min(1,(reveal-o.delay)/.55)),ease=1-Math.pow(1-t,3);if(o.ring){o.mesh.scale.setScalar(.75+ease*.25);o.mesh.position.y=(o.mesh.material.color.getHexString()==='94e1d3'?8:3)+(1-ease)*20;}else{o.mesh.scale.y=Math.max(.001,ease);o.mesh.position.y=o.height*ease/2;}}
  group.rotation.y=next==='rhythm'?Math.sin(progress*Math.PI*2)*.12:0;renderer.render(scene,camera);return canvas;
 }
 function dispose(){if(disposed)return;disposed=true;clear();canvas.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 return {draw,dispose};
}
root.OdoInsightScene={create};
})(globalThis);
