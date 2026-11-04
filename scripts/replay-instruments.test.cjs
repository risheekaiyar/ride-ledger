'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {dynamics}=require('../web/replay-instruments.js');
const reel=require('../web/insight-reel.js');

test('GPS estimates distinguish acceleration, braking, right turns and missing axes',()=>{
 const track=[
  [77,12,0,18,3,50,355,0,.5],
  [77.0001,12,1,27,3,50,5,0,.5],
  [77.0002,12,2,18,3,50,null,0,.5],
  [77.0003,12,8,27,3,50,15,1,.5],
  [77.0004,12,9,30,30,50,20,1,.5]
 ];
 const samples=dynamics({track});
 assert.equal(samples.length,2);
 assert.ok(samples[0].longitudinal>0&&samples[0].lateral>0);
 assert.ok(samples[1].longitudinal<0);
 assert.equal(samples[1].lateral,null);
 assert.deepEqual(dynamics({source:'GPX export',track}),[]);
});

test('Meta may link only to an available elapsed pause window',()=>{
 const context={scenes:['rhythm'],facts:{low:30},pause_windows:[{start_second:10,end_second:40}]};
 const reply={title:'A pause worth a look',takeaway:'Confirm the reason for the pause.',chapters:[{
  scene:'rhythm',headline:'A stretch at low speed',insight:'This pause accounted for much of the slow time.',fact_ids:['low']
 }]};
 assert.equal(reel.validateReply({...reply,pause_window:0},context).pause_window,0);
 assert.throws(()=>reel.validateReply({...reply,pause_window:1},context),/unavailable low-speed window/);
 assert.equal(reel.validateReply({...reply,pause_window:null},context).pause_window,undefined);
});
