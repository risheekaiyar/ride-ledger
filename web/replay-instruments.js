(() => {
  const palette=['#758996','#90acaf','#83d7c6','#c1e4aa','#e5d291','#ffac79','#ff765b'];
  function dynamics(ride){
    if(ride.source==='GPX export')return [];
    const points=ride.track||[], samples=[];
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dt=b[2]-a[2];
      if(a[7]!==b[7]||dt<=0||dt>3||![a,b].every(p=>Number.isFinite(p[3])&&p[3]>=0&&p[3]<252&&Number.isFinite(p[4])&&p[4]<=12&&Number.isFinite(p[8])&&p[8]<=1.5))continue;
      const longitudinal=(b[3]-a[3])/3.6/dt/9.80665;
      const turn=((b[6]-a[6]+540)%360)-180;
      const lateral=[a,b].every(p=>Number.isFinite(p[6])&&p[3]>=12)&&Math.abs(turn)<=45
        ?(a[3]+b[3])/7.2*(turn*Math.PI/180)/dt/9.80665:null;
      if(Math.abs(longitudinal)<=3&&(lateral===null||Math.abs(lateral)<=3))samples.push({start:a[2],end:b[2],longitudinal,lateral});
    }
    return samples;
  }
  function trace(model){
    if(!model)return null;
    const scale=Math.min(176/Math.max(1,model.width),106/Math.max(1,model.depth));
    const xy=p=>[100+p.x*scale,60+p.z*scale];
    const line=model.points.map((p,i)=>`${i&&model.points[i-1].segment===p.segment?'L':'M'}${xy(p).map(v=>v.toFixed(2)).join(' ')}`).join('');
    return {xy,line};
  }
  function drawCanvas(host,kind,data,ride){
    const canvas=document.createElement('canvas');host.append(canvas);
    const ctx=canvas.getContext('2d'),samples=kind==='flow'?dynamics(ride):[];
    const sampleScale=samples.reduce((max,p)=>Math.max(max,Math.hypot(p.longitudinal,p.lateral??0)),.5);
    const model=kind==='flow'?OdoTrackModel.build(ride.track,{gapLimit:3}):null, mini=trace(model);
    const miniPath=mini?new Path2D(mini.line):null;
    let lastProgress=0;
    function draw(_scene,progress,reveal=1){
      lastProgress=progress;
      const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),ratio=Math.min(devicePixelRatio,2);
      if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
        canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px';
      }
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
      function label(value,x,y,size=12,color='#bfd0cd',align='center'){
        ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`600 ${size}px system-ui`;ctx.fillText(value,x,y);
      }
      function arc(x,y,r,a,b,color,width){
        ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,a,b);ctx.stroke();
      }
      if(kind==='pace'){
        const radius=Math.max(1,Math.min(w*.29,h*.28)),x=w/2,y=h*.58;
        const start=Math.PI*.76,span=Math.PI*1.48;
        for(let i=0;i<7;i++){
          const a=start+span*i/7,b=start+span*(i+1)/7;
          const percent=data.telemetry.observed?Math.round(100*data.telemetry.seconds[i]/data.telemetry.observed):0;
          arc(x,y,radius,a+.03,b-.03,percent?palette[i]:'#33434b',12);
          const m=(a+b)/2,d=radius+23;label(percent+'%',x+Math.cos(m)*d,y+Math.sin(m)*d+4,11);
        }
        label('MOST OBSERVED',x,y-17,10,'#99b3b0');
        label(data.bandLabel+' km/h',x,y+12,Math.min(27,w/13),'#f6fbec');
        label('Share of observed time by speed band',x,h*.9,11);
      }else{
        const wide=w>=450,r=Math.max(1,Math.min(w*(wide?.19:.24),h*.24)),x=wide?w*.27:w*.28,y=h*.57;
        const now=ride.duration*progress;
        let lo=0,hi=samples.length;
        while(lo<hi){const mid=(lo+hi)>>1;if(samples[mid].end<now)lo=mid+1;else hi=mid;}
        const active=samples[lo]?.start<=now?samples[lo]:null;
        for(const f of [.5,1])arc(x,y,r*f,0,2*Math.PI,'#4d6872',1);
        ctx.strokeStyle='#4d6872';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();
        label('ACCEL',x,y-r-12,10);label('BRAKE',x,y+r+16,10);
        label('L',x-r-11,y+4,10);label('R',x+r+11,y+4,10);
        label(`Outer ring · ${sampleScale.toFixed(2)} g`,x,y+r+34,10);
        for(let i=0;i<samples.length;i+=Math.max(1,Math.ceil(samples.length/380))){
          const s=samples[i];if(s.lateral===null)continue;
          ctx.fillStyle='#73b9bf66';ctx.fillRect(x+s.lateral/sampleScale*r,y-s.longitudinal/sampleScale*r,2,2);
        }
        if(active?.lateral!=null){
          const px=x+active.lateral/sampleScale*r,py=y-active.longitudinal/sampleScale*r;
          arc(px,py,4,0,2*Math.PI,'#ffb281',4);
        }
        const mx=w*.76,my=h*.48,mw=Math.min(w*.38,220),mh=mw*.6;
        if(mini){
          ctx.save();ctx.translate(mx-mw/2,my-mh/2);ctx.scale(mw/200,mh/120);
          ctx.strokeStyle='#739690';ctx.lineWidth=2;ctx.stroke(miniPath);
          const point=OdoTrackModel.atTime(model,now);
          if(!point.gap){const [px,py]=mini.xy(point);arc(px,py,4,0,2*Math.PI,'#ffb281',4);}
          ctx.restore();
        }
        label('GPS ESTIMATE',mx,my+mh/2+16,10);
        const longitudinal=active?active.longitudinal.toFixed(2)+' g':'—';
        const lateral=active?.lateral!=null?active.lateral.toFixed(2)+' g':'—';
        label(longitudinal+' forward / brake',mx,my+mh/2+35,10);
        label(lateral+' lateral',mx,my+mh/2+50,10);
        if(!samples.length)label('No qualifying GPS acceleration',w/2,h*.9,11,'#ffb281');
      }
      return canvas;
    }
    return {draw,resize:()=>draw(kind,lastProgress),dispose:()=>canvas.remove()};
  }
  const api={create:drawCanvas,trace,palette,dynamics};
  if(typeof module!=='undefined')module.exports=api;
  globalThis.OdoReplayInstruments=api;
})();
