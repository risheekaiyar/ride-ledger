/* Original, locally drawn motorcycle artwork. No stock images, external assets or model calls. */
(function(root){
'use strict';
const cache=new Map();
const tint=(hex,amount)=>{const n=parseInt(hex.slice(1),16),to=amount<0?0:255,a=Math.abs(amount);return '#'+[n>>16,n>>8&255,n&255].map(v=>Math.round(v+(to-v)*a).toString(16).padStart(2,'0')).join('');};
function create(profile){
 const family=profile.family||'naked',color=/^#[0-9a-f]{6}$/i.test(profile.color||'')?profile.color:'#d9433c',key=family+color;
 if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=560;const c=canvas.getContext('2d');c.scale(1.2,1.2);c.translate(0,8);c.lineJoin='round';c.lineCap='round';
 const adventure=['adventure','rally'].includes(family),rally=family==='rally',sport=family==='sport',classic=family==='classic',touring=family==='touring',scooter=family==='scooter';
 const gradient=(x,y,x2,y2,stops)=>{const g=c.createLinearGradient(x,y,x2,y2);stops.forEach(([p,v])=>g.addColorStop(p,v));return g;};
 const paint=gradient(130,120,350,300,[[0,tint(color,.48)],[.22,color],[.65,tint(color,-.18)],[1,tint(color,-.65)]]),bright=gradient(200,100,370,200,[[0,tint(color,.68)],[.32,color],[1,tint(color,-.25)]]),alloy=gradient(130,200,330,330,[[0,'#f1f2ee'],[.35,'#99a5ad'],[.55,'#d2d8d8'],[1,'#4c555d']]),black=gradient(160,120,380,300,[[0,'#495056'],[.45,'#20282b'],[1,'#0e1418']]);
 function path(d,fill,stroke='#0a1014',width=3){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}}
 function line(d,color='#9ca8ab',width=3){path(d,null,color,width);}
 function ellipse(x,y,rx,ry,fill,stroke='#101519',width=3,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 function wheel(x,y,scale,front=false){
  c.save();c.translate(x,y);c.rotate(.21);c.scale(scale,scale);
  const tyre=gradient(-70,-60,55,95,[[0,'#3e4549'],[.34,'#151b1f'],[.8,'#0c1115'],[1,'#2b3134']]);
  ellipse(9,0,64,87,'#080d11',null);ellipse(0,0,64,87,tyre,'#090e11',4);ellipse(-3,0,46,67,'#121c21','#626b70',2);
  const count=adventure||classic?16:5;for(let i=0;i<count;i++){const a=i*Math.PI*2/count,dx=Math.cos(a),dy=Math.sin(a);line(`M-3 0L${-3+dx*44} ${dy*65}`,adventure||classic?'#a0a7aa':'#4a555d',adventure||classic?1.6:7);}
  ellipse(-3,0,31,43,alloy,'#131e25',2);ellipse(-3,0,18,26,'#414c51','#111b21',2);for(let i=0;i<12;i++){const a=i*Math.PI*2/12;ellipse(-3+Math.cos(a)*24,Math.sin(a)*34,2.3,3.2,'#263038',null);}
  ellipse(-3,0,8,12,'#b9c4c8','#1c292f',2);
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12,x=Math.cos(a)*55,y=Math.sin(a)*77;c.save();c.translate(x,y);c.rotate(a);path(adventure?'M-3 -8l8 3-1 9-7-2z':'M-3 -8q7 3 7 12',adventure?'#313a40':null,'#495055',adventure?1:2);c.restore();}
  if(front){path('M22 -40q13 8 9 25l-7 15-9-4 2-29z',sport?'#c6a65b':'#7b858c','#18252b',2);}
  c.restore();
 }
 // Wheels, engine, frame and suspension are shared construction, with family-specific bodywork above.
 c.save();c.globalAlpha=.22;ellipse(300,395,220,22,'#040a0e',null,-.13);c.restore();
 wheel(456,286,sport?1.02:.94);
 path('M242 225l91-33 115 82-33 31-105 23-66-31z',black,'#080f13',5);
 path('M280 224l67 15-25 77-59 13-40-47z',alloy,'#111b21',4);
 for(let i=0;i<6;i++)line(`M247 ${246+i*9}l64 10`,'#37474e',4);
 ellipse(320,285,32,35,'#3d494f','#172229',4);ellipse(319,284,22,25,'#56636b','#253039',2);ellipse(319,284,7,8,'#a8b3b8',null);
 for(const d of ['M257 220L353 215L323 287Z','M353 215L417 231L323 287']){line(d,'#080f13',13);line(d,'#6d7476',6);}
 line('M320 291L453 283','#080f13',20);line('M322 287L453 279','#39454d',11);line('M337 303L465 298','#0c1419',5);
 if(sport||family==='naked')for(let i=0;i<9;i++)line(`M${382-i*3} ${212+i*8}l-16 -4`,'#e5b64d',4);
 path('M330 320l104-34 12 13-104 39z',alloy,'#18232a',4);ellipse(439,295,9,12,'#222e34','#b9c3c5',3,-.5);
 // Distant fork leg, front wheel and polished near fork.
 line('M215 190L151 330','#161e24',17);line('M215 190L170 283',sport?'#d4af59':'#c4ced0',11);
 wheel(136,339,1.15,true);
 line('M237 185L165 335','#111b23',18);line('M235 188L199 270',sport?'#d7b870':'#c6cdd1',12);line('M199 270L166 332','#f0f1e7',9);ellipse(166,335,8,10,'#d7e0de','#27333a',3);
 // Painted fender hugs the wheel, instead of the old rectangular blocks.
 path(adventure?'M78 259q42-37 99-8l44 19-6 17-50-16q-44-15-78 4z':'M76 277q31-53 85-42 43 11 49 48l-26 5q-15-40-49-31-20 4-37 33z',paint,'#10171c',4);
 if(sport){
  // Swept split fairing, tapered tail, high windscreen and twin LED lamps.
  path('M200 128q-37 12-61 54l-21 57 32 9 37 72 55 37 65-25 30-79-37-63-31-49z',paint,'#0b131a',5);
  path('M186 227l-7 66 64 51 52-24 17-64-43 25-32-58z',black,'#0a131a',3);
  path('M199 153q35-46 101-33l49 40-27 44-68-25-47 13z',bright,'#10181e',4);
  path('M310 175q43 16 80-10l94-46 41 3-23 39-71 45-73 4z',paint,'#111a20',4);
  path('M331 177l64-18 79-37 42 3-65 44-63 28-54-4z','#151c23','#080f14',4);
  path('M398 163l65-24 34-4-32 21-65 28z',tint(color,.64),null);
  path('M205 128q12-51 55-80 26 5 40 28l-27 54-48 27z',gradient(210,55,280,155,[[0,'#eff7f78f'],[.6,'#7f9aa6c9'],[1,'#202f3cec']]),'#182833',3);
  line('M211 125q16-44 43-66','#eaf7f4',3);
  path('M141 204l49-33 25 8-22 26-45 14z','#0c1824','#101c25',4);
  path('M151 204l35-22 12 2-17 18-29 9z',gradient(145,190,200,212,[[0,'#72bfdb'],[1,'#f4fcff']]),'#c1e9f0',1.5);
  path('M229 173l37-3-16 27-22 7z','#0d1a24','#0a151f',3);line('M232 183l25-8-10 17','#cef7ff',4);
  path('M166 226l53-14-19 19-24 7z','#101b22',null);line('M282 220l-38 22-11 30',tint(color,.45),3);
  line('M315 201L333 191','#a9b3b8',4);line('M225 127L209 99','#171f25',7);ellipse(199,92,20,11,black,'#11191e',3,-.6);line('M281 118L322 90','#151f27',7);ellipse(335,85,22,11,black,'#0b151e',3,-.15);
 }else if(adventure||touring){
  path('M214 156q47-26 89-6l38 36-19 39-61-23-57 10-24-33z',bright,'#10181d',5);
  path('M282 190q45 29 95 0l92-43 35 8-9 29-89 45-77 5-47-20z',paint,'#111a1e',5);
  path('M304 190q39 20 78-5l87-33 26 4-13 14-95 43-57-3z','#161c22','#0a1218',4);
  path('M302 218q66 24 168-45',null,tint(color,.65),3);
  path(rally?'M196 134l35 5 12 55-32 33-52 24-39-5 33-31 22-53z':'M194 132l47 10 10 49-36 47-84 27-40-14 47-30 28-55z',paint,'#0b141a',5);
  path('M184 143l25 3 7 40-37 35-22-3 10-39z','#20282f','#090f15',4);
  path('M181 168l17 2 2 19-21 7-7-9z','#9eaeb1','#0c171f',4);line('M179 174l13 3 2 9','#e7f7fa',3);
  path('M202 145l-21-9 12-44 33-58 43-7 12 25-21 48-23 43z',gradient(190,60,250,156,[[0,'#616970'],[.45,'#202930'],[1,'#0e171f']]),'#0b1218',4);
  line('M192 124l10-36 25-44','#d7e8ed',3);line('M250 50l17-14','#9cabb1',2);
  path('M250 232l37 15-25 51-35 2-9-31z',alloy,'#0a141d',4);
  path('M272 302l34-7-13 30-47 19-23-18 1-25z',alloy,'#13232d',4);line('M246 318l33-9','#2a3d46',6);
  line('M218 163L269 123L330 139','#11191f',13);line('M222 158L270 127L326 141','#a8b5ba',5);
  path('M281 120q28-1 61 11l-1 15-60-9z','#4b555d','#10181e',4);ellipse(340,140,9,9,'#3a4349','#101a21',3);
  line('M219 146L205 105','#151e24',7);ellipse(199,98,17,11,'#424f58','#101a22',3,-.4);
  if(touring||family==='adventure'){path('M409 225l62-24 36 21-10 61-68 17-28-22z',touring?paint:'#444e54','#111c22',4);line('M416 241l74-23M438 253l26-7','#889399',3);}
 }else if(scooter){
  path('M214 135q35 1 41 29l-15 93 55 13 81-65 84-4 36 44-19 52-91 15-82-13-97-48-26-48z',paint,'#101a20',5);
  path('M268 270l42 10 59-49 38 6-73 60-65-8z','#252f36','#101b21',4);
  path('M344 199l99-26 49 13-7 24-96 15-40-9z','#18232a','#0d151b',4);
  path('M189 145l44-24 34 21-10 19-53 2z',bright,'#111a21',4);path('M203 140l30-12 18 16-44 9z','#cfebef','#43535e',3);
  line('M208 131L183 105M253 130L281 101','#29373e',6);ellipse(178,96,15,11,'#516169');ellipse(290,93,17,10,'#516169');
 }else{
  // Exposed-engine roadster and classic silhouettes.
  path('M217 184q30-44 86-36l45 27-13 41-82 13-35-21z',bright,'#101a20',5);
  path('M332 182l57-17 86-7 24 16-11 18-130 24-26-17z','#20282f','#10171e',5);
  if(!classic)path('M371 195l123-35 11 14-54 38-72 7z',paint,'#111a23',4);
  if(classic){path('M420 208q35-41 76-8l25 42-19 4q-28-36-62-15z',paint,'#15232a',4);ellipse(212,164,26,28,alloy,'#101b23',5);ellipse(207,164,19,20,'#d5e5dc','#566670',3);line('M199 154l12-4','#ffffff',3);}
  else{path('M191 145l42-7 19 23-20 39-29-10z',black,'#0e1922',4);path('M200 154l34-8-11 30-16 3z','#b1e0e6','#3e6877',3);}
  line('M226 169L251 139L312 141','#141f27',10);line('M229 164L252 140L310 143','#c8d1d4',4);line('M239 142L225 111M302 140L322 111','#26363f',5);ellipse(219,104,17,10,'#56646c');ellipse(333,105,18,10,'#56646c');
 }
 // Small details readable at poster size, clean outlines readable at marker size.
 line('M300 317L275 336','#18262e',7);line('M271 337L292 338','#bac5c9',4);
 ellipse(284,175,12,5,'#202a30','#96a5ac',2,-.2);
 path('M477 190l20-8 3 8-18 11z','#f17a64','#19272c',2);
 cache.set(key,canvas);while(cache.size>16)cache.delete(cache.keys().next().value);return canvas;
}
root.OdoBikeIllustration={create};
})(globalThis);
