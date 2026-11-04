/* The preview stays local. Exporting a route and handing it to a share target are explicit actions. */
const filmTransfers=new Map();
window.odoClipShared=(id,error)=>{const request=filmTransfers.get(id);if(!request)return;clearTimeout(request.timer);filmTransfers.delete(id);error?request.reject(Error(error)):request.resolve();};
function sendNativeFilm(blob){
 return new Promise((resolve,reject)=>{
  const id='clip_'+crypto.randomUUID().replaceAll('-',''),reader=new FileReader();
  reader.onerror=()=>reject(Error('The clip could not be read for sharing.'));
  reader.onload=()=>{const timer=setTimeout(()=>{filmTransfers.delete(id);reject(Error('Android did not confirm the share sheet. Keep the app visible and try again.'));},30000);filmTransfers.set(id,{resolve,reject,timer});try{window.RideNative.shareClip(id,reader.result);}catch(error){window.odoClipShared(id,error.message||'Android sharing failed.');}};
  reader.readAsDataURL(blob);
 });
}
function openRideFilm(){
 const ride=current();if(!ride?.track?.length)return toast('Open a ride with a recorded route first.');
 const previousTime=trackTime;stopPlay();collapseTrackPreview();disposeTrackScene();
 modal(`<div class="film-head"><div><span class="eyebrow">ODO / MOTION STUDIO</span><h2>The ride, in motion.</h2><p>A track preview with a race-weekend finish.</p></div><button data-action="close" aria-label="Close motion studio">×</button></div><div class="film-editor"><div class="film-preview"><canvas id="film-canvas" aria-label="Private ride clip preview"></canvas><video id="film-video" controls playsinline muted hidden aria-label="Rendered ride clip"></video><span class="film-preview-label">PRIVATE PREVIEW / 9:16</span></div><div class="film-options"><div class="film-series"><span>01</span><div><strong>Your route. On the grid.</strong><p>720 × 1280 · silent · rendered on this device</p></div></div><label>Headline<input id="film-headline" maxlength="40" value="THE RIDE, REPLAYED."></label><div class="film-fields"><label>Edition<select id="film-accent"><option value="race">Race orange</option><option value="ice">Ice blue</option></select></label><label>Clip length<select id="film-duration"><option value="12">12 seconds</option><option value="18">18 seconds</option></select></label></div><div class="film-scrub"><button id="film-play" aria-label="Play clip preview">${playbackIcon(false)}</button><input id="film-timeline" type="range" min="0" max="1000" step="1" value="0" aria-label="Clip preview position"><span id="film-position">0%</span></div><fieldset class="film-sharing"><legend>What goes in your clip</legend><label class="check"><input type="checkbox" id="film-route"> Include my route shape</label><p>A route can reveal places even without map labels. The preview stays on this device.</p><label class="check"><input type="checkbox" id="film-speed"> Include replay speed</label><p>GPS readings or GPX estimates, with missing intervals left unknown.</p></fieldset><div class="film-status" role="status" id="film-status">Preparing the track…</div><progress id="film-progress" max="1" value="0" aria-label="Video render progress" hidden></progress><div class="film-actions"><button id="film-render" class="primary" disabled>Render clip</button><button id="film-cancel" hidden>Cancel render</button><button id="film-save" disabled>${window.RideNative?'Share clip':'Save clip'}</button></div><p class="film-runtime-note">Keep Odo visible while it renders. No microphone, camera or map service is used.</p></div></div>`);
 const dialog=$('#modal');dialog.classList.add('film-modal');
 const canvas=$('#film-canvas'),video=$('#film-video'),status=$('#film-status'),renderButton=$('#film-render'),saveButton=$('#film-save'),cancelButton=$('#film-cancel'),progressBar=$('#film-progress'),timeline=$('#film-timeline'),play=$('#film-play');
 const options=()=>({headline:$('#film-headline').value,accent:$('#film-accent').value,includeSpeed:$('#film-speed').checked});
 let codec=null,codecChecked=false;const nativeUnavailable=window.RideNative&&typeof window.RideNative.shareClip!=='function';
 const host=document.createElement('div');host.className='film-render-host';host.style.cssText='position:fixed;left:-12000px;top:0;width:720px;height:548px;pointer-events:none';host.setAttribute('aria-hidden','true');document.body.append(host);
 let scene=null,closed=false,previewFrame=0,previewStart=0,position=0,controller=null,result=null,url=null,sharing=false,failed=false;
 function stopPreview(){cancelAnimationFrame(previewFrame);previewFrame=0;play.innerHTML=playbackIcon(false);play.setAttribute('aria-label','Play clip preview');}
 function clearResult(){video.pause();video.removeAttribute('src');video.load();video.hidden=true;canvas.hidden=false;if(url)URL.revokeObjectURL(url);url=null;result=null;saveButton.disabled=true;}
 function available(){return scene&&!failed&&codec&&(codec.mode==='frames'||typeof canvas.captureStream==='function')&&!nativeUnavailable;}
 function idleStatus(){status.textContent=failed?'The 3D renderer was interrupted. Close and reopen the studio to retry.':nativeUnavailable?'Update the Android app to share video clips. PNG posters remain available.':!codecChecked?'Checking video support…':!codec||codec.mode!=='frames'&&typeof canvas.captureStream!=='function'?'Video encoding is unavailable on this device. You can still use the PNG poster studio.':`Ready for ${codec.extension.toUpperCase()} · ${codec.mode==='frames'?'24 fps':'real-time encoding'} · ${$('#film-route').checked?'route included':'choose route inclusion to render'}`;}
 function controls(){const busy=!!controller||sharing;for(const el of $$('.film-options input,.film-options select'))el.disabled=busy;play.disabled=busy||!scene||failed;renderButton.disabled=busy||!available()||!$('#film-route').checked;saveButton.disabled=busy||!result;cancelButton.hidden=!controller;progressBar.hidden=!controller;}
 function draw(p){if(!scene||closed||failed)return;position=Math.max(0,Math.min(1,p));OdoRideFilm.paint(canvas,scene,ride,position,options());timeline.value=String(Math.round(position*1000));$('#film-position').textContent=Math.round(position*100)+'%';}
 function animate(now){if(closed||!scene||failed)return;const duration=Number($('#film-duration').value),p=Math.min(1,(now-previewStart)/(duration*1000));draw(p);if(p>=1)stopPreview();else previewFrame=requestAnimationFrame(animate);}
 function cancel(reason){if(controller){controller.abort();status.textContent=reason;}stopPreview();}
 function visibility(){if(document.hidden){cancel('Rendering cancelled because Odo was moved to the background.');video.pause();}}
 function cleanup(restore=true){if(closed)return;closed=true;cancel('');clearResult();scene?.dispose();scene=null;host.remove();dialog.classList.remove('film-modal');document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',hide);dialog.removeEventListener('close',cleanup);if(restore!==false){mountTrackScene();if(current()?.id===ride.id){if(trackScene)trackScene.setTime(previousTime);trackTime=previousTime;}}}
 const hide=()=>{cleanup(false);dialog.close();};dialog.addEventListener('close',cleanup);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',hide);
 try{scene=OdoTrackScene.create(host,ride,{autoRender:false,pixelRatio:1,shadowSize:1024,onUnavailable:()=>{failed=true;cancel('The graphics context was interrupted. Reopen the studio to retry.');idleStatus();controls();}});draw(0);idleStatus();}catch(error){failed=true;status.textContent=error.message||'This route cannot be rendered in 3D.';}
 controls();OdoRideFilm.encoder().then(value=>{if(closed)return;codec=value;codecChecked=true;idleStatus();controls();}).catch(()=>{if(closed)return;codecChecked=true;idleStatus();controls();});
 play.onclick=()=>{if(previewFrame){stopPreview();return;}clearResult();if(position>=1)position=0;previewStart=performance.now()-position*Number($('#film-duration').value)*1000;play.innerHTML=playbackIcon(true);play.setAttribute('aria-label','Pause clip preview');previewFrame=requestAnimationFrame(animate);};
 timeline.oninput=()=>{stopPreview();clearResult();draw(Number(timeline.value)/1000);controls();};
 for(const id of ['film-headline','film-accent','film-duration','film-speed','film-route'])$('#'+id).addEventListener(id==='film-headline'?'input':'change',()=>{stopPreview();clearResult();draw(position);idleStatus();controls();});
 cancelButton.onclick=()=>cancel('Rendering cancelled. Your ride is unchanged.');
 renderButton.onclick=async()=>{
  if(!available()||!$('#film-route').checked||controller)return;stopPreview();clearResult();controller=new AbortController();controls();status.textContent=codec.mode==='frames'?'Rendering every frame locally… this can take longer than the clip.':'Rendering in real time… keep Odo visible.';progressBar.value=0;
  try{
   const rendered=await OdoRideFilm.record(canvas,draw,{duration:Number($('#film-duration').value),codec,signal:controller.signal,onProgress:p=>{progressBar.value=p;}});
   if(closed)return;result=rendered;url=URL.createObjectURL(result.blob);video.src=url;video.hidden=false;canvas.hidden=true;
   status.textContent=`${result.extension.toUpperCase()} ready${result.mode==='frames'?' · 24 fps':''} · ${(result.blob.size/1024/1024).toFixed(1)} MB · preview before sharing.`;
  }catch(error){if(!closed&&error.name!=='AbortError')status.textContent=error.message||'Video rendering failed.';}
  finally{controller=null;if(!closed)controls();}
 };
 saveButton.onclick=async()=>{
  if(!result||sharing)return;sharing=true;controls();video.pause();
  try{
   if(window.RideNative?.shareClip){status.textContent='Preparing the Android share sheet…';await sendNativeFilm(result.blob);if(!closed)status.textContent='Share sheet opened. Choose where to send your clip.';}
   else{
    const file=new File([result.blob],`odo-ride.${result.extension}`,{type:result.type});
    if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'My Odo ride'});if(!closed)status.textContent='Clip handed to the selected app.';return;}catch(error){if(error.name==='AbortError'){if(!closed)status.textContent='Sharing cancelled. Your clip is still ready.';return;}}}
    const a=document.createElement('a'),downloadUrl=URL.createObjectURL(result.blob);a.href=downloadUrl;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(downloadUrl),10000);if(!closed)status.textContent='Clip saved through your browser.';
   }
  }catch(error){if(!closed)status.textContent=error.message||'The clip could not be shared.';}
  finally{sharing=false;if(!closed)controls();}
 };
}
