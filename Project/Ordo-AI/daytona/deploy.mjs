// Official Daytona REST API integration. Requires an existing, started sandbox.
// No API key is uploaded. Run prepare.mjs first; original submission hosting is never contacted.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),runtime=path.join(root,'.runtime');
const key=process.env.DAYTONA_API_KEY,id=process.env.DAYTONA_SANDBOX_ID;
if(!key||!id)throw Error('Set DAYTONA_API_KEY and DAYTONA_SANDBOX_ID in your private process environment.');
if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('Invalid sandbox ID.');
const api='https://app.daytona.io/api',proxy='https://proxy.app.daytona.io/toolbox';
async function request(url,method='GET',body){
 const form=body instanceof FormData;
 const r=await fetch(url,{method,redirect:'error',headers:{Authorization:'Bearer '+key,...(body&&!form?{'Content-Type':'application/json'}:{})},...(body?{body:form?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw Error('Daytona request returned HTTP '+r.status);
 const text=await r.text();return text?JSON.parse(text):null;
}
async function exec(command){const r=await request(`${proxy}/${id}/process/execute`,'POST',{command,timeout:30});if(r.exitCode!==0)throw Error('Remote command failed.');return r;}
const info=await request(`${api}/sandbox/${id}`);if(info.state!=='started')throw Error('Start the selected sandbox first.');
const names=['analysis.cjs','demo-server.mjs','demo-launcher.cjs','demo-client.js','demo-client.css','demo-config.json'];
async function collect(dir,prefix){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.'))throw Error('Hidden deploy file rejected.');if(e.isDirectory())await collect(path.join(dir,e.name),prefix+e.name+'/');else if(e.isFile())names.push(prefix+e.name);else throw Error('Nonregular file rejected.');}}
await collect(path.join(runtime,'public'),'public/');
await exec('mkdir -p /home/daytona/ordo-demo/public/assets');
for(let i=0;i<names.length;i+=4)await Promise.all(names.slice(i,i+4).map(async name=>{
 if(!/^[A-Za-z0-9_./-]+$/.test(name)||name.includes('..'))throw Error('Unsafe deploy path.');
 const f=new FormData();f.append('file',new Blob([await readFile(path.join(runtime,name))]),path.basename(name));
 await request(`${proxy}/${id}/files/upload?path=${encodeURIComponent('/home/daytona/ordo-demo/'+name)}`,'POST',f);
}));
await request(`${api}/sandbox/${id}/autostop/180`,'POST');
await exec('node /home/daytona/ordo-demo/demo-launcher.cjs');
const preview=await request(`${api}/sandbox/${id}/ports/3001/signed-preview-url?expiresInSeconds=10800`);
const config=JSON.parse(await readFile(path.join(runtime,'demo-config.json'),'utf8'));
const result={url:preview.url,expiresAt:config.expiresAt,sandboxId:id,port:3001};
await writeFile(path.join(root,'deployment.local.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result)); // Shareable single-port preview, never a management token.
