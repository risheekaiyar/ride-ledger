(function(root){
'use strict';
const tolerance=300,cellSize=tolerance*2,deg=Math.PI/180;
function planFromXml(xml){
  if(typeof xml!=='string'||xml.length>2*1024*1024||/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Choose a standard planned GPX under 2 MiB.');
  const doc=new DOMParser().parseFromString(xml,'application/xml'),top=doc.documentElement;
  if(top.localName!=='gpx'||doc.getElementsByTagNameNS('*','parsererror').length)throw Error('Invalid planned GPX.');
  const parts=[],groups=[...top.children].flatMap(el=>el.localName==='rte'?[el]:el.localName==='trk'?[...el.children].filter(s=>s.localName==='trkseg'):[]);
  let count=0;
  for(const group of groups){
    const coords=[];
    for(const p of group.children){
      if(p.localName!==(group.localName==='rte'?'rtept':'trkpt'))continue;
      if(++count>6000)throw Error('Choose a shorter plan (up to 6,000 points).');
      coords.push([root.OdoGpx.coordinate(p.getAttribute('lon'),'longitude',count),root.OdoGpx.coordinate(p.getAttribute('lat'),'latitude',count)]);
    }
    if(coords.length>=2)parts.push(coords);
  }
  if(!parts.length)throw Error('Supply a planned GPX with at least two points in one route or track segment.');
  return parts;
}
function compare(ride,plan){
  if(!plan?.length)return {state:'no-plan',candidates:[]};
  const track=ride.track||[],first=plan[0][0],cos=Math.cos(first[1]*deg);
  if(!track.length)return {state:'no-coverage',candidates:[]};
  if(Math.abs(first[1])>80)throw Error('This local comparison supports routes below 80° latitude.');
  const point=([lon,lat])=>[(((lon-first[0]+540)%360)-180)*111195*cos,(lat-first[1])*111195];
  const grid=new Map(),cell=(x,y)=>x+','+y;
  let samples=0;
  for(const part of plan){
    let a=point(part[0]);
    for(const coord of part.slice(1)){
      const b=point(coord),dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy,n=Math.max(1,Math.ceil(Math.sqrt(len)/cellSize));
      if((samples+=n)>18000)throw Error('This plan is too long for local comparison.');
      const segment={x:a[0],y:a[1],dx,dy,len};let last='';
      for(let i=0;i<=n;i++){const k=cell(Math.floor((a[0]+dx*i/n)/cellSize),Math.floor((a[1]+dy*i/n)/cellSize));if(k===last)continue;last=k;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(segment);}
      a=b;
    }
  }
  const onPlan=([x,y])=>{
    const gx=Math.floor(x/cellSize),gy=Math.floor(y/cellSize);
    for(let i=gx-1;i<=gx+1;i++)for(let k=gy-1;k<=gy+1;k++){
      for(const s of grid.get(cell(i,k))||[]){const t=s.len?Math.max(0,Math.min(1,((x-s.x)*s.dx+(y-s.y)*s.dy)/s.len)):0;
        if(Math.hypot(x-(s.x+t*s.dx),y-(s.y+t*s.dy))<=tolerance)return true;}
    }return false;
  };
  const candidates=[];let active=null,prev=null,covered=false;
  function finish(){if(active&&active.meters>=tolerance&&active.count>=3)candidates.push(active);active=null;}
  for(const fix of track){
    const p=point(fix),away=!onPlan(p),gap=ride.source==='GPX export'?30:3;
    const connected=prev&&fix[7]===prev.fix[7]&&fix[2]>prev.fix[2]&&fix[2]-prev.fix[2]<=gap;
    if(connected)covered=true;
    if(!away||!connected)finish();
    if(away){
      if(!active)active={start:fix[2],end:fix[2],meters:0,count:1};
      else{active.end=fix[2];active.count++;active.meters+=Math.hypot(p[0]-prev.p[0],p[1]-prev.p[1]);}
    }
    prev={fix,p};
  }
  finish();return {state:covered?'compared':'no-coverage',candidates};
}
const demoPlans=new WeakMap();
function samplePlan(ride){
  if(!ride.journalDemo)return null;if(demoPlans.has(ride))return demoPlans.get(ride);
  const pass=ride.id.endsWith('1')?[6090,8180]:[5300,6550];
  const points=ride.track.filter((p,i)=>i===0||i===ride.track.length-1||i%6===0&&(p[2]<pass[0]||p[2]>pass[1])).map(p=>p.slice(0,2));
  const plan=[points];demoPlans.set(ride,plan);return plan;
}
const demoReports=[
  {from:70,to:88,surface:'smooth',date:'2026-09-17'},
  {from:79,to:94,surface:'rough',date:'2026-10-12'}
];
function coverage(total,reports){
  if(!Number.isFinite(total)||total<=0)return null;
  const rows=reports.filter(x=>['smooth','rough'].includes(x.surface)&&Number.isFinite(x.from)&&Number.isFinite(x.to)&&x.from>=0&&x.to>x.from&&x.to<=total);
  const edges=[...new Set([0,total,...rows.flatMap(x=>[x.from,x.to])])].sort((a,b)=>a-b);
  const out={smooth:0,rough:0,conflict:0,unknown:0};
  for(let i=1;i<edges.length;i++){const types=new Set(rows.filter(x=>x.from<=edges[i-1]&&x.to>=edges[i]).map(x=>x.surface));
    out[types.size>1?'conflict':types.values().next().value||'unknown']+=edges[i]-edges[i-1];}
  return out;
}
const api={planFromXml,compare,samplePlan,coverage,demoReports,tolerance};root.OdoJournalRoute=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
