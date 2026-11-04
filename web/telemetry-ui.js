/* Ride instruments use deterministic calculations; empty channels remain visibly unavailable. */
let telemetryChannel='speed',telemetryWindow=null;
function telemetryBounds(ride){
 if(page!=='detail')return {id:ride.id,duration:ride.duration,span:0,start:0,end:ride.duration};
 if(!telemetryWindow||telemetryWindow.id!==ride.id||telemetryWindow.duration!==ride.duration)telemetryWindow={id:ride.id,duration:ride.duration,span:0,...OdoTelemetry.windowRange(ride.duration,0)};
 return telemetryWindow;
}
function telemetryWindowTime(time){const rounded=Math.round(time*10)/10,fraction=Math.round((rounded-Math.floor(rounded))*10);return clock(rounded)+(fraction?'.'+fraction:'');}
function telemetryWindowControls(ride){
 const window=telemetryBounds(ride);
 return `<div class="telemetry-window" ${ride.duration>15?'':'hidden'}><div class="telemetry-window-head"><span>TRACE WINDOW</span><output id="telemetry-window-range" role="status" aria-live="polite"></output></div><div class="telemetry-window-options" role="group" aria-label="Trace window duration">${[[0,'Whole ride'],[300,'5 min'],[60,'1 min'],[15,'15 sec']].map(([span,label])=>`<button data-trace-window="${span}" aria-pressed="${window.span===span}" aria-controls="telemetry-chart" ${span&&span>=ride.duration?'disabled':''}>${label}</button>`).join('')}</div><div class="telemetry-window-pan"><button data-window-step="-1" aria-label="Previous time window"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button><button data-window-center>Center on playhead</button><button data-window-step="1" aria-label="Next time window"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button></div><p id="telemetry-window-position"></p><p class="telemetry-window-note">Ride summaries cover the full recording.</p><button class="telemetry-window-debrief" data-window-debrief aria-label="Ask Odo about this window" ${window.span?'':'disabled'}><span aria-hidden="true">✦</span> Ask Odo about this window</button><p class="telemetry-window-note" id="window-debrief-note"></p></div>`;
}
function updateTelemetryWindowControls(ride,time){
 const window=telemetryBounds(ride),range=$('#telemetry-window-range');if(!range)return;
 const label=`${telemetryWindowTime(window.start)} – ${telemetryWindowTime(window.end)}${window.span?'':' · whole ride'}`;
 if(range.textContent!==label)range.textContent=label;
 $$('[data-trace-window]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.traceWindow)===window.span)));
 $('[data-window-step="-1"]').disabled=window.start<=0;$('[data-window-step="1"]').disabled=window.end>=ride.duration;$('[data-window-center]').disabled=!window.span;
 const position=$('#telemetry-window-position'),outside=time<window.start||time>window.end;position.hidden=!outside;
 if(outside)position.textContent=`Playhead ${telemetryWindowTime(time)} is outside this window.`;
 const canDebrief=window.span>0&&Math.floor(window.end)>Math.ceil(window.start);$('[data-window-debrief]').disabled=!canDebrief;$('#window-debrief-note').textContent=canDebrief?'Review the summary before sending it to Meta.':'Choose a focused window to enable its debrief.';
}
function changeTelemetryWindow(span,center){
 const ride=current(),focused=document.activeElement;if(!ride)return;stopPlay();telemetryBounds(ride);
 telemetryWindow={id:ride.id,duration:ride.duration,span,...OdoTelemetry.windowRange(ride.duration,span,center)};
 $('#telemetry-chart').innerHTML=telemetryChart(ride,telemetryChannel);updateTelemetryAccessibility(ride,trackTime);
 if(focused?.matches('[data-window-step]')&&focused.disabled)$('[data-window-center]').focus({preventScroll:true});
}

function telemetryChart(ride,kind){
 const window=telemetryBounds(ride),data=OdoTelemetry.series(ride,kind),plot=OdoTelemetry.windowPath(data,ride.duration,window.start,window.end,600,150,kind==='motion'?1:ride.source==='GPX export'?30:3,kind!=='altitude');
 if(!plot.d)return `<div class="telemetry-empty"><span>∿</span><strong>${window.span?'No samples in this window':`No ${kind==='motion'?'phone motion':kind==='altitude'?'altitude':'speed'} channel`}</strong><p>${window.span?'Move the window or return to the whole ride. Missing intervals are not filled.':'This recording did not supply usable samples for this view.'}</p></div>`;
 const unit=kind==='motion'?'g · raw phone acceleration · 1s bin peak':kind==='altitude'?'m · source altitude':'km/h';
 return `<div class="telemetry-plot"><div class="telemetry-scale"><span>${kind==='altitude'?fmt(plot.min,1)+' – ':''}${fmt(plot.max,1)} ${unit}</span><span>${plot.aggregated?'Time-column min / max':kind==='altitude'?'Unverified vertical accuracy':kind==='motion'?'Includes gravity · phone frame':'Gaps stay visible'}</span></div><svg preserveAspectRatio="none" data-telemetry-plot data-trace-kind="${kind}" viewBox="0 0 600 150" role="slider" tabindex="0" aria-orientation="horizontal" aria-valuemin="${window.start}" aria-valuemax="${window.end}" aria-valuenow="${window.start}" aria-valuetext="First recorded sample" aria-label="${esc(kind)} trace sample"><path d="M0 30H600M0 85H600M0 140H600" class="telemetry-grid"/><path d="${plot.d}" class="telemetry-line"/><path d="${plot.dots}" class="telemetry-line telemetry-dots"/><line id="telemetry-cursor" x1="0" x2="0" y1="0" y2="150" class="telemetry-cursor"/></svg><div class="chart-axis"><span>${telemetryWindowTime(window.start)}</span><span>${telemetryWindowTime((window.start+window.end)/2)}</span><span>${telemetryWindowTime(window.end)}</span></div><div class="telemetry-gap-row"><span>Trace gaps</span><svg viewBox="0 0 600 4" preserveAspectRatio="none" role="img" aria-label="${plot.gapColumns} of 600 time columns contain unconnected trace intervals"><path d="M0 2H600" class="telemetry-gap-base"/><path d="${plot.gaps}" transform="translate(0 2)" class="telemetry-gap-mark"/></svg></div>${plot.aggregated?'<p class="tiny">Long traces show the minimum and maximum in each time column. Inspection still reads the original samples.</p>':''}<p class="tiny">Tap to seek. Arrow keys step ${kind==='motion'?'one-second bins':'recorded fixes'}; Shift + arrows jump ten. Home / End seek ${window.span?'this window’s':'the ride’s'} limits.</p>${window.span?'<p class="tiny">Chart edges clip the connecting lines. Inspection shows original sample values.</p>':''}</div>`;
}
function telemetryPanel(ride){
 const t=OdoTelemetry.analyze(ride),highest=Math.max(1,...t.seconds),known=t.observed>0;
 return `<section class="telemetry-dashboard section"><div class="telemetry-heading"><div><span class="eyebrow">RIDE / DATA ROOM</span><h2>The rhythm of the road.</h2></div><span class="tag gray">${t.imported?'Derived from GPX':'GPS observations'}</span></div><div class="telemetry-instruments"><div class="telemetry-dial"><span class="eyebrow">AT THE PLAYHEAD</span><div><strong id="telemetry-speed">—</strong><span>km/h</span></div><p id="telemetry-moment">Scrub your ride</p><div class="dial-ticks" aria-hidden="true"></div></div><div class="telemetry-facts"><div><span>Observed average</span><strong>${fmt(t.average,1)} <small>km/h</small></strong></div><div><span>Observed peak</span><strong>${fmt(t.peak,1)} <small>km/h</small></strong></div><div><span>Speed coverage</span><strong>${fmt(t.coverage*100,0)}<small>%</small></strong></div><div><span>Unobserved time</span><strong>${clock(t.unobserved)}</strong></div></div></div><div class="telemetry-tabs" role="group" aria-label="Trace channel">${[['speed','Speed'],['altitude','Elevation'],['motion','Phone motion']].map(([key,label])=>`<button data-channel="${key}" aria-pressed="${telemetryChannel===key}">${label}</button>`).join('')}</div>${telemetryWindowControls(ride)}<div id="telemetry-chart">${telemetryChart(ride,telemetryChannel)}</div>${sampleInspector(ride)}<div class="telemetry-lower"><div><span class="eyebrow">TIME AT SPEED</span><div class="speed-histogram">${t.seconds.map((seconds,i)=>`<div><span style="height:${known?Math.max(2,seconds/highest*100):2}%" title="${fmt(seconds,1)} seconds"></span><small>${i===t.seconds.length-1?'100+':t.bands[i]+'–'+t.bands[i+1]}</small></div>`).join('')}</div><p class="tiny">km/h · weighted by elapsed time, not sample count</p></div><div class="coverage-card"><span class="eyebrow">WHAT THE TIMELINE KNOWS</span><div class="coverage-bar" aria-label="${fmt(t.coverage*100,0)} percent speed coverage"><span style="width:${t.coverage*100}%"></span></div><dl><div><dt>Observed moving</dt><dd>${known?clock(t.moving):'—'}</dd></div><div><dt>Observed low speed</dt><dd>${known?clock(t.lowSpeed):'—'}</dd></div><div><dt>Unknown</dt><dd>${clock(t.unobserved)}</dd></div></dl><p class="tiny">Low speed means under 5 km/h; it is not a confirmed stop. ${t.imported?'GPX segment speeds are geometric estimates, without source accuracy.':'No speed or distance is filled across missing intervals.'}</p></div></div></section>`;
}
function sampleInspector(ride){return `<details class="sample-inspector" open><summary><span>Inspect this moment</span><span class="sample-source">${ride.source==='GPX export'?'GPX export':'Phone recording'}</span></summary><div class="sample-navigation"><div><strong id="sample-time">—</strong><p id="sample-status">Select a recorded sample</p></div><div class="sample-steps"><button data-sample-step="-1" aria-label="Previous recorded sample">←</button><button data-sample-step="1" aria-label="Next recorded sample">→</button></div></div><dl class="sample-fields"><div><dt>Horizontal accuracy</dt><dd id="sample-accuracy">—</dd><small>Reported GPS radius</small></div><div><dt>Speed accuracy</dt><dd id="sample-speed-accuracy">—</dd><small>Reported uncertainty</small></div><div><dt>Source altitude</dt><dd id="sample-altitude">—</dd><small>Vertical accuracy unknown</small></div><div><dt>GPS course</dt><dd id="sample-course">—</dd><small>Movement direction, not compass</small></div></dl><div class="sample-motion-head"><span>PHONE MOTION / 1 SECOND BIN</span><span id="sample-motion-time">—</span></div><dl class="sample-fields sample-motion"><div><dt>Raw acceleration peak</dt><dd id="sample-acceleration">—</dd><small>Includes gravity</small></div><div><dt>Linear acceleration peak</dt><dd id="sample-linear">—</dd><small>Phone frame, gravity removed</small></div><div><dt>Angular speed median</dt><dd id="sample-angular">—</dd><small>Phone rotation magnitude</small></div></dl><p class="sample-note">Timeline: ${ride.source==='GPX export'?'GPX timestamps':ride.timeBasis==='elapsed-realtime'?'Android monotonic clock':'legacy device wall-clock duration'}. These are source observations and one-second phone summaries. They do not establish motorcycle lean, tyre grip or bike-frame forces.</p></details>`;}
function updateSampleInspector(time){
 const r=current(),inspector=$('.sample-inspector');if(!r||!inspector)return;
 const sample=OdoTelemetry.inspect(r,time),key=[r.id,sample.index,sample.motionTime,sample.gap].join('|');if(inspector.dataset.sample===key)return;inspector.dataset.sample=key;
 const put=(id,value,unit,digits)=>{$(id).textContent=value===null?'Not supplied':fmt(value,digits)+' '+unit;};
 $('#sample-time').textContent=sample.gap?'GPS recording gap':clock(sample.sampleTime)+' / recorded fix';
 $('#sample-status').textContent=sample.gap?'No GPS sample is filled across this interval.':`Sample ${sample.index+1} of ${r.track.length} · ${sample.imported?'GPX speed is an interval estimate':'Values belong to the nearest recorded fix'}`;
 put('#sample-accuracy',sample.accuracy,'m',1);put('#sample-speed-accuracy',sample.speedAccuracy,'m/s',2);put('#sample-altitude',sample.altitude,'m',1);put('#sample-course',sample.course,'°',0);
 put('#sample-acceleration',sample.acceleration,'g',2);put('#sample-linear',sample.linearAcceleration,'g',2);put('#sample-angular',sample.angularSpeed,'rad/s',2);
 $('#sample-motion-time').textContent=sample.motionTime===null?'No motion bin':clock(sample.motionTime)+' – '+clock(Math.min(r.duration,sample.motionTime+1));
 $('[data-sample-step="-1"]').disabled=sample.index<=0;$('[data-sample-step="1"]').disabled=sample.index>=r.track.length-1;
}
function updateTelemetryAccessibility(ride,time){
 const window=telemetryBounds(ride),inside=time>=window.start&&time<=window.end;updateTelemetryWindowControls(ride,time);
 const cursor=$('#telemetry-cursor');if(cursor){const x=Math.max(0,Math.min(600,(time-window.start)/(window.end-window.start)*600));cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);cursor.style.display=inside?'':'none';}
 const sample=OdoTelemetry.inspect(ride,time);
 $$('[data-telemetry-plot]').forEach(plot=>{
  const kind=plot.dataset.traceKind,value=kind==='motion'?sample.acceleration:kind==='altitude'?sample.altitude:sample.speed,unit=kind==='motion'?'g, raw phone peak':kind==='altitude'?'metres, source altitude':'kilometres per hour';
  const source=kind==='motion'?(sample.motionTime===null?'no motion bin':'phone bin at '+clock(sample.motionTime)):(sample.gap?'GPS gap':'nearest recorded fix at '+clock(sample.sampleTime));
  plot.setAttribute('aria-valuenow',Math.max(window.start,Math.min(window.end,Number(time.toFixed(2)))));plot.setAttribute('aria-valuetext',`${inside?'':'Playhead outside this window. '}${fmt(time,1)} seconds, ${value===null?'value unavailable':fmt(value,2)+' '+unit}, ${source}`);
 });
}
const detailBeforeTelemetry=rideDetail;
rideDetail=function(){const ride=current(),html=detailBeforeTelemetry();if(!ride)return html;const first=html.indexOf('<div class="grid2 section">'),second=html.indexOf('<div class="grid2 section">',first+1);return first>=0&&second>first?html.slice(0,first)+telemetryPanel(ride)+html.slice(second):html+telemetryPanel(ride);};
const updateBeforeTelemetry=updateTimeline;
updateTimeline=function(index){updateBeforeTelemetry(index);const r=current(),point=r?.track[index];if(!r)return;const time=point?.[2]??0,speed=$('#telemetry-speed');if(speed){speed.textContent=fmt(point?.[3]??null,0);$('#telemetry-moment').textContent=clock(time)+' / '+clock(r.duration);}updateTelemetryAccessibility(r,time);updateSampleInspector(time);};
chart=function(ride,signal='speed'){return telemetryChart(ride,signal==='speed'?'speed':'motion');};
function seekTelemetry(index){const r=current();if(!r?.track.length)return;stopPlay();updateTimeline(Math.max(0,Math.min(r.track.length-1,index)));}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-window-debrief]')){const window=telemetryBounds(current());stopPlay();museSetup({focus:{start:window.start,end:window.end,channel:telemetryChannel}});return;}
 const windowButton=e.target.closest('[data-trace-window],[data-window-step],[data-window-center]');if(windowButton){const r=current(),window=telemetryBounds(r),span=windowButton.hasAttribute('data-trace-window')?Number(windowButton.dataset.traceWindow):window.span,center=windowButton.hasAttribute('data-window-step')?(window.start+window.end)/2+Number(windowButton.dataset.windowStep)*(window.end-window.start):trackTime;changeTelemetryWindow(span,center);return;}
 const step=e.target.closest('[data-sample-step]');if(step){seekTelemetry(playIndex+Number(step.dataset.sampleStep));return;}
 const button=e.target.closest('[data-channel]');if(button){telemetryChannel=button.dataset.channel;$('#telemetry-chart').innerHTML=telemetryChart(current(),telemetryChannel);$$('[data-channel]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateTelemetryAccessibility(current(),trackTime);updateSampleInspector(trackTime);return;}
 const plot=e.target.closest('[data-telemetry-plot]');if(plot){const transform=plot.getScreenCTM();if(!transform)return;const local=new DOMPoint(e.clientX,e.clientY).matrixTransform(transform.inverse()),r=current(),window=telemetryBounds(r),time=window.start+Math.max(0,Math.min(1,local.x/600))*(window.end-window.start);seekTrackTime(time);}
});
document.addEventListener('keydown',e=>{
 if(!e.target.closest('[data-telemetry-plot]'))return;const r=current();if(!r||(!r.track.length&&e.target.dataset.traceKind!=='motion'))return;
 const forward=['ArrowRight','ArrowUp','PageUp'].includes(e.key),backward=['ArrowLeft','ArrowDown','PageDown'].includes(e.key);if(!forward&&!backward&&!['Home','End'].includes(e.key))return;
 const step=(e.shiftKey||e.key.startsWith('Page'))?10:1,window=telemetryBounds(r),clamp=time=>Math.max(window.start,Math.min(window.end,time));
 if(window.span){
  e.preventDefault();const anchor=clamp(trackTime);let time=e.key==='Home'?window.start:e.key==='End'?window.end:null;
  if(time===null)time=e.target.dataset.traceKind==='motion'?Math.floor(anchor)+(forward?step:-step):r.track[Math.max(0,Math.min(r.track.length-1,OdoTelemetry.nearest(r.track,anchor)+(forward?step:-step)))][2];
  seekTrackTime(clamp(time));return;
 }
 if(e.target.dataset.traceKind==='motion'){
  e.preventDefault();seekTrackTime(e.key==='Home'?0:e.key==='End'?r.duration:Math.floor(trackTime)+(forward?step:-step));return;
 }
 const index=e.key==='Home'?0:e.key==='End'?r.track.length-1:playIndex+(forward?step:-step);
 e.preventDefault();seekTelemetry(index);
});
