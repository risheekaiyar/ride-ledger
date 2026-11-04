/* Track studio owns its WebGL lifecycle and synchronizes the existing ride timeline. */
let trackScene=null,trackView='3d',trackPlayback=0,trackTime=0,trackLastFrame=0,trackWasPlaying=false,trackExpanded=null;
const flatMapPanel=mapPanel;
mapPanel=function(ride,large=false){
 if(!ride?.track?.length)return flatMapPanel(ride,large);
 const is3d=trackView==='3d';
 return `<section class="track-studio panel"><div class="track-studio-head"><div><span class="eyebrow">ODO / TRACK STUDIO</span><h2>${esc(ride.title)}</h2></div><div class="track-view-switch" role="group" aria-label="Route view"><button data-track-view="3d" aria-pressed="${is3d}">3D track</button><button data-track-view="2d" aria-pressed="${!is3d}">Route map</button></div></div><div class="track-viewport ${large?'track-large':''}"><div id="map-canvas" class="track-canvas" data-renderer="${is3d?'pending':'2d'}">${!is3d?routeSvg(ride):''}</div><div class="track-broadcast"><span class="track-live-dot"></span><span>RIDE REPLAY</span><span class="track-broadcast-rule"></span><span>${esc(date(ride))}</span></div><button class="track-expand" data-track-action="expand" aria-label="Expand track preview" title="Expand track preview">⤢</button><div class="track-number" aria-hidden="true">${String(Math.max(1,rides.findIndex(r=>r.id===ride.id)+1)).padStart(2,'0')}</div><div class="track-hud"><div><span>PLAYHEAD</span><strong id="track-clock">${clock(0)}</strong></div><div><span id="track-speed-source" title="${ride.source==='GPX export'?'Distance/time estimate for the GPX interval':'Interpolated GPS speed during replay; sample speed when seeking'}">${ride.source==='GPX export'?'EST. SPEED':'GPS SPEED'}</span><strong id="track-speed">—<small> km/h</small></strong></div><div class="track-gap" id="track-gap" hidden>Recording gap</div></div><div class="track-orbit-hint" id="track-hint">${is3d?'Drag to orbit · pinch to zoom':'Recorded route · offline'}</div><div class="track-north" aria-label="North">N<span>↑</span></div><div class="track-fallback" id="track-fallback" hidden></div></div><div class="track-director"><div role="group" aria-label="Camera">${[['orbit','Overview'],['cinematic','Flyover'],['follow','Chase'],['top','Overhead']].map(([key,label])=>`<button data-track-camera="${key}" aria-pressed="${key==='orbit'}" ${is3d?'':'disabled'}>${label}</button>`).join('')}</div><div class="track-actions"><button data-track-action="elevation" aria-pressed="false" ${is3d?'':'disabled'}>Source elevation</button><button data-track-action="snapshot" aria-label="Save track image" ${is3d?'':'disabled'}>Save image</button></div></div><div class="playbar track-playbar"><button data-action="play" aria-label="Play route">${playbackIcon(false)}</button><input id="timeline" type="range" aria-label="Journey timeline" min="0" max="${Math.max(0,ride.track.length-1)}" value="0"><span class="timeline-readout" id="timeline-readout">0:00 · — km/h</span><select id="replay-rate" aria-label="Replay speed"><option value="10">10×</option><option value="30" selected>30×</option><option value="60">60×</option></select></div><div class="track-footnote"><span id="map-label">${is3d?'Smoothed route model · stylized road width · elevation off':'Recorded route · offline schematic'}</span><button data-action="enable-map">Load geographic map</button></div><div id="coordinate-readout" class="map-control-note">Scrub to inspect a recorded sample.</div></section>`;
};
function disposeTrackScene(){if(trackScene){trackScene.dispose();trackScene=null;}}
function trackFallback(message){
 disposeTrackScene();const container=$('#map-canvas');if(!container)return;
 container.innerHTML=routeSvg(current());container.dataset.renderer='fallback';
 const fallback=$('#track-fallback');if(fallback){fallback.hidden=false;fallback.textContent='3D unavailable · showing the recorded 2D route';}
 $$('[data-track-camera],[data-track-action]:not([data-track-action=expand])').forEach(b=>b.disabled=true);
 $('#map-label').textContent=message;$('#track-hint').textContent='Recorded route · offline';
}
function updateTrackReadouts(s){
 updateSampleInspector(s.time);const ride=current();if(ride)updateTelemetryAccessibility(ride,s.time);
 if($('#timeline-readout'))$('#timeline-readout').textContent=clock(s.time)+' · '+fmt(s.speed,0)+' km/h';
 const dot=$('#route-dot');if(dot)dot.style.visibility=s.gap?'hidden':'visible';if(marker?.getElement)marker.getElement().hidden=s.gap;
 if($('#track-clock'))$('#track-clock').textContent=clock(s.time);
 if($('#track-speed'))$('#track-speed').innerHTML=`${fmt(s.speed,0)}<small> km/h</small>`;
 if($('#track-gap'))$('#track-gap').hidden=!s.gap;
 if($('#telemetry-speed'))$('#telemetry-speed').textContent=fmt(s.speed,0);
 if($('#telemetry-moment'))$('#telemetry-moment').textContent=s.gap?'Recording gap':clock(s.time)+' / '+clock(current().duration);
 const cursor=$('#telemetry-cursor');if(cursor){const x=Math.max(0,Math.min(600,s.time/current().duration*600));cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);}
}
function mountTrackScene(){
 const container=$('#map-canvas'),ride=current();
 if(trackScene||!container||!ride?.track?.length||!container.closest('.track-studio')||trackView!=='3d')return;
 try{
  trackScene=OdoTrackScene.create(container,ride,{onState:updateTrackReadouts,onUnavailable:()=>{stopPlay();trackFallback('The graphics context was interrupted. Switch to 3D track to retry.');}});
  const elevation=$('[data-track-action=elevation]');
  elevation.disabled=!trackScene.model.elevationAvailable;
  elevation.title=trackScene.model.elevationAvailable?'Use recorded source altitude, without terrain or vertical exaggeration':'This recording does not have a complete elevation channel';
  trackTime=ride.track[playIndex]?.[2]??ride.track[0][2];trackScene.setTime(trackTime);container.dataset.renderer='webgl';
 }catch(error){trackFallback(error.message);}
}
const renderBeforeTrack=render;
render=function(){collapseTrackPreview();disposeTrackScene();renderBeforeTrack();mountTrackScene();};
const updateBeforeTrack=updateTimeline;
updateTimeline=function(index){
 updateBeforeTrack(index);const point=current()?.track[index];if(!point)return;
 trackTime=point[2];if(trackScene)trackScene.setTime(trackTime);else updateTrackReadouts({time:trackTime,speed:point[3],gap:false});
};
const stopBeforeTrack=stopPlay;
stopPlay=function(){
 stopBeforeTrack();cancelAnimationFrame(trackPlayback);trackPlayback=0;trackWasPlaying=false;
 setPlaybackButton(false);
};
function seekTrackTime(value){
 const ride=current();if(!ride?.track.length||!Number.isFinite(value))return;
 stopPlay();const time=Math.max(0,Math.min(ride.duration,value)),index=OdoTelemetry.nearest(ride.track,time);
 updateBeforeTrack(index);trackTime=time;
 if(trackScene)trackScene.setTime(time);else{const sample=OdoTelemetry.inspect(ride,time);updateTrackReadouts({time,speed:sample.speed,gap:sample.gap});}
}
function animateTrackPlayback(now){
 if(!trackWasPlaying)return;
 const dt=Math.min(.1,(now-trackLastFrame)/1000);trackLastFrame=now;const r=current();if(!r)return stopPlay();
 trackTime+=dt*Number($('#replay-rate')?.value||30);
 const end=r.track.at(-1)[2],time=Math.min(end,trackTime),index=OdoTelemetry.nearest(r.track,time);
 updateBeforeTrack(index);trackScene?.setTime(time);trackTime=time;
 if(time>=end)return stopPlay();trackPlayback=requestAnimationFrame(animateTrackPlayback);
}
function expandTrackPreview(){
 if(trackExpanded)return collapseTrackPreview();
 const panel=$('.track-studio');if(!panel)return;
 const placeholder=document.createComment('track-preview-position'),dialog=document.createElement('dialog'),scrollY=window.scrollY;
 panel.before(placeholder);dialog.className='track-expanded-dialog';dialog.setAttribute('aria-label','Expanded track preview');dialog.append(panel);document.body.append(dialog);
 trackExpanded={panel,placeholder,dialog,scrollY};
 const button=panel.querySelector('[data-track-action=expand]');button.textContent='×';button.setAttribute('aria-label','Close expanded preview');button.title='Close expanded preview';
 dialog.addEventListener('cancel',event=>{event.preventDefault();collapseTrackPreview();});dialog.addEventListener('close',()=>{if(trackExpanded?.dialog===dialog)collapseTrackPreview();});
 dialog.showModal();button.focus({preventScroll:true});
}
function collapseTrackPreview(){
 if(!trackExpanded)return;
 const {panel,placeholder,dialog,scrollY}=trackExpanded;trackExpanded=null;
 dialog.close();placeholder.replaceWith(panel);dialog.remove();
 const button=panel.querySelector('[data-track-action=expand]');button.textContent='⤢';button.setAttribute('aria-label','Expand track preview');button.title='Expand track preview';button.focus({preventScroll:true});window.scrollTo(0,scrollY);
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.action==='play'&&trackScene){
  event.stopImmediatePropagation();if(trackWasPlaying)return stopPlay();
  if(trackTime>=current().track.at(-1)[2])trackTime=current().track[0][2];
  trackWasPlaying=true;setPlaybackButton(true);trackLastFrame=performance.now();trackPlayback=requestAnimationFrame(animateTrackPlayback);return;
 }
 if(b.dataset.trackView){stopPlay();trackView=b.dataset.trackView;render();return;}
 if(b.dataset.trackCamera){trackScene?.preset(b.dataset.trackCamera);$$('[data-track-camera]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));return;}
 if(b.dataset.trackAction==='expand'){expandTrackPreview();return;}
 if(b.dataset.trackAction==='elevation'&&trackScene){
  const enabled=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(enabled));trackScene.setElevation(enabled);
  $('#map-label').textContent=enabled?'Source altitude · unverified vertical accuracy · stylized road width':'Smoothed route model · stylized road width · elevation off';return;
 }
 if(b.dataset.trackAction==='snapshot'&&trackScene){
  modal(`<h2>Export this track view?</h2><p class="subtle">The image includes your route shape, which can reveal places even without map labels. No timestamps or coordinates are printed.</p><div class="actions"><button data-action="close">Cancel</button><button class="primary" id="confirm-track-image">Save image</button></div>`);
  $('#confirm-track-image').onclick=()=>{try{const url=trackScene.snapshot();if(window.RideNative?.shareStory)window.RideNative.shareStory(url);else{const a=document.createElement('a');a.href=url;a.download='odo-track-preview.png';a.click();}$('#modal').close();}catch(error){toast('Could not export this view: '+error.message);}};return;
 }
 // Keep the current 3D view while map consent is open; switch only after the explicit load action.
 if(b.dataset.mapConfirm){stopPlay();trackView='2d';render();}
},true);
document.addEventListener('input',e=>{if(e.target.id==='timeline'&&(trackWasPlaying||playTimer))stopPlay();},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();});
window.addEventListener('pagehide',()=>{stopPlay();disposeTrackScene();});
window.addEventListener('pageshow',()=>mountTrackScene());
if($('#map-canvas'))mountTrackScene();
