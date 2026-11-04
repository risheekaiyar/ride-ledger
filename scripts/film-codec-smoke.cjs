// Real MediaRecorder fallback with a synthetic moving graphic; no camera or microphone.
const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await b.newPage();await p.goto('http://127.0.0.1:4178');await p.waitForSelector('.studio-hero');
 const result=await p.evaluate(async()=>{
  const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d'),capture=c.captureStream.bind(c);let stream;
  c.captureStream=fps=>(stream=capture(fps));
  const r=await OdoRideFilm.record(c,t=>{x.fillStyle='#121926';x.fillRect(0,0,320,180);x.fillStyle='#8bd9da';x.fillRect(t*280,60,40,60);},{codec:{mode:'realtime',mime:'video/webm;codecs=vp8'},duration:12});
  const bytes=new Uint8Array(await r.blob.arrayBuffer());let binary='';for(const n of bytes)binary+=String.fromCharCode(n);
  return {type:r.type,frames:r.frames,base64:btoa(binary),ended:stream.getTracks().every(t=>t.readyState==='ended')};
 });
 assert.equal(result.type,'video/webm');assert(result.frames>=144);assert(result.ended);fs.writeFileSync('/tmp/odo-film-fallback.webm',Buffer.from(result.base64,'base64'));
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,codec_type','-of','json','/tmp/odo-film-fallback.webm'],{encoding:'utf8'}));assert.equal(meta.streams.length,1);assert.equal(meta.streams[0].codec_name,'vp8');
 console.log('PASS: playable WebM fallback, sufficient render frames, silent video and released capture tracks');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
