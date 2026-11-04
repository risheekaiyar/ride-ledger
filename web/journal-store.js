(function(root){
'use strict';
let database;
function open(){
  if(!database)database=new Promise((resolve,reject)=>{
    const req=indexedDB.open('odo-field-journal-v1',2);
    req.onupgradeneeded=()=>{
      if(!req.result.objectStoreNames.contains('moments'))req.result.createObjectStore('moments',{keyPath:['trip','second']}).createIndex('trip','trip');
      if(!req.result.objectStoreNames.contains('links'))req.result.createObjectStore('links',{keyPath:'trip'});
      if(!req.result.objectStoreNames.contains('plans'))req.result.createObjectStore('plans',{keyPath:'trip'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>{database=null;reject(req.error);};
  });
  return database;
}
async function read(store,run){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const q=run(db.transaction(store).objectStore(store));
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
  });
}
async function change(store,run){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Journal change cancelled.'));
    run(tx.objectStore(store));
  });
}
function update(trip,second,fn){
  return change('moments',store=>{
    const q=store.get([trip,second]);
    q.onsuccess=()=>{
      const row=q.result||{trip,second},next=fn(row);
      if(next===undefined)return;
      if(!next||!(next.frame||next.note||next.skipped))store.delete([trip,second]);else store.put(next);
    };
  });
}
function normalizeLink(trip,journey,tags){
  const unique=new Map();
  for(const v of tags.split(',')){const tag=v.trim().slice(0,32);if(tag&&!unique.has(tag.toLowerCase()))unique.set(tag.toLowerCase(),tag);}
  return {trip,journey:journey.trim().slice(0,80),tags:[...unique.values()].slice(0,12)};
}
root.OdoJournalStore={update,normalizeLink,
  moment:(trip,sec)=>read('moments',s=>s.get([trip,sec])),
  seconds:trip=>read('moments',s=>s.index('trip').getAllKeys(trip)).then(keys=>keys.map(key=>key[1])),
  links:()=>read('links',s=>s.getAll()),
  plan:trip=>read('plans',s=>s.get(trip)).then(row=>row?.paths||null),
  savePlan:(trip,paths)=>change('plans',s=>paths?s.put({trip,paths}):s.delete(trip)),
  saveLink:link=>change('links',s=>{if(link.journey||link.tags.length)s.put(link);else s.delete(link.trip);})
};
})(globalThis);
