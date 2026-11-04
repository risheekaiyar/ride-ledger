/* Local motorsport posters. Route geometry is included only after an explicit opt-in. */
function storyLayout(format){
 const height=({story:1920,portrait:1350,square:1080})[format]||1920;
 return {width:1080,height,heroTop:height===1080?300:390,heroBottom:height-360};
}
function paintStory(canvas,ride,{format,caption,includeRoute,routeImage,accent}){
 const {width:w,height:h,heroTop,heroBottom}=storyLayout(format),x=canvas.getContext('2d');
 canvas.width=w;canvas.height=h;
 const cream='#f3ecda',muted='#a9a8ad',ink='#101219',color=accent==='ice'?'#79dadd':'#ff7554';
 x.fillStyle=ink;x.fillRect(0,0,w,h);
 const glow=x.createRadialGradient(940,heroTop+150,0,500,h/2,h);glow.addColorStop(0,'#2a303d');glow.addColorStop(1,ink);x.fillStyle=glow;x.fillRect(0,0,w,h);
 x.strokeStyle='#ffffff09';x.lineWidth=1;for(let i=80;i<w;i+=80){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}
 x.fillStyle=color;x.fillRect(54,57,10,79);x.fillStyle=cream;x.font='800 82px Arial,sans-serif';x.fillText('odo',86,124);
 x.font='18px monospace';x.textAlign='right';x.fillStyle=muted;x.fillText('THE RIDER’S JOURNAL',1026,86);x.fillStyle=color;x.fillText('RECORD / REPLAY / REMEMBER',1026,121);x.textAlign='left';
 // A compact finish-line device gives the series its visual signature.
 for(let row=0;row<2;row++)for(let col=0;col<12;col++){x.fillStyle=(row+col)%2?cream:'#313641';x.fillRect(54+col*11,161+row*11,11,11);}
 x.strokeStyle='#ffffff28';x.beginPath();x.moveTo(208,172);x.lineTo(1026,172);x.stroke();
 const words=(caption.trim()||'A DAY, WELL RIDDEN').toUpperCase().split(/\s+/);
 let titleSize=h===1080?70:92,lines=[];const baseline=h===1080?245:280;
 for(;;){let line='';lines=[];x.font=`italic 900 ${titleSize}px Arial,sans-serif`;
  for(const word of words){const candidate=line?line+' '+word:word;if(x.measureText(candidate).width>965&&line){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);
  if((lines.length<=2&&baseline+(lines.length-1)*titleSize*.94<heroTop-12)||titleSize<=36)break;titleSize-=2;
 }
 x.fillStyle=cream;for(let i=0;i<Math.min(2,lines.length);i++)x.fillText(lines[i],54,baseline+i*titleSize*.94,970);
 const heroHeight=heroBottom-heroTop;
 if(includeRoute){
  if(routeImage){x.save();x.beginPath();x.roundRect(40,heroTop,1000,heroHeight,24);x.clip();x.drawImage(routeImage,40,heroTop,1000,heroHeight);x.restore();}
  else{
   // The same gap-aware/dateline-aware projection used by the app is the fallback.
   const geometry=OdoRouteGeometry.project(ride.track||[],{width:900,height:Math.max(120,heroHeight-90),padding:30});
   x.save();x.translate(90,heroTop+30);x.lineCap='round';x.lineJoin='round';
   x.strokeStyle='#020509';x.lineWidth=20;x.stroke(new Path2D(geometry.path));x.strokeStyle=cream;x.lineWidth=12;x.stroke(new Path2D(geometry.path));x.strokeStyle=color;x.lineWidth=5;x.stroke(new Path2D(geometry.path));x.restore();
  }
  x.fillStyle=color;x.font='16px monospace';x.fillText(routeImage?'ROUTE / 3D STUDY':'ROUTE / 2D STUDY',64,heroTop+30);
  x.fillStyle=muted;x.font='14px monospace';x.fillText(routeImage?'STYLIZED ROAD · ELEVATION OFF':'RECORDED ROUTE · GAPS PRESERVED',64,heroBottom-18);
 }else{
  x.save();x.beginPath();x.rect(0,heroTop,w,heroHeight);x.clip();x.translate(40,heroTop+heroHeight*.43);x.rotate(-.09);
  x.font=`italic 900 ${h===1080?145:185}px Arial,sans-serif`;x.fillStyle=color;x.fillText('CHASE THE',0,0,1000);x.fillStyle=cream;x.fillText('FEELING.',0,h===1080?135:170,1000);
  x.strokeStyle='#ffffff1a';x.lineWidth=2;for(let i=0;i<5;i++){x.beginPath();x.moveTo(0,205+i*13);x.lineTo(1000,205+i*13);x.stroke();}x.restore();
 }
 const safe=OdoAnalysis.safeShare(ride),isGpx=ride.source==='GPX export',mapped=isGpx&&Number.isFinite(ride.distanceKm)?Math.round(ride.distanceKm*10)/10:safe.distanceKm;
 const metricY=h-294;x.fillStyle='#f3ecda';x.fillRect(54,metricY,972,2);x.fillStyle=color;x.fillRect(54,metricY,140,4);
 x.font='16px monospace';x.fillStyle=muted;x.fillText('THE RIDE, IN NUMBERS',54,metricY+37);
 x.font='700 100px Arial,sans-serif';x.fillStyle=cream;x.fillText(mapped===null?'—':String(mapped),54,h-125,430);x.fillText(String(safe.durationMinutes),600,h-125,400);
 x.fillStyle=muted;x.font='18px monospace';x.fillText(isGpx?'MAPPED KM / ESTIMATE':'KM / GPS ESTIMATE',54,h-88);x.fillText('MIN / RECORDED',600,h-88);
 x.strokeStyle='#ffffff25';x.beginPath();x.moveTo(540,metricY+64);x.lineTo(540,h-85);x.stroke();
 x.fillStyle=color;x.fillRect(0,h-40,w,40);x.fillStyle=ink;x.font='bold 15px monospace';x.fillText('YOUR WORLD. RIDDEN YOUR WAY.',54,h-14);x.textAlign='right';x.fillText('ODO / RIDE ARCHIVE',1026,h-14);x.textAlign='left';
}
shareCard=function(){
 const ride=current();if(!ride)return toast('Import a journey first.');
 modal(`<div class="story-editor-head"><span class="eyebrow">ODO / POSTER STUDIO</span><h2>Your ride. Cover-worthy.</h2><p class="subtle">A race-weekend look for the road you rode.</p></div><div class="story-editor"><div class="story-options"><label>Headline<input id="story-title" value="A DAY, WELL RIDDEN" maxlength="35"></label><label>Format<select id="story-format"><option value="story">Story · 9:16</option><option value="portrait">Portrait · 4:5</option><option value="square">Square · 1:1</option></select></label><label>Edition<select id="story-accent"><option value="race">Race orange</option><option value="ice">Ice blue</option></select></label><label class="check"><input id="story-route" type="checkbox"> Include my route as a 3D track</label><p class="tiny">Route shapes can reveal places, even without map labels. No route is included until you choose it.</p><p class="tiny" id="story-status" role="status">Typography edition · route hidden</p><div class="actions"><button data-action="close">Close</button><button id="story-download" class="primary">${window.RideNative?.shareStory?'Share image':'Download PNG'}</button></div></div><div class="story-preview"><canvas id="story-canvas" aria-label="Share poster preview"></canvas></div></div>`);
 const dialog=$('#modal');dialog.classList.add('story-modal');let closed=false,generation=0;const images=new Map();
 const close=()=>{closed=true;generation++;dialog.classList.remove('story-modal');dialog.removeEventListener('close',close);};dialog.addEventListener('close',close);
 async function routeImage(format){
  if(images.has(format))return images.get(format);
  const {heroTop,heroBottom}=storyLayout(format),host=document.createElement('div');host.style.cssText=`position:fixed;left:-12000px;top:0;width:1000px;height:${heroBottom-heroTop}px;pointer-events:none`;host.setAttribute('aria-hidden','true');document.body.append(host);
  let scene;try{scene=OdoTrackScene.create(host,ride);scene.preset('poster');const data=scene.snapshot(),img=new Image();img.src=data;await img.decode();images.set(format,img);return img;}catch(error){images.set(format,null);return null;}finally{scene?.dispose();host.remove();}
 }
 async function draw(){
  const version=++generation,format=$('#story-format').value,includeRoute=$('#story-route').checked,caption=$('#story-title').value,accent=$('#story-accent').value,canvas=$('#story-canvas'),button=$('#story-download');
  button.disabled=includeRoute&&!images.has(format);$('#story-status').textContent=button.disabled?'Preparing your track poster…':includeRoute?'Route included':'Typography edition · route hidden';
  paintStory(canvas,ride,{format,caption,includeRoute:false,accent});
  const image=includeRoute?await routeImage(format):null;if(closed||version!==generation)return;
  paintStory(canvas,ride,{format,caption,includeRoute,routeImage:image,accent});button.disabled=false;
  $('#story-status').textContent=includeRoute?(image?'3D track edition · source elevation off':'2D route edition · 3D unavailable on this device'):'Typography edition · route hidden';
 }
 $('#story-route').onchange=draw;$('#story-title').oninput=draw;$('#story-format').onchange=draw;$('#story-accent').onchange=draw;draw();
 $('#story-download').onclick=()=>{
  const canvas=$('#story-canvas');
  if(window.RideNative?.shareStory){try{window.RideNative.shareStory(canvas.toDataURL('image/png'));}catch(error){toast('Image sharing failed: '+error.message);}return;}
  canvas.toBlob(async blob=>{if(!blob)return toast('Image export failed.');const file=new File([blob],'odo-ride.png',{type:'image/png'});
   if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'My Odo ride'});return;}catch(error){if(error.name==='AbortError')return;}}
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);
  },'image/png');
 };
};
