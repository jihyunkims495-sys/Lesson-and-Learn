import { createServer } from 'node:http';
import { createServer as netServer } from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
const project=dirname(dirname(fileURLToPath(import.meta.url)));
const reuseBuild=process.argv.includes('--reuse-build');
const require=createRequire(join(project,'package.json'));
const {createBrowserClient,createServerClient}=require('@supabase/ssr');
const key='sb_publishable_local_validation_only';
const authOrigin='http://127.0.0.1:54321';
const user={id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const session=(expired=false)=>{const now=Math.floor(Date.now()/1000);return{access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,aud:'authenticated',role:'authenticated',iat:now-7200,exp:now+(expired?-3600:3600)})}.fixture-signature`,token_type:'bearer',expires_in:expired?-3600:3600,expires_at:now+(expired?-3600:3600),refresh_token:'fixture-refresh-only',user};};
const report={scope:'Local synthetic PKCE and refresh cookie propagation only; no external auth',checks:[]};
let challenge,challengeMethod,matchedVerifier=false,refreshCount=0,next;
const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};
const fixture=createServer(async(req,res)=>{
 const url=new URL(req.url,authOrigin);
 if(url.pathname==='/auth/v1/signup'){
  let body='';for await(const c of req)body+=c;const value=JSON.parse(body);challenge=value.code_challenge;challengeMethod=value.code_challenge_method;return json(res,200,user);
 }
 if(url.pathname==='/auth/v1/token'){
  let body='';for await(const c of req)body+=c;const value=JSON.parse(body);
  if(url.searchParams.get('grant_type')==='pkce'){
   matchedVerifier=value.auth_code==='fixture-code'&&typeof value.code_verifier==='string'&&createHash('sha256').update(value.code_verifier).digest('base64url')===challenge;
   return json(res,matchedVerifier?200:400,matchedVerifier?session():{error:'bad verifier'});
  }
  if(url.searchParams.get('grant_type')==='refresh_token'){refreshCount++;return json(res,200,session());}
  return json(res,200,session(true));
 }
 if(url.pathname==='/auth/v1/user')return json(res,200,user);
 return json(res,404,{error:'local fixture route missing'});
});
const adapter=jar=>({getAll:()=>jar,setAll:values=>{for(const value of values){const i=jar.findIndex(c=>c.name===value.name);if(i<0)jar.push(value);else jar[i]=value;}}});
const cookieHeader=jar=>jar.filter(c=>c.value).map(c=>`${c.name}=${c.value}`).join('; ');
try{
 await new Promise((resolve,reject)=>fixture.once('error',reject).listen(54321,'127.0.0.1',resolve));
 if(!reuseBuild){
  const compile=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'build'],{cwd:project,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:authOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key},stdio:['ignore','pipe','pipe'],windowsHide:true});
  compile.stdout.resume();compile.stderr.resume();
  const code=await new Promise((resolve,reject)=>{compile.once('error',reject);compile.once('exit',resolve);});
  if(code!==0)throw new Error('local build failed');
 }
 const probe=netServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));const origin=`http://127.0.0.1:${port}`;
 next=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:project,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:authOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key},stdio:['ignore','pipe','pipe'],windowsHide:true});
 next.stdout.resume();next.stderr.resume();
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/login')).ok){ready=true;break;}}catch{}await delay(150);}if(!ready)throw new Error('startup');
 const jar=[];const browser=createBrowserClient(authOrigin,key,{isSingleton:false,cookies:adapter(jar)});
 const signup=await browser.auth.signUp({email:user.email,password:'fixture-password-only',options:{emailRedirectTo:origin+'/auth/callback'}});
 if(signup.error)throw new Error('signup');
 const response=await fetch(origin+'/auth/callback?code=fixture-code',{headers:{cookie:cookieHeader(jar)},redirect:'manual'});
 const cookies=response.headers.getSetCookie();
 const callback={name:'pkce-callback-cookie-propagation',signupVerifierCookie:jar.some(c=>c.name.includes('code-verifier')&&Boolean(c.value)),s256Challenge:challengeMethod==='s256',verifierMatched:matchedVerifier,status:response.status,redirectTodos:new URL(response.headers.get('location'),origin).pathname==='/todos',sessionCookieWritten:cookies.some(c=>c.includes('auth-token=')||/auth-token\.\d=/.test(c)),cacheControl:response.headers.get('cache-control'),pragma:response.headers.get('pragma'),expires:response.headers.get('expires')};
 callback.result=callback.signupVerifierCookie&&callback.verifierMatched&&callback.redirectTodos&&callback.sessionCookieWritten&&/private/.test(callback.cacheControl||'')&&/no-store/.test(callback.cacheControl||'')&&callback.pragma==='no-cache'&&callback.expires==='0'?'PASS':'FAIL';report.checks.push(callback);
 const expired=[];const server=createServerClient(authOrigin,key,{cookies:adapter(expired)});await server.auth.signInWithPassword({email:user.email,password:'fixture-password-only'});
 const before=refreshCount;const refreshed=await fetch(origin+'/login',{headers:{cookie:cookieHeader(expired)},redirect:'manual'});
 const refresh={name:'proxy-expired-cookie-refresh',refreshRequested:refreshCount>before,sessionCookieWritten:refreshed.headers.getSetCookie().some(c=>c.includes('auth-token=')||/auth-token\.\d=/.test(c)),cacheControl:refreshed.headers.get('cache-control'),pragma:refreshed.headers.get('pragma'),expires:refreshed.headers.get('expires')};
 refresh.result=refresh.refreshRequested&&refresh.sessionCookieWritten&&/private/.test(refresh.cacheControl||'')&&/no-store/.test(refresh.cacheControl||'')&&refresh.pragma==='no-cache'&&refresh.expires==='0'?'PASS':'FAIL';report.checks.push(refresh);
 report.result=report.checks.every(c=>c.result==='PASS')?'PASS':'FAIL';
}catch{report.result='FAIL';report.failure='synthetic-preflight-error';}
finally{
 if(next&&next.exitCode===null){const stopped=new Promise(r=>next.once('exit',r));next.kill();await Promise.race([stopped,delay(5000)]);}
 fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));
}
console.log(JSON.stringify(report,null,2));
if(report.result!=='PASS')process.exitCode=1;
