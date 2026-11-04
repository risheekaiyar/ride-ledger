/* The same verified chapter measurements, composed into a shareable 9:16 film. */
(function(root){
'use strict';
function create(host,ride,data,chapters){
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;const ctx=canvas.getContext('2d');let scene=null,sceneId='',disposed=false;
 function wrap(text,x,y,width,lineHeight,maxLines){const words=String(text).split(/\s+/);let line='',row=0;for(let i=0;i<words.length;i++){const next=line?line+' '+words[i]:words[i];if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,y+row*lineHeight);line=words[i];row++;if(row>=maxLines-1){let rest=[line,...words.slice(i+1)].join(' ');if(ctx.measureText(rest).width>width){while(rest&&ctx.measureText(rest+'…').width>width)rest=rest.slice(0,-1);rest+='…';}ctx.fillText(rest,x,y+row*lineHeight);return;}}else line=next;}if(row<maxLines)ctx.fillText(line,x,y+row*lineHeight);}
 const format=(id,v)=>{const d=OdoInsightReel.definitions[id];if(d.unit==='s'){const seconds=Math.round(v);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}return v.toFixed(d.unit==='g'?2:id==='distance'||id==='average'||id==='peak'?1:0);};
 function draw(progress){
  if(disposed)throw Error('Insight film is closed.');const index=Math.min(chapters.length-1,Math.floor(progress*chapters.length)),p=progress===1?1:progress*chapters.length-index,c=chapters[index],meta=OdoInsightReel.scenes[c.scene];
  if(sceneId!==c.scene){scene?.dispose();scene=null;sceneId=c.scene;scene=c.scene==='route'?OdoJourneyRadar.create(host,ride,{pixelRatio:1}):OdoInsightScene.create(host,data,{onUnavailable:()=>{disposed=true;}});}
  const visual=c.scene==='route'?scene.renderFrame(p*ride.duration,p):scene.draw(c.scene,p,Math.min(1.6,p*5));
  ctx.fillStyle='#191c20';ctx.fillRect(0,0,720,1280);const glow=ctx.createRadialGradient(360,550,20,360,550,500);glow.addColorStop(0,'#343a41');glow.addColorStop(1,'#191c20');ctx.fillStyle=glow;ctx.fillRect(0,0,720,1280);
  ctx.fillStyle='#f5f7f8';ctx.font='800 48px sans-serif';ctx.fillText('odo',44,65);ctx.fillStyle='#b0bac2';ctx.font='14px monospace';ctx.fillText('RIDE INSIGHTS',149,60);ctx.textAlign='right';ctx.fillText(`${String(index+1).padStart(2,'0')} / ${String(chapters.length).padStart(2,'0')}`,676,60);ctx.textAlign='left';
  ctx.fillStyle='#b0bac2';ctx.font='13px monospace';ctx.fillText(meta.label.toUpperCase(),44,118);
  ctx.fillStyle='#f5f7f8';ctx.font='500 48px sans-serif';wrap(c.headline,44,180,632,54,3);
  ctx.drawImage(visual,0,302,720,436);
  const ids=c.fact_ids.slice(0,3),column=632/ids.length;ctx.strokeStyle='#89949d66';ctx.beginPath();ctx.moveTo(44,775);ctx.lineTo(676,775);ctx.stroke();
  ids.forEach((id,i)=>{const x=44+i*column,d=OdoInsightReel.definitions[id];ctx.fillStyle='#b0bac2';ctx.font='14px sans-serif';wrap(d.label,x,804,column-16,19,2);ctx.fillStyle='#f5f7f8';ctx.font='500 42px sans-serif';const value=format(id,data.facts[id]);ctx.fillText(value,x,880);const width=ctx.measureText(value).width;ctx.fillStyle='#b0bac2';ctx.font='13px monospace';ctx.fillText(d.unit==='s'?'':d.unit==='candidates'&&data.facts[id]===1?'candidate':d.unit,x+width+6,880);});
  ctx.fillStyle='#dce2e7';ctx.font='23px sans-serif';wrap(c.insight,44,944,632,33,5);ctx.fillStyle='#b0bac2';ctx.font='13px sans-serif';wrap(c.scene==='route'?'Recorded GPS route · cyan marks replay progress. Raised white trails follow the recorded GPS shape. Gaps stay open.':meta.note,44,1143,632,19,3);
  ctx.font='12px monospace';ctx.fillText(data.source==='gpx_interval_estimate'?'GPX ESTIMATE / PRIVATE UNTIL SHARED':'PHONE GPS / PRIVATE UNTIL SHARED',44,1220);
  for(let i=0;i<chapters.length;i++){const width=(632-(chapters.length-1)*7)/chapters.length,x=44+i*(width+7);ctx.fillStyle='#343a41';ctx.fillRect(x,1243,width,4);ctx.fillStyle='#9beaf0';ctx.fillRect(x,1243,width*(i<index?1:i===index?p:0),4);}
  return canvas;
 }
 return {canvas,draw,dispose(){scene?.dispose();scene=null;disposed=true;}};
}
root.OdoInsightFilm={create};
})(globalThis);
