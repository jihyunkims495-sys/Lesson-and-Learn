/* Deterministic DEV orders. Original CSV/JSON and real supplier orders are untouched. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.OrdoDevFeed=api;root.OrdoSnapshot=api.sync(root.OrdoDemoCalibration.calibrate(root.OrdoSnapshot));}
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const KEY='ordo-dev-feed-v1', DAY=86400000;
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  const shift=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
  const latestClosedDate=(now=new Date())=>shift(new Date(now.getTime()+9*3600000-8*3600000).toISOString().slice(0,10),-1);
  const random=key=>{let h=2166136261;for(const c of key)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
  let warning='';
  function project(base,through){
    if(!validDate(through))throw new Error('Invalid DEV date');
    const end=[through,shift(base.policy.seasonEnd,-1)].sort()[0];
    if(end<=base.meta.asOf)return base;
    const data=JSON.parse(JSON.stringify(base)), batches=[], orders=[];
    for(let date=shift(base.meta.asOf,1);date<=end;date=shift(date,1)){
      const day={date,units:0,revenue:0,orderCount:0,source:'DEV_GENERATED',categories:{}};
      const weekday=(new Date(date+'T00:00:00Z').getUTCDay()+6)%7;
      for(const product of data.products){
        for(const option of product.options){
          // A scheduled receipt becomes physical stock once, before sales.
          if(option.receiptDate<=date && option.inboundQty>0){
            option.physicalQty+=option.inboundQty;option.inboundQty=0;
          }
          if(option.launchDate>date||option.receiptDate>date||option.inventory<=0)continue;
          // Sparse demand, not every product sells daily. Independent of forecast/MD decisions.
          const p=(.018+random(product.code+'-velocity')*.035)*base.policy.weekdayFactors[weekday];
          if(random(option.id+date+'-sale')>=p)continue;
          const units=Math.min(option.inventory,1+Math.floor(random(option.id+date+'-units')*3));
          const price=Math.round(option.retailPrice*(.82+random(option.id+date+'-price')*.18));
          const revenue=price*units;
          const order={id:'DEV-'+date+'-'+option.id,date,code:product.code,optionId:option.id,units,revenue,source:'DEV_GENERATED'};
          orders.push(order);option.history.push({date,units,revenue,source:'DEV_GENERATED',orderId:order.id});
          option.inventory-=units;option.physicalQty=Math.max(0,option.physicalQty-units);option.soldQty+=units;
          day.units+=units;day.revenue+=revenue;day.orderCount++;
        }
      }
      data.daily.push(day);batches.push({date,rows:day.orderCount,units:day.units,revenue:day.revenue});
    }
    for(const p of data.products){
      p.inventory=p.options.reduce((n,o)=>n+o.inventory,0);
      const recent=p.options.flatMap(o=>o.history).filter(r=>r.date>=shift(end,-6));
      p.recent7Units=recent.reduce((n,r)=>n+r.units,0);p.recent7Revenue=recent.reduce((n,r)=>n+r.revenue,0);
      for(const size of p.sizes||[]){const opts=p.options.filter(o=>o.size===size.size);size.inventory=opts.reduce((n,o)=>n+o.inventory,0);size.soldQty=opts.reduce((n,o)=>n+o.soldQty,0);}
      const core=p.options.filter(o=>o.isCore), initial=core.reduce((n,o)=>n+o.initialQty,0);
      if(initial)p.coreSellThrough=core.reduce((n,o)=>n+o.soldQty,0)/initial;
    }
    const addedUnits=orders.reduce((n,o)=>n+o.units,0), addedRevenue=orders.reduce((n,o)=>n+o.revenue,0);
    Object.assign(data.meta,{asOf:end,windowEnd:end,sourceAsOf:base.meta.asOf,sourceContentHash:base.meta.contentHash,
      contentHash:base.meta.contentHash+':dev-daily-v1:'+end,
      acceptedRows:base.meta.acceptedRows+orders.length,rawRows:base.meta.rawRows+orders.length,
      acceptedUnits:base.meta.acceptedUnits+addedUnits,acceptedRevenue:base.meta.acceptedRevenue+addedRevenue});
    data.devFeed={mode:'DEV_GENERATED',baseAsOf:base.meta.asOf,through:end,batches,orders,rows:orders.length,units:addedUnits,revenue:addedRevenue};
    data.meta.warnings.unshift(`원본 CSV 기준일은 ${base.meta.asOf}이며 DEV 생성 주문 반영일 ${end}와 구분합니다. 실제 브랜드 실적이 아닙니다.`);
    data.meta.warnings.unshift('DEV 생성 주문을 포함합니다. 매일 KST 08:00에 전일 분량을 반영하고 미접속 날짜는 다음 실행 때 보충합니다. 실제 주문·모델 적중 증거가 아닙니다.');
    return data;
  }
  function sync(base,{manual=false,now=new Date()}={}){
    let cursor=null;
    try{cursor=JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){warning='DEV 진행 날짜를 읽지 못해 자동 날짜를 사용합니다.';}
    const saved=cursor?.sourceHash===base.meta.contentHash&&validDate(cursor.through)?cursor.through:base.meta.asOf;
    const yesterday=shift(new Date(now.getTime()+9*3600000).toISOString().slice(0,10),-1);
    // Never trust the old demo cursor: older versions allowed advancing into the future.
    const safeSaved=saved>yesterday?base.meta.asOf:saved;
    const through=[base.meta.asOf,manual?yesterday:latestClosedDate(now),safeSaved].sort().at(-1);
    const data=project(base,through);
    try{localStorage.setItem(KEY,JSON.stringify({sourceHash:base.meta.contentHash,through:data.meta.asOf}));}catch(_){warning='수집 기준일을 저장하지 못했습니다. 재접속 시 같은 날짜의 가상 주문을 중복 없이 재구성합니다.';}
    return data;
  }
  return {project,sync,latestClosedDate,shift,get warning(){return warning;}};
});
