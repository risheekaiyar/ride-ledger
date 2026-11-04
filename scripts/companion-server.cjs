'use strict';
// Single-owner HTTPS companion gateway. Provider keys never leave this process.
const https=require('node:https');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {createRuntime}=require('./muse-runtime.cjs');
const {frameBodyLimit}=require('./field-frame.cjs');

function createQuota(filename,limit){
 if(!Number.isSafeInteger(limit)||limit<1||limit>10000)throw Error('Set an explicit lifetime request limit between 1 and 10000.');
 if(filename===':memory:')throw Error('The gateway requires persistent quota storage.');
 fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true,mode:0o700});
 const db=new DatabaseSync(filename);fs.chmodSync(filename,0o600);
 db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=DELETE; CREATE TABLE IF NOT EXISTS quota (id INTEGER PRIMARY KEY CHECK(id=1), used INTEGER NOT NULL CHECK(used>=0)); INSERT OR IGNORE INTO quota VALUES (1,0)');
 const used=()=>Number(db.prepare('SELECT used FROM quota WHERE id=1').get().used);
 return {remaining:()=>Math.max(0,limit-used()),reserve(){
  db.exec('BEGIN IMMEDIATE');try{if(used()>=limit)throw Error('Persistent request allowance exhausted.');db.exec('UPDATE quota SET used=used+1 WHERE id=1');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 },close:()=>db.close()};
}
function createGateway({key,tokenHash,quota,tls,provider}){
 if(!key)throw Error('Meta provider key is required.');
 if(!/^[a-f0-9]{64}$/i.test(tokenHash||''))throw Error('A SHA-256 digest of a strong client token is required.');
 const expected=Buffer.from(tokenHash,'hex');
 const runtime=createRuntime({key,quota,provider,imageEnabled:process.env.ODO_META_IMAGE_ENABLED==='1'});
 return https.createServer({...tls,minVersion:'TLSv1.2'},async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
  const reply=(status,body)=>{res.writeHead(status);res.end(JSON.stringify(body));};
  // This gateway is for native clients. Browser origins and cross-site requests are not accepted.
  if(req.headers.origin||req.headers['sec-fetch-site'])return reply(403,{error:'Native clients only.'});
  const authorization=req.headers.authorization||'';
  if(!authorization.startsWith('Bearer ')||authorization.length>520)return reply(401,{error:'Authentication required.'});
  const token=authorization.slice(7);
  if(token.length<32||!crypto.timingSafeEqual(crypto.createHash('sha256').update(token).digest(),expected))return reply(401,{error:'Authentication required.'});
  if(req.method==='GET'&&req.url==='/api/muse/status')return reply(200,runtime.status());
  const isFrame=req.url==='/api/muse/frame';
  if(req.method!=='POST'||(!isFrame&&req.url!=='/api/muse/insights'))return reply(404,{error:'Not found.'});
  if(req.headers['content-type']!=='application/json')return reply(415,{error:'JSON required.'});
  let size=0,chunks=[];
  try{for await(const chunk of req){size+=chunk.length;if(size>(isFrame?frameBodyLimit:12000))return reply(413,{error:'Request too large.'});chunks.push(chunk);}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   const result=isFrame?await runtime.askFrame(body):await runtime.ask(body);reply(200,result);
  }catch(e){
   // Do not return upstream payloads, credentials or stack traces to the client.
   const message=String(e.message);const known=/^(Provide a question|Invalid |Evidence packet|Persistent request allowance|Odo test request allowance|Meta response|Meta returned|Meta API returned)/.test(message);
   reply(400,{error:known?message:'Companion request failed. Check the server configuration.'});
  }
 });
}
if(require.main===module){
 let quota;
 try{
  const {ODO_META_API_KEY:key,ODO_CLIENT_TOKEN_SHA256:tokenHash,ODO_TLS_CERT_FILE:certFile,ODO_TLS_KEY_FILE:keyFile,ODO_QUOTA_FILE:quotaFile,ODO_LIFETIME_REQUEST_LIMIT:limit}=process.env;
  if(!certFile||!keyFile||!quotaFile)throw Error('TLS certificate/key paths and persistent quota path are required.');
  quota=createQuota(quotaFile,Number(limit));
  const server=createGateway({key,tokenHash,quota,tls:{cert:fs.readFileSync(certFile),key:fs.readFileSync(keyFile)}});
  server.requestTimeout=60000;server.headersTimeout=10000;
  server.on('error',()=>{console.error('Companion HTTPS listener failed.');quota.close();process.exitCode=1;});
  server.listen(Number(process.env.ODO_GATEWAY_PORT||8443),process.env.ODO_GATEWAY_HOST||'127.0.0.1',()=>console.log('Odo authenticated HTTPS companion started.'));
  const stop=()=>server.close(()=>{quota.close();process.exit(0)});process.on('SIGINT',stop);process.on('SIGTERM',stop);
 }catch(e){if(quota)quota.close();console.error('Gateway setup failed: '+e.message);process.exitCode=1;}
}
module.exports={createQuota,createGateway};
