const test=require('node:test'),assert=require('node:assert/strict'),S=require('../web/elevation-scale.js');
test('meter ticks bracket the source range with equal intervals, including negative altitudes',()=>{
 for(const [min,max] of [[782.3,858.2],[-418,-300],[0,.7],[3250,7800],[180,180]]){const s=S.create(min,max);assert(s.floor<=min);assert(s.ceiling>=max);assert(s.ticks.length>=2&&s.ticks.length<=7);for(let i=1;i<s.ticks.length;i++)assert(Math.abs(s.ticks[i]-s.ticks[i-1]-s.step)<1e-6);assert.equal(S.height(s.floor,s),0);assert.equal(S.height(s.ceiling,s),1);}
});
test('elevation colors are tied to altitude, not the section index or elapsed time',()=>{
 const scale=S.create(100,500);assert.equal(S.color(100,scale),'#3bd8e6');assert.equal(S.color(300,scale),'#f5f7f8');assert.equal(S.color(500,scale),'#ff4655');assert.equal(S.color(-10,scale),S.color(100,scale));assert.equal(S.color(900,scale),S.color(500,scale));
 const climbs=[100,200,500,200,100].map(v=>S.color(v,scale));assert.equal(climbs[0],climbs[4]);assert.equal(climbs[1],climbs[3]);assert.notEqual(climbs[1],climbs[2]);
});
test('unobserved elevation intervals split surfaces; a lone observed interval is preserved',()=>{
 const bins=[{complete:true,max:120},{complete:true,max:130},{complete:false,max:200},{complete:true,max:150},{complete:true,max:null}],before=JSON.stringify(bins),runs=S.runs(bins);assert.deepEqual(runs.map(r=>r.map(b=>b.index)),[[0,1],[3]]);assert.equal(runs[1][0].max,150);assert.equal(JSON.stringify(bins),before);
});
test('invalid altitude domains fail explicitly and a flat domain has a neutral color',()=>{
 for(const values of [[NaN,2],[0,Infinity],[20,10]])assert.throws(()=>S.create(...values));const s=S.create(42,42);assert.equal(S.color(42,s),'#f5f7f8');assert.equal(S.format(1200.35),'1,200.3');
});
