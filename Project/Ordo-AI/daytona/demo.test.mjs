import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import {demoServer} from './demo-server.mjs';
import adapter from './analysis.cjs';
const require=createRequire(import.meta.url),root=path.join(path.dirname(fileURLToPath(import.meta.url)),'.runtime');
const site=path.join(root,'public'),asOf=require(path.join(site,'dev-feed.js')).latestClosedDate();
const source=adapter.loadModel(site);
source.snapshot=require(path.join(site,'dev-feed.js')).project(require(path.join(site,'demo-calibration.js')).calibrate(source.snapshot),asOf);
async function fixture(t,override={}) {
 const server=await demoServer({root,config:{asOf,maxCalls:30,expiresAt:new Date(Date.now()+60000).toISOString(),...override}});
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
 return 'http://127.0.0.1:'+server.address().port;
}
const post=(url,body,headers={})=>fetch(url+'/api/simulate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('serves isolated app and video range, never private server files',async t=>{
 const url=await fixture(t),r=await fetch(url),html=await r.text();assert.equal(r.status,200);assert.match(html,/demo-client.js/);
 for(const route of ['today','overview','decisions','simulator','orders','reports'])assert.ok(html.includes('data-route="'+route+'"'));
 for(const file of ['/demo-config.json','/server-private.json','/analysis.cjs','/.env'])assert.equal((await fetch(url+file)).status,404);
 const video=await fetch(url+'/assets/ordo-ai-how-to-use.mp4',{headers:{Range:'bytes=0-99'}});assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,100);
});
test('auto, manual quantity and weekly sales exactly match existing model',async t=>{
 const url=await fixture(t);
 for(const extra of [{},{manualBaseQty:40},{promotionUnits:[100,90,80,70,110,130,120]}]){
 const input={sku:'RA26FSH060',horizon:'ALL',asOf,...extra};const r=await post(url,input);assert.equal(r.status,200);const data=await r.json();assert.deepEqual(data.calculation,adapter.analyze(source,input));assert.equal(data.inference,'NONE');assert.equal(data.supplierOrderSent,false);assert.ok(data.executionId);}
});
test('invalid request data and cross-site browser requests are rejected',async t=>{
 const url=await fixture(t),good={sku:'RA26FSH060',horizon:'D+14',asOf};
 assert.equal((await post(url,{...good,sku:'INVALID'})).status,400);
 assert.equal((await post(url,{...good,asOf:'2000-01-01'})).status,409);
 assert.equal((await post(url,{...good,promotionUnits:[1]})).status,400);
 assert.equal((await post(url,{...good,extra:'x'})).status,400);
 assert.equal((await post(url,good,{'Sec-Fetch-Site':'cross-site'})).status,403);
});
test('request count and expiry bound the temporary demo',async t=>{
 const url=await fixture(t,{maxCalls:1}),good={sku:'RA26FSH060',horizon:'D+14',asOf};
 assert.equal((await post(url,good)).status,200);assert.equal((await post(url,good)).status,429);
 const expired=await fixture(t,{expiresAt:'2020-01-01T00:00:00Z'});assert.equal((await fetch(expired+'/health')).status,410);
});
