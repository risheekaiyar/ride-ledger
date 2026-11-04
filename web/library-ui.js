/* Compact route reliefs and a map-backed ride sheet. Geographic tiles remain opt-in. */
let reliefUid=0,libraryMap=null,libraryMapEnabled=false,libraryFiltersOpen=false;
const libraryBatchSize=20;
let libraryLimit=libraryBatchSize,libraryQuery='',libraryLastFilter='all',libraryRenderedIds=[];
const reliefCache=new WeakMap(),libraryMetricCache=new WeakMap();
function routeReliefSvg(ride){
 const track=ride.track||[];let shape=reliefCache.get(track);if(!shape){shape=OdoRouteRelief.build(track);reliefCache.set(track,shape);}
 const id='relief-'+(++reliefUid);
 return `<svg viewBox="0 0 120 86" aria-hidden="true" class="route-relief"><defs><linearGradient id="${id}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dce2e7" stop-opacity=".8"/><stop offset=".55" stop-color="#b0bac2" stop-opacity=".45"/><stop offset="1" stop-color="#89949d" stop-opacity=".04"/></linearGradient><filter id="${id}-shadow" x="-50%" y="-50%" width="200%" height="220%"><feGaussianBlur stdDeviation="3.6"/></filter><filter id="${id}-glow" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="1.8"/></filter><filter id="${id}-soften" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation=".32"/></filter></defs><path d="${shape.shadow}" fill="none" stroke="#dce2e7" stroke-width="7" opacity=".13" filter="url(#${id}-shadow)"/><g filter="url(#${id}-soften)">${shape.faces.map(face=>`<path d="${face.d}" fill="url(#${id}-wall)" opacity="${face.shade.toFixed(2)}"/>`).join('')}</g><path d="${shape.top}" fill="none" stroke="#f5f7f8" stroke-width="5" opacity=".2" filter="url(#${id}-glow)"/><path d="${shape.top}" fill="none" stroke="#f5f7f8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${shape.ends.map(p=>`<path d="M${p.x.toFixed(2)},${p.y.toFixed(2)}v${shape.depth}" stroke="#f5f7f8" stroke-width=".6" opacity=".25"/>`).join('')}</svg>`;
}
function libraryMetrics(ride){let entry=libraryMetricCache.get(ride);if(!entry||entry.track!==ride.track||entry.duration!==ride.duration||entry.source!==ride.source){entry={track:ride.track,duration:ride.duration,source:ride.source,value:OdoTelemetry.analyze(ride)};libraryMetricCache.set(ride,entry);}return entry.value;}
function libraryDuration(seconds){const n=Math.max(0,Math.floor(seconds)),h=Math.floor(n/3600),m=Math.floor(n/60)%60,s=n%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;}
rows=function(list){return list.map(ride=>{
 const imported=ride.source==='GPX export',metrics=libraryMetrics(ride),distance=ride.distanceReliable||imported?fmt(ride.distanceKm,1):'—',end={started:ride.started+ride.duration*1000};
 const description=[(imported&&distance!=='—'?'~':'')+distance+' km',libraryDuration(ride.duration),ride.bike_id||ride.title].join(' · ');
 const match=page==='journeys'?libraryMatchLabel(ride):'';
 return `<button class="ride-row library-ride" data-ride="${esc(ride.id)}"><span class="route-thumbnail">${routeReliefSvg(ride)}</span><span class="ride-title"><strong>${date(ride)}</strong><span class="library-time">${time(ride)} – ${time(end)}</span><span class="library-description">${esc(description)}</span>${match?`<span class="library-match">${esc(match)}</span>`:''}<span class="library-source">${imported?'GPX import':ride.kind==='walk'?'Walk · phone recording':ride.kind==='unclassified'?'Unclassified · phone recording':'Phone recording'}</span></span><span class="ride-values"><strong>${fmt(metrics.peak,0)}</strong><span class="library-unit">KM/H</span><span class="library-peak">${metrics.peak===null?'NO SPEED':imported?'EST. PEAK':'GPS PEAK'}</span></span></button>`;
 }).join('');};
