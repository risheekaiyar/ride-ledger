const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4178');await p.waitForSelector('.studio-hero');
 const cases=await p.evaluate(()=>{
  const point=(n,extra='')=>`<trkpt lat="12.000${n}" lon="77.000${n}"><time>2026-11-04T10:00:0${n}Z</time>${extra}</trkpt>`;
  const wrap=inside=>`<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>${inside}</trkseg></trk></gpx>`;
  const good=wrap(point(0)+point(1));
  const duplicate=OdoGpx.parse(wrap(point(0)+point(0)+point(1)));
  const altitude=OdoGpx.parse(wrap(point(0,'<ele>bad</ele>')+point(1,'<ele>0</ele>')));
  const segmented=OdoGpx.parse(`<gpx><trk><trkseg>${point(0)}</trkseg><trkseg>${point(1)+point(2)}</trkseg></trk></gpx>`);
  const invalid=[good.replace('lat="12.0000"','lat=""'),good.replace('2026-11-04T10:00:00Z','2026-11-04T10:00:00'),good.replace('lat="12.0000"',''),'<not-gpx/>','<gpx><rte><rtept lat="12" lon="77"/></rte></gpx>',wrap(point(0)+point(1).replace('10:00:01','10:00:00')),wrap(point(1)+point(0)),good.replace('<gpx ','<!DOCTYPE gpx><gpx ')];
  const rejected=invalid.map(xml=>{try{OdoGpx.parse(xml);return false;}catch{return true;}});
  // Extension fields must not replace missing GPX time/elevation or inject extra track points.
  const extension='<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:e="urn:test"><trk><trkseg><trkpt lat="12" lon="77"><extensions><e:time>2026-11-04T00:00:00Z</e:time></extensions></trkpt>'+point(1)+'</trkseg></trk></gpx>';
  let ignored=false;try{OdoGpx.parse(extension);}catch{ignored=true;}
  return {good,duplicate:{points:duplicate.track.length,removed:duplicate.importDuplicates,rows:duplicate.gpsRows,id:duplicate.id,base:OdoGpx.parse(good).id},altitude:{bad:altitude.importInvalidAltitude,first:altitude.track[0][5],last:altitude.track[1][5]},segmented:segmented.track.map(t=>t[7]),rejected,ignored};
 });
 assert.deepEqual(cases.duplicate,{points:2,removed:1,rows:3,id:cases.duplicate.base,base:cases.duplicate.base});assert.deepEqual(cases.altitude,{bad:1,first:null,last:0});assert.deepEqual(cases.segmented,[0,1,1]);assert(cases.rejected.every(Boolean));assert(cases.ignored);
 await p.locator('#zip-input').setInputFiles([{name:'valid.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from(cases.good)},{name:'ambiguous.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from(cases.good.replace('10:00:00Z','10:00:00'))}]);
 await p.getByText('Some GPX files need attention',{exact:true}).waitFor();assert.match(await p.locator('#modal').textContent(),/1 GPX file imported/);assert.match(await p.locator('#modal').textContent(),/explicit timezone/);assert.equal(await p.evaluate(()=>rides.length),1);await p.getByRole('button',{name:'Done',exact:true}).click();await p.locator('[data-ride]').first().click();await p.getByText('2 imported · accuracy unknown',{exact:true}).waitFor();assert.deepEqual(errors,[]);
 console.log('PASS: GPX namespace boundaries, missing/blank fields, explicit timezones, duplicates, conflicting times, invalid altitude, segment gaps and per-file batch outcomes');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
