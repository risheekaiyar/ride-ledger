// Synthetic route for visual regression only. Never loaded into the product by default.
exports.seed=async()=>{
 const anchors=[[-.7,-.7],[-.15,-.95],[.5,-.85],[.86,-.5],[.8,-.1],[.3,.02],[.32,.28],[.8,.4],[.7,.7],[.25,.78],[.05,.4],[-.22,.4],[-.2,.8],[-.7,.7],[-.85,.4],[-.55,.1],[-.6,-.25],[-.9,-.5],[-.7,-.7]];
 const points=[];
 for(let k=0;k<anchors.length-1;k++)for(let j=0;j<12;j++){
  const t=j/12,x=anchors[k][0]+(anchors[k+1][0]-anchors[k][0])*t,y=anchors[k][1]+(anchors[k+1][1]-anchors[k][1])*t,i=points.length;
  points.push({lon:77+x*.008,lat:12-y*.008,time:1700000000000+i*4000,altitude:800+20*Math.sin(i/35),segment:0});
 }
 points.push({...points[0],time:1700000000000+points.length*4000});
 const r=OdoPortable.fromPoints(points,'Synthetic · circuit preview');await saveRide(r);selected=r.id;navigate('detail');
};
