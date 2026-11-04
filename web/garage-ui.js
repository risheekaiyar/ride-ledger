/* Bike profile, local showroom and rider-confirmed odometer checkpoints. */
function garageMileage(bike, associated, reading){
 const anchor=bike.odoCheckpoint?.bike===bike.name?bike.odoCheckpoint:null;
 const recorded=anchor?associated.filter(r=>r.distanceReliable&&r.source!=='GPX export'&&r.started>=anchor.at):[];
 const km=recorded.reduce((sum,r)=>sum+r.distanceKm,0);
 const scale=anchor&&Number.isFinite(anchor.scale)&&anchor.scale>=.8&&anchor.scale<=1.2?anchor.scale:1;
 return {anchor,km,scale,value:reading===null?null:reading+km*scale};
}
function garageCluster(bike,mileage){
 const visual=OdoBikeVisual.profile(null,bike),lcd=visual.model.cluster==='lcd',value=mileage.value;
 const odometer=value===null?'—':fmt(value,0);
 return `<div class="garage-cluster ${lcd?'cluster-lcd':'cluster-tft'}">
   <div class="cluster-lamps" aria-hidden="true"><span>◈</span><span>◀</span><span>◆</span><span>▶</span><span>◈</span></div>
   <div class="cluster-face">
     <div class="cluster-rev" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--segment:${i}"></i>`).join('')}</div>
     <div class="cluster-odo"><div><span>ODO · ${mileage.km?'ESTIMATE':'LAST READING'}</span><strong aria-label="${odometer} kilometres">${odometer}<small>km</small></strong></div><span>JOURNAL<br><b>${fmt(mileage.km,1)} km</b></span></div>
   </div>
 </div><div class="garage-cluster-actions"><button data-odo-refresh>Replay startup</button><button data-odo-correct>Correct odometer</button></div>`;
}
function correctGarageOdometer(){
 const bike=prefs.bike,associated=rides.filter(r=>r.kind==='ride'&&r.bike_id===bike.name);
 const reading=String(bike.odometer??'').trim()===''?null:Number(bike.odometer);
 const mileage=garageMileage(bike,associated,Number.isFinite(reading)?reading:null);
 modal(`<h2>Update the bike’s odometer</h2>
  <p class="subtle">Enter the reading on the bike now. Odo adds supported GPS distance recorded after this checkpoint to estimate the next reading.</p>
  <form id="odo-checkpoint-form">
   <label>Reading on bike (km)<input name="reading" type="number" min="0" max="2000000" step="1" required></label>
   ${mileage.anchor&&mileage.km>=20?'<label class="odo-confirm"><input name="complete" type="checkbox"> Odo recorded all the distance since the last reading</label>':''}
   <p class="tiny">A complete interval of at least 20 km can adjust future distance estimates. Original ride measurements stay available in the ride log.</p>
   <div class="actions"><button type="button" data-action="close">Cancel</button><button class="primary">Save reading</button></div>
  </form>`);
 $('#odo-checkpoint-form').onsubmit=event=>{
  event.preventDefault();event.stopPropagation();
  const data=new FormData(event.target),next=Number(data.get('reading'));
  if(!Number.isFinite(next)||next<0||next>2000000)return;
  const ratio=reading!==null&&mileage.km>=20?(next-reading)/mileage.km:0;
  const scale=data.has('complete')&&ratio>=.8&&ratio<=1.2?ratio:1;
  bike.odometer=String(next);bike.odoCheckpoint={at:Date.now(),bike:bike.name,scale,
   ...(reading!==null&&mileage.km>0?{comparison:{actual:next-reading,logged:mileage.km,confirmed:data.has('complete')}}:{})};
  savePrefs();$('#modal').close();render();
  toast(scale===1?'Odometer reading saved.':'Reading saved and future distance estimate adjusted.');
 };
}
garage=function(){
 const bike=prefs.bike,types=['Unknown','Adventure','Sport','Touring','Roadster','Cruiser','Scooter','Off-road'],type=types.includes(bike.type)?bike.type:'Unknown';
 const associated=rides.filter(r=>r.kind==='ride'&&r.bike_id===bike.name),supported=associated.filter(r=>r.distanceReliable),latest=associated[0];
 const distance=supported.length?supported.reduce((sum,r)=>sum+r.distanceKm,0):null,totalTime=associated.reduce((sum,r)=>sum+r.duration,0);
 const odometer=bike.odometer!==''&&bike.odometer!==null&&bike.odometer!==undefined&&Number.isFinite(Number(bike.odometer))&&Number(bike.odometer)>=0?Number(bike.odometer):null;
 const mileage=garageMileage(bike,associated,odometer);
 const visual=OdoBikeVisual.profile(null,bike);
 const modelValue=bike.model||visual.model.id;
 const photo=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(bike.photo||'')?bike.photo:'';
 return `<section class="garage-page"><div class="garage-page-head"><div><span class="eyebrow">THE OTHER HALF OF YOUR STORY</span><h1>Your garage.</h1><p>A home for your bike. Context for every ride.</p></div><button data-garage-record><span class="record-dot"></span> Record this bike</button></div><div class="garage-layout"><div class="garage-main"><section class="garage-hero"><div class="garage-hero-title"><div><span class="garage-type">${type==='Unknown'?'YOUR BIKE':esc(type.toUpperCase())}</span><h2>${esc(bike.name)}</h2></div><button data-garage-edit aria-label="Edit bike details">${icon('arrow')}</button></div><div class="garage-hero-visual ${photo?'with-photo':''}">
 <div class="garage-bike-viewer" data-bike-viewer>${photo?`<img src="${photo}" alt="Saved bike photo">`:bikeArt}</div>
 <span class="garage-illustration-label">3D ILLUSTRATION · DRAG TO ROTATE</span>
 </div><div class="garage-media-actions">
 <button data-action="photo">${photo?'Change saved photo':'Add bike photo'}</button>
 ${photo?'<button data-garage-photo-view>Show saved photo</button>':''}
 ${visual.model.reference?`<a href="${visual.model.reference}" target="_blank" rel="noopener">Official model reference ↗</a>`:''}
 </div><div class="garage-odometer">
 <div><span>YOUR BIKE / ODOMETER</span><p>Last rider reading · ${fmt(odometer,0)} km${mileage.anchor?` · Distance factor ${fmt(mileage.scale,3)}`:''}</p></div>
 <span class="garage-local-badge">${icon('check')} On this device</span></div>
 ${garageCluster(bike,mileage)}${mileage.anchor?.comparison?'<button class="garage-odo-ask" data-odo-debrief>✦ Ask Odo about the difference</button>':''}
