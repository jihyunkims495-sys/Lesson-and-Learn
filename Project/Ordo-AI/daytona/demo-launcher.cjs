'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
async function main(){
  try {const r=await fetch('http://127.0.0.1:3001/health',{signal:AbortSignal.timeout(1000)});if(r.ok){console.log('Independent demo already running.');return;}}catch{}
  const log=fs.openSync(path.join(__dirname,'demo.log'),'a',0o600);
  const child=spawn(process.execPath,[path.join(__dirname,'demo-server.mjs')],{cwd:__dirname,detached:true,stdio:['ignore',log,log]});
  child.unref();fs.closeSync(log);console.log('Independent demo started.');
}
main().catch(()=>{console.error('Demo launch failed.');process.exitCode=1;});
