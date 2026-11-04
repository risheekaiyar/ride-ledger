'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const reel = require('../web/insight-reel.js');
const turns = require('../web/ride-insights.js');
const companion = require('../web/companion.js');
const { packet, extractRecap } = require('./muse-runtime.cjs');

function scenario(stopCount, elevation, turnRate, gap, placement) {
  const duration = 240;
  const track = [];
  let longitude = 0, latitude = 0;
  for (let t = 0; t <= duration; t++) {
    if (gap && t >= 190 && t < 190 + gap) continue;
    const paused = Array.from({length:stopCount}, (_,i)=>70+i*27).some(start=>t>=start&&t<start+12);
    const speed = paused ? 0 : 32;
    const heading = ((t < 32 ? turnRate * t : turnRate * 32) + 1440) % 360;
    longitude += Math.sin(heading*Math.PI/180)*speed/3.6/111195;
    latitude += Math.cos(heading*Math.PI/180)*speed/3.6/111195;
    const altitude = elevation === 'missing' ? null : elevation === 'hill'
      ? 150+Math.min(t, duration-t) : elevation === 'down' ? 400-t : 150;
    track.push([longitude, latitude, t, speed, 3, altitude, heading, t>=190+gap&&gap ? 1 : 0, .5]);
  }
  return {kind:'ride', placement, duration, quality:99, medianAccuracy:3, track, stats:[], events:[]};
}

test('720 synthetic combinations preserve stops, elevation, directional turn estimates and missing time', () => {
  let cases=0;
  for (const stops of [0,1,2,4])
  for (const elevation of ['flat','hill','down','missing'])
  for (const rate of [-18,-8,0,8,18])
  for (const gap of [0,8,35])
  for (const placement of ['Pocket','Rigid mount','Bag']) {
    const ride=scenario(stops,elevation,rate,gap,placement);
    const result=reel.analyze(ride), dynamics=turns.analyze(ride);
    assert.equal(result.pauseWindows.length,stops);
    assert.ok(result.pauseWindows.every(w=>w.end_second-w.start_second===11));
    assert.equal(result.facts.altitude_span,{flat:0,hill:120,down:240,missing:undefined}[elevation]);
    assert.equal(Boolean(dynamics.left),rate<0);
    assert.equal(Boolean(dynamics.right),rate>0);
    if(rate){
      const expected=Math.atan((32/3.6)*Math.abs(rate)*Math.PI/180/9.80665)*180/Math.PI;
      assert.ok(Math.abs(Math.abs((dynamics.left??dynamics.right).angle)-expected)<.001);
    }
    assert.equal(result.facts.missing,gap?gap+1:0);
    assert.equal(result.available.includes('elevation'),elevation!=='missing');
    const recap=reel.packet(result,{weather:'light_rain',...(stops?{pause:{window:0,reason:'fuel'}}:{})});
    const input=packet({question:'Explain the ride rhythm.',rides:[companion.evidence(ride)],recap});
    assert.deepEqual(input.recap.pause_windows,result.pauseWindows);
    assert.equal(input.recap.rider_context.weather,'light_rain');
    assert.equal(input.recap.rider_context.pause?.reason,stops?'fuel':undefined);
    assert.ok(!JSON.stringify(input).includes('"track"'));
    cases++;
  }
  assert.equal(cases,720);
});

test('gateway rejects invented context fields, nonexistent stop labels and overlapping windows',()=>{
  const ride=scenario(2,'hill',8,8,'Pocket');
  const body={question:'Explain the ride rhythm.',rides:[companion.evidence(ride)],recap:reel.packet(reel.analyze(ride))};
  for(const change of [
    x=>{x.recap.rider_context={weather:'unknown weather'};},
    x=>{x.recap.rider_context={note:'unreviewed text'};},
    x=>{x.recap.rider_context={pause:{window:2,reason:'fuel'}};},
    x=>{x.recap.pause_windows[1]={...x.recap.pause_windows[0]};},
    x=>{x.recap.pause_windows[0].end_second=241;},
    x=>{x.recap.pause_windows=[{start_second:0,end_second:60}];}
  ]){const changed=structuredClone(body);change(changed);assert.throws(()=>packet(changed),/rider|window/i);}
});

test('a major evidence gap stays visible first without overriding an explicit elevation question',()=>{
  const ride=scenario(0,'hill',0,0,'Pocket');
  ride.track=ride.track.filter(p=>p[2]<120||p[2]>180);
  const context=reel.packet(reel.analyze(ride));
  const chapters=context.scenes.map(scene=>({
    scene,headline:'Review the journey',insight:'Review the available observations.',
    fact_ids:[reel.scenes[scene].facts.find(id=>context.facts[id]!==undefined)]
  })).sort((a,b)=>Number(b.scene==='elevation')-Number(a.scene==='elevation'));
  const result={status:'completed',output:[{type:'message',content:[{type:'output_text',
    text:JSON.stringify({title:'Journey review',takeaway:'Check the missing period in your recording.',chapters})}]}]};
  assert.equal(extractRecap(result,context,'What stood out?').chapters[0].scene,'rhythm');
  assert.equal(extractRecap(result,context,'Focus on elevation.').chapters[0].scene,'elevation');
});