</section><section class="garage-log"><div class="garage-log-heading"><span class="eyebrow">THIS BIKE / YOUR JOURNAL</span><span>Matched by saved bike name</span></div><div class="garage-log-stats"><div><strong>${associated.length}</strong><span>Recorded rides</span></div><div><strong>${associated.length?`${Math.floor(totalTime/3600)}<small>h</small> ${Math.floor(totalTime/60)%60}<small>m</small>`:'—'}</strong><span>Time recorded</span></div><div><strong>${fmt(distance,1)} <small>km</small></strong><span>${supported.length} of ${associated.length} rides support distance</span></div></div>${associated.length?'':`<div class="garage-empty-log"><p>Add bike context to a saved ride, or record your next one with this bike’s name.</p><button data-page="journeys">Browse saved rides ${icon('arrow')}</button></div>`}</section></div><div class="garage-side"><details class="garage-editor" ${matchMedia('(min-width:900px)').matches?'open':''}><summary><div><span class="eyebrow">MAKE IT YOURS</span><h2>Bike details</h2></div><span aria-hidden="true">＋</span></summary><form id="bike-form"><label>Model reference<select name="model">${OdoBikeVisual.models.map(m=>`<option value="${m.id}" ${m.id===modelValue?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><label>Replay color<input name="color" type="color" value="${visual.color}"></label><label>Bike name or nickname<input name="name" maxlength="100" value="${esc(bike.name)}" required></label><label>Bike type<select name="type">${types.map(t=>`<option ${t===type?'selected':''}>${t}</option>`).join('')}</select></label><div class="garage-form-row"><label>Odometer (km)<input name="odometer" type="number" min="0" max="2000000" step="1" value="${esc(bike.odometer)}" placeholder="Not entered"></label><label>Private plate nickname<input name="plate" maxlength="30" value="${esc(bike.plate)}" placeholder="Optional"></label></div><label>Setup notes<textarea name="notes" maxlength="1000" placeholder="Tyres, suspension, luggage…">${esc(bike.notes)}</textarea></label><p>Renaming this profile leaves the bike names saved in earlier recordings unchanged.</p><button class="primary" type="submit">Save bike details</button>${photo?'<button type="button" data-garage-remove-photo class="garage-remove-photo">Remove saved photo</button>':''}</form></details><section class="garage-source-card"><span class="eyebrow">WHERE YOUR DATA COMES FROM</span><div><span>Route & speed</span><strong>Phone GPS / imported track</strong></div><div><span>Motion</span><strong>Phone sensors, when recorded</strong></div><div><span>Bike telemetry</span><strong>Not connected</strong></div><p>RPM, gears, fuel and tyre pressure need a documented compatible bike sensor or export. Phone motion alone cannot supply them.</p></section></div></div><section class="garage-setup-card"><div class="garage-setup-copy"><span class="eyebrow">${latest?'LATEST RECORDED SETUP':'THE SETUP BEHIND THE SIGNAL'}</span><h2>${latest?'A little context goes a long way.':'Start with a repeatable setup.'}</h2><p>${latest?`${esc(date(latest))} · ${esc(latest.title)}`:'Keep your bike, phone and placement consistent to make future comparisons more useful.'}</p></div><div class="garage-setup-facts"><div><span>Phone placement</span><strong>${esc(latest?.placement||'Not recorded')}</strong></div><div><span>Mount condition</span><strong>${esc(latest?.mount_condition||'Not recorded')}</strong></div><div><span>Recording device</span><strong>${esc(latest?.device||'Not supplied')}</strong></div></div><div class="garage-odo"><span aria-hidden="true">✦</span><div><strong>Make sense of your setup with Odo.</strong><p>Your Meta companion uses the context saved with the ride.</p></div>${latest?`<button data-garage-debrief="${esc(latest.id)}">Debrief this ride</button>`:'<button data-garage-record>Set up a recording</button>'}</div></section></section>`;
};
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-odo-correct'))return correctGarageOdometer();
 if(button.hasAttribute('data-odo-refresh')){
  const cluster=$('.garage-cluster');cluster.classList.remove('cluster-starting');void cluster.offsetWidth;cluster.classList.add('cluster-starting');return;
 }
 if(button.hasAttribute('data-garage-photo-view')){
  modal(`<h2>Your saved bike photo</h2><img class="garage-modal-photo" src="${$('.garage-hero-visual').classList.contains('with-photo')&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(prefs.bike.photo)?prefs.bike.photo:''}" alt="Saved bike photo"><div class="actions"><button data-action="close">Close</button></div>`);
  return;
 }
 if(button.hasAttribute('data-odo-debrief')){
  const comparison=prefs.bike.odoCheckpoint?.comparison;
  const ride=rides.find(r=>r.kind==='ride'&&r.bike_id===prefs.bike.name);
  if(!comparison||!ride)return toast('Add a recorded ride and an odometer correction first.');
  selected=ride.id;museSetup();
  const question=$('#companion-form [name=question]');
  if(question)question.value=`My bike odometer changed by ${fmt(comparison.actual,1)} km. Odo logged ${fmt(comparison.logged,1)} km. ${comparison.confirmed?'I recorded all rides in this interval.':'The interval may include unrecorded rides.'} Help me interpret this difference and suggest a reliable way to check the distance estimate.`;
  return;
 }
 if(button.hasAttribute('data-garage-record')){
  if(recording)toast('A journey is already recording. Use the top recording control to end it before starting another.');
  else recorder();
 }
 if(button.hasAttribute('data-garage-edit')){const editor=$('.garage-editor');editor.open=true;editor.scrollIntoView({block:'start',behavior:'smooth'});$('#bike-form [name=name]').focus({preventScroll:true});}
 if(button.hasAttribute('data-garage-remove-photo')){prefs.bike.photo='';savePrefs();render();toast('Photo removed from this profile.');}
 if(button.dataset.garageDebrief){selected=button.dataset.garageDebrief;museSetup();}
});
document.addEventListener('submit',event=>{if(event.target.id!=='bike-form')return;const name=event.target.elements.name;name.value=name.value.trim();if(!name.value){event.preventDefault();event.stopImmediatePropagation();name.setCustomValidity('Enter a bike name or nickname.');name.reportValidity();return;}
 const odometer=event.target.elements.odometer.value;
 if(name.value!==prefs.bike.name||odometer!==String(prefs.bike.odometer??'')){
  prefs.bike.odoCheckpoint=odometer===''?null:{at:Date.now(),bike:name.value,scale:1};
 }
},true);
document.addEventListener('input',event=>{if(event.target.closest('#bike-form')&&event.target.name==='name')event.target.setCustomValidity('');});

document.addEventListener('change',event=>{
 const field=event.target;
 if(!field.matches('#bike-form [name=model]'))return;
 const model=OdoBikeVisual.models.find(item=>item.id===field.value);
 if(!model?.type)return;
 field.form.elements.name.value=model.name;
 field.form.elements.type.value=model.type;
});
let disposeGarageViewer=null;
const renderBeforeGarage=render;
render=function(){
 disposeGarageViewer?.();disposeGarageViewer=null;
 renderBeforeGarage();
 const host=$('[data-bike-viewer]');
 if(host){
  try{disposeGarageViewer=OdoBikeVisual.viewer(host,OdoBikeVisual.profile(null,prefs.bike));}
  catch{const label=$('.garage-illustration-label');if(label)label.textContent='BIKE PREVIEW';}
  $('.garage-cluster')?.classList.add('cluster-starting');
 }
};
