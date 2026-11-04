/* Resolve Meta's elapsed-window reference locally. Map tiles load only on request. */
function mountReplayReference(host, ride, windows, selectWindow) {
 const model=OdoTrackModel.build(ride.track,{gapLimit:ride.source==='GPX export'?30:3});
 const outline=OdoReplayInstruments.trace(model);
 let map=null,pin=null,active=0,loaded=false,failed=false;
 host.innerHTML=`<div class="reel-spot-heading"><strong>Where did this happen?</strong><time></time></div>
   <div class="reel-spot-map" aria-label="Route location of the selected pause"></div>
   <button type="button" class="reel-spot-load">Load street map</button>
   <p class="tiny">Street tiles show nearby roads and places. Loading them shares the viewed area with OpenStreetMap.</p>`;
 const area=host.querySelector('.reel-spot-map'),time=host.querySelector('time'),load=host.querySelector('button');
 function update(index){
  active=index;
  const window=windows[index];if(!window)return;
  const wall=Number.isFinite(ride.started)&&ride.started>0?new Date(ride.started+window.start_second*1000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
  time.textContent=`${clock(Math.round(window.start_second))}–${clock(Math.round(window.end_second))} elapsed${wall?' · '+wall:''}`;
  const sample=ride.track[OdoTelemetry.nearest(ride.track,window.start_second)];
  if(map){
   if(sample){pin.setLngLat(sample.slice(0,2));map.jumpTo({center:sample.slice(0,2),zoom:16});}
   if(loaded)map.getSource('window').setData(trackGeo(ride.track.filter(p=>p[2]>=window.start_second&&p[2]<=window.end_second)));
   return;
  }
  if(!outline){area.textContent='No connected route geometry for this window.';load.hidden=!sample||failed;return;}
  const point=OdoTrackModel.atTime(model,window.start_second),[x,y]=outline.xy(point);
  area.innerHTML=`<svg viewBox="0 0 200 120" role="img" aria-label="Offline GPS route with pause marker"><path d="${outline.line}" fill="none" stroke="#8acbbc" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="#ff936d" stroke="#fff2dc" stroke-width="1.5"/></svg>`;
 }
 function fallback(){
  if(!map)return;
  const instance=map;map=null;instance.remove();failed=true;load.hidden=true;
  update(active);load.insertAdjacentHTML('afterend','<p class="tiny">Street tiles unavailable. The offline route still shows your pause.</p>');
 }
 load.onclick=()=>{
  if(map)return;
  const sample=ride.track[OdoTelemetry.nearest(ride.track,windows[active].start_second)];
  if(!sample)return;
  area.replaceChildren();
  try{
   map=new maplibregl.Map({container:area,style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}},layers:[{id:'streets',type:'raster',source:'osm'}]},center:sample.slice(0,2),zoom:16});
   pin=new maplibregl.Marker({element:OdoBikeVisual.marker(OdoBikeVisual.profile(ride,prefs.bike))}).setLngLat(sample.slice(0,2)).addTo(map);
   map.once('load',()=>{
    map.addSource('route',{type:'geojson',data:trackGeo(ride.track)});
    map.addLayer({id:'route',type:'line',source:'route',paint:{'line-color':'#126582','line-width':5}});
    map.addSource('window',{type:'geojson',data:trackGeo([])});
    map.addLayer({id:'window',type:'line',source:'window',paint:{'line-color':'#db5233','line-width':7}});
    loaded=true;update(active);
   });
   map.on('error',()=>fallback());
   load.hidden=true;
  }catch{if(map)fallback();else{failed=true;load.hidden=true;update(active);}}
 };
 update(Number(selectWindow.value));
 return {update,dispose(){if(map){const instance=map;map=null;instance.remove();}}};
}
