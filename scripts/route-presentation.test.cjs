const test=require('node:test'),assert=require('node:assert/strict'),source=require('../web/track-model.js'),display=require('../web/route-presentation.js');
const p=(x,y,t,segment=0)=>[x,y,t,36,3,100,90,segment];
test('story playback connects missing positions without turning them into observed measurements',()=>{
 const track=[p(77,12,0),p(77.001,12,1),p(77.003,12.002,10,1),p(77.004,12.002,11,1)],before=JSON.stringify(track),model=source.build(track,{gapLimit:3}),state=display.atTime(model,5.5),a=model.points[1],b=model.points[2];
 assert.equal(state.gap,true);assert.equal(state.interpolated,true);assert.equal(state.speed,null);assert.equal(state.index,2);assert.equal(state.x,(a.x+b.x)/2);assert.equal(state.z,(a.z+b.z)/2);assert.equal(source.atTime(model,5.5).gap,true);assert.equal(source.atTime(model,5.5).speed,null);assert.equal(JSON.stringify(track),before);
});
test('connected samples and source speed retain their exact existing replay behavior',()=>{
 const model=source.build([p(77,12,0),p(77.001,12.001,1),p(77.002,12.001,2)]);
 for(const t of [0,.25,1,1.5,2]){const state=display.atTime(model,t);assert.equal(state.interpolated,false);const {interpolated,...rest}=state;assert.deepEqual(rest,source.atTime(model,t));}
});
test('display continuity never extrapolates outside the recorded time domain',()=>{
 const model=source.build([p(77,12,2),p(77.001,12.001,3)]);for(const t of [0,4,NaN]){const state=display.atTime(model,t);assert(state.gap);assert.equal(state.interpolated,false);assert.equal(state.speed,null);}
});
test('connector direction follows the two source endpoints and dateline crossings stay local',()=>{
 const model=source.build([p(179.999,12,0),p(-179.999,12,10)],{gapLimit:3}),state=display.atTime(model,5),direction=display.direction(model,state);assert(state.interpolated);assert(direction.x>0);assert.equal(direction.z,0);assert(Math.abs(state.x)<1e-8);
});
