import { createServer } from 'node:http';
import { createServer as netServer } from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createServerClient } from '@supabase/ssr';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(new URL('../package.json', import.meta.url));
const siblings = readdirSync(dirname(root), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name.startsWith('02-')).map(entry => entry.name);
let browserRequire;
for (const name of ['02-frontend', ...siblings]) {
  try {
    const candidate = createRequire(join(dirname(root), name, 'package.json'));
    candidate.resolve('@playwright/test');
    browserRequire = candidate;
    break;
  } catch { /* Try another installed sibling. */ }
}
if (!browserRequire) throw new Error('Run npm ci in the sibling 02-frontend project first.');
const { chromium, expect } = browserRequire('@playwright/test');
const user = { id:'11111111-1111-4111-8111-111111111111', email:'fixture@example.invalid', aud:'authenticated', role:'authenticated', app_metadata:{provider:'email',providers:['email']}, user_metadata:{}, created_at:'2026-01-01T00:00:00Z' };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now()/1000);
const access = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,aud:'authenticated',role:'authenticated',iat:now,exp:now+3600})}.fixture-signature`;
const session = {access_token:access,token_type:'bearer',expires_in:3600,expires_at:now+3600,refresh_token:'local-fixture-refresh-only',user};
const report = {scope:'Local fake Auth/PostgREST only; no external service or real credentials',checks:[]};
let mode='empty';
let release;
let next;
let browser;
let stage='start-local-fixture';
let origin='';
let signupContract=false;
let readCount=0;
let delayedWrite=false;
let writeReceived=false;
let releaseWrite;
let writtenTitle='';
let writeCount=0;
const fixtureRequestKinds=new Set();
const clientRequestKinds=new Set();
const clientErrorKinds=new Set();
const json=(response,status,value)=>{response.writeHead(status,{'content-type':'application/json'});response.end(JSON.stringify(value));};
const fixture=createServer(async(request,response)=>{
  const url=new URL(request.url,'http://127.0.0.1:54321');
  fixtureRequestKinds.add(request.method+' '+url.pathname);
  response.setHeader('Access-Control-Allow-Origin',origin||'*');
  response.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,prefer,content-profile,accept-profile,x-client-info,x-supabase-api-version');
  if(request.method==='OPTIONS'){response.writeHead(204);response.end();return;}
  if(url.pathname==='/auth/v1/token'){
    let body='';for await(const chunk of request)body+=chunk;
    const value=JSON.parse(body);
    return value.password==='fixture-password-only' ? json(response,200,session)
      : json(response,400,{error_code:'invalid_credentials',msg:'Invalid login credentials'});
  }
  if(url.pathname==='/auth/v1/user')return json(response,200,user);
  if(url.pathname==='/auth/v1/signup'){
    let body='';for await(const chunk of request)body+=chunk;
    const value=JSON.parse(body);
    signupContract=value.email==='signup@example.invalid' && value.password==='fixture-password-only'
      && url.searchParams.get('redirect_to')===origin+'/auth/callback';
    return json(response,200,{...user,email:'signup@example.invalid'});
  }
  if(url.pathname==='/rest/v1/practice_todos'){
    if(request.method==='POST'){
      let body='';for await(const chunk of request)body+=chunk;
      const value=JSON.parse(body);writtenTitle=value.title;writeReceived=true;
      if(delayedWrite)await new Promise(resolve=>{releaseWrite=resolve;});
      writeCount++;
      return json(response,201,{id:'22222222-2222-4222-8222-222222222222',user_id:user.id,
        title:value.title,done:false,created_at:'2026-01-01T00:00:00Z'});
    }
    readCount++;
    if(mode==='slow')await new Promise(resolve=>{release=resolve;});
    if(mode==='error')return json(response,503,{code:'FIXTURE_UNAVAILABLE',message:'local fixture failure'});
    return json(response,200,[]);
  }
  return json(response,404,{code:'FIXTURE_NOT_FOUND'});
});
const pass=(name)=>report.checks.push({name,status:'PASS'});
try{
  await new Promise((resolve,reject)=>fixture.once('error',reject).listen(54321,'127.0.0.1',resolve));
  stage='build-local-fixture-version';
  const compile=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'build'],{
    cwd:root,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_validation_only'},
    stdio:['ignore','pipe','pipe'],windowsHide:true,
  });
  compile.stdout.resume();compile.stderr.resume();
  const compiled=await new Promise((resolve,reject)=>{compile.once('error',reject);compile.once('exit',resolve);});
  if(compiled!==0)throw new Error('Local fixture build failed');
  const cookies=[];
  const db=createServerClient('http://127.0.0.1:54321','sb_publishable_local_validation_only',{
    cookies:{getAll:()=>cookies,setAll:values=>{for(const value of values){const i=cookies.findIndex(c=>c.name===value.name);if(i<0)cookies.push(value);else cookies[i]=value;}}},
  });
  const login=await db.auth.signInWithPassword({email:user.email,password:'fixture-password-only'});
  if(login.error||!cookies.length)throw new Error('Fixture session failed');
  const probe=netServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));origin=`http://127.0.0.1:${port}`;
  next=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{
    cwd:root,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_validation_only'},
    stdio:['ignore','pipe','pipe'],windowsHide:true,
  });
  next.stdout.resume();next.stderr.resume();
  let ready=false;
  for(let i=0;i<80;i++){
    try{if((await fetch(origin+'/login',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}
    await delay(200);
  }
  if(!ready)throw new Error('Startup timeout');
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  await context.addCookies(cookies.filter(c=>c.value).map(c=>({name:c.name,value:c.value,domain:'127.0.0.1',path:'/',sameSite:'Lax'})));
  const page=await context.newPage();page.setDefaultTimeout(10000);
  page.on('request',request=>{const target=new URL(request.url());if(target.port==='54321')clientRequestKinds.add(request.method()+' '+target.pathname);});
  page.on('console',message=>{if(message.type()==='error')clientErrorKinds.add(/CORS|Access-Control/i.test(message.text())?'cors':/hydrate|hydration/i.test(message.text())?'hydration':'other');});
  page.on('pageerror',()=>clientErrorKinds.add('page-error'));
  stage='fixture-authenticated-empty-state';
  await page.goto(origin+'/todos');
  await expect(page.getByRole('heading',{name:'오늘의 할 일'})).toBeVisible();
  await expect(page.getByText('조회된 할 일이 없습니다.',{exact:true})).toBeVisible();pass(stage);
  stage='pending-create-draft-protection';
  const input=page.getByLabel('할 일',{exact:true});
  const firstTitle='처리 중인 일정 A';const nextTitle='다음 일정 B';
  delayedWrite=true;writeReceived=false;releaseWrite=undefined;
  await input.fill(firstTitle);
  await page.getByRole('button',{name:'추가',exact:true}).click();
  for(let i=0;i<50&&!releaseWrite;i++)await delay(100);
  if(!writeReceived||!releaseWrite){report.pendingCreateDiagnostic={fixtureRequestKinds:[...fixtureRequestKinds],clientRequestKinds:[...clientRequestKinds],clientErrorKinds:[...clientErrorKinds],inputRetained:await input.inputValue()===firstTitle,addEnabled:await page.getByRole('button',{name:'추가',exact:true}).isEnabled(),appAlertCount:await page.locator('main [role=alert]').count()};throw new Error('Delayed create was not requested');}
  await expect(page.getByRole('button',{name:'추가',exact:true})).toBeDisabled();
  const inputEditableDuringWrite=await input.isEnabled();
  if(inputEditableDuringWrite)await input.fill(nextTitle);
  delayedWrite=false;releaseWrite();releaseWrite=undefined;
  await expect(page.getByRole('link',{name:firstTitle,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'추가',exact:true})).toBeEnabled();
  await expect(input).toBeEnabled();
  const nextDraftPreserved=!inputEditableDuringWrite||(await input.inputValue())===nextTitle;
  const diagnostics={inputDisabledDuringWrite:!inputEditableDuringWrite,nextDraftPreserved,
    exactlyOneCreate:writeCount===1,submittedTitleMatches:writtenTitle===firstTitle};
  if(!nextDraftPreserved||writeCount!==1||writtenTitle!==firstTitle){
    report.checks.push({name:stage,status:'FAIL',diagnostic:diagnostics});
  }else{
    if(!inputEditableDuringWrite)await expect(input).toHaveValue('');
    await input.fill(nextTitle);
    await expect(input).toHaveValue(nextTitle);
    report.checks.push({name:stage,status:'PASS',diagnostic:diagnostics});
  }
  stage='server-loading-state';mode='slow';release=undefined;
  const navigation=page.goto(origin+'/todos',{waitUntil:'commit'});
  await navigation;
  await expect(page.getByText('불러오는 중…',{exact:true})).toBeVisible();pass(stage);
  for(let i=0;i<50&&!release;i++)await delay(100);
  if(!release)throw new Error('Slow fixture not requested');
  mode='empty';release();release=undefined;
  await expect(page.getByText('조회된 할 일이 없습니다.',{exact:true})).toBeVisible();pass('loading-resolves-to-empty');
  stage='server-query-error-boundary';mode='error';
  await page.goto(origin+'/todos');
  await expect(page.locator('main [role="alert"]')).toHaveText('요청 처리에 실패했습니다.');pass(stage);
  stage='error-boundary-retry';mode='empty';
  const readsBeforeRetry=readCount;
  await page.getByRole('button',{name:'다시 시도',exact:true}).click();
  try {
    await expect(page.getByText('조회된 할 일이 없습니다.',{exact:true})).toBeVisible({timeout:10000});
    if(readCount<=readsBeforeRetry)throw new Error('Retry did not request fresh data');pass(stage);
  } catch {
    report.checks.push({name:stage,status:'FAIL',diagnostic:{newDataRequests:readCount-readsBeforeRetry,errorStillVisible:await page.locator('main [role="alert"]').count()>0}});
  }
  stage='manual-reload-recovers-query';
  await page.reload();
  await expect(page.getByText('조회된 할 일이 없습니다.',{exact:true})).toBeVisible();pass(stage);
  const signedOut=await browser.newContext();const authPage=await signedOut.newPage();authPage.setDefaultTimeout(10000);
  stage='wrong-login-message-and-button-recovery';
  await authPage.goto(origin+'/login');
  await authPage.getByLabel('이메일',{exact:true}).fill('fixture@example.invalid');
  await authPage.getByLabel('비밀번호',{exact:true}).fill('incorrect-fixture-password');
  await authPage.getByRole('button',{name:'로그인',exact:true}).click();
  await expect(authPage.getByText('인증 실패: 이메일·비밀번호 또는 인증 상태를 확인하세요.',{exact:true})).toBeVisible();
  await expect(authPage.getByRole('button',{name:'로그인',exact:true})).toBeEnabled();pass(stage);
  stage='signup-request-and-confirmation-notice';
  await authPage.getByRole('button',{name:'회원가입으로 전환',exact:true}).click();
  await authPage.getByLabel('이메일',{exact:true}).fill('signup@example.invalid');
  await authPage.getByLabel('비밀번호',{exact:true}).fill('fixture-password-only');
  await authPage.getByRole('button',{name:'회원가입',exact:true}).click();
  await expect(authPage.getByText('가입 확인 이메일을 확인한 뒤 로그인하세요.',{exact:true})).toBeVisible();
  if(!signupContract)throw new Error('Signup request contract failed');pass(stage);
  report.status=report.checks.some(check=>check.status==='FAIL')?'FAIL':'PASS';
}catch(error){report.status='FAIL';report.failedCheck=stage;report.failure=String(error.message).slice(0,350);}
finally{
  mode='empty';if(release)release();if(releaseWrite)releaseWrite();
  if(browser)await browser.close();
  if(next&&next.exitCode===null){const stopped=new Promise(resolve=>next.once('exit',resolve));next.kill();await Promise.race([stopped,delay(5000)]);}
  fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));
}
console.log(JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
