/* One numeric mapping for the elevation surface, reference axis and color legend. */
(function(root){
'use strict';
const stops=['#3bd8e6','#f5f7f8','#ff4655'];
function create(min,max){
 if(!Number.isFinite(min)||!Number.isFinite(max)||max<min)throw Error('A finite elevation range is required.');
 const span=Math.max(.1,max-min),raw=span/4,power=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].find(v=>v*power>=raw)*power;
 const floor=Math.floor(min/step)*step,ceiling=Math.max(floor+step,Math.ceil(max/step)*step),ticks=[];
 for(let i=0;i<=Math.round((ceiling-floor)/step);i++)ticks.push(Number((floor+i*step).toFixed(6)));
 return {min,max,floor,ceiling,step,ticks};
}
const ratio=(value,scale)=>Math.max(0,Math.min(1,scale.max===scale.min?.5:(value-scale.min)/(scale.max-scale.min)));
function color(value,scale){const t=ratio(value,scale)*2,i=Math.min(1,Math.floor(t)),f=t-i,a=stops[i],b=stops[i+1];return '#'+[1,3,5].map(k=>Math.round(parseInt(a.slice(k,k+2),16)*(1-f)+parseInt(b.slice(k,k+2),16)*f).toString(16).padStart(2,'0')).join('');}
const height=(value,scale)=>Math.max(0,Math.min(1,(value-scale.floor)/(scale.ceiling-scale.floor)));
const format=value=>Number(value.toFixed(1)).toLocaleString('en-US',{maximumFractionDigits:1});
function runs(bins){const out=[];let run=[];function end(){if(run.length)out.push(run);run=[];}bins.forEach((b,index)=>{if(b.complete&&Number.isFinite(b.max))run.push({...b,index});else end();});end();return out;}
const api={create,color,height,ratio,format,runs,stops};root.OdoElevationScale=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
