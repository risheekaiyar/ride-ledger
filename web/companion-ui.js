/* Conversations are scoped to the current ride and retained only in memory. */
const odoConversations=new Map();
function museSetup(options={}){
 const ride=page==='overview'?rides[0]:current();
 if(!ride){modal(`<h2>Your companion starts with your ride.</h2><p class="subtle">Import a recording or record with the Android app. Odo will help explain the evidence, compare compatible journeys and shape your ride story.</p><div class="actions"><button data-action="close">Close</button><button id="companion-import" class="primary">Import a ride</button></div>`);$('#companion-import').onclick=()=>{$('#modal').close();$('#zip-input').click();};return;}
 const comparison=options.comparisonId?rides.find(r=>r.id===options.comparisonId&&r.id!==ride.id):rides.find(r=>OdoCompanion.comparable(ride,r));
 const comparisonContext=comparison?OdoCompare.packet(OdoCompare.compare(ride,comparison)):null;
 const selectedRides=[ride,...(comparison?[comparison]:[])];
 const evidence=selectedRides.map(r=>OdoCompanion.evidence(r,r.source==='GPX export'?null:OdoRideInsights.summary(r,OdoRideInsights.analyze(r))));
 // Reset context after any evidence change; stale replies must not appear to explain new facts.
 const fingerprint=JSON.stringify({selection:selectedRides.map(r=>r.id),evidence,comparison:comparisonContext});
 let conversation=odoConversations.get(ride.id);
 if(!conversation||conversation.fingerprint!==fingerprint){conversation={fingerprint,turns:[]};odoConversations.set(ride.id,conversation);}
 const evidenceLinks=ids=>ids.map(id=>{const n=Number(id.replace('trip_',''))-1;return selectedRides[n]?`<button class="evidence-link" data-companion-trip="${n}">↗ ${esc(selectedRides[n].title)}</button>`:'';}).join('');
 modal(`<div class="flex between"><span class="eyebrow">ODO / META COMPANION</span><button data-action="close" aria-label="Close companion">×</button></div><h2 class="companion-title">Let's unpack the ride.</h2><p class="subtle">${esc(ride.title)}${comparison?' · paired with '+esc(comparison.title):' · one journey, in context'}</p><div id="companion-status" role="status">Checking connection…</div>${window.OdoNativeCompanion?'<button type="button" id="companion-connect">Connection settings</button>':''}<div class="prompt-options"><button data-prompt="What stands out in this ride, and what can the evidence actually support?">Debrief my ride</button><button data-prompt="How could my phone placement and bike setup affect these measurements? What should I check next?">Check my setup</button><button data-prompt="Suggest a short title and caption for this ride story, without adding places, weather or experiences that are not in the evidence.">Shape my story</button></div><details class="section"><summary>Review what is sent to Meta</summary><p class="tiny">Your question, the recent conversation below and these summaries are sent only when you press Send. Routes, exact timestamps, raw samples and private notes are excluded. Anything you type is shared as written.</p><pre class="odo-payload">${esc(JSON.stringify(evidence,null,2))}</pre>${comparisonContext?`<p class="tiny">Comparison screening and one-second summaries</p><pre class="odo-comparison-payload">${esc(JSON.stringify(comparisonContext,null,2))}</pre>`:''}</details><div id="companion-thread" class="companion-thread" aria-live="polite"></div><form id="companion-form"><label>Ask or add context<textarea name="question" maxlength="500" required placeholder="That pause was a tea stop. Can you help tell the story?"></textarea></label><div class="actions"><button type="button" id="companion-clear">Clear conversation</button><button class="primary" id="companion-send">Send to Meta</button></div></form><p class="tiny">Conversation stays in memory until reload. Each follow-up is a new model request. Suggestions are interpretations, not calibrated bike measurements.</p>`);
 const thread=$('#companion-thread'),status=$('#companion-status'),form=$('#companion-form'),send=$('#companion-send');
 const draw=()=>{thread.innerHTML=conversation.turns.map(t=>`<article class="companion-turn"><p class="companion-question">${esc(t.question)}</p><span class="eyebrow">META ${esc(t.answer.model)}</span><p>${esc(t.answer.summary)}</p>${t.answer.observations.map(o=>`<div class="companion-observation"><p>${esc(o.text)}</p>${evidenceLinks(o.evidence_ids)}</div>`).join('')}${t.answer.question?`<p class="subtle">${esc(t.answer.question)}</p>`:''}</article>`).join('');};
 draw();let pending=false;if($('#companion-connect'))$('#companion-connect').onclick=()=>window.OdoNativeCompanion.configure();
 $('#companion-clear').onclick=()=>{if(pending)return;conversation.turns=[];draw();};
 $$('#modal [data-prompt]').forEach(b=>b.onclick=()=>{form.elements.question.value=b.dataset.prompt;form.elements.question.focus();});
 thread.onclick=e=>{const b=e.target.closest('[data-companion-trip]');if(!b)return;selected=selectedRides[Number(b.dataset.companionTrip)].id;$('#modal').close();navigate('detail');};
 odoCompanionRequest('GET').then(v=>{if(!status.isConnected)return;status.textContent=v.enabled?`Meta ready · ${v.remaining} requests remaining`:v.configured?'Request allowance exhausted. Configure a new allowance on the local server.':'Meta is not configured on this server. Your local ride tools remain available.';send.disabled=!v.enabled;}).catch(error=>{if(status.isConnected){status.textContent=error.message||'Meta runtime is not reachable.';send.disabled=true;}});
 form.onsubmit=async e=>{e.preventDefault();if(pending||send.disabled)return;const question=form.elements.question.value.trim();if(!question)return;pending=true;send.disabled=true;status.textContent='Odo is reading the evidence…';
 const history=conversation.turns.slice(-2).flatMap(t=>[{role:'user',content:t.question},{role:'assistant',content:t.answer.summary.slice(0,600)}]);
 try{const answer=await odoCompanionRequest('POST',{question,rides:evidence,history,...(comparisonContext?{comparison:comparisonContext}:{})});conversation.turns.push({question,answer});conversation.turns=conversation.turns.slice(-8);if(thread.isConnected){draw();form.elements.question.value='';status.textContent=`Meta replied · ${answer.remaining} requests remaining`;thread.lastElementChild?.scrollIntoView({block:'nearest'});send.disabled=answer.remaining===0;}}
 catch(error){if(status.isConnected){status.textContent=error.message;send.disabled=false;}}
 finally{pending=false;}
 };
}

if(location.hash==='#companion-overlay'){
 document.body.classList.add('companion-overlay');
 const open=()=>{if(!document.querySelector('#modal').open)museSetup();};
 window.addEventListener('odo-ready',open,{once:true});
 // IndexedDB may have resolved while scripts loaded.
 if(document.querySelector('#content').children.length)open();
}