function libraryAtlas(ride){
 const route=OdoRouteGeometry.project(ride?.track||[],{width:1100,height:440,padding:65});
 return `<svg viewBox="0 0 1100 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="${route.path}" fill="none" stroke="#b0bac2" stroke-width="100" opacity=".015"/><path d="${route.path}" fill="none" stroke="#59636b" stroke-width="1.4" opacity=".3"/></svg>`;
}
function libraryMatches(){
 const query=libraryQuery.trim().toLocaleLowerCase();
 return rides.filter(r=>(filter==='all'||r.kind===filter||filter==='recurring'&&r.recurring)&&(!query||[r.title,r.bike_id,r.recurring].some(value=>String(value||'').toLocaleLowerCase().includes(query))));
}
function libraryResultLabel(count){return `${count} ${libraryQuery.trim()?'matching':'saved'} ${count===1?'journey':'journeys'}`;}
function libraryCriteria(){return [filter==='all'?'':({ride:'Rides',walk:'Walks',recurring:'Recurring'})[filter],libraryQuery.trim()?`Search: “${libraryQuery.trim()}”`:''].filter(Boolean).join(' · ');}
function libraryMatchLabel(ride){
 const query=libraryQuery.trim().toLocaleLowerCase();if(!query)return '';
 return [[ride.bike_id?'Title':'',ride.title],['Route',ride.recurring]].filter(([label,value])=>label&&String(value||'').toLocaleLowerCase().includes(query)).map(([label,value])=>`${label}: ${value}`).join(' · ');
}
function libraryEmpty(){return `<div class="rides-empty"><span>${icon('journeys')}</span><h3>${libraryQuery.trim()?'No journeys match this search.':rides.length?'No journeys in this view.':'Your road. Your story.'}</h3><p>${libraryQuery.trim()?'Try a ride title, bike name or recurring route label.':rides.length?'Choose another filter to see your saved recordings.':'Record on your phone or bring a ride from another app.'}</p>${libraryQuery.trim()?'<button data-library-clear>Clear search</button>':'<button data-action="import">Import a ride</button>'}</div>`;}
function libraryFooter(total,shown){return `<div class="library-load" ${total?'':'hidden'}><p id="library-load-status" role="status" aria-live="polite" aria-atomic="true">${shown<total?`Showing ${shown} of ${total} journeys`:`All ${total} ${total===1?'journey is':'journeys are'} shown`}</p><button data-library-more aria-controls="library-rides" ${shown>=total?'hidden':''}>Show ${Math.min(libraryBatchSize,total-shown)} more ${icon('arrow')}</button></div>`;}
function updateLibraryFooter(total,shown,message){
 const footer=$('.library-load'),button=footer.querySelector('button');footer.hidden=!total;
 $('#library-load-status').textContent=message||(shown<total?`Showing ${shown} of ${total} journeys`:`All ${total} ${total===1?'journey is':'journeys are'} shown`);
 button.hidden=shown>=total;button.innerHTML=`Show ${Math.max(0,Math.min(libraryBatchSize,total-shown))} more ${icon('arrow')}`;
}
function refreshLibraryResults(){
 const list=libraryMatches(),visible=list.slice(0,libraryLimit),container=$('#library-rides');if(!container)return;
 libraryLastFilter=filter;libraryRenderedIds=visible.map(r=>r.id);container.innerHTML=visible.length?rows(visible):libraryEmpty();
 $('#library-count').textContent=libraryResultLabel(list.length);updateLibraryFooter(list.length,visible.length);
 const criteria=$('#library-criteria');criteria.hidden=!libraryCriteria();criteria.querySelector('span').textContent=libraryCriteria();
 $$('#rides-filters [data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
 const clear=$('#library-search-clear');if(clear)clear.hidden=!libraryQuery;
}
function showMoreLibraryRides(){
 const list=libraryMatches(),container=$('#library-rides');if(!container)return;
 // An asynchronous import may have changed the order since these rows were drawn.
 if(libraryRenderedIds.some((id,index)=>list[index]?.id!==id)){
  libraryLimit=libraryBatchSize;refreshLibraryResults();$('#library-load-status').textContent=`Journal updated. Showing ${Math.min(libraryLimit,list.length)} of ${list.length} journeys.`;($('#library-rides .library-ride')||$('[data-library-filter]'))?.focus({preventScroll:true});return;
 }
 const next=list.slice(libraryRenderedIds.length,libraryRenderedIds.length+libraryBatchSize);if(!next.length)return;
 const previous=libraryRenderedIds.length;container.insertAdjacentHTML('beforeend',rows(next));libraryRenderedIds.push(...next.map(r=>r.id));libraryLimit=libraryRenderedIds.length;
 updateLibraryFooter(list.length,libraryLimit,`${next.length} more ${next.length===1?'journey':'journeys'} loaded. Showing ${libraryLimit} of ${list.length}.`);
 // Move focus to the first newly available ride instead of losing it when the final button disappears.
 const first=container.querySelectorAll('.library-ride')[previous];first?.focus({preventScroll:true});first?.scrollIntoView({block:'nearest',behavior:'instant'});
}
journeys=function(){
 if(filter!==libraryLastFilter){libraryLimit=libraryBatchSize;libraryLastFilter=filter;}
 const list=libraryMatches(),visible=list.slice(0,libraryLimit),latest=rides[0],initial=(prefs.name||'R').trim().charAt(0).toUpperCase();libraryRenderedIds=visible.map(r=>r.id);
 return `<section class="rides-experience"><div class="rides-cover"><div class="rides-atlas" id="library-atlas">${libraryAtlas(latest)}</div><div id="library-map" class="rides-geography" aria-hidden="true"></div><div class="rides-cover-shade"></div><div class="rides-cover-copy"><span>YOUR PRIVATE RIDE JOURNAL</span><h1>Saved when you<br>stopped.</h1></div><div class="rides-map-caption"><span id="library-map-status">${latest?'Your latest route · offline':'Your next ride starts here'}</span><button data-library-map="open">${icon('explore')} Map background</button></div></div><section class="rides-sheet"><div class="rides-sheet-head"><div><h2>Rides</h2><span id="library-count" role="status" aria-live="polite" aria-atomic="true">${libraryResultLabel(list.length)}</span></div><div class="rides-header-actions"><button class="rides-filter-toggle" data-library-filter aria-label="Search and filter journeys" aria-controls="rides-filters" aria-expanded="${libraryFiltersOpen}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="#24282d"/><circle cx="15" cy="17" r="2.5" fill="#24282d"/></svg></button><button class="rides-profile" data-rider-menu aria-label="Open rider menu">${esc(initial)}</button></div></div><div class="library-criteria" id="library-criteria" ${libraryCriteria()?'':'hidden'}><span>${esc(libraryCriteria())}</span><button data-library-reset>Clear all</button></div><div class="rides-tools" id="rides-filters" ${libraryFiltersOpen?'':'hidden'}><div class="rides-search"><label for="library-search">Search your journal</label><div><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg><input type="search" id="library-search" maxlength="120" placeholder="Ride title, bike or route label" value="${esc(libraryQuery)}" autocomplete="off"><button id="library-search-clear" data-library-clear aria-label="Clear search" ${libraryQuery?'':'hidden'}><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div></div><div class="rides-filters" role="group" aria-label="Filter saved journeys">${[['all','All'],['ride','Rides'],['walk','Walks'],['recurring','Recurring']].map(([key,label])=>`<button data-filter="${key}" aria-pressed="${filter===key}">${label}</button>`).join('')}<button class="rides-import" data-action="import" aria-label="Import recordings">＋ Import</button></div></div><div class="rides-list" id="library-rides" role="region" aria-label="Saved journeys">${visible.length?rows(visible):libraryEmpty()}</div>${libraryFooter(list.length,visible.length)}</section><details class="library-plans"><summary><span>On your horizon</span><span>${prefs.plans.length} private plans</span></summary><div class="library-plans-body"><button data-action="plan">＋ Plan a ride</button><div class="grid3 section">${prefs.plans.map((p,i)=>`<div class="panel pad"><span class="tag gray">${esc(p.type)}</span><h3>${esc(p.name)}</h3><p class="subtle">${esc(p.destination)}</p><p class="tiny">${esc(p.date||'No date set')}</p><button class="arrow-link" data-plan="${i}">Edit plan</button></div>`).join('')||'<p class="subtle">Keep your next commute or weekend route here.</p>'}</div></div></details></section>`;
};
// Updating only results preserves the map instance, input composition, selection and focus.
document.addEventListener('input',event=>{if(event.target.id==='library-search'&&!event.isComposing){libraryQuery=event.target.value;libraryLimit=libraryBatchSize;refreshLibraryResults();}});
document.addEventListener('compositionend',event=>{if(event.target.id==='library-search'){libraryQuery=event.target.value;libraryLimit=libraryBatchSize;refreshLibraryResults();}});
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||page!=='journeys')return;
 if(button.dataset.filter&&button.closest('#rides-filters')){event.preventDefault();event.stopImmediatePropagation();filter=button.dataset.filter;libraryLimit=libraryBatchSize;refreshLibraryResults();}
 if(button.hasAttribute('data-library-more'))showMoreLibraryRides();
 if(button.hasAttribute('data-library-clear')||button.hasAttribute('data-library-reset')){libraryQuery='';libraryLimit=libraryBatchSize;if(button.hasAttribute('data-library-reset'))filter='all';$('#library-search').value='';refreshLibraryResults();libraryFiltersOpen=true;$('#rides-filters').hidden=false;$('[data-library-filter]').setAttribute('aria-expanded','true');$('#library-search').focus({preventScroll:true});}
},true);
function disposeLibraryMap(){if(libraryMap){libraryMap.remove();libraryMap=null;}}
function mountLibraryMap(){
 const container=$('#library-map'),ride=rides[0];if(!libraryMapEnabled||!container)return;
 $('[data-library-map=open]').innerHTML=icon('explore')+' Hide map';
 if(!ride?.track.length){$('#library-map-status').textContent='Import a route to place your map';return;}
 try{
  // Bounds unwrap the dateline before fitting, avoiding a world-wide view of a local ride.
  let longitude=ride.track[0][0];const coordinates=ride.track.map((point,i)=>{if(i)longitude+=((point[0]-longitude+180)%360+360)%360-180;return [longitude,point[1]];});
  const bounds=new maplibregl.LngLatBounds();coordinates.forEach(p=>bounds.extend(p));
  const localMap=new maplibregl.Map({container,interactive:false,attributionControl:false,center:coordinates[0],zoom:10,bounds,fitBoundsOptions:{padding:65,maxZoom:13},style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}},layers:[{id:'base',type:'raster',source:'osm',paint:{'raster-saturation':-1,'raster-brightness-max':.2,'raster-brightness-min':0,'raster-contrast':.2}}]}});
  let tileFailed=false;libraryMap=localMap;localMap.addControl(new maplibregl.AttributionControl({compact:false}),'top-right');$('#library-map-status').textContent='Loading geographic map…';
  localMap.on('load',()=>{if(libraryMap!==localMap||tileFailed)return;$('#library-map-status').textContent='OpenStreetMap · latest ride area';$('#library-atlas').classList.add('with-geography');});
  localMap.on('error',()=>{tileFailed=true;if(libraryMap===localMap&&$('#library-map-status')){$('#library-atlas').classList.remove('with-geography');$('#library-map-status').textContent='Map unavailable · your routes remain on this device';}});
 }catch(error){disposeLibraryMap();$('#library-map-status').textContent='Map unavailable · showing your local route';}
}
const renderBeforeLibrary=render;
render=function(){disposeLibraryMap();document.body.classList.add('rider-shell');document.body.classList.toggle('library-active',page==='journeys');renderBeforeLibrary();$('#nav [data-page=journeys] span').textContent='Rides';$('.header-rider-menu').textContent=(prefs.name||'R').trim().charAt(0).toUpperCase();if(page==='journeys')mountLibraryMap();};
document.addEventListener('click',event=>{
 const menu=event.target.closest('[data-rider-menu]');if(menu){modal(`<div class="rider-menu-head"><span class="eyebrow">YOUR RIDING SPACE</span><h2>${esc(prefs.name||'Your profile')}</h2><p>Routes, ride evidence and your bike.</p></div><div class="rider-menu">${[['overview','Overview'],['journeys','Rides'],['journal','Field journal'],['explore','Route lab'],['garage','Garage'],['community','Story drafts'],['settings','Settings']].map(([key,label])=>`<button data-rider-destination="${key}">${icon(key)}<span>${label}</span><span aria-hidden="true">${icon('arrow')}</span></button>`).join('')}</div><button class="rider-menu-close" data-action="close">Close</button>`);return;}
 const destination=event.target.closest('[data-rider-destination]');if(destination){$('#modal').close();navigate(destination.dataset.riderDestination);return;}
 const toggle=event.target.closest('[data-library-filter]');if(toggle){libraryFiltersOpen=!libraryFiltersOpen;toggle.setAttribute('aria-expanded',String(libraryFiltersOpen));$('#rides-filters').hidden=!libraryFiltersOpen;return;}
 const button=event.target.closest('[data-library-map]');if(!button)return;
 if(button.dataset.libraryMap==='open'){
  if(libraryMap){libraryMapEnabled=false;disposeLibraryMap();$('#library-atlas').classList.remove('with-geography');$('#library-map-status').textContent='Your latest route · offline';button.innerHTML=icon('explore')+' Map background';return;}
  modal(`<h2>A map behind your rides</h2><p class="subtle">Load OpenStreetMap tiles around your latest route? The map provider receives the viewed area and your connection. Recorded speeds and phone samples stay on this device.</p><div class="actions"><button data-action="close">Keep offline</button><button class="primary" data-library-map="confirm">Load map</button></div>`);
 }else{libraryMapEnabled=true;$('#modal').close();mountLibraryMap();}
});
window.addEventListener('pagehide',disposeLibraryMap);
window.addEventListener('pageshow',()=>{if(page==='journeys'&&libraryMapEnabled&&!libraryMap)mountLibraryMap();});
