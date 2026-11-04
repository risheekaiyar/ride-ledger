/* Phone-owned hardware preflight. Setup guidance is deterministic, not a model result. */
const recordingSensors=[
 [1,'Acceleration','Includes gravity','m/s²'],[4,'Gyroscope','Phone rotation','rad/s'],
 [11,'Orientation','Android rotation vector','unitless'],[9,'Gravity','Estimated gravity vector','m/s²'],
 [10,'Linear acceleration','Estimated gravity removed','m/s²'],[2,'Magnetic field','Optional environment channel','µT'],
 [5,'Light','Optional environment channel','lx'],[6,'Pressure','If the phone has a barometer','hPa']
];
const recorderBeforeSetup=recorder;
function recordingCapabilities(){
 try{const value=JSON.parse(window.RideNative?.recordingCapabilities?.()||'null');return value?.schema===1&&Array.isArray(value.sensors)?value:null;}catch{return null;}
}
recorder=function(){
 if(recording||!window.RideNative)return recorderBeforeSetup();
 const previous=prefs.recordingSetup||{},placement=['Pocket','Bag','Rigid mount'].includes(previous.placement)?previous.placement:'Pocket',bikeType=['Unknown','Adventure','Sport','Touring','Roadster','Cruiser','Scooter','Off-road'].includes(previous.bike_type)?previous.bike_type:'Unknown';
 modal(`<div class="record-setup-head"><div><span class="eyebrow">BEFORE THE NEXT CHAPTER</span><h2>Ready when you are.</h2><p>Your bike. Your phone. The right context.</p></div><button data-action="close" aria-label="Close recording setup">×</button></div><form id="record-form"><div class="record-setup-grid"><div class="record-setup-main"><div class="record-step"><span>01</span><h3>The ride</h3></div><label>Bike for this recording<input name="bike_id" required maxlength="100" value="${esc(prefs.bike.name)}"></label><div class="record-fields"><label>Bike type<select name="bike_type">${['Unknown','Adventure','Sport','Touring','Roadster','Cruiser','Scooter','Off-road'].map(type=>`<option ${type===bikeType?'selected':''}>${type}</option>`).join('')}</select></label><label>Activity<select name="activity"><option value="ride">Motorcycle ride</option><option value="walk">Walk</option></select></label></div><div class="record-step"><span>02</span><h3>Where’s your phone?</h3></div><fieldset class="record-placement"><legend>Phone placement</legend>${[['Pocket','With you'],['Bag','Packed away'],['Rigid mount','On the bike']].map(([value,note])=>`<label><input type="radio" name="placement" value="${value}" ${value===placement?'checked':''}><span class="placement-symbol" aria-hidden="true">${value==='Pocket'?'<svg viewBox="0 0 40 40"><path d="M8 8h24v18L20 34 8 26zM12 14h16"/></svg>':value==='Bag'?'<svg viewBox="0 0 40 40"><rect x="9" y="13" width="22" height="21" rx="5"/><path d="M15 13V9a5 5 0 0 1 10 0v4M13 23h14"/></svg>':'<svg viewBox="0 0 40 40"><rect x="13" y="5" width="14" height="24" rx="3"/><path d="M6 33h28M20 29v4M17 10h6"/></svg>'}</span><strong>${value}</strong><small>${note}</small></label>`).join('')}</fieldset><label id="record-mount-label" ${placement==='Rigid mount'?'':'hidden'}>Mount condition today<select name="mount_condition"><option>Unknown</option><option>Stable</option><option>Slipping</option><option hidden ${placement!=='Rigid mount'?'selected':''}>Not mounted</option></select></label><div class="record-placement-note" id="record-placement-note" role="status"></div></div><div class="record-setup-side"><div class="record-step"><span>03</span><h3>Phone check</h3><button type="button" id="record-refresh">Refresh</button></div><div class="record-device-status" id="record-device-status" aria-live="polite"></div><details class="record-sensor-options"><summary>Recording channels <span id="record-channel-count"></span></summary><p>GPS records the route. Choose the phone channels you want alongside it.</p><div class="record-sensor-list">${recordingSensors.map(([type,label,note])=>`<label><input type="checkbox" name="sensor" value="${type}" ${[1,4,11,9,10].includes(type)?'checked':''}><span><strong>${label}</strong><small>${note}</small><small class="record-hardware" data-hardware="${type}">Availability checked at start</small></span><em data-hardware-state="${type}"></em></label>`).join('')}</div><p>Available hardware can still fail to register. Saved recording metadata reports which channels actually started.</p></details><div class="record-meta-note"><span aria-hidden="true">✦</span><div><strong>Context for your Odo debrief</strong><p>Bike and placement help Meta interpret the readings after your ride. Setup choices do not calibrate motorcycle lean or forces.</p></div></div></div></div><div class="record-setup-footer"><div><strong id="record-selection">GPS + phone channels</strong><span>Start while parked. Recording continues with the screen locked.</span></div><button class="primary" id="record-start" type="submit"><span class="record-dot"></span> Start journey</button></div></form>`);
 const dialog=$('#modal'),form=$('#record-form');dialog.classList.add('recording-modal');
 function updatePlacement(){
  const selected=form.elements.placement.value,mounted=selected==='Rigid mount';$('#record-mount-label').hidden=!mounted;
  if(!mounted)form.elements.mount_condition.value='Not mounted';
  $('#record-placement-note').innerHTML=`<strong>${mounted?form.elements.mount_condition.value==='Slipping'?'Mount movement changes the signal.':'A mount still needs context.':selected==='Pocket'?'The phone moves with your body.':'The phone can shift inside your bag.'}</strong><p>${mounted?'Engine vibration, road input and mount movement all reach the phone. Select how secure the holder is today.':'GPS can describe your route; motion also contains movement of your body or bag. It cannot directly measure bike lean or road impacts.'}</p>`;
 }
 function updateSelection(){const n=form.querySelectorAll('[name=sensor]:checked:not(:disabled)').length;$('#record-channel-count').textContent=`${n} selected`;$('#record-selection').textContent=n?`GPS + ${n} phone channels`:'GPS only · no phone motion';}
 function refresh(){
  if(!dialog.open||!form.isConnected)return null;
  const capabilities=recordingCapabilities();
  const rows=capabilities?[
   ['GPS provider',capabilities.gps_enabled===true?'Enabled':capabilities.gps_enabled===false?'Turn on location':'Not reported',capabilities.gps_enabled],
   ['Precise location',capabilities.precise_location===true?'Permission granted':capabilities.precise_location===false?'Will ask on start':'Not reported',capabilities.precise_location],
   ['Notifications',capabilities.notifications===true?'Permission granted':capabilities.notifications===false?'Will ask on start':'Not reported',capabilities.notifications]
  ]:[];
  $('#record-device-status').innerHTML=capabilities?rows.map(([label,value,ready])=>`<div><span>${label}</span><strong class="${ready===true?'ready':'pending'}">${value}</strong></div>`).join('')+(capabilities.gps_enabled===false?`<button type="button" id="record-location-settings">Open location settings</button>`:''):'<p>This app version cannot check hardware before recording. Channel availability will be recorded when the journey starts.</p>';
  for(const [type,, ,unit] of recordingSensors){
   const item=capabilities?.sensors.find(s=>s.type===type),available=typeof item?.available==='boolean'?item.available:null,input=form.querySelector(`[name=sensor][value="${type}"]`);
   input.disabled=available===false;if(input.disabled)input.checked=false;
   const facts=available===true?[typeof item.name==='string'?item.name.slice(0,100):'',Number.isFinite(item.resolution)&&item.resolution>0?`Resolution ${Number(item.resolution.toPrecision(3))} ${unit}`:''].filter(Boolean).join(' · '):'';
   $(`[data-hardware="${type}"]`).textContent=facts||(available===false?'Not present on this phone':'Availability checked at start');
   $(`[data-hardware-state="${type}"]`).textContent=available===false?'Unavailable':available===true?'Available':'Unchecked';
  }
  $('#record-start').disabled=capabilities?.gps_enabled===false;updateSelection();return capabilities;
 }
 form.addEventListener('change',event=>{if(event.target.name==='placement'){if(event.target.value==='Rigid mount')form.elements.mount_condition.value='Unknown';updatePlacement();}else if(event.target.name==='mount_condition')updatePlacement();if(event.target.name==='sensor')updateSelection();});
 form.addEventListener('click',event=>{if(event.target.closest('#record-refresh'))refresh();if(event.target.closest('#record-location-settings'))window.RideNative?.openLocationSettings?.();});
 form.addEventListener('submit',event=>{
  event.preventDefault();event.stopPropagation();if(refresh()?.gps_enabled===false){$('#record-device-status').scrollIntoView({block:'center'});return;}
  const data=new FormData(form),bike=String(data.get('bike_id')||'').trim();if(!bike){form.elements.bike_id.setCustomValidity('Enter a bike name or nickname.');form.elements.bike_id.reportValidity();return;}
  const types=data.getAll('sensor').map(Number),context={bike_id:bike,bike_type:data.get('bike_type'),mount_condition:data.get('placement')==='Rigid mount'?data.get('mount_condition'):'Not mounted'};
  try{window.RideNative.start(data.get('placement'),JSON.stringify(types),data.get('activity'),JSON.stringify(context));prefs.recordingSetup={placement:data.get('placement'),bike_type:data.get('bike_type')};savePrefs();dialog.close();}catch(error){toast('Could not start recording: '+error.message);}
 });
 form.elements.bike_id.addEventListener('input',()=>form.elements.bike_id.setCustomValidity(''));
 const resumed=()=>{if(!document.hidden)refresh();};window.addEventListener('focus',resumed);document.addEventListener('visibilitychange',resumed);
 dialog.addEventListener('close',()=>{dialog.classList.remove('recording-modal');window.removeEventListener('focus',resumed);document.removeEventListener('visibilitychange',resumed);},{once:true});
 updatePlacement();refresh();
};
$('#record-btn').onclick=()=>recorder();
// Native invokes this only after confirming the service is idle; a one-second UI poll may lag.
window.odoOpenRecordingSetup=()=>{recording=false;updateRecordButton();if(!($('#record-form')&&$('#modal').open))recorder();};
window.addEventListener('odo-ready',()=>window.RideNative?.ready?.());
