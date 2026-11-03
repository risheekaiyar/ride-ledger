(function(root){
'use strict';
const delta=degrees=>((degrees+180)%360+360)%360-180;
function project(track,{width=120,height=72,padding=8,top=padding,bottom=padding}={}){
 if(!track.length)return {points:[],path:'',point:()=>null};
 let longitude=track[0][0];const unwrapped=track.map((p,i)=>{if(i)longitude+=delta(p[0]-longitude);return [longitude,p[1]];});
 const xs=unwrapped.map(p=>p[0]),ys=unwrapped.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),middleX=(minX+maxX)/2,middleY=(minY+maxY)/2,cos=Math.max(.001,Math.cos(middleY*Math.PI/180));
 const scale=Math.min(Math.max(1,width-2*padding)/Math.max((maxX-minX)*cos,.000001),Math.max(1,height-top-bottom)/Math.max(maxY-minY,.000001));
 const position=(lon,lat)=>[width/2+(lon-middleX)*cos*scale,top+(height-top-bottom)/2-(lat-middleY)*scale];
 const points=unwrapped.map(p=>position(...p)),path=points.map((p,i)=>`${i&&track[i][7]===track[i-1][7]?'L':'M'}${p.map(v=>v.toFixed(2)).join(',')}`).join(' ');
 return {points,path,point:p=>position(middleX+delta(p[0]-middleX),p[1])};
}
const api={project};root.OdoRouteGeometry=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
