/* Solid road ribbon. Source vertices stay on the centerline; only road edges are offset. */
(function(root){
'use strict';
function build(points,{half=4,top=18,bottom=1,elevation=false}={}){
 const surface=[],walls=[],indices=[],times=[],incoming=[],outgoing=[];
 let direction={x:1,z:0};
 for(let i=0;i<points.length;i++){
  if(i){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length>1e-7)direction={x:(b.x-a.x)/length,z:(b.z-a.z)/length};}
  incoming.push(direction);
 }
 for(let i=points.length-1;i>=0;i--){
  if(i<points.length-1){const a=points[i],b=points[i+1],length=Math.hypot(b.x-a.x,b.z-a.z);if(length>1e-7)direction={x:(b.x-a.x)/length,z:(b.z-a.z)/length};}
  outgoing[i]=direction;
 }
 if(points.length){incoming[0]=outgoing[0];outgoing[points.length-1]=incoming[points.length-1];}
 for(let i=0;i<points.length;i++){
  const p=points[i],a=incoming[i],b=outgoing[i];let nx=-a.z-b.z,nz=a.x+b.x,length=Math.hypot(nx,nz);
  if(length<1e-7){nx=-b.z;nz=b.x;length=1;}
  nx/=length;nz/=length;
  const extent=Math.min(half*2,half/Math.max(.25,nx*-b.z+nz*b.x)),y=top+(elevation?p.y:0);
  surface.push(p.x-nx*extent,y,p.z-nz*extent,p.x+nx*extent,y,p.z+nz*extent);times.push(p.time,p.time);
  if(i){const k=i*2;indices.push(k-2,k-1,k,k-1,k+1,k);}
 }
 const vertex=(i,side,lower=false)=>{const k=i*6+side*3;return [surface[k],lower?bottom:surface[k+1],surface[k+2]];};
 function quad(a,b,c,d){walls.push(...a,...b,...c,...a,...c,...d);}
 for(let i=1;i<points.length;i++)for(const side of [0,1]){
  const a=vertex(i-1,side),b=vertex(i,side),c=vertex(i,side,true),d=vertex(i-1,side,true);
  if(side===0)quad(a,b,c,d);else quad(b,a,d,c);
 }
 if(points.length>1){quad(vertex(0,1),vertex(0,0),vertex(0,0,true),vertex(0,1,true));const n=points.length-1;quad(vertex(n,0),vertex(n,1),vertex(n,1,true),vertex(n,0,true));}
 return {surface,walls,indices,times};
}
const api={build};root.OdoRouteMesh=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
