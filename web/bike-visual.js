/* Shared garage and replay models. Geometry is illustrative and built on device. */
(() => {
  const models = [
    {id:'xpulse', name:'Hero Xpulse 200', type:'Adventure', shape:'rally', cluster:'lcd', reference:'https://www.heromotocorp.com/en-in/motorcycles/xpulse-200-4v.html'},
    {id:'ktm390r', name:'KTM 390 Adventure R', type:'Adventure', shape:'rally', cluster:'tft', reference:'https://press.ktm.com/news-introducing-the-2025-ktm-390-adventure-lineup?id=211885&imageid=835995&l=uk&menueid=5904'},
    {id:'mt07', name:'Yamaha MT-07', type:'Roadster', shape:'naked', cluster:'tft', reference:'https://www.yamaha-motor.eu/content/dam/yme/language-masters/en/eicma-2025/digital-brochures/2026_EICMA_MC_BROCHURE_EN.pdf'},
    {id:'generic', name:'Custom bike', cluster:'tft'}
  ];
  const types = {Adventure:'adventure', 'Off-road':'rally', Sport:'sport', Roadster:'naked', Touring:'tourer', Cruiser:'cruiser', Scooter:'scooter'};
  const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#ff795b';
  function profile(ride, bike = {}) {
    const saved = models.find(item=>item.id===bike.model && item.id!=='generic') ||
      (bike.model!=='generic' && /xpulse\s*200/i.test(bike.name || '') ? models[0] : models.at(-1));
    const matches = !ride?.bike_id || ride.bike_id === bike.name;
    const type = matches && (!ride?.bike_type || ride.bike_type === 'Unknown') ? bike.type || saved.type : ride?.bike_type;
    return {shape:matches&&saved.shape&&(!bike.type||bike.type==='Unknown'||bike.type===saved.type)?saved.shape:types[type]||'naked',
      color:color(matches?bike.color:null),model:matches?saved:models.at(-1)};
  }
  function build(T, spec) {
    const group=new T.Group(), rubber=new T.MeshStandardMaterial({color:'#18181e',roughness:.9}),
      alloy=new T.MeshStandardMaterial({color:'#9eabb2',metalness:.55,roughness:.35}),
      paint=new T.MeshStandardMaterial({color:spec.color,roughness:.36}),
      glass=new T.MeshStandardMaterial({color:'#8fabbc',roughness:.25,transparent:true,opacity:.68});
    const shapes={
      adventure:[1.48,.83,2.42,1.05,.68],rally:[1.58,.88,2.52,.85,.95],sport:[1.45,.73,1.84,1.2,.45],
      naked:[1.43,.75,1.95,.9,0],tourer:[1.58,.76,2.27,1.3,.85],cruiser:[1.77,.76,1.64,.86,0],scooter:[1.3,.57,1.76,.82,.35]
    };
    const [base,tyre,seat,width,screen]=shapes[spec.shape]||shapes.naked;
    function mesh(geometry, material,x,y,z){
      const m=new T.Mesh(geometry,material);m.position.set(x,y,z);group.add(m);return m;
    }
    function capsule(x,y,z,w,h,d,material){
      const m=mesh(new T.SphereGeometry(1,16,10),material,x,y,z);m.scale.set(w,h,d);return m;
    }
    function strut(a,b,r,material){
      const start=new T.Vector3(...a),end=new T.Vector3(...b),mid=start.clone().lerp(end,.5);
      const m=mesh(new T.CylinderGeometry(r,r,start.distanceTo(end),8),material,mid.x,mid.y,mid.z);
      m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());
    }
    for(const z of [-base,base]){
      mesh(new T.TorusGeometry(tyre*.79,tyre*.21,10,32),rubber,0,tyre,z).rotation.y=Math.PI/2;
      mesh(new T.TorusGeometry(tyre*.62,.045,6,24),alloy,0,tyre,z).rotation.y=Math.PI/2;
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4;
        strut([0,tyre,z],[0,tyre+Math.sin(a)*tyre*.62,z+Math.cos(a)*tyre*.62],.024,alloy);
      }
    }
    for(const x of [-.23,.23]){
      strut([x,tyre,base],[x,seat+.22,.72],.073,alloy);
      strut([x,tyre,-base],[x,seat-.64,.06],.09,alloy);
    }
    mesh(new T.BoxGeometry(.68,.61,.83),alloy,0,seat-.75,.12);
    capsule(0,seat-.12,-.82,width*.36,.17,.93,rubber);
    capsule(0,seat-.28,-1.22,width*.35,.22,.65,paint);
    capsule(0,seat,.12,width*.48,.33,.73,paint);
    capsule(0,seat+.05,.94,width*.42,.29,.44,paint);
    capsule(0,seat+.09,1.29,width*.24,.13,.12,alloy);
    if(screen)mesh(new T.BoxGeometry(width*.71,screen,.06),glass,0,seat+.31+screen/2,1.05).rotation.x=-.23;
    if(spec.shape==='tourer')for(const x of [-.68,.68])mesh(new T.BoxGeometry(.48,.65,1),paint,x,seat-.46,-1.03);
    strut([-.63,seat+.41,.73],[.63,seat+.41,.73],.052,rubber);
    return group;
  }
  function marker(spec){
    const el=document.createElement('div');el.className='bike-map-marker';el.style.setProperty('--bike-color',spec.color);
    const trim={rally:'m26 10 2-8h5M4 9h11l6 3',adventure:'m26 10 2-6h5M3 11h11',
      tourer:'m26 10 2-6h6M3 11h9v8H3z',sport:'m20 12 8-6 6 4-8 5-4 7',naked:'m21 12 4-4 5 1',
      cruiser:'m6 15 9 1 5-4',scooter:'m17 14-2 7h9l6-12'}[spec.shape];
    el.innerHTML=`<svg viewBox="0 0 40 31" aria-hidden="true"><circle cx="9" cy="23" r="6"/><circle cx="31" cy="23" r="6"/><path d="m9 23 7-11 9 1 6 10M9 23h13l5-13 5 1 ${trim||''}"/></svg>`;
    return el;
  }
  function viewer(host,spec){
    const T=window.THREE;
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,100);
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    renderer.outputColorSpace=T.SRGBColorSpace;
    const key=new T.DirectionalLight('#fff4de',3);key.position.set(3,7,4);
    scene.add(new T.HemisphereLight('#d4efff','#46525b',2),key);
    const bike=build(T,spec);scene.add(bike);
    const canvas=renderer.domElement;canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Bike model. Drag or use left and right arrow keys to rotate.');
    host.replaceChildren(canvas);
    let angle=1.09,pitch=.22,last=null;
    const paint=()=>{
      const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      const distance=Math.max(9,9/camera.aspect);
      camera.position.set(distance*Math.sin(angle),1.6+distance*pitch,distance*Math.cos(angle));
      camera.lookAt(0,1.48,0);renderer.render(scene,camera);
    };
    canvas.onpointerdown=e=>{last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
    canvas.onpointermove=e=>{if(!last)return;angle-=(e.clientX-last[0])*.012;pitch=Math.max(-.05,Math.min(.58,pitch+(e.clientY-last[1])*.004));last=[e.clientX,e.clientY];paint();};
    canvas.onpointerup=canvas.onpointercancel=()=>{last=null;};
    canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();angle+=e.key==='ArrowLeft'?-.15:.15;paint();};
    const resize=new ResizeObserver(paint);resize.observe(host);paint();
    return ()=>{resize.disconnect();const materials=new Set();bike.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();};
  }
  window.OdoBikeVisual={models,profile,build,marker,color,viewer};
})();
