(function(root){
'use strict';
const J=OdoFieldJournal,store=OdoJournalStore,media=OdoJournalMedia;
let mode='',tripId='',second=0,row=null,seconds=[],links=[],ticket=0,group='',tag='',loadError='',loading=false;
const pending=new Set();
let plan=null,compared={state:'no-plan',candidates:[]};
const detourPrompt=['Was this change of route intentional?',['Scenic detour','Road closure','Stopped for food']];
const sample=()=>J.demoTrips(OdoPortable);
const pool=()=>mode==='demo'?sample():rides;
const link=r=>r.journalDemo?{journey:'Mountains to Coast',tags:r.tags}:links.find(x=>x.trip===r.id)||{journey:'',tags:[]};
const filtered=()=>pool().filter(r=>(!group||link(r).journey===group)&&(!tag||link(r).tags.includes(tag))).slice().sort((a,b)=>a.started-b.started);
const ride=()=>filtered().find(r=>r.id===tripId)||filtered()[0];
const key=(r,s)=>JSON.stringify([r.id,s]);
const q=(selector,box=document)=>box.querySelector(selector);
function resetTrip(r){
  tripId=r?.id||'';second=r?J.suggested(r)[0].second:0;row=null;seconds=[];
}
function panel(){
  if(!mode){mode=rides.length?'mine':'demo';resetTrip(ride());}
  return '<section id="field-journal" class="field-journal" aria-label="Journey field journal"></section>';
}
function selectMode(next,id){
  mode=next;group='';tag='';resetTrip(pool().find(r=>r.id===id)||ride());
  if(page==='journal')load();else navigate('journal');
}
async function load(){
  const id=++ticket;loadError='';loading=true;
  if(!q('#field-journal'))return;
  try{
    links=await store.links();if(id!==ticket||page!=='journal')return;
    const r=ride();if(r&&r.id!==tripId)resetTrip(r);
    if(r){
      const [record,times,paths]=await Promise.all([store.moment(r.id,second),store.seconds(r.id),r.journalDemo?OdoJournalRoute.samplePlan(r):store.plan(r.id)]);
      if(id!==ticket||page!=='journal')return;row=record||null;seconds=times;plan=paths;compared=OdoJournalRoute.compare(r,paths);
    }else{row=null;seconds=[];}
  }catch{if(id!==ticket)return;row=null;seconds=[];plan=null;compared={state:'unknown',candidates:[]};loadError='Local journal data could not be read. Reopen the journal to try again.';}
  loading=false;draw();
}
function option(value,label,active){return `<option value="${esc(value)}"${value===active?' selected':''}>${esc(label)}</option>`;}
const button=(act,label,cls='fj-text')=>`<button type="button" class="${cls}" data-fj="${act}">${label}</button>`;
const drawings=new WeakMap();
function drawing(r){
  const track=r.track||[];if(drawings.has(track))return drawings.get(track);
  const p=OdoRouteGeometry.project(track,{width:300,height:95,padding:12,includePath:false});
  let path='',last=-2;
  const stride=Math.max(1,Math.ceil(track.length/500)),gap=r.source==='GPX export'?30:3;
  for(let i=0;i<track.length;i++){
    const broken=i===0||track[i][7]!==track[i-1][7]||track[i][2]-track[i-1][2]>gap;
    const ends=i===track.length-1||track[i+1][7]!==track[i][7]||track[i+1][2]-track[i][2]>gap;
    if(!broken&&!ends&&i%stride!==0)continue;
    path+=(broken||last<0?'M':'L')+p.points[i].map(v=>v.toFixed(1)).join(',');last=i;
  }
  const result={path,points:p.points,project:p.point};drawings.set(track,result);return result;
}
function plannedPath(r){
  if(!plan||!r.track?.length)return '';
  const {project}=drawing(r);
  return plan.map(part=>part.map((p,i)=>(i?'L':'M')+project(p).map(n=>n.toFixed(1)).join(',')).join(' ')).join(' ');
}
function routeCard(r){
  const {path,points}=drawing(r),point=points[J.rowAt(r,second)];
  return `<div class="fj-map"><div class="fj-map-head"><span>TRIP TRACE</span><span>LOCAL &nbsp; ↑ N</span></div>${path?`<svg viewBox="0 0 300 95" role="img" aria-label="Trip trace with selected elapsed time highlighted"><path d="${path}"/>${plan?`<path class="fj-plan-line" d="${plannedPath(r)}"/>`:''}${point?`<circle cx="${point[0]}" cy="${point[1]}" r="7"/><circle cx="${point[0]}" cy="${point[1]}" r="2.8"/>`:''}</svg>`:'<p>No route geometry supplied</p>'}<small>${point?'Selected moment · '+J.clock(second):'Location unknown at this time'}</small></div>`;
}
const midpoint=c=>Math.round((c.start+c.end)/2);
function title(r){return J.suggested(r).find(x=>x.second===second)?.label||(compared.candidates.some(c=>midpoint(c)===second)?'A change of route':'A moment worth keeping');}
function contextCard(r){
  const c=compared.candidates,src=r.journalDemo?'Synthetic planned GPX':'Private planned GPX';
  const status=compared.state==='no-plan'?'No planned route supplied. Route changes are unknown.':compared.state==='no-coverage'?'Insufficient connected GPS fixes for a comparison.':plan?`${src} · dashed amber on the trip trace. A candidate needs at least three connected fixes and 300 m traced beyond a 300 m corridor.`:'Comparison unavailable.';
  const reports=r.journalDemo&&r.id.endsWith('1')?OdoJournalRoute.demoReports:[],coverage=OdoJournalRoute.coverage(r.distanceKm,reports);
  return `<div class="fj-context"><details><summary>Planned and ridden <small>${plan?c.length+' candidate'+(c.length===1?'':'s'):'Plan unknown'}</small></summary><p>${status}</p>
    ${c.slice(0,8).map(x=>`<button data-fj-at="${midpoint(x)}" class="fj-secondary">${J.clock(x.start)}–${J.clock(x.end)} · ~${fmt(x.meters/1000,1)} km traced away from plan ↗</button>`).join(' ')}
    ${!r.journalDemo?`${button('add-plan',plan?'Replace planned GPX':'Choose planned GPX','fj-secondary')} ${plan?button('remove-plan','Remove plan'):''}`:''}</details>
    <details><summary>Notes from other riders <small>${reports.length?'2 fictional reports':'No reports'}</small></summary>
    ${reports.length?`<p>Synthetic community example · two fictional riders described overlapping sections. Current conditions are unknown.</p><ul>${reports.map(x=>`<li>${x.date} · km ${x.from}–${x.to} · reported ${x.surface}</li>`).join('')}</ul><p>${fmt(coverage.smooth,0)} km smooth only · ${fmt(coverage.rough,0)} km rough only · ${fmt(coverage.conflict,0)} km conflicting · ${fmt(coverage.unknown,0)} km unreported.</p>`:'<p>No community service is connected. Road conditions are unknown.</p>'}</details></div>`;
}
function modeBar(){
  return `<div class="fj-top"><span class="fj-mark"><b>◈</b> ODOme <i>/</i> Field journal</span><div class="fj-switch" aria-label="Journal source">${button('demo','Sample expedition',mode==='demo'?'on':'')}${button('mine','My journal',mode==='mine'?'on':'')}</div></div>`;
}
function groupBar(all){
  if(mode==='demo')return '';
  const groups=[...new Set(all.map(r=>link(r).journey).filter(Boolean))].sort(),tags=[...new Set(all.flatMap(r=>link(r).tags))].sort();
  return `<div class="fj-filter"><label>Journey<select aria-label="Journey" data-fj-input="group">${option('','All recordings',group)}${groups.map(g=>option(g,g,group)).join('')}</select></label>
    <label>Collection<select aria-label="Collection" data-fj-input="tag">${option('','All collections',tag)}${tags.map(t=>option(t,t,tag)).join('')}</select></label>${button('organize','Organize a trip','fj-secondary')}</div>`;
}
function draw(){
  const host=q('#field-journal');if(!host||page!=='journal')return;
  if(recording){host.innerHTML='<div class="fj-empty"><p class="fj-kicker">RECORDING IN PROGRESS</p><h1>See you after the ride.</h1><p>Your journal will reopen when the recording ends. Review your memories while parked.</p></div>';return;}
  const r=ride(),all=pool(),list=filtered();
  const top=modeBar()+groupBar(all);
  if(!r){host.innerHTML=top+`<div class="fj-empty"><p class="fj-kicker">YOUR PRIVATE JOURNAL</p><h1>${all.length?'No trips in this view.':'Your first field note.'}</h1><p>${all.length?'Choose another journey or collection.':'Record a ride on Android or import a timed GPX or recorder ZIP. Then pair a moment with what you remember.'}</p>${all.length?button('clear','Show all trips','fj-primary'):'<button type="button" data-action="import" class="fj-primary">Import a recording</button>'} ${button('demo','Explore the sample')}</div>`;return;}
  const demo=mode==='demo',details=link(r),currentList=demo?list:details.journey?all.filter(x=>link(x).journey===details.journey):[r];
  const totals=J.distanceSummary(currentList),count=currentList.length,days=new Set(currentList.map(t=>new Date(t.started).toLocaleDateString())).size;
  const heroTitle=demo?'Mountains to Coast':details.journey||r.title;
  const facts=J.facts(r,second),moments=new Map(J.suggested(r).map(x=>[x.second,x.label]));
  for(const t of seconds)if(!moments.has(t)&&t<=r.duration)moments.set(t,'Saved moment');
  if(!moments.has(second))moments.set(second,'Selected moment');
  const caption=demo?'A two-day ride from misty switchbacks to the sea.':'A private record of the roads and moments you want to remember.';
  const sameEvidence=row?.ai?.facts&&Object.entries(facts).every(([k,v])=>row.ai.facts[k]===v);
  const activePrompt=(sameEvidence&&J.prompts[row.ai.review.question_intent])||(compared.candidates.some(c=>midpoint(c)===second)?detourPrompt:J.prompts[J.nextQuestion(facts)]);
  const cue=sameEvidence&&J.cueLabels[row.ai.review.visual_cue];
  const sources=demo?'Synthetic GPS':facts.source==='gpx'?'Timed GPX':'Phone recording';
  const answered=!!row?.note,example=demo&&r===sample()[0]&&second===5100;
  host.innerHTML=top+`<div class="fj-spread"><div class="fj-cover ${demo?'fj-demo':'fj-own'}">
    <div class="fj-cover-top"><span>FIELD JOURNAL &nbsp; / &nbsp; ${demo?'VOL. 01':'PRIVATE EDITION'}</span><span class="fj-stamp">${demo?'SYNTHETIC DEMO':'ON THIS DEVICE'}</span></div>
    <div class="fj-cover-text"><p class="fj-kicker">${demo?'THE WESTERN PASS SERIES':'FROM YOUR RIDES'}</p><h1>${esc(heroTitle)}</h1><p>${caption}</p></div>
    <div class="fj-cover-meta"><span><strong>${totals.km===null?'—':fmt(totals.km,0)}</strong> km${totals.known<totals.total?' known':''}</span><span><strong>${count}</strong> ${count===1?'trip':'trips'}</span><span><strong>${days}</strong> ${days===1?'day':'days'}</span></div></div>
    <aside class="fj-itinerary"><p class="fj-kicker">01 &nbsp; / &nbsp; ITINERARY</p><h2>Trip log</h2><label class="fj-trip-select">Select a recording<select data-fj-input="trip">${list.map(t=>option(t.id,t.title,r.id)).join('')}</select></label>
    ${list.slice(0,4).map((t,i)=>`<button class="fj-trip ${t.id===r.id?'current':''}" data-fj-trip="${esc(t.id)}"><span>${String(i+1).padStart(2,'0')}</span><div><b>${esc(t.title)}</b><small>${J.clock(t.duration)} elapsed${demo?' · Synthetic':''}</small></div><i>↗</i></button>`).join('')}
    <div class="fj-tags">${details.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${routeCard(r)}${button('replay','▷ &nbsp; Replay journey','fj-replay-button')}</aside></div>
    <section class="fj-notebook"><div class="fj-section-head"><div><p class="fj-kicker">02 &nbsp; / &nbsp; MOMENT REVIEW</p><h2>Along the way</h2></div><span class="fj-local">● &nbsp; AFTER THE RIDE</span></div>
    <div class="fj-moment-tabs" aria-label="Trip moments">${[...moments].sort((a,b)=>a[0]-b[0]).map(([t,label])=>`<button data-fj-at="${t}" aria-pressed="${t===second}"><b>${J.clock(t)}</b> ${esc(label)}</button>`).join('')}${button('time','＋ Choose time')}</div>
    <div class="fj-review"><div class="fj-evidence"><p class="fj-kicker">EVIDENCE AT &nbsp; ${J.clock(second)}</p><h3>${esc(title(r))}</h3>
    <div class="fj-source"><i>01</i><div><b>${sources}</b><p>${esc(J.measuredText(facts))}</p></div></div>
    <div class="fj-source"><i>02</i><div><b>Selected frame</b>${row?.frame?`<div class="fj-thumb"><img src="${esc(row.frame.url)}" alt="Selected frame at ${J.clock(second)}"><small>${row.frame.width} × ${row.frame.height}${row.frame.videoSecond!==null?' · clip '+row.frame.videoSecond.toFixed(1)+' s':''}</small></div>${button('consent','Review for Spark ↗')} ${button('remove-frame','Remove')}`:`<p>${demo&&r===sample()[0]&&second===5100?'A short illustrated clip accompanies this moment.':'No frame linked to this time.'}</p>${demo&&r===sample()[0]&&second===5100?button('sample-clip','Open sample clip ↗','fj-secondary'):''} ${button('media','Add your own frame')}`}</div></div>
    ${example&&!row?.frame?button('saved-review','Replay tested Spark review ↗','fj-receipt-button'):''}
    ${cue?`<div class="fj-source"><i>03</i><div><b>Spark · visual candidate</b><p>${esc(cue)}</p><small>${row.ai.kind==='saved-live-synthetic'?'Saved live response · replayed offline':'Live response'} · ${row.ai.review.evidence_ids.map(x=>x==='frame'?'selected frame':'ride window').join(' + ')} · ${fmt(row.ai.elapsed_ms/1000,1)} s</small></div></div>`:''}</div>
    <div class="fj-memory"><p class="fj-kicker">${answered?'RIDER CONFIRMED':row?.skipped?'LEFT OPEN':cue?'SPARK ASKS':'JOURNAL PROMPT · OFFLINE'}</p><h3>${answered?'In your words':row?.skipped?'Cause unknown':esc(activePrompt[0])}</h3>
    ${answered?`<blockquote>${esc(row.note)}</blockquote><p>Saved as your recollection at ${J.clock(second)}.</p>${button('answer','Edit memory','fj-secondary')} ${button('clear-note','Remove memory')}`:row?.skipped?`<p>You skipped this question. The original observation is still here.</p>${button('answer','Add a memory','fj-secondary')}`:`<p>The recording leaves room for your side of the story.</p><div class="fj-choices">${activePrompt[1].map(x=>`<button data-fj-choice="${esc(x)}">${esc(x)}</button>`).join('')}</div>${button('answer','Write my own')} ${button('skip','Skip for now')}`}
    </div></div>${loadError?`<p role="alert">${esc(loadError)}</p>`:''}</section>${contextCard(r)}`;
}
function choosePlan(r){
  const {d,box}=media.dialog('Add a planned route');
  box.innerHTML='<p class="fj-kicker">LOCAL GPS COMPARISON</p><h2>Your planned route.</h2><p>Select the GPX you intended to follow. Its coordinates stay on this device.</p><label>Planned GPX<input type="file" accept=".gpx,application/gpx+xml"></label><p class="fj-error" role="alert"></p>';
  q('input',box).onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>2*1024*1024)throw Error('Choose a planned GPX under 2 MiB.');const paths=OdoJournalRoute.planFromXml(await file.text());
      OdoJournalRoute.compare(r,paths);if(!d.open||!parked())return;await store.savePlan(r.id,paths);d.close();await load();
    }catch(err){q('.fj-error',box).textContent=err.message;}
  };
}
function parked(){if(recording){toast('Finish recording and park before reviewing moments.');return false;}return true;}
function replay(r){
  const journey=link(r).journey;
  const trips=(journey?pool().filter(t=>link(t).journey===journey):[r]).filter(t=>Number.isFinite(t.duration)&&t.duration>0).slice().sort((a,b)=>a.started-b.started);
  if(!trips.length)return toast('There is no timed trip to replay.');
  const {d,box}=media.dialog('Journey replay');d.classList.add('fj-replay-dialog');
  box.innerHTML=`<p class="fj-kicker">LOCAL ROUTE REPLAY${r.journalDemo?' &nbsp; / &nbsp; SYNTHETIC':''}</p><h2></h2><p class="fj-replay-trip"></p>
    <div class="fj-replay-screen"><svg viewBox="0 0 300 110" role="img" aria-label="Route traced from timed trip samples"><g transform="translate(0 7)"><path class="fj-replay-path"/><g class="fj-bike-marker"><circle r="8"/><g fill="none" stroke="currentColor" stroke-width=".95"><circle cx="-3.4" cy="1.8" r="1.65"/><circle cx="3.4" cy="1.8" r="1.65"/><path d="m-3.4 1.8 2-3.5h2l1.7 3.5h-3.3l-1.6-3.5m2 0 1.4-1.5H3l.5 1.2"/></g></g></g></svg></div>
    <div class="fj-replay-values"><span>Elapsed <b data-metric="time"></b></span><span>Speed <b data-metric="speed"></b></span><span>Source elevation <b data-metric="alt"></b></span></div>
    <label>Journey timeline<input type="range" min="0" step="1" max="1" value="0"></label><p class="fj-status"></p>
    <div class="fj-replay-actions"><button type="button" class="fj-primary fj-play">Play</button><button type="button" class="fj-secondary fj-pin">Review this time</button></div>`;
  const ends=[];let total=0;for(const t of trips){total+=Math.max(1,Math.floor(t.duration));ends.push(total);}
  const slider=q('input',box),play=q('.fj-play',box),pin=q('.fj-pin',box);slider.max=total;
  let pos=0,idx=-1,local=0,last=0,raf=0,playing=false;
  function paint(){
    const n=Math.floor(pos),i=ends.findIndex(end=>n<end),next=i===-1?trips.length-1:i,t=trips[next];
    local=Math.min(Math.floor(t.duration),n-(ends[next-1]||0));slider.value=n;
    const geom=drawing(t),sampleIndex=J.rowAt(t,local),p=geom.points[sampleIndex],sample=t.track?.[sampleIndex];
    if(idx!==next){idx=next;q('h2',box).textContent=journey||t.title;q('.fj-replay-trip',box).textContent=`Trip ${idx+1} of ${trips.length} · ${t.title}`;q('.fj-replay-path',box).setAttribute('d',geom.path);}
    const marker=q('.fj-bike-marker',box);marker.style.display=p?'':'none';if(p)marker.setAttribute('transform',`translate(${p[0]} ${p[1]})`);
    q('[data-metric=time]',box).textContent=J.clock(local);q('[data-metric=speed]',box).textContent=Number.isFinite(sample?.[3])?fmt(sample[3],0)+' km/h':'Unknown';
    q('[data-metric=alt]',box).textContent=Number.isFinite(sample?.[5])?fmt(sample[5],0)+' m':'Unknown';
    q('.fj-status',box).textContent=p?(t.source==='GPX export'?'Timed track · interval speed estimate':'Phone recording · nearest observed fix'):'GPS coverage gap · location unknown';
  }
  function stop(){playing=false;cancelAnimationFrame(raf);play.textContent=pos>=total?'Replay':'Play';}
  function tick(now){
    if(!d.open||document.hidden){stop();return;}
    pos=Math.min(total,pos+(now-last)*total/(Math.min(60,trips.length*13)*1000));last=now;paint();
    if(pos>=total){stop();return;}raf=requestAnimationFrame(tick);
  }
  function start(){if(pos>=total)pos=0;playing=true;last=performance.now();play.textContent='Pause';raf=requestAnimationFrame(tick);}
  play.onclick=()=>playing?stop():start();slider.oninput=()=>{stop();pos=Number(slider.value);paint();};
  pin.onclick=()=>{if(!parked())return;stop();group='';tag='';resetTrip(trips[idx]);second=local;d.close();load();};
  const visibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',visibility);
  d.addEventListener('close',()=>{stop();document.removeEventListener('visibilitychange',visibility);},{once:true});
  paint();
}
async function replayExample(r,t){
  if(!r.journalDemo||r!==sample()[0]||t!==5100)return;
  const [data,image]=await Promise.all([fetch('assets/field-spark-review.json'),fetch('assets/field-overlook.jpg')]);
  if(!data.ok||!image.ok)throw Error('The recorded example could not be loaded.');
  const ai=await data.json(),bytes=new Uint8Array(await image.arrayBuffer());
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(ai.frame_sha256!==digest||JSON.stringify(ai.facts)!==JSON.stringify(J.facts(r,t)))throw Error('Example evidence changed.');
  const url='data:image/jpeg;base64,'+btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
  const frame={url,width:640,height:320,videoSecond:3,id:crypto.randomUUID()};
  await store.update(r.id,t,old=>old.frame?undefined:{...old,frame,ai});await refreshIf(r,t);
}
async function refreshIf(r,t){if(page==='journal'&&ride()?.id===r.id&&second===t)await load();}
async function saveNote(r,t,note,skipped=false){
  await store.update(r.id,t,old=>({...old,note,skipped}));await refreshIf(r,t);
}
function inputDialog(title,markup,onSubmit){
  const {d,box}=media.dialog(title);box.innerHTML=`<h2>${esc(title)}</h2><form>${markup}<p class="fj-error" role="alert"></p><button type="submit" class="fj-primary">Save</button></form>`;
  const form=q('form',box);form.onsubmit=async e=>{e.preventDefault();if(!parked())return;const b=q('[type=submit]',form);b.disabled=true;try{await onSubmit(new FormData(form));d.close();}catch(err){q('.fj-error',form).textContent=err.message;b.disabled=false;}};
}
function organize(){
  if(!rides.length){toast('Import a recording before organizing trips.');return;}
  const r=ride()||rides[0];
  const {d,box}=media.dialog('Organize a trip');
  box.innerHTML=`<p class="fj-kicker">PRIVATE COLLECTIONS</p><h2>Organize a trip.</h2><form><label>Recording<select name="trip">${rides.map(t=>option(t.id,t.title,r.id)).join('')}</select></label><label>Journey title<input name="journey" maxlength="80" list="fj-journey-names" placeholder="e.g. A weekend in the hills"></label><datalist id="fj-journey-names">${[...new Set(links.map(x=>x.journey).filter(Boolean))].map(v=>option(v,v,'')).join('')}</datalist><label>Collections, separated by commas<input name="tags" maxlength="390" placeholder="mountains, weekend rides"></label><p>Use the same journey title for multiple days. Clear it to take this trip out of a journey. The original recording stays in Rides.</p><p class="fj-error" role="alert"></p><button class="fj-primary">Save organization</button></form>`;
  const f=q('form',box);
  const show=()=>{const l=links.find(x=>x.trip===f.elements.trip.value);f.elements.journey.value=l?.journey||'';f.elements.tags.value=(l?.tags||[]).join(', ');};show();f.elements.trip.onchange=show;
  f.onsubmit=async e=>{e.preventDefault();const b=q('button',f);b.disabled=true;try{const id=f.elements.trip.value;await store.saveLink(store.normalizeLink(id,f.elements.journey.value,f.elements.tags.value));group='';tag='';resetTrip(rides.find(x=>x.id===id));await load();d.close();}catch{q('.fj-error',f).textContent='Could not save trip organization.';b.disabled=false;}};
}
function consent(r,t,entry){
  const frame=entry.frame,facts=J.facts(r,t),id=key(r,t);
  const {d,box}=media.dialog('Review what Spark receives');
  box.innerHTML=`<p class="fj-kicker">ONE REQUEST &nbsp; / &nbsp; META MUSE SPARK 1.3</p><h2>Review before sending.</h2>
  <img class="fj-consent-frame" alt="Exactly the JPEG selected for Meta" src="${esc(frame.url)}"><p>One JPEG · ${frame.width} × ${frame.height} · ${Math.ceil(atob(frame.url.split(',')[1]).length/1024)} KiB. These are the ride facts sent with it.</p>
  <pre></pre><p>The full clip, audio, coordinates, filenames and rider notes stay on this device. Standard Meta processing applies. The server requests <code>store:false</code>.</p><p class="fj-status" role="status">Checking the companion connection…</p>
  <label class="fj-check"><input type="checkbox"> I approve sending this frame and these facts to Meta.</label><button type="button" class="fj-primary" disabled>Send once to Spark</button>`;
  q('pre',box).textContent=JSON.stringify(facts,null,2);
  const send=q('.fj-primary',box),check=q('input',box),status=q('.fj-status',box);let available=false,started=false;
  function controls(){send.disabled=!available||!check.checked||started||pending.has(id);}
  check.onchange=controls;
  odoCompanionRequest('GET').then(v=>{if(!d.open)return;available=v.enabled;status.textContent=available?'Gateway ready. One request uses one unit of its configured allowance.':'Spark is offline or its allowance is exhausted. You can still add your memory.';controls();}).catch(()=>{status.textContent='Spark is unavailable. Your frame is saved locally.';});
  send.onclick=async()=>{
    if(send.disabled||!parked())return;started=true;pending.add(id);controls();
    try{
      const latest=await store.moment(r.id,t);
      if(!d.open||latest?.frame?.id!==frame.id)throw Error('The selected frame changed. Open its preview again.');
      status.textContent='Asking Spark about this frame…';
      const result=await odoCompanionRequest('FRAME',{consent:'one-frame-v1',facts,jpeg:frame.url.split(',')[1]});
      await store.update(r.id,t,old=>old.frame?.id===frame.id?{...old,ai:{...result,facts}}:undefined);
      d.close();await refreshIf(r,t);toast('Spark reviewed the frame. Your recollection is kept separately.');
    }catch(e){status.textContent=e.message+' Your local memory is still available.';}finally{pending.delete(id);controls();}
  };
}
async function act(e){
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-fj-open')){if(!parked())return;selectMode(b.dataset.fjOpen==='trip'?'mine':'demo',b.dataset.fjOpen==='trip'?current()?.id:'');return;}
  if(!b.closest('#field-journal')||page!=='journal')return;
  const a=b.dataset.fj;if(a==='demo'||a==='mine'){selectMode(a);return;}
  if(a==='clear'){group='';tag='';resetTrip(ride());await load();return;}
  if(a==='organize'&&parked()){organize();return;}
  const r=ride();if(!r||!parked()||loading)return;
  if(b.dataset.fjTrip){resetTrip(pool().find(x=>x.id===b.dataset.fjTrip));await load();return;}
  if(b.dataset.fjAt!==undefined){second=Number(b.dataset.fjAt);await load();return;}
  const t=second;
  if(a==='add-plan'&&!r.journalDemo)choosePlan(r);
  if(a==='remove-plan'&&!r.journalDemo){await store.savePlan(r.id,null);await load();}
  if(a==='replay')replay(r);
  if(a==='saved-review')await replayExample(r,t);
  if(a==='time')inputDialog('Choose a ride time',`<label>Elapsed time (h:mm:ss)<input name="time" value="${J.clock(t)}" required></label><p>Trip duration ${J.clock(r.duration)}.</p>`,async data=>{const s=J.parseTime(data.get('time'));if(!Number.isInteger(s)||s>r.duration)throw Error('Enter a time within this trip.');second=s;await load();});
  if(a==='media'||a==='sample-clip')media.choose({ride:r,second:t,sample:a==='sample-clip',onSave:async(target,frame)=>{await store.update(r.id,target,old=>({...old,frame,ai:null}));if(page==='journal'&&ride()?.id===r.id){second=target;await load();}}});
  if(a==='consent'&&row?.frame)consent(r,t,row);
  if(a==='remove-frame'){await store.update(r.id,t,old=>({...old,frame:null,ai:null}));await refreshIf(r,t);}
  if(a==='answer'||b.dataset.fjChoice)inputDialog('Your memory',`<label>What happened here?<textarea name="note" required maxlength="420" rows="3">${esc(b.dataset.fjChoice||row?.note||'')}</textarea></label><p>This stays on your device, linked to ${J.clock(t)}.</p>`,async data=>{const s=data.get('note').trim();if(!s)throw Error('Write a memory or skip the question.');await saveNote(r,t,s);});
  if(a==='skip'||a==='clear-note')await saveNote(r,t,'',a==='skip');
}
document.addEventListener('click',e=>act(e).catch(()=>toast('That journal change could not be saved. Try again on this device.')));
document.addEventListener('change',e=>{
  const kind=e.target.dataset.fjInput;if(!kind)return;
  if(kind==='trip')resetTrip(pool().find(x=>x.id===e.target.value));
  if(kind==='group')group=e.target.value;if(kind==='tag')tag=e.target.value;
  load();
});
root.OdoJournalView={panel,load};
root.addEventListener('odo-ready',()=>{if(new URLSearchParams(location.search).get('journal')==='demo')selectMode('demo');});
})(window);
