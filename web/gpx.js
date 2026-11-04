/* Strict GPX boundaries keep malformed exports out of measured ride data. */
(function(root){
'use strict';
const decimal=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
function coordinate(value,axis,point){
 const text=typeof value==='string'?value.trim():'';
 const number=decimal.test(text)?Number(text):NaN,limit=axis==='latitude'?90:180;
 if(!Number.isFinite(number)||Math.abs(number)>limit)throw Error(`GPX point ${point}: missing or invalid ${axis}.`);
 return number;
}
function timestamp(value,point){
 const text=typeof value==='string'?value.trim():'';
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/.exec(text);
 if(!m)throw Error(`GPX point ${point}: time needs an ISO date and explicit timezone (Z or ±hh:mm).`);
 const [year,month,day,hour,minute,second]=m.slice(1,7).map(Number),check=new Date(0);
 check.setUTCFullYear(year,month-1,day);check.setUTCHours(hour,minute,second,0);
 const zone=m[8],offsetHour=zone==='Z'?0:Number(zone.slice(1,3)),offsetMinute=zone==='Z'?0:Number(zone.slice(4,6));
 if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day||hour>23||minute>59||second>59||offsetHour>14||offsetMinute>59||(offsetHour===14&&offsetMinute!==0))throw Error(`GPX point ${point}: invalid calendar date, clock time or timezone.`);
 const time=Date.parse(text);if(!Number.isFinite(time))throw Error(`GPX point ${point}: timestamp cannot be read.`);return time;
}
function parse(xml,name='Imported GPX'){
 if(typeof xml!=='string'||xml.length>8*1024*1024)throw Error('GPX files must be under 8 MB.');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('GPX document declarations and entities are not supported. Export a standard GPX track.');
 const doc=new root.DOMParser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagNameNS('*','parsererror').length)throw Error('Invalid GPX XML.');
 const element=doc.documentElement,namespace=element?.namespaceURI||'';
 if(element?.localName!=='gpx'||!['','http://www.topografix.com/GPX/1/0','http://www.topografix.com/GPX/1/1'].includes(namespace))throw Error('This file is not a supported GPX 1.0/1.1 document.');
 const children=(node,name)=>Array.from(node.children||[]).filter(n=>n.localName===name&&(n.namespaceURI||'')===namespace);
 const value=(node,name)=>children(node,name)[0]?.textContent;
 const points=[];let segment=0,count=0,duplicates=0,badAltitude=0;
 for(const track of children(element,'trk'))for(const section of children(track,'trkseg')){
  for(const node of children(section,'trkpt')){
   if(++count>50000)throw Error('GPX supports up to 50,000 track points per file.');
   const lon=coordinate(node.getAttribute('lon'),'longitude',count),lat=coordinate(node.getAttribute('lat'),'latitude',count),time=timestamp(value(node,'time'),count);
   const elevation=value(node,'ele')?.trim();let altitude=null;
   if(elevation){const n=decimal.test(elevation)?Number(elevation):NaN;if(Number.isFinite(n)&&n>=-1000&&n<=10000)altitude=n;else badAltitude++;}
   const previous=points.at(-1);
   if(previous&&time===previous.time){
    if(previous.lon===lon&&previous.lat===lat&&previous.altitude===altitude){duplicates++;continue;}
    throw Error(`GPX point ${count}: conflicting samples share a timestamp. Export an ordered recording with distinct sample times.`);
   }
   if(previous&&time<previous.time)throw Error(`GPX point ${count}: timestamps go backwards. Separate or reorder the source tracks before importing.`);
   points.push({lon,lat,time,altitude,segment});
  }
  segment++;
 }
 if(points.length<2)throw Error('This GPX needs at least two timed track points. Planned routes and waypoints are not ride recordings.');
 const ride=root.OdoPortable.fromPoints(points,name);ride.importDuplicates=duplicates;ride.importInvalidAltitude=badAltitude;ride.gpsRows=count;ride.duplicates=duplicates;
 if(duplicates)ride.warnings.push(`Removed ${duplicates} identical GPX sample${duplicates===1?'':'s'}; no distance was counted twice.`);
 if(badAltitude)ride.warnings.push(`Ignored ${badAltitude} unusable altitude value${badAltitude===1?'':'s'}; the positions remain available and elevation is unknown there.`);
 return ride;
}
const api={coordinate,timestamp,parse};root.OdoGpx=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
