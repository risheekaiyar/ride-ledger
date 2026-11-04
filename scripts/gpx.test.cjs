const test=require('node:test'),assert=require('node:assert/strict'),{coordinate,timestamp}=require('../web/gpx.js');
test('GPX coordinates reject blank, missing, non-decimal and out-of-range values',()=>{
 for(const value of ['',null,' ','0x12','Infinity','NaN','1e2','91','-91'])assert.throws(()=>coordinate(value,'latitude',1),/latitude/);
 assert.equal(coordinate(' 0 ','latitude',1),0);assert.equal(coordinate('-180','longitude',1),-180);assert.equal(coordinate('+77.20','longitude',1),77.2);
});
test('GPX times require explicit zones and valid calendar values',()=>{
 for(const value of ['2026-01-01T10:00:00','2026-02-30T10:00:00Z','2026-11-31T00:00:00Z','2026-01-01T24:00:00Z','2026-01-01T12:60:00Z','2026-01-01T12:00:60Z','2026-01-01T12:00:00+15:00','2026-01-01T12:00:00+14:01','2026-01-01T12:00:00+00:60','2025-02-29T12:00:00Z',null])assert.throws(()=>timestamp(value,2),/GPX point 2/);
 assert.equal(timestamp('2024-02-29T12:00:00.123Z',1),Date.parse('2024-02-29T12:00:00.123Z'));
 assert.equal(timestamp('2026-11-04T12:30:00+05:30',1),Date.parse('2026-11-04T07:00:00Z'));
 assert.equal(timestamp('2026-11-04T00:00:00-04:00',1),Date.parse('2026-11-04T04:00:00Z'));
});
