/* Display geometry for complete one-second bins. Summary statistics never use this reduction. */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function inspect(points,duration,elapsed){
 if(!(duration>0)||!Number.isFinite(elapsed)||elapsed<0||elapsed>duration)return {time:null,end:null,value:null};
 // At the exact end, inspect the final interval rather than a nonexistent next second.
 const time=Math.floor(elapsed===duration?Math.max(0,duration-1e-7):elapsed);
 let low=0,high=points.length;while(low<high){const mid=(low+high)>>1;if(points[mid][0]<time)low=mid+1;else high=mid;}
 const point=points[low];return {time,end:Math.min(duration,time+1),value:point?.[0]===time?point[1]:null};
}
function plot(points,duration,{columns=640,height=160,maximum=null}={}){
 columns=clamp(Math.floor(columns)||640,16,2048);height=clamp(height||160,20,1000);
 if(!(duration>0)||!Number.isFinite(duration))return {d:'',dots:'',gaps:'',aggregated:false,maximum:null,count:0,gapColumns:0,columns};
 let max=0;for(const p of points)max=Math.max(max,p[1]);if(Number.isFinite(maximum)&&maximum>=max)max=maximum;
 const ceiling=max>0?max:1,y=value=>height-8-value/ceiling*(height-16),x=time=>clamp(time/duration*columns,0,columns);
 const bins=Array.from({length:columns},()=>({min:Infinity,max:-Infinity,covered:0})),span=duration/columns;
 for(const [time,value] of points){
  // Count covered portions, including bins which straddle a display column.
  const left=clamp(Math.floor(time/span),0,columns-1),right=clamp(Math.ceil((time+1)/span)-1,0,columns-1);
  for(let c=left;c<=right;c++)bins[c].covered+=Math.max(0,Math.min(time+1,(c+1)*span,duration)-Math.max(time,c*span));
  const c=clamp(Math.floor((time+.5)/span),0,columns-1);bins[c].min=Math.min(bins[c].min,value);bins[c].max=Math.max(bins[c].max,value);
 }
 // An interval may be narrower than one pixel. Mark the entire affected column; never claim it is fully observed.
 let gaps='',start=null,gapColumns=0;for(let i=0;i<=columns;i++){
  const gap=i<columns&&bins[i].covered<span-1e-8;if(gap)gapColumns++;
  if(gap&&start===null)start=i;if(!gap&&start!==null){gaps+=`M${start},0H${i} `;start=null;}
 }
 const aggregated=points.length>columns*2;let d='',dots='';
 if(aggregated){for(let c=0;c<columns;c++){const b=bins[c];if(b.min===Infinity)continue;const top=y(b.max),bottom=y(b.min);d+=`M${c+.5},${top.toFixed(3)}V${bottom.toFixed(3)} `;if(b.max===b.min)dots+=`M${c+.1},${top.toFixed(3)}h.8 `;}}
 else{
  for(let i=0;i<points.length;i++){const p=points[i],before=points[i-1],after=points[i+1],px=x(p[0]+.5),py=y(p[1]),joined=before&&p[0]-before[0]===1;d+=`${joined?'L':'M'}${px.toFixed(3)},${py.toFixed(3)} `;
   if(!joined&&(!after||after[0]-p[0]!==1))dots+=`M${(px-.8).toFixed(3)},${py.toFixed(3)}h1.6 `;
  }
 }
 return {d,dots,gaps,aggregated,maximum:max,count:points.length,gapColumns,columns};
}
const api={inspect,plot};root.OdoSignalView=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
