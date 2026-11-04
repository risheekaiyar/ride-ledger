/* Local video composition and bounded recording. No camera, microphone or network input. */
(function(root){
'use strict';
const WIDTH=720,HEIGHT=1280,FPS=24,MAX_BYTES=12*1024*1024;
const formats=Object.freeze({
 story:Object.freeze({label:'Story 9:16',ratio:'9:16',width:720,height:1280,routeTop:307,routeHeight:548}),
 portrait:Object.freeze({label:'Portrait 4:5',ratio:'4:5',width:720,height:900,routeTop:242,routeHeight:340}),
 square:Object.freeze({label:'Square 1:1',ratio:'1:1',width:720,height:720,routeTop:202,routeHeight:276})
});
function formatSpec(id){if(!Object.hasOwn(formats,id))throw Error('Choose a story, portrait or square clip format.');return formats[id];}
function encoding(Recorder=root.MediaRecorder){
 if(!Recorder?.isTypeSupported)return null;
 for(const mime of ['video/mp4;codecs=avc1.42001f','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']){
  try{if(Recorder.isTypeSupported(mime))return {mode:'realtime',mime,type:mime.startsWith('video/mp4')?'video/mp4':'video/webm',extension:mime.startsWith('video/mp4')?'mp4':'webm'};}catch{}
 }
 return null;
}
async function encoder(format='story'){
 const {width,height}=formatSpec(format);
 if(root.VideoEncoder&&root.VideoFrame&&root.Mp4Muxer){
  const config={codec:'avc1.42001f',width,height,bitrate:4000000,framerate:FPS,avc:{format:'avc'},latencyMode:'quality'};
  try{if((await VideoEncoder.isConfigSupported(config)).supported)return {mode:'frames',type:'video/mp4',extension:'mp4',config};}catch{}
 }
 return encoding();
}
function frame(ride,model,progress,includeSpeed=false){
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0,time=p*ride.duration;
 const sample=root.OdoTrackModel.atTime(model,time),imported=ride.source==='GPX export';
 return {progress:p,time,gap:sample.gap,speed:includeSpeed&&!sample.gap&&Number.isFinite(sample.speed)&&sample.speed>=0&&sample.speed<=252?sample.speed:null,showSpeed:includeSpeed,speedLabel:imported?'GPX EST. SPEED':'GPS REPLAY SPEED',distance:(imported||ride.distanceReliable)&&Number.isFinite(ride.distanceKm)&&ride.distanceKm>=0?ride.distanceKm:null,distanceLabel:imported?'GPX EST. KM':'GPS EST. KM'};
}
function timestamp(value){const s=Math.max(0,Math.floor(value)),m=Math.floor(s/60),remainder=String(s%60).padStart(2,'0');return m>=60?`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}:${remainder}`:`${m}:${remainder}`;}
function paint(canvas,scene,ride,progress,{headline='THE RIDE, REPLAYED.',accent='race',includeSpeed=false,format='story'}={}){
 const spec=formatSpec(format),h=spec.height,compact=format!=='story',square=format==='square';
 const layout=square?{brand:63,line:84,headline:128,font:38,source:185,caption:496,timeline:524,bar:541,label:582,value:634,footer:655,motto:null}
  :compact?{brand:75,line:100,headline:153,font:48,source:223,caption:600,timeline:635,bar:652,label:710,value:771,footer:829,motto:801}
  :{brand:89,line:119,headline:190,font:57,source:283,caption:858,timeline:910,bar:929,label:1003,value:1084,footer:1196,motto:1152};
 const s=frame(ride,scene.model,progress,includeSpeed),x=canvas.getContext('2d'),cream='#f5f7f8',muted='#b0bac2',ink='#111316',color=accent==='ice'?'#3bd8e6':'#ff4655';
 if(canvas.width!==WIDTH||canvas.height!==h){canvas.width=WIDTH;canvas.height=h;}
 x.clearRect(0,0,WIDTH,h);x.fillStyle=ink;x.fillRect(0,0,WIDTH,h);
 const light=x.createRadialGradient(620,h*.21,0,440,h*.35,700);light.addColorStop(0,'#343a41');light.addColorStop(1,ink);x.fillStyle=light;x.fillRect(0,0,WIDTH,h);
 x.fillStyle=color;x.fillRect(38,layout.brand-(compact?40:47),6,compact?44:53);x.fillStyle=cream;x.font=`800 ${compact?50:61}px Arial,sans-serif`;x.fillText('odo',57,layout.brand);
 x.fillStyle=muted;x.textAlign='right';x.font='13px monospace';x.fillText('RIDE FILM / 01',682,layout.brand-26);x.fillStyle=color;x.fillText('YOUR WORLD. RIDDEN.',682,layout.brand-1);x.textAlign='left';
 x.strokeStyle='#f5f7f824';x.beginPath();x.moveTo(38,layout.line);x.lineTo(682,layout.line);x.stroke();
 const words=(String(headline).trim()||'THE RIDE, REPLAYED.').toUpperCase().slice(0,50).split(/\s+/);let size=layout.font,lines=[];
 while(size>=28){x.font=`italic 900 ${size}px Arial,sans-serif`;let line='';lines=[];for(const word of words){const next=line?`${line} ${word}`:word;if(x.measureText(next).width>644&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);if(lines.length<=2)break;size-=2;}
 x.fillStyle=cream;lines.slice(0,2).forEach((line,i)=>x.fillText(line,38,layout.headline+i*size,644));
 x.font='11px monospace';x.fillStyle=muted;x.fillText('ROUTE STUDY / STYLIZED ROAD / ELEVATION OFF',38,layout.source);
 const source=scene.renderFrame(s.time,s.progress);x.drawImage(source,0,spec.routeTop,720,spec.routeHeight);
 // Every number belongs to the ride, not the speed of the rendered animation.
 x.save();x.globalAlpha=.08;x.fillStyle=cream;x.textAlign='right';x.font=`italic 900 ${compact?72:100}px Arial`;x.fillText('ODO',680,spec.routeTop+(compact?75:106));x.restore();
 x.fillStyle=muted;x.font='11px monospace';x.fillText('RECORDED ROUTE · SMOOTHED FOR PRESENTATION',38,layout.caption);
 const routeBottom=spec.routeTop+spec.routeHeight;
 if(s.showSpeed){
  x.fillStyle=cream;x.font=`600 ${compact?42:55}px Arial`;x.fillText(s.speed===null?'—':String(Math.round(s.speed)),38,routeBottom-(compact?53:75));
  x.fillStyle=muted;x.font='12px monospace';x.fillText('KM/H',38,routeBottom-(compact?30:52));x.fillText(s.speedLabel,38,routeBottom-(compact?10:32));
 }
 if(s.gap){x.fillStyle='#343a41';x.fillRect(474,routeBottom-68,208,38);x.fillStyle='#ff8993';x.font='12px monospace';x.textAlign='center';x.fillText('GPS RECORDING GAP',578,routeBottom-43);x.textAlign='left';}
 x.fillStyle=muted;x.font='12px monospace';x.fillText('RIDE TIMELINE',38,layout.timeline);x.textAlign='right';x.fillStyle=cream;x.fillText(`${timestamp(s.time)} / ${timestamp(ride.duration)}`,682,layout.timeline);x.textAlign='left';
 x.fillStyle='#343a41';x.fillRect(38,layout.bar,644,4);x.fillStyle=color;x.fillRect(38,layout.bar,644*s.progress,4);x.beginPath();x.arc(38+644*s.progress,layout.bar+2,5,0,Math.PI*2);x.fill();
 for(let i=0;i<=4;i++){x.fillStyle='#89949d';x.fillRect(38+161*i,layout.bar+15,1,6);}
 x.fillStyle=color;x.font='11px monospace';x.fillText(s.distanceLabel,38,layout.label);x.fillText('RECORDED TIME',388,layout.label);
 x.fillStyle=cream;x.font=`600 ${compact?54:69}px Arial`;x.fillText(s.distance===null?'—':s.distance.toFixed(1),38,layout.value,300);x.font=`500 ${compact?46:55}px Arial`;x.fillText(timestamp(ride.duration),388,layout.value-4,294);
 x.strokeStyle='#f5f7f822';x.beginPath();x.moveTo(352,layout.label-17);x.lineTo(352,layout.value+16);x.stroke();
 if(layout.motto){x.fillStyle=muted;x.font='11px monospace';x.fillText('THE ROUTE. THE RHYTHM. THE RIDE.',38,layout.motto);}
 for(let row=0;row<2;row++)for(let col=0;col<12;col++){x.fillStyle=(row+col)%2?cream:'#343a41';x.fillRect(38+col*8,layout.footer-13+row*8,8,8);}
 x.fillStyle=muted;x.textAlign='right';x.font='11px monospace';x.fillText('ODO / PRIVATE RIDE JOURNAL',682,layout.footer);x.textAlign='left';
 x.fillStyle=color;x.fillRect(0,h-45,WIDTH,45);x.fillStyle=ink;x.font='bold 12px monospace';x.fillText('RECORD / REPLAY / REMEMBER',38,h-17);
 return s;
}
function record(canvas,draw,{duration=12,signal,onProgress=()=>{},codec=encoding()}={}){
 if(codec?.mode==='frames')return encodeFrames(canvas,draw,{duration,signal,onProgress,codec});
 if(!codec||typeof canvas.captureStream!=='function')return Promise.reject(Error('This browser cannot encode a ride clip.'));
 if(![12,18].includes(duration))return Promise.reject(Error('Choose a 12 or 18 second clip.'));
 if(signal?.aborted)return Promise.reject(new DOMException('Rendering cancelled.','AbortError'));
 return new Promise((resolve,reject)=>{
  let stream,recorder,raf=0,finishTimer=0,watchdog=0,done=false,started=0,last=-Infinity,bytes=0,frames=0;const chunks=[];
  const clean=()=>{cancelAnimationFrame(raf);clearTimeout(finishTimer);clearTimeout(watchdog);signal?.removeEventListener('abort',abort);stream?.getTracks().forEach(t=>t.stop());};
  function fail(error){if(done)return;done=true;try{if(recorder?.state!=='inactive')recorder?.stop();}catch{}clean();reject(error);}
  const abort=()=>fail(new DOMException('Rendering cancelled.','AbortError'));
  function tick(now){
   if(done)return;
   if(now-last>=1000/FPS){last=now;const progress=Math.min(1,(now-started)/(duration*1000));
    try{draw(progress);frames++;onProgress(progress);}catch(error){fail(error);return;}
    if(progress===1){finishTimer=setTimeout(()=>{try{recorder.stop();}catch(error){fail(error);}},140);return;}
   }
   raf=requestAnimationFrame(tick);
  }
  try{
   draw(0);if(signal?.aborted)throw new DOMException('Rendering cancelled.','AbortError');stream=canvas.captureStream(FPS);recorder=new MediaRecorder(stream,{mimeType:codec.mime,videoBitsPerSecond:4000000});
   recorder.ondataavailable=event=>{if(done||!event.data?.size)return;bytes+=event.data.size;if(bytes>MAX_BYTES){fail(Error('This clip exceeded the local 12 MB limit. Try the shorter duration.'));return;}chunks.push(event.data);};
   recorder.onerror=()=>fail(Error('The video encoder stopped. Try another browser or use a PNG poster.'));
   recorder.onstart=()=>{if(done)return;started=performance.now();raf=requestAnimationFrame(tick);};
   recorder.onstop=()=>{
    if(done)return;done=true;clean();const type=recorder.mimeType.split(';')[0],blob=new Blob(chunks,{type});
    if(!blob.size||!['video/mp4','video/webm'].includes(type)){reject(Error('The encoder did not produce a playable clip.'));return;}
    if(frames<duration*12){reject(Error('This device rendered too few frames for a smooth clip. Try a browser with frame-by-frame encoding, or use a PNG poster.'));return;}
    resolve({blob,type,extension:type==='video/mp4'?'mp4':'webm',frames,duration,mode:'realtime'});
   };
   signal?.addEventListener('abort',abort,{once:true});watchdog=setTimeout(()=>fail(Error('The encoder timed out. Keep Odo visible and try again.')),(duration+10)*1000);recorder.start(500);
  }catch(error){fail(error);}
 });
}
async function encodeFrames(canvas,draw,{duration,signal,onProgress,codec}){
 if(![12,18].includes(duration))throw Error('Choose a 12 or 18 second clip.');
 const cancelled=()=>{if(signal?.aborted)throw new DOMException('Rendering cancelled.','AbortError');};cancelled();
 const {width,height}=codec.config||{};if(!Object.values(formats).some(f=>f.width===width&&f.height===height))throw Error('Unsupported clip encoding dimensions.');
 draw(0);cancelled();if(canvas.width!==width||canvas.height!==height)throw Error('The clip format changed. Check video support and render again.');
 const target=new Mp4Muxer.ArrayBufferTarget(),muxer=new Mp4Muxer.Muxer({target,video:{codec:'avc',width,height,frameRate:FPS},fastStart:'in-memory'});
 let failure=null,bytes=0,finished=false;
 const videoEncoder=new VideoEncoder({output:(chunk,meta)=>{if(finished||signal?.aborted)return;bytes+=chunk.byteLength;if(bytes>MAX_BYTES){failure=Error('This clip exceeded the local 12 MB limit. Try the shorter duration.');return;}try{muxer.addVideoChunk(chunk,meta);}catch(error){failure=error;}},error:error=>{failure=error;}});
 const abort=()=>{if(videoEncoder.state!=='closed')videoEncoder.close();};signal?.addEventListener('abort',abort,{once:true});
 const flush=async()=>{let timer;try{await Promise.race([videoEncoder.flush(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('The video encoder stopped responding.')),15000);})]);}finally{clearTimeout(timer);}};
 try{
  videoEncoder.configure(codec.config);const frames=duration*FPS,deadline=performance.now()+180000;
  for(let i=0;i<frames;i++){
   cancelled();if(failure)throw failure;if(performance.now()>deadline)throw Error('Rendering took too long on this device. Try a PNG poster.');
   draw(i/(frames-1));cancelled();if(canvas.width!==width||canvas.height!==height)throw Error('The clip format changed during rendering.');const timestamp=Math.round(i*1000000/FPS),videoFrame=new VideoFrame(canvas,{timestamp,duration:Math.round((i+1)*1000000/FPS)-timestamp});
   try{videoEncoder.encode(videoFrame,{keyFrame:i%(FPS*2)===0});}finally{videoFrame.close();}
   if(videoEncoder.encodeQueueSize>4)await flush();onProgress((i+1)/frames);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  await flush();cancelled();if(failure)throw failure;muxer.finalize();const blob=new Blob([target.buffer],{type:'video/mp4'});if(blob.size>MAX_BYTES)throw Error('The finished clip exceeded the local 12 MB limit.');
  return {blob,type:'video/mp4',extension:'mp4',frames,duration,mode:'frames'};
 }catch(error){cancelled();throw error;}
 finally{finished=true;signal?.removeEventListener('abort',abort);if(videoEncoder.state!=='closed')videoEncoder.close();}
}
const api={WIDTH,HEIGHT,FPS,MAX_BYTES,formats,encoding,encoder,frame,paint,record};root.OdoRideFilm=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
