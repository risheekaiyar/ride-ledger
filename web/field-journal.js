(function(root){
'use strict';
const cueLabels = {
  mountains:'Mountain scenery is visible.', mist:'The frame appears misty.',
  viewpoint:'The frame appears to show a lookout.', fuel_station:'A structure resembling a fuel station is visible.',
  traffic:'Vehicles are visible in the frame.', uneven_surface:'The surface appears uneven in this frame.',
  coast:'Coastal scenery is visible.', unclear:'The frame has no clear visual clue.'
};
const prompts = {
  pause:['What brought you to a pause here?', ['Taking photographs','Waiting for traffic','A break']],
  visibility:['What was visibility like from the saddle?', ['Clear from the bike','Mist or rain','Hard to tell']],
  fuel:['What do you remember doing near this station?', ['Passed through','Stopped for fuel','Stopped for something else']],
  surface:['What did you feel through this stretch?', ['Smooth from the saddle','Uneven surface','Phone mount moved']],
  landscape:['What would you like to remember about this view?', ['Taking photographs','Enjoying the scenery','Just passing through']],
  open:['What do you remember about this moment?', ['A planned stop','A change in conditions','Nothing unusual']]
};
const valid = n=>typeof n==='number' && Number.isFinite(n);
const round1 = n=>Math.round(n*10)/10;
const clipLimit = 96*1024;
// Canvas encoders can add an ICC profile. Drop application and comment segments before preview.
function cleanCanvasJpeg(url){
  const prefix='data:image/jpeg;base64,';
  if(!url.startsWith(prefix))throw Error('The image could not be encoded as JPEG.');
  const binary=atob(url.slice(prefix.length));
  let clean=binary.slice(0,2),offset=2;
  while(offset+4<=binary.length&&binary.charCodeAt(offset)===255){
    const marker=binary.charCodeAt(offset+1);
    if(marker===0xda)return prefix+btoa(clean+binary.slice(offset));
    const size=(binary.charCodeAt(offset+2)<<8)+binary.charCodeAt(offset+3);
    if(size<2||offset+2+size>binary.length)break;
    if((marker<0xe0||marker>0xef)&&marker!==0xfe)clean+=binary.slice(offset,offset+2+size);
    offset+=2+size;
  }
  throw Error('The image could not be prepared for review.');
}
function rowAt(ride,second){
  const a=ride.track||[];
  let left=0, right=a.length;
  while(left<right){const mid=(left+right)>>>1;if(a[mid][2]<second)left=mid+1;else right=mid;}
  if(a[left]?.[2]===second)return left;
  if(left===0||left===a.length)return -1;
  const before=a[left-1],after=a[left],limit=ride.source==='GPX export'?30:3;
  if(after[7]!==before[7]||after[2]-before[2]>limit)return -1;
  return second-before[2]<after[2]-second?left-1:left;
}
function facts(ride,second){
  if(!valid(second)||!Number.isInteger(second)||second<0||second>ride.duration)throw Error('Choose a time within this trip.');
  const index=rowAt(ride,second),track=ride.track||[],point=track[index],gpx=ride.source==='GPX export';
  let low=0;
  const slow=i=>{
    const p=track[i],a=track[i-1];
    return p&&a&&p[7]===a[7]&&p[2]>a[2]&&p[2]-a[2]<=(gpx?30:3)&&valid(p[3])&&p[3]>=0&&p[3]<5&&(gpx||(valid(a[3])&&a[3]>=0&&a[3]<5));
  };
  if(index>=0&&valid(point[3])&&point[3]>=0&&point[3]<5){
    let lo=index,hi=index;
    while(slow(lo))lo--;
    while(slow(hi+1))hi++;
    if(second>=track[lo][2]&&second<=track[hi][2])low=Math.round(track[hi][2]-track[lo][2]);
  }
  const candidates=(ride.events||[]).some(e=>e?.kind==='impact'&&valid(e.t)&&Math.abs(e.t-second)<=1&&valid(e.g)&&e.g>=0);
  return {source:ride.journalDemo?'synthetic_gps':gpx?'gpx':'phone',elapsed_s:second,
    speed_kmh:valid(point?.[3])&&point[3]>=0?round1(point[3]):null,
    elevation_m:valid(point?.[5])?Math.round(point[5]):null,low_seconds:low||null,phone_peak_candidate:candidates};
}
function suggested(ride){
  if(ride.journalDemo)return ride.journalMoments;
  const times=(root.OdoReviewMoments?.list(ride)||[]).slice(0,3).map(e=>({second:Math.round(e.t),label:e.title}));
  return times.length?times:[{second:Math.floor(ride.duration/2)||0,label:'A moment on your ride'}];
}
function clock(value){
  const s=Math.max(0,Math.floor(value)),h=Math.floor(s/3600),m=Math.floor(s/60)%60;
  return (h?h+':'+String(m).padStart(2,'0'):String(m))+':'+String(s%60).padStart(2,'0');
}
function parseTime(text){
  const value=String(text).trim();
  if(!/^(?:\d{1,6}|\d{1,4}:[0-5]\d|\d{1,2}:[0-5]\d:[0-5]\d)$/.test(value))return NaN;
  return value.split(':').reduce((total,n)=>total*60+Number(n),0);
}
function distanceSummary(trips){
  const known=trips.filter(r=>(r.distanceReliable||r.source==='GPX export')&&valid(r.distanceKm)&&r.distanceKm>=0);
  return {km:known.length?known.reduce((a,r)=>a+r.distanceKm,0):null,known:known.length,total:trips.length};
}
function measuredText(f){
  if(f.low_seconds)return `GPS shows ${f.low_seconds} seconds below 5 km/h around this moment.`;
  if(f.phone_peak_candidate)return 'A phone-motion peak was recorded near this time. Its source is unknown.';
  if(f.speed_kmh!==null)return `${f.source==='gpx'?'The timed track gives an estimated':'The GPS sample shows'} ${f.speed_kmh} km/h near this time.`;
  if(f.elevation_m!==null)return `The track includes a source altitude of ${f.elevation_m} m near this time.`;
  return 'No usable GPS or phone observation is available for this moment.';
}
function nextQuestion(f){return f.low_seconds?'pause':f.phone_peak_candidate?'surface':'open';}
function makeDay(portable,day){
  const vertices=day===1?[[0,.12],[.13,.22],[.23,.17],[.28,.29],[.21,.34],[.35,.38],[.46,.26],[.55,.4],[.49,.46],[.57,.49],[.63,.38],[.78,.41],[.85,.31],[1,.4]]:[[1,.4],[1.08,.28],[1.14,.33],[1.24,.18],[1.34,.17],[1.4,.08],[1.52,.14],[1.69,.03],[1.83,.08],[1.89,-.03],[2,-.05]];
  const start=Date.UTC(2026,9,17+day,2,30),seconds=day===1?14400:12600;
  const stops=day===1?[[5040,5220],[9300,9840]]:[[3240,3420],[7800,8520]];
  const moving=seconds-stops.reduce((n,[a,b])=>n+b-a,0);
  function points(scale){
    const output=[];
    for(let sec=0;sec<=seconds;sec+=10){
      const pause=stops.reduce((sum,[a,b])=>sum+Math.max(0,Math.min(sec,b)-a),0);
      const progress=(sec-pause)/moving*(vertices.length-1),i=Math.min(vertices.length-2,Math.floor(progress)),f=progress-i;
      const a=vertices[i],b=vertices[i+1],x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
      const bend=Math.sin(progress*Math.PI)*Math.sin(progress*3.4)*.013;
      output.push({lon:73+(x-vertices[0][0])*scale+(day===2?1.35:0),lat:14+(y-vertices[0][1]+bend)*scale+(day===2?.37:0),
        time:start+sec*1000,altitude:Math.round(day===1?650+480*Math.sin(progress/(vertices.length-1)*Math.PI)+110*Math.sin(progress):180-168*progress/(vertices.length-1)),segment:0});
    }
    return output;
  }
  const target=day===1?205:187;
  let scale=1,ride;
  for(let pass=0;pass<3;pass++){ride=portable.fromPoints(points(scale),'Synthetic GPX');scale*=target/ride.distanceKm;}
  return {...ride,id:`demo-field-day-${day}`,journalDemo:true,title:day===1?'Mountain crossing':'Down to the coast',
    journalMoments:day===1?[{second:5100,label:'The overlook'},{second:9480,label:'The roadside stop'}]:[{second:3300,label:'The coastal turn'},{second:8100,label:'The lunch stop'}],
    tags:day===1?['Mountains','Monsoon rides']:['Beaches','Monsoon rides']};
}
let demo;
function demoTrips(portable){return demo||(demo=[makeDay(portable,1),makeDay(portable,2)]);}
const api={facts,rowAt,suggested,clock,parseTime,distanceSummary,measuredText,nextQuestion,cueLabels,prompts,clipLimit,cleanCanvasJpeg,demoTrips};
root.OdoFieldJournal=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
