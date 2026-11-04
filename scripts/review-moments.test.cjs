const test=require('node:test'),assert=require('node:assert/strict'),{list}=require('../web/review-moments.js');
const moment=(id,t,kind='impact',g=3.8)=>({id,t,kind,g,reason:'private free text',lon:77,lat:12});
test('review moments preserve source events and distinguish phone peaks from GPS changes',()=>{
 const ride={duration:120,events:[moment('last',100,'braking',.25),moment('first',0),moment('middle',60,'acceleration',0)]},before=JSON.stringify(ride);
 const result=list(ride);assert.deepEqual(result.map(e=>e.id),['first','middle','last']);assert.equal(result[0].channel,'motion');assert.equal(result[1].channel,'speed');assert.equal(result[1].g,0);assert.match(result[0].description,/gravity/);assert.match(result[2].source,/GPS/);assert.equal(JSON.stringify(ride),before);assert(!JSON.stringify(result).includes('private free text'));assert(!Object.hasOwn(result[0],'lon'));
});
test('review moments exclude ambiguous IDs, invalid magnitudes, unsupported kinds and out-of-window events',()=>{
 const events=[moment('same',1),moment('same',2),moment('same',3),moment('negative',-1),moment('late',121),moment('nan',NaN),moment('null',null),moment('no-g',4,'impact',null),moment('infinite',4,'impact',Infinity),moment('too-large',4,'impact',1001),moment('unknown',4,'other'),moment('constructor',4,'constructor'),moment('last-bin',120),moment('last-fix',120,'braking',.2),moment('fraction',119.5),null];
 assert.deepEqual(list({duration:120,events}).map(e=>e.id),['fraction','last-fix']);
 assert.deepEqual(list({duration:0,events}),[]);assert.deepEqual(list({duration:NaN,events}),[]);assert.deepEqual(list(null),[]);
});
test('GPX imports do not inherit the native recorder candidate list',()=>{
 assert.deepEqual(list({duration:120,source:'GPX export',events:[moment('injected',60)]}),[]);
});
