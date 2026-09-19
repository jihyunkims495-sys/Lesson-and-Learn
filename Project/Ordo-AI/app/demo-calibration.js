/* Alternative, reversible DEV stock fixture. This is not a reconstruction of actual inventory. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.OrdoDemoCalibration=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const VERSION='working-stock-v1',DAY=86400000;
  const shift=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*DAY).toISOString().slice(0,10);
  const sum=(rows,key)=>rows.reduce((n,r)=>n+(typeof key==='function'?key(r):r[key]),0);
  const random=key=>{let h=2166136261;for(const c of key)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296;};
  const close=(a,b)=>Math.abs(a-b)<.01;
  function allocate(total,weights){
    if(!total)return weights.map(()=>0);
    const denominator=sum(weights,v=>v),raw=weights.map(w=>total*w/denominator),out=raw.map(Math.floor);
    const order=raw.map((v,i)=>({i,f:v-out[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
    for(let n=total-sum(out,v=>v),i=0;i<n;i++)out[order[i].i]++;
    return out;
  }
  function calibrate(base){
    if(base?.calibration?.version===VERSION)return base;
    if(base?.calibration)throw new Error('Unsupported existing calibration; start from the original source snapshot.');
    if(!base?.products?.length||!base?.policy?.weekdayFactors||base.devFeed)throw new Error('Calibrate the original source snapshot before DEV daily projection.');
    const data=JSON.parse(JSON.stringify(base)),asOf=data.meta.asOf,weekday=data.policy.weekdayFactors;
    const exposure=(start,end)=>{let n=0;for(let d=start;d<=end;d=shift(d,1))n+=weekday[(new Date(d+'T00:00:00Z').getUTCDay()+6)%7];return n;};
    const sourceOptions=base.products.flatMap(p=>p.options),sourceInitialCost=sum(sourceOptions,o=>o.initialQty*o.unitCost);
    const originalBudget=base.policy.budgetByMethod;
    const derivedSpendVerified=close(sourceInitialCost,base.targets.initialCost)&&Object.entries(originalBudget).every(([method,b])=>
      close(sum(base.products.filter(p=>p.productionType===method),p=>sum(p.options,o=>o.initialQty*o.unitCost)),b.initialCost));
    let workingStyles=0,deadstockStyles=0,workingStock=0,deadstockStock=0,removedFutureSold=0;
    for(const product of data.products){
      product.sourceStock={inventory:product.inventory,coreSellThrough:product.coreSellThrough,initialQty:sum(product.options,'initialQty'),soldQty:sum(product.options,'soldQty')};
      const from=[data.meta.windowStart,shift(asOf,-27)].sort().at(-1),lastStart=shift(asOf,-6);
      const eligible=product.options.map(o=>[o.receiptDate,o.launchDate,from].sort().at(-1)).sort()[0];
      const recent=sum(product.options,o=>sum(o.history.filter(r=>r.date>=lastStart&&r.date<=asOf),'units'));
      const older=sum(product.options,o=>sum(o.history.filter(r=>r.date>=from&&r.date<lastStart),'units'));
      const exp7=exposure([eligible,lastStart].sort().at(-1),asOf),exp21=exposure(eligible,shift(lastStart,-1));
      const dailyRate=exp7&&exp21 ? .65*recent/exp7+.35*older/exp21 : exp7?recent/exp7:exp21?older/exp21:0;
      const initialTotal=sum(product.options,'initialQty');
      const bands={REORDER:[.35,.80],WATCH:[1.20,1.80],HOLD:[2.50,4.00]};
      const band=bands[product.decision]||bands.HOLD;
      // These are declared stock-cover assumptions, not estimates learned from the archive.
      const coverDays=Math.max(1,(product.leadTime+7)*(band[0]+random(product.code+'-cover')*(band[1]-band[0])));
      const working=dailyRate>0;
      const weights=product.options.map(o=>{
        const observed=sum(o.history.filter(r=>r.date>=from&&r.date<=asOf),'units');
        const prior=initialTotal?o.initialQty/initialTotal:1/product.options.length;
        const share=.75*observed/Math.max(1,recent+older)+.25*prior;
        return share*(.75+.50*random(o.id+'-cover'));
      });
      const styleStock=working?Math.max(1,Math.round(dailyRate*coverDays)):sum(product.options,'inventory');
      const quantities=working?allocate(styleStock,weights):product.options.map(o=>o.inventory);
      product.calibration={kind:working?'WORKING_STOCK':'LEGACY_NO_EVIDENCE_STOCK',dailyRate,coverDays:working?coverDays:null,
        sourceArchiveDecision:product.decision,allocationObservedShare:.75,allocationPriorShare:.25,
        stockAssumption:working?'Observed-demand stock-cover fixture; not measured current stock.':'No valid demand evidence: source inventory retained; not proof that demand is zero.'};
      working?workingStyles++:deadstockStyles++;
      working?workingStock+=styleStock:deadstockStock+=styleStock;
      product.options.forEach((option,i)=>{
        option.sourceStock={initialQty:option.initialQty,soldQty:option.soldQty,inventory:option.inventory,
          physicalQty:option.physicalQty,reservedQty:option.reservedQty,inboundQty:option.inboundQty,virtualQty:option.virtualQty};
        option.inventory=quantities[i];
        const received=option.receiptDate<=asOf,launched=option.launchDate<=asOf;
        if(!received||!launched){removedFutureSold+=option.soldQty;option.soldQty=0;}
        // Unverified historic sold balances remain synthetic source balances. New actuals are never invented.
        option.initialQty=option.soldQty+option.inventory;
        option.reservedQty=0;option.virtualQty=0;
        option.physicalQty=received?option.inventory:0;
        option.inboundQty=received?0:option.inventory;
      });
      product.inventory=sum(product.options,'inventory');
      const core=product.options.filter(o=>o.isCore),initial=sum(core,'initialQty');
      product.coreSellThrough=initial?sum(core,'soldQty')/initial:0;
      for(const size of product.sizes||[]){const options=product.options.filter(o=>o.size===size.size);
        size.initialQty=sum(options,'initialQty');size.soldQty=sum(options,'soldQty');size.inventory=sum(options,'inventory');}
    }
    const all=data.products.flatMap(p=>p.options),calibratedInitialCost=sum(all,o=>o.initialQty*o.unitCost);
    data.meta.sourceFinancials={targets:JSON.parse(JSON.stringify(base.targets)),budgetByMethod:JSON.parse(JSON.stringify(originalBudget)),availableBudget:base.policy.availableBudget};
    if(derivedSpendVerified){
      data.targets.initialCost=calibratedInitialCost;
      for(const [method,budget]of Object.entries(data.policy.budgetByMethod)){
        budget.sourceInitialCost=budget.initialCost;
        budget.initialCost=sum(data.products.filter(p=>p.productionType===method),p=>sum(p.options,o=>o.initialQty*o.unitCost));
        budget.availableBudget=Math.max(0,Math.min(budget.reorderBudget,budget.productBudget-budget.initialCost));
      }
      data.policy.availableBudget=Math.max(0,sum(Object.values(data.policy.budgetByMethod),'productBudget')-calibratedInitialCost);
    }
    const originalHash=base.meta.contentHash;
    data.meta.mode='DEV_CALIBRATED';data.meta.sourceContentHash=originalHash;
    data.meta.sourceMode=base.meta.mode;data.meta.contentHash=originalHash+':'+VERSION;
    data.calibration={version:VERSION,mode:'DEV_CALIBRATED',sourceAsOf:asOf,sourceContentHash:originalHash,
      financialMode:derivedSpendVerified?'RECOMPUTED_DERIVED_DEMO_SPEND':'SOURCE_SPEND_PRESERVED',
      bands:{REORDER:[.35,.80],WATCH:[1.20,1.80],HOLD:[2.50,4]},coverAnchor:'physical leadTime + 7 calendar days',
      workingStyles,retainedNoEvidenceStyles:deadstockStyles,workingStock,retainedNoEvidenceStock:deadstockStock,
      sourceSellableStock:sum(sourceOptions,'inventory'),calibratedSellableStock:sum(all,'inventory'),
      sourceInitialCost,calibratedInitialCost,removedFutureSold,historyUnchanged:true,
      assumptions:[
        'This is a separate synthetic working-stock scenario, not a correction establishing true warehouse stock.',
        'Accepted transaction dates, units and revenue are unchanged. Source CSV/JSON and archive decisions are unchanged.',
        'Archive labels select stock-cover fixture bands only; current model decisions and effects must be recalculated and may be zero.',
        'Zero-evidence styles retain original stock and cost; absence of orders is not proof of zero demand.',
        'Original synthetic sold balances are retained except impossible pre-receipt/pre-launch balances. They still contain unsupported opening quantities and quarantined-sale effects.',
        'Synthetic reservations are released in this alternative fixture. Initial units = synthetic sold balance + working/future stock.',
        'Physical stock is zero until receipt. Future stock remains explicitly inbound; the forecasting engine must gate sales by launch/receipt.',
        'Only verified quantity-times-cost-derived spend is recomputed. Budgets, unit costs, MOQs, supplier risks and lead times are unchanged.',
        'The stock-cover bands and 75/25 evidence/prior allocation are explicit demo assumptions, not calibrated or validated real-world parameters.'
      ]};
    data.meta.warnings.unshift('DEV 보정 시나리오: 관측 주문은 그대로 두고 재고 커버일·초도 원가를 별도 합성 가정으로 다시 구성했습니다. 실제 재고·실적 복원값이 아니며 원본 재고/예산은 sourceStock·sourceFinancials에 보존합니다.');
    return data;
  }
  return {VERSION,calibrate};
});
