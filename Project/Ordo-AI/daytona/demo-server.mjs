import http from 'node:http';
import path from 'node:path';
import {readFile,readdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import adapter from './analysis.cjs';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.mp4':'video/mp4','.ttf':'font/ttf','.woff2':'font/woff2'};
export async function demoServer({root,config}) {
  const publicRoot=path.join(root,'public'), allowed=new Map();
  async function inventory(dir,prefix='') {
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      if(entry.name.startsWith('.')) continue;
      if(entry.isDirectory()) await inventory(path.join(dir,entry.name),prefix+entry.name+'/');
      else if(entry.isFile()) allowed.set('/'+prefix+entry.name,path.join(dir,entry.name));
    }
  }
  await inventory(publicRoot);
  allowed.set('/demo-client.js',path.join(root,'demo-client.js'));
  allowed.set('/demo-client.css',path.join(root,'demo-client.css'));
  const require=createRequire(import.meta.url);
  const source=adapter.loadModel(publicRoot);
  source.snapshot=require(path.join(publicRoot,'dev-feed.js')).project(require(path.join(publicRoot,'demo-calibration.js')).calibrate(source.snapshot),config.asOf);
  let calls=0;
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Cache-Control','no-store');
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify(data));};
    try {
      if(Date.now()>=Date.parse(config.expiresAt)) {send(410,{error:'시연 시간이 종료되었습니다. 기존 제출 사이트에는 영향이 없습니다.'});return;}
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/health'&&req.method==='GET') {send(200,{service:'ordo-daytona-demo',version:1,runtime:'Daytona',inference:'NONE',asOf:config.asOf,expiresAt:config.expiresAt,calls,originalSiteModified:false,supplierOrderSent:false});return;}
      if(url.pathname==='/api/simulate'&&req.method==='POST') {
        if(req.headers['sec-fetch-site']==='cross-site') {send(403,{error:'Same-origin requests only.'});return;}
        if(!(req.headers['content-type']||'').startsWith('application/json')) {send(415,{error:'JSON required.'});return;}
        if(calls>=config.maxCalls) {send(429,{error:'시연 계산 한도에 도달했습니다.'});return;}
        let body='';
        for await(const chunk of req) {body+=chunk;if(Buffer.byteLength(body)>4096){send(413,{error:'Input too large.'});return;}}
        let input,result;
        try {
          input=JSON.parse(body);
          const fields=['sku','horizon','asOf','promotionUnits','weekdayFactors','manualBaseQty'];
          if(!input||Array.isArray(input)||typeof input!=='object'||Object.keys(input).some(k=>!fields.includes(k))) throw Error();
          if(input.asOf!==config.asOf) {send(409,{error:'데이터 기준일이 다릅니다. 새로고침 후 다시 실행해 주세요.'});return;}
          for(const k of ['promotionUnits','weekdayFactors']) if(input[k]!==undefined&&(!Array.isArray(input[k])||input[k].length!==7||input[k].some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000))) throw Error();
          result=adapter.analyze(source,input);
        } catch {send(400,{error:'상품 또는 시뮬레이션 입력을 확인해 주세요.'});return;}
        calls++;
        send(200,{executionId:randomUUID(),executedAt:new Date().toISOString(),runtime:'Daytona',inference:'NONE',calculation:result,resultHash:createHash('sha256').update(JSON.stringify(result)).digest('hex'),supplierOrderSent:false});return;
      }
      if(!['GET','HEAD'].includes(req.method)){send(405,{error:'Method not allowed.'});return;}
      const route=url.pathname==='/'?'/index.html':url.pathname;
      const file=allowed.get(route);
      if(!file){send(404,{error:'Not found.'});return;}
      let buffer=await readFile(file);
      if(route==='/index.html') buffer=Buffer.from(buffer.toString('utf8').replace('</head>','<meta name="referrer" content="no-referrer"><link rel="stylesheet" href="/demo-client.css"></head>').replace('</body>','<script src="/demo-client.js"></script></body>'));
      const type=MIME[path.extname(file)]||'application/octet-stream';
      if(route.endsWith('.mp4')&&req.headers.range) {
        const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        const start=m?Number(m[1]):-1,end=m&&m[2]?Math.min(Number(m[2]),buffer.length-1):buffer.length-1;
        if(start<0||start> end||start>=buffer.length){res.writeHead(416,{'Content-Range':`bytes */${buffer.length}`}).end();return;}
        res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${buffer.length}`,'Content-Length':end-start+1});res.end(req.method==='HEAD'?undefined:buffer.subarray(start,end+1));return;
      }
      res.writeHead(200,{'Content-Type':type,'Content-Length':buffer.length,...(route.endsWith('.mp4')?{'Accept-Ranges':'bytes'}:{})});
      res.end(req.method==='HEAD'?undefined:buffer);
    } catch {if(!res.headersSent)send(500,{error:'시연 서버 오류입니다. 원본 사이트에는 영향이 없습니다.'});else res.end();}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.dirname(fileURLToPath(import.meta.url));
  const config=JSON.parse(await readFile(path.join(root,'demo-config.json'),'utf8'));
  const server=await demoServer({root,config});
  server.listen(3001,'0.0.0.0',()=>console.log('Independent Ordo demo listening on 3001.'));
  const remaining=Date.parse(config.expiresAt)-Date.now();
  if(remaining<=0)process.exit(0);
  setTimeout(()=>{server.close();setTimeout(()=>process.exit(0),1000).unref();},remaining).unref();
}
