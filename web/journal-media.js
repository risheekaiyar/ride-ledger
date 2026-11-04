(function(root){
'use strict';
const J=root.OdoFieldJournal;
function dialog(title){
  const d=document.createElement('dialog');d.className='fj-dialog';d.setAttribute('aria-label',title);
  const header=document.createElement('header');header.innerHTML='<span>ODOme &nbsp; / &nbsp; FIELD JOURNAL</span><button type="button" aria-label="Close dialog">×</button>';
  header.querySelector('button').onclick=()=>d.close();d.append(header);
  const box=document.createElement('div');box.className='fj-dialog-body';d.append(box);document.body.append(d);
  d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();return {d,box};
}
function capture(source){
  const w=source.videoWidth||source.naturalWidth,h=source.videoHeight||source.naturalHeight;
  if(!w||!h)throw Error('Choose a frame after the preview loads.');
  const canvas=document.createElement('canvas');const scale=Math.min(1,640/Math.max(w,h));
  canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
  const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(source,0,0,canvas.width,canvas.height);
  for(const quality of [.78,.60,.42]){
    const url=J.cleanCanvasJpeg(canvas.toDataURL('image/jpeg',quality));
    if(url.startsWith('data:image/jpeg;base64,')&&atob(url.split(',')[1]).length<=J.clipLimit)return {url,width:canvas.width,height:canvas.height};
  }
  throw Error('This frame exceeds 96 KiB. Choose a different frame.');
}
function choose({ride,second,sample,onSave}){
  const {d,box}=dialog('Link a frame to your ride');
  box.innerHTML=`<p class="fj-kicker">01 / SELECT A MOMENT</p><h2>Link a frame.</h2><p>Pick one moment from a clip or photo. Match it to the time shown in your ride.</p>
  <label class="fj-file">Choose a photo or video<input type="file" accept="image/jpeg,image/png,image/webp,video/*"></label>
  <div class="fj-viewer" hidden></div><p class="fj-source-info" aria-live="polite"></p>
  <label>Ride time for this exact frame <input class="fj-anchor" type="text" value="${J.clock(second)}" placeholder="h:mm:ss" required></label>
  <p class="fj-hint">Ride length ${J.clock(ride.duration)}. Set the elapsed time yourself when the camera clock differs.</p>
  <label class="fj-check"><input type="checkbox" class="fj-aligned"> I matched this frame to that ride time.</label>
  <p class="fj-error" role="alert"></p><button type="button" class="fj-primary fj-use" disabled>Keep this frame on this device</button>`;
  const viewer=box.querySelector('.fj-viewer'),info=box.querySelector('.fj-source-info'),error=box.querySelector('.fj-error'),use=box.querySelector('.fj-use'),align=box.querySelector('.fj-aligned'),anchor=box.querySelector('.fj-anchor');
  let media,url,ready=false,saving=false,loadId=0;
  function check(){const t=J.parseTime(anchor.value);use.disabled=saving||!ready||!align.checked||!Number.isInteger(t)||t>ride.duration;}
  function clear(){loadId++;ready=false;align.checked=false;if(media){if(media.pause)media.pause();media.removeAttribute('src');if(media.load)media.load();media=null;}if(url){URL.revokeObjectURL(url);url=null;}viewer.replaceChildren();viewer.hidden=true;info.textContent='';check();}
  function load(blob,video,synthetic){
    clear();error.textContent='';
    if(!blob?.size||blob.size>(video?500:25)*1024*1024){error.textContent='Choose a video under 500 MiB or a photo under 25 MiB.';return;}
    const id=loadId;url=URL.createObjectURL(blob);media=document.createElement(video?'video':'img');
    const size=`${(blob.size/1024).toFixed(0)} KiB`,label=synthetic?'Synthetic clip':video?'Local video':'Local photo';
    if(video){media.controls=true;media.muted=true;media.playsInline=true;media.preload='auto';}
    else media.alt='Your selected local image';
    const loaded=()=>{if(id!==loadId||!d.open)return;
      ready=!video||(Number.isFinite(media.duration)&&media.duration>0&&media.readyState>=2&&!media.seeking);
      info.textContent=`${label} · ${size}${video&&Number.isFinite(media.duration)?' · '+media.duration.toFixed(1)+' s · frame '+media.currentTime.toFixed(1)+' s':''}. Only one still is kept. Audio stays out.`;check();
    };
    if(video){for(const event of ['loadeddata','seeked','timeupdate'])media.addEventListener(event,loaded);
      media.addEventListener('seeking',()=>{if(id!==loadId)return;ready=false;align.checked=false;check();});
      media.addEventListener('play',()=>{align.checked=false;check();});
      media.addEventListener('loadedmetadata',()=>{if(synthetic&&id===loadId)media.currentTime=Math.min(3,media.duration/2);});
    }else media.onload=loaded;
    media.onerror=()=>{if(id!==loadId)return;ready=false;error.textContent='This media could not be decoded. Try a JPEG or another clip.';check();};
    viewer.hidden=false;viewer.append(media);media.src=url;
  }
  d.addEventListener('close',clear,{once:true});
  box.querySelector('[type=file]').onchange=e=>{const file=e.target.files[0];if(!file)return;if(!/^(video\/|image\/(jpeg|png|webp)$)/.test(file.type)){clear();error.textContent='Choose a supported photo or video.';return;}load(file,file.type.startsWith('video/'),false);};
  anchor.oninput=()=>{align.checked=false;check();};align.onchange=()=>{if(media?.pause)media.pause();check();};
  use.onclick=async()=>{try{
    if(use.disabled||!d.open)return;
    if(recording)throw Error('Finish recording and park before reviewing media.');
    const target=J.parseTime(anchor.value);if(!Number.isInteger(target)||target<0||target>ride.duration)throw Error('Choose a valid ride time.');
    const frame={...capture(media),id:crypto.randomUUID(),videoSecond:media?.tagName==='VIDEO'?Math.round(media.currentTime*10)/10:null};
    saving=true;check();await onSave(target,frame);d.close();
  }catch(e){error.textContent=e.message;saving=false;check();}};
  if(sample){const expected=loadId;fetch('assets/field-pass.webm').then(r=>{if(!r.ok)throw Error();return r.blob();}).then(blob=>{if(d.open&&loadId===expected)load(blob,true,true);}).catch(()=>{if(d.open&&loadId===expected)error.textContent='The sample clip could not be loaded. Choose a local photo or video.';});}
}
root.OdoJournalMedia={dialog,choose,capture};
})(globalThis);
