const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web'),privateReview=path.resolve(__dirname,'../dist/private-review.json');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.mp4':'video/mp4'};
http.createServer((req,res)=>{try{if(!['127.0.0.1:4178','localhost:4178'].includes(req.headers.host)){res.writeHead(403);return res.end();}let pathname=new URL(req.url,'http://localhost').pathname;let target;
 if(pathname==='/private-review.json')target=privateReview;
 else if(pathname==='/reference.mp4'&&process.env.ODO_REFERENCE_VIDEO)target=process.env.ODO_REFERENCE_VIDEO;
 else if(pathname==='/reference.html'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Odo video reference</title><body style="background:#111"><video controls muted src="/reference.mp4" style="max-height:85vh;max-width:100%"></video></body>');}
 else{target=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}}
 if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');fs.createReadStream(target).pipe(res);
}catch{res.writeHead(400);res.end('Bad request');}}).listen(4178,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4178/?review=1'));
