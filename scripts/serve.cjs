const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web'),privateReview=path.resolve(__dirname,'../dist/private-review.json');
const {createRuntime}=require('./muse-runtime.cjs');
const {frameBodyLimit}=require('./field-frame.cjs');
const muse=createRuntime({key:process.env.ODO_META_API_KEY,maxCalls:Number(process.env.ODO_META_MAX_REQUESTS)});
const port=Number(process.env.ODO_LOCAL_PORT||4178);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.mp4':'video/mp4','.webm':'video/webm','.jpg':'image/jpeg'};
http.createServer(async(req,res)=>{try{if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)){res.writeHead(403);return res.end();}let pathname=new URL(req.url,'http://localhost').pathname;let target;
 if(pathname==='/api/muse/status'&&req.method==='GET'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(muse.status()));}
 const isFrame=pathname==='/api/muse/frame';
 if((isFrame||pathname==='/api/muse/insights')&&req.method==='POST'){
  if(req.headers.origin!==`http://${req.headers.host}`||req.headers['content-type']!=='application/json'){res.writeHead(403);return res.end();}
  let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>(isFrame?frameBodyLimit:12000)){res.writeHead(413);return res.end();}chunks.push(chunk);}
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));return res.end(JSON.stringify(isFrame?await muse.askFrame(body):await muse.ask(body)));}catch(e){res.writeHead(400);return res.end(JSON.stringify({error:e.message}));}
 }
 if(pathname==='/private-review.json')target=privateReview;
 else if(pathname==='/reference.mp4'&&process.env.ODO_REFERENCE_VIDEO)target=process.env.ODO_REFERENCE_VIDEO;
 else if(pathname==='/reference.html'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Odo video reference</title><body style="background:#111"><video controls muted src="/reference.mp4" style="max-height:85vh;max-width:100%"></video></body>');}
 else{target=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}}
 if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');fs.createReadStream(target).pipe(res);
}catch{res.writeHead(400);res.end('Bad request');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
