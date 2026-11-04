/* A projected route curtain for compact previews. Extrusion is visual styling, not elevation. */
(function(root){
'use strict';
const geometry=root.OdoRouteGeometry||(typeof require==='function'?require('./route-geometry.js'):null);
function build(track,{width=120,height=86,padding=10,depth=16,angle=-.38,tilt=.58}={}){
 if(!Array.isArray(track)||!track.length)return {top:'',shadow:'',faces:[],ends:[],points:[]};
 const projection=geometry.project(track,{width:1,height:1,padding:0,includePath:false}),c=Math.cos(angle),s=Math.sin(angle);
 const raw=projection.points.map(([x,y])=>({x:(x-.5)*c-(y-.5)*s,y:((x-.5)*s+(y-.5)*c)*tilt}));
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of raw){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 const scale=Math.min((width-padding*2)/Math.max(.000001,maxX-minX),(height-padding*2-depth)/Math.max(.000001,maxY-minY));
 const points=raw.map((p,i)=>({x:width/2+(p.x-(minX+maxX)/2)*scale,y:(height-depth)/2+(p.y-(minY+maxY)/2)*scale,segment:track[i][7]}));
 const groups=[];for(const p of points){if(!groups.length||p.segment!==groups.at(-1).segment)groups.push({segment:p.segment,points:[]});groups.at(-1).points.push(p);}
 const number=n=>n.toFixed(2),path=(items,offset)=>items.map((p,i)=>`${i?'L':'M'}${number(p.x)},${number(p.y+offset)}`).join(' '),faces=[],ends=[],tops=[],shadows=[];
 for(const group of groups){
  // Subpixel simplification keeps list previews light without connecting disconnected segments.
  const reduced=[];for(let i=0;i<group.points.length;i++){const p=group.points[i],last=reduced.at(-1);if(!last||i===group.points.length-1||Math.hypot(p.x-last.x,p.y-last.y)>=.65)reduced.push(p);}
  if(!reduced.length)continue;tops.push(path(reduced,0));shadows.push(path(reduced,depth));ends.push(reduced[0],reduced.at(-1));
  for(let i=1;i<reduced.length;i++){const a=reduced[i-1],b=reduced[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.01)continue;
   faces.push({d:`M${number(a.x)},${number(a.y)}L${number(b.x)},${number(b.y)}L${number(b.x)},${number(b.y+depth)}L${number(a.x)},${number(a.y+depth)}Z`,shade:.35+.65*Math.abs(dx)/length,order:(a.y+b.y)/2});
  }
 }
 faces.sort((a,b)=>a.order-b.order);
 return {top:tops.join(' '),shadow:shadows.join(' '),faces,ends,points,depth,width,height};
}
const api={build};root.OdoRouteRelief=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
