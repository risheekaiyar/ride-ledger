'use strict';
const fs=require('node:fs'),path=require('node:path');
const {zipSync,strToU8}=require('../web/vendor/fflate.js');
const J=require('../web/field-journal.js'),R=require('../web/journal-route.js');
const trips=J.demoTrips(require('../web/portable.js')),files={};
const xml=body=>`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="ODOme synthetic fixture" xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`;
for(const [i,r] of trips.entries()){
  const num=i+1,name=`Synthetic day ${num} - ${r.title}`;
  const track=r.track.map(([lon,lat,t,,,alt])=>`<trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"><ele>${alt}</ele><time>${new Date(r.started+t*1000).toISOString()}</time></trkpt>`).join('\n');
  files[name+'.gpx']=strToU8(xml(`<trk><name>${name}</name><trkseg>${track}</trkseg></trk>`));
  const plan=R.samplePlan(r)[0].map(([lon,lat])=>`<rtept lon="${lon.toFixed(7)}" lat="${lat.toFixed(7)}"/>`).join('\n');
  files[`Synthetic plan ${num}.gpx`]=strToU8(xml(`<rte><name>Synthetic intended route</name>${plan}</rte>`));
}
const assets=path.join(__dirname,'../web/assets');
for(const name of ['field-pass.webm','field-overlook.jpg','field-spark-review.json'])files[name]=fs.readFileSync(path.join(assets,name));
files['READ ME.txt']=strToU8(`MOUNTAINS TO COAST / SYNTHETIC DEVELOPMENT FIXTURE

Every coordinate, timestamp, altitude, pause and planned route is invented. The silent six-second clip animates an original mountain illustration. No rider footage or recording is included.

Unzip first. Import the two "Synthetic day" GPX tracks into Odo Rides. Each trkpt has longitude and latitude in degrees, source elevation in meters, and an absolute UTC time. Speed and distance are estimated by the normal timed-GPX importer. No phone-motion or lean sample is supplied.

Open either trip's Field journal. In "Planned and ridden", select its matching "Synthetic plan" GPX. The route-only files define intended geometry and have no timestamps. Measured progress away from the plan does not establish the reason.

On day one, choose ride time 1:25:00 and attach field-pass.webm. Pause at 0:03, confirm the alignment and keep the frame locally. field-overlook.jpg is the exact re-encoded frame used in the one authorized live test. field-spark-review.json contains its SHA-256, supplied facts, model output codes, usage and elapsed time. In the built-in sample "Replay tested Spark review" displays this saved result offline.

The built-in two-day sample stays separate from the ride library. Explicitly importing these tracks creates two local GPX records. The synthetic reports shown inside the built-in sample have no live community source.
`);
const output=process.argv[2]||path.resolve(__dirname,'../dist/Mountains-to-Coast-synthetic.zip');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,zipSync(files,{level:6}));console.log(output);
