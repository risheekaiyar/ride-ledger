'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const keyPath=path.join(os.homedir(),'.codex','odo-meta-key.txt');
let key;try{key=fs.readFileSync(keyPath,'utf8').trim();}catch{throw Error('Odo Meta key file not found.');}
if(!key)throw Error('Odo Meta key file is empty.');
process.env.ODO_META_API_KEY=key;
process.env.ODO_META_MAX_REQUESTS='3';
process.env.ODO_LOCAL_PORT='4180';
console.log('Three requests are allowed per run. Restarting resets the count; check Meta Billing for account usage.');
require('./serve.cjs');
