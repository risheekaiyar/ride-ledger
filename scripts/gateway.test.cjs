const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),https=require('node:https'),{execFileSync}=require('node:child_process');
const {createQuota,createGateway}=require('./companion-server.cjs');
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'odo-gateway-'));
const ride={kind:'ride',placement:'Pocket',duration_seconds:100,distance_km:1,gps_accepted_percent:90,gps_accuracy_m:5,screen_off_seconds:50};
test('request reservations persist across connections and restarts',()=>{const dir=temp(),file=path.join(dir,'quota.db');try{const a=createQuota(file,2),b=createQuota(file,2);a.reserve();b.reserve();assert.throws(()=>a.reserve(),/allowance/);a.close();b.close();const c=createQuota(file,2);assert.equal(c.remaining(),0);c.close();}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('authenticated TLS gateway bounds requests and never resets exhausted quota',async()=>{const dir=temp();let server,quota;try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(dir,'key.pem'),'-out',path.join(dir,'cert.pem'),'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});
 const cert=fs.readFileSync(path.join(dir,'cert.pem')),token=crypto.randomBytes(32).toString('hex');let calls=0;
 quota=createQuota(path.join(dir,'quota.db'),1);server=createGateway({key:'test-only',tokenHash:crypto.createHash('sha256').update(token).digest('hex'),quota,tls:{cert,key:fs.readFileSync(path.join(dir,'key.pem'))},provider:async()=>{calls++;return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'The ride needs context.',observations:[{text:'Phone movement is uncertain.',evidence_ids:['trip_1']}],question:null})}]}]})}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const request=(body,headers={},route='/api/muse/insights')=>new Promise((resolve,reject)=>{const req=https.request({host:'127.0.0.1',port:server.address().port,path:route,method:body===undefined?'GET':'POST',ca:cert,headers:{authorization:'Bearer '+token,'content-type':'application/json',...headers}},res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(data)}));});req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body));});
 assert.equal((await request(undefined,{authorization:'Bearer wrong'},'/api/muse/status')).status,401);
 assert.equal((await request({question:'Review',rides:[ride]},{origin:'https://other.example'})).status,403);
 assert.equal((await request({question:'x'.repeat(13000)})).status,413);
 assert.equal((await request({question:'',rides:[ride]})).status,400);assert.equal(quota.remaining(),1);
 assert.equal((await request({question:'Review',rides:[ride]})).status,200);assert.equal(calls,1);assert.equal(quota.remaining(),0);
 assert.equal((await request({question:'Again',rides:[ride]})).status,400);assert.equal(calls,1);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));if(quota)quota.close();fs.rmSync(dir,{recursive:true,force:true});}});
