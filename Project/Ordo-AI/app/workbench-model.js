(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else {
    root.createOrdoModel = factory;
    root.OrdoModel = factory(root.OrdoSnapshot);
  }
})(typeof window !== 'undefined' ? window : globalThis, function createOrdoModel(snapshot, overrides) {
  'use strict';
  if (overrides === undefined) overrides = {};
  if (!snapshot?.products?.length || !snapshot.policy) throw new Error('A complete Ordo snapshot is required.');
  const DAY = 86400000;
  const shift = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
  const between = (from, to) => Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1);
  const sum = (rows, key) => rows.reduce((total, row) => total + (typeof key === 'function' ? key(row) : row[key]), 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const clean = value => Math.abs(value) < 1e-8 ? 0 : value;
  const ratio = (a, b) => b > 0 ? a / b : null;
  const dates = (from, to) => Array.from({length: between(from, to)}, (_, index) => shift(from, index));
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('Model overrides must be an object.');
  const sourceWeekdayFactors = [...snapshot.policy.weekdayFactors];
  const requestedWeekdayFactors = overrides.weekdayFactors === undefined ? sourceWeekdayFactors : overrides.weekdayFactors;
  if (!Array.isArray(requestedWeekdayFactors) || requestedWeekdayFactors.length !== 7
      || requestedWeekdayFactors.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      || !Number.isFinite(requestedWeekdayFactors.reduce((a, b) => a + b, 0))
      || requestedWeekdayFactors.reduce((a, b) => a + b, 0) <= 0) {
    throw new Error('weekdayFactors must contain seven finite non-negative numbers (Monday–Sunday), with at least one positive value.');
  }
  const effectiveWeekdayFactors = Object.freeze([...requestedWeekdayFactors]);
  const hasWeekdayOverrides = effectiveWeekdayFactors.some((value, index) => value !== sourceWeekdayFactors[index]);
  const promotionUnits=overrides.promotionUnits??null;
  if(promotionUnits!==null&&(!Array.isArray(promotionUnits)||promotionUnits.length!==7||promotionUnits.some(v=>!Number.isSafeInteger(v)||v<0||v>1000000)))throw new Error('promotionUnits requires seven non-negative integer daily demand quantities.');
  const overrideFingerprint = `weekday:${effectiveWeekdayFactors.join(',')}`+(promotionUnits?`:promotion:${promotionUnits.join(',')}`:'');
  const runtimeFingerprint = `${snapshot.meta.contentHash}:ordo-option-ledger-4:${overrideFingerprint}`;
  // A local policy copy keeps runtime MD assumptions separate from source evidence.
  const policy = {...snapshot.policy, weekdayFactors: effectiveWeekdayFactors};
  const asOf = snapshot.meta.asOf, from = shift(asOf, 1), seasonEnd = policy.seasonEnd;
  const fullDates = dates(from, seasonEnd);
  const products = new Map(snapshot.products.map(product => [product.code, product]));
  const observedCache = new Map(), scenarioCache = new Map(), analysisCache = new Map(), portfolioCache = new Map();
  let backtestCache = null, monitorCache = null;
  const cases = [
    {id: 'conservative', name: '보수적 방어', multiplier: 0.7, coverage: 7},
    {id: 'balanced', name: '균형 운영', multiplier: 1, coverage: 14},
    {id: 'aggressive', name: '수요 확대 대응', multiplier: 1.3, coverage: 21},
  ];
  const caseById = new Map(cases.map(item => [item.id, item]));
  const factor = date => policy.weekdayFactors[(new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7];
  function baseDemandFactor(product, obs, date, cutoff = asOf) {
    const curve = snapshot.brandProfile?.seasonality?.[product.brandFamily] || {};
    const baseMonth = Number(cutoff.slice(5, 7)), nextMonth = Number(date.slice(5, 7));
    const base = curve[baseMonth] || curve[9] || 1;
    const seasonal = (curve[nextMonth] || curve[9] || 1) / base;
    const trend = obs.trendRatio === null ? 1 : clamp(obs.trendRatio, 0.85, 1.15);
    const progress = clamp((Date.parse(date) - Date.parse(cutoff)) / DAY / 28, 0, 1);
    return factor(date) * seasonal * (1 + (trend - 1) * progress);
  }
  const promotionDenominators=new Map();
  function demandFactor(product,obs,date,cutoff=asOf) {
    const normal=baseDemandFactor(product,obs,date,cutoff);
    if(!promotionUnits||cutoff!==asOf||date<from||date>shift(from,6))return normal;
    if(!promotionDenominators.has(date)){
      const total=snapshot.products.reduce((n,p)=>{const o=observed(p.code);return n+o.options.filter(r=>r.option.launchDate<=date).reduce((s,r)=>s+r.dailyRate,0)*baseDemandFactor(p,o,date);},0);
      promotionDenominators.set(date,total);
    }
    const denominator=promotionDenominators.get(date),weekday=(new Date(date+'T00:00:00Z').getUTCDay()+6)%7;
    return denominator>0?normal*promotionUnits[weekday]/denominator:0;
  }
  const horizonDays = horizon => {
    if (String(horizon).toUpperCase() === 'ALL') return fullDates.length;
    const days = Number(String(horizon).replace(/^D\+/i, ''));
    if (![3, 7, 14, 21].includes(days)) throw new Error('Supported horizons: D+3 / D+7 / D+14 / D+21 / ALL');
    return Math.min(days, fullDates.length);
  };
  const getProduct = code => {
    const product = products.get(code);
    if (!product) throw new Error(`Unknown product: ${code}`);
    return product;
  };
  const f = value => Math.round(value).toLocaleString('ko-KR');

  function observed(code, cutoff = asOf) {
    const cacheKey = `${code}:${cutoff}`;
    if (observedCache.has(cacheKey)) return observedCache.get(cacheKey);
    const product = getProduct(code), start = snapshot.meta.windowStart;
    const lastStart = shift(cutoff, -6), priorStart = shift(cutoff, -13), olderStart = shift(cutoff, -27);
    const historyMap = new Map(dates(start, cutoff).map(date => [date, {date, units: 0, revenue: 0}]));
    const totalInitial = sum(product.options, 'initialQty');
    const optionInputs = product.options.map(option => {
      const ready = [option.launchDate, option.receiptDate, start].sort().at(-1);
      const history = option.history.filter(row => row.date <= cutoff);
      for (const row of history) {
        if (!historyMap.has(row.date)) continue;
        const day = historyMap.get(row.date); day.units += row.units; day.revenue += row.revenue;
      }
      const exposure = (lo, hi) => sum(dates([ready, lo].sort().at(-1), hi), factor);
      const recent = history.filter(row => row.date >= lastStart);
      const prior = history.filter(row => row.date >= priorStart && row.date < lastStart);
      const older = history.filter(row => row.date >= olderStart && row.date < lastStart);
      const exposure7 = exposure(lastStart, cutoff), exposure21 = exposure(olderStart, shift(lastStart, -1));
      const units7 = sum(recent, 'units'), units21 = sum(older, 'units');
      const rate7 = exposure7 > 0 ? units7 / exposure7 : 0;
      const rate21 = exposure21 > 0 ? units21 / exposure21 : 0;
      const rawRate = exposure21 > 0 && exposure7 > 0 ? rate7 * 0.65 + rate21 * 0.35 : (exposure7 ? rate7 : rate21);
      return {option, history, ready, units7, units21, prior7: sum(prior, 'units'), exposure7, exposure21,
        rawRate, initialShare: totalInitial ? option.initialQty / totalInitial : 1 / product.options.length};
    });
    const history = [...historyMap.values()];
    const eligibleFrom = optionInputs.map(row => row.ready).sort()[0];
    const styleExposure7 = sum(dates([lastStart, eligibleFrom].sort().at(-1), cutoff), factor);
    const styleExposure21 = sum(dates([olderStart, eligibleFrom].sort().at(-1), shift(lastStart, -1)), factor);
    const units7 = sum(optionInputs, 'units7'), units21 = sum(optionInputs, 'units21');
    const recentRate = styleExposure7 > 0 ? units7 / styleExposure7 : 0;
    const olderRate = styleExposure21 > 0 ? units21 / styleExposure21 : 0;
    const dailyRate = styleExposure7 && styleExposure21 ? recentRate * 0.65 + olderRate * 0.35 : (styleExposure7 ? recentRate : olderRate);
    const last28Rows = history.filter(row => row.date >= olderStart);
    const last28Units = sum(last28Rows, 'units'), last28Revenue = sum(last28Rows, 'revenue');
    const styleNetRatio = last28Units > 0 ? clamp(last28Revenue / last28Units / product.retailPrice, 0, 1) : 0.9;
    let optionRates = optionInputs.map(row => {
      const evidenceDays = row.exposure7 + row.exposure21;
      const evidenceWeight = evidenceDays / (evidenceDays + 7);
      const shrunk = row.rawRate * evidenceWeight + dailyRate * row.initialShare * (1 - evidenceWeight);
      const units = sum(row.history, 'units'), revenue = sum(row.history, 'revenue');
      return {...row, shrunk, evidenceWeight, netPrice: units > 0 ? revenue / units : row.option.retailPrice * styleNetRatio};
    });
    const totalShrunk = sum(optionRates, 'shrunk');
    optionRates = optionRates.map(row => ({...row, dailyRate: totalShrunk > 0 ? row.shrunk / totalShrunk * dailyRate : 0}));
    const prior7 = sum(optionInputs, 'prior7');
    const priorExposure7 = sum(dates([priorStart, eligibleFrom].sort().at(-1), shift(lastStart, -1)), factor);
    const priorRate = priorExposure7 ? prior7 / priorExposure7 : 0;
    const output = {last7Units: units7, prev7Units: prior7, last28Units,
      last7Revenue: sum(history.filter(row => row.date >= lastStart), 'revenue'),
      dailyRate, netPrice: last28Units ? last28Revenue / last28Units : product.retailPrice * 0.9,
      trendRatio: ratio(recentRate, priorRate), history, options: optionRates,
      exposureDays: between(eligibleFrom, cutoff), last28Revenue, priceAssumed: last28Units === 0};
    observedCache.set(cacheKey, output);
    return output;
  }

  function nextSlot(product) {
    const allowed = policy.decisionWeekdays[product.productionType];
    for (let offset = 0; offset < 8; offset += 1) {
      const day = shift(asOf, offset);
      if (allowed.includes((new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7)) return day;
    }
    throw new Error('No decision slot');
  }

  function allocate(total, weights) {
    if (total <= 0) return weights.map(() => 0);
    const denominator = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map(weight => total * (denominator ? weight / denominator : 1 / weights.length));
    const quantities = raw.map(Math.floor);
    let remainder = total - quantities.reduce((a, b) => a + b, 0);
    const order = raw.map((value, index) => ({index, part: value - quantities[index]}))
      .sort((a, b) => b.part - a.part || a.index - b.index);
    for (let index = 0; index < remainder; index += 1) quantities[order[index].index] += 1;
    return quantities;
  }

  function runLedger(product, obs, caseDef, quantities, arrivalDate) {
    const optionResults = obs.options.map((row, index) => ({
      id: row.option.id, color: row.option.color, size: row.option.size,
      stock: row.option.inventory, dailyRate: row.dailyRate, quantity: quantities[index], share: 0,
      forecastUnits: 0, forecastRevenue: 0, endingInventory: 0, lostUnits: 0,
      unitCost: row.option.unitCost, receivedUnits: 0,
      reason: `최근 7일 ${row.units7}개 · 관측 반영 ${Math.round(row.evidenceWeight * 100)}% / 초도 비중 사전값 ${Math.round((1 - row.evidenceWeight) * 100)}%`,
      readyDate: [row.option.receiptDate, row.option.launchDate].sort().at(-1),
      inventoryAtStart: row.option.receiptDate <= asOf && row.option.launchDate <= asOf ? row.option.inventory : 0,
    }));
    const stock = optionResults.map(row => row.inventoryAtStart);
    const daily = [];
    let cumulativeRevenue = 0;
    for (const date of fullDates) {
      let units = 0, revenue = 0, lostUnits = 0, receivedUnits = 0, cogs = 0;
      const unitByOption = [], revenueByOption = [], lossByOption = [], receiptsByOption = [];
      const dateDemandFactor = demandFactor(product, obs, date);
      for (let index = 0; index < obs.options.length; index += 1) {
        const row = obs.options[index], result = optionResults[index];
        let receipts = 0;
        if (result.readyDate === date && result.readyDate > asOf) receipts += row.option.inventory;
        if (arrivalDate === date) receipts += quantities[index];
        stock[index] += receipts;
        const demand = date >= row.option.launchDate ? row.dailyRate * dateDemandFactor * caseDef.multiplier : 0;
        const sold = Math.min(stock[index], demand), lost = Math.max(0, demand - sold);
        const sale = sold * row.netPrice;
        stock[index] = Math.max(0, stock[index] - sold);
        result.forecastUnits += sold; result.forecastRevenue += sale;
        result.lostUnits += lost; result.receivedUnits += receipts;
        units += sold; revenue += sale; lostUnits += lost; receivedUnits += receipts; cogs += sold * row.option.unitCost;
        unitByOption.push(sold); revenueByOption.push(sale); lossByOption.push(lost); receiptsByOption.push(receipts);
      }
      cumulativeRevenue += revenue;
      daily.push({date, weekday: policy.weekdayPattern?.labels[(new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7],
        weekdayFactor: factor(date), demandScale: dateDemandFactor * caseDef.multiplier,
        units, revenue, cumulativeRevenue, inventory: stock.reduce((a, b) => a + b, 0),
        lostUnits, receivedUnits, cogs, optionStock: [...stock], unitByOption, revenueByOption, lossByOption, receiptsByOption});
    }
    optionResults.forEach((row, index) => { row.endingInventory = stock[index]; });
    return {daily, options: optionResults, inventoryAtStart: sum(optionResults, 'inventoryAtStart')};
  }

  function wholeScenario(code, scenarioId, manualBaseQty) {
    const manual = manualBaseQty !== null && manualBaseQty !== undefined;
    if (manual && (!Number.isSafeInteger(Number(manualBaseQty)) || Number(manualBaseQty) < 0)) throw new Error('Manual quantity must be a non-negative safe integer.');
    const cacheKey = `${code}:${scenarioId}:${manual ? Number(manualBaseQty) : 'auto'}`;
    if (scenarioCache.has(cacheKey)) return scenarioCache.get(cacheKey);
    const product = getProduct(code), obs = observed(code), caseDef = caseById.get(scenarioId);
    if (!caseDef) throw new Error(`Unknown scenario: ${scenarioId}`);
    const moq = product.effectiveMoq || product.moq;
    const decisionDate = nextSlot(product), arrivalDate = shift(decisionDate, product.leadTime);
    const zero = product.options.map(() => 0);
    const baseline = runLedger(product, obs, caseDef, zero, arrivalDate);
    const coverageEnd = [shift(arrivalDate, caseDef.coverage - 1), seasonEnd].sort()[0];
    // Lost sales before delivery cannot be fulfilled retroactively. Size the PO
    // only against option shortages that this delivery can actually recover.
    const postArrival = baseline.daily.filter(day => day.date >= arrivalDate);
    const coverageDays = postArrival.filter(day => day.date <= coverageEnd);
    const deficits = obs.options.map((_, index) => sum(coverageDays, day => day.lossByOption[index]));
    const seasonLost = sum(postArrival, day => sum(day.lossByOption, value => value));
    const tier = product.coreSellThrough <= 0.3 ? 0 : product.coreSellThrough >= 0.55 ? 2 : product.coreSellThrough >= 0.45 ? 1.5 : 1;
    const rawNeed = Math.min(sum(deficits, value => value) * tier, seasonLost);
    let quantity = manual ? Number(manualBaseQty) : Math.ceil(rawNeed / moq) * moq;
    const requestedQuantity = quantity;
    const blockers = [], risks = [], reasons = [];
    if (manual && quantity > 0 && quantity % moq !== 0) blockers.push(`입력 수량 ${f(quantity)}개는 스타일 MOQ ${f(moq)}개의 배수가 아닙니다. 수량은 그대로 비교하되 승인은 차단합니다.`);
    if (product.blocked) blockers.push('원자재 문제로 공급사가 리오더를 중단했습니다.');
    if (product.cycle > (policy.cycleCaps[product.productionType] || product.maxCycles)) blockers.push('설정된 시즌 리오더 회차 상한을 초과했습니다.');
    if (arrivalDate > seasonEnd) blockers.push('예상 입고가 FW 보고 시즌 종료일 이후입니다.');
    if (tier === 0) blockers.push('주요 아소트 누적 판매율이 30% 이하이므로 추가 발주를 보류합니다.');
    const budget = Math.min(policy.budgetByMethod[product.productionType]?.availableBudget || 0, policy.availableBudget ?? Infinity);
    if (quantity * product.unitCost > budget + 0.01) blockers.push('초도 집행액을 차감한 생산방식별 가용 예산을 초과합니다.');
    if (!manual && quantity > seasonLost + moq * 0.25 && quantity > 0) {
      reasons.push(`예상 부족 ${seasonLost.toFixed(1)}개보다 MOQ ${moq}개의 과잉 발주 위험이 큽니다.`); quantity = 0;
    }
    // A blocked manual scenario is a counterfactual, not an executable proposal.
    // Keep the exact requested quantity in the ledger; approval remains forbidden.
    if (blockers.length && !manual) quantity = 0;
    let weights = deficits;
    if (sum(weights, value => value) === 0) weights = obs.options.map(row => row.dailyRate);
    if (sum(weights, value => value) === 0) weights = obs.options.map(row => row.initialShare);
    let allocation = allocate(quantity, weights);
    let ledger = quantity > 0 ? runLedger(product, obs, caseDef, allocation, arrivalDate) : baseline;
    let cost = quantity * product.unitCost;
    const potentialIncrement = sum(ledger.daily, 'revenue') - sum(baseline.daily, 'revenue');
    if (!manual && quantity > 0 && potentialIncrement < cost) {
      reasons.push(`추가 매출 ${f(potentialIncrement)}원이 발주 현금 ${f(cost)}원을 회수하지 못해 자동 발주를 보류합니다.`);
      quantity = 0; allocation = zero; ledger = baseline; cost = 0;
    }
    const weightSum = sum(weights, value => value);
    ledger = {...ledger, options: ledger.options.map((row, index) => ({...row,
      quantity: allocation[index], share: weightSum ? weights[index] / weightSum : 1 / weights.length,
      reason: row.reason + (deficits[index] > 0 ? ` · 입고 후 보충 필요 ${deficits[index].toFixed(1)}개` : ' · 현재 재고로 충당')}))};
    reasons.unshift(`최근 7일 ${obs.last7Units}개, 이전 7일 ${obs.prev7Units}개를 요일 보정해 일 기준 ${obs.dailyRate.toFixed(2)}개로 추정했습니다.`);
    reasons.push(`수요 ${Math.round(caseDef.multiplier * 100)}% 민감도 · ${decisionDate} 검토 → 리드타임 ${product.leadTime}일 → ${arrivalDate} 입고.`);
    reasons.push(`추가 공급 전후를 동일 수요 조건으로 비교합니다. 초도 아소트 비중은 희소 옵션의 사전값이며 리오더는 옵션별 부족량으로 배분합니다.`);
    reasons.push(`브랜드 역할 ${product.brandRole || product.role}${product.identityProduct ? ' · 아이덴티티 상품' : ''}: 품목별 월 시즌성과 최근 상승·하락 추이를 함께 반영합니다.`);
    if (manual) reasons.push(`사용자 입력 ${f(requestedQuantity)}개를 변경 없이 옵션·입고·재고·매출 계산에 반영한 수동 비교입니다. 발주량 증가는 수요 증가를 뜻하지 않습니다.`);
    if (manual && blockers.length) risks.unshift('승인 불가 조건을 해소하고 예정일에 수동 수량이 도착한다고 가정한 비교 전용 결과입니다. 실제 발주 가능한 제안이 아닙니다.');
    if (hasWeekdayOverrides) reasons.push('MD가 편집한 요일 가중치를 관측 속도 재추정과 일별 예측에 적용했습니다. 원본 거래·기본 가중치는 변경하지 않았습니다.');
    if (!quantity && !blockers.length && !rawNeed) reasons.push('검토 기간의 재고가 예측 수요를 커버하므로 추가 발주량은 0개입니다.');
    if (obs.last28Units < 10) risks.push(`28일 관측 ${obs.last28Units}개로 상품 단위 수요 근거가 희소합니다.`);
    if (obs.priceAssumed) risks.push('유효 거래가 없어 판매단가를 정상가 90%로 가정했습니다.');
    if (product.riskType !== 'NONE') risks.push(`공급 위험 ${product.riskType}: 리드타임·MOQ·발주 가능 여부에 반영했습니다.`);
    if (product.sourceProductionType && product.sourceProductionType !== product.productionType) risks.push(`브랜드 정책으로 ${product.sourceProductionType}→${product.productionType} 재분류한 샘플입니다. 원가·공급 납기는 원본을 유지하므로 업체 조건 재확인이 필요합니다.`);
    if (manual && quantity && potentialIncrement < cost) risks.push(`스트레스 수량의 추가 매출이 발주 현금보다 작습니다. 회수 부족 ${f(cost - potentialIncrement)}원.`);
    if (sum(baseline.options, 'lostUnits') > 0) risks.push(`리오더 없을 때 시즌 누적 미충족 수요 ${sum(baseline.options, 'lostUnits').toFixed(1)}개가 예상됩니다.`);
    risks.push(snapshot.calibration ? '재고·초도 집행액은 DEV 보정 가정입니다. 원본 주문은 보존했으며 실제 재고 복원이나 적중 확률을 뜻하지 않습니다.' : '재고·기초 누적 판매는 원본 합성 스냅샷이며 관측 주문과 별도 가정입니다. 시나리오 범위는 적중 확률이 아닙니다.');
    const output = {id: caseDef.id, name: caseDef.name, quantity, cost, arrivalDate, decisionDate,
      leadTime: product.leadTime, moq, options: ledger.options, daily: ledger.daily,
      baselineDaily: baseline.daily, baselineOptions: baseline.options,
      inventoryAtStart: ledger.inventoryAtStart, reasons, risks, blockers, allowed: blockers.length === 0,
      approvalQuantity: blockers.length === 0 ? quantity : 0, simulationOnly: manual && blockers.length > 0,
      demandMultiplier: caseDef.multiplier, coverage: caseDef.coverage, manual, from, to: seasonEnd,
      days: fullDates.length, rawNeed, requestedQuantity, observed: obs};
    scenarioCache.set(cacheKey, output);
    return output;
  }

  function summarizeScenario(whole, horizon) {
    const days = horizonDays(horizon), sourceDaily = whole.daily.slice(0, days), baselineDaily = whole.baselineDaily.slice(0, days);
    const daily = sourceDaily.map((day, index) => ({date: day.date, weekday: day.weekday, weekdayFactor: day.weekdayFactor,
      demandScale: day.demandScale, revenue: day.revenue,
      cumulativeRevenue: day.cumulativeRevenue, units: day.units, inventory: day.inventory,
      lostUnits: day.lostUnits, receivedUnits: day.receivedUnits, baselineRevenue: baselineDaily[index].revenue,
      cumulativeBaselineRevenue: baselineDaily[index].cumulativeRevenue}));
    const options = whole.options.map((row, index) => ({...row,
      forecastUnits: sum(sourceDaily, day => day.unitByOption[index]),
      forecastRevenue: sum(sourceDaily, day => day.revenueByOption[index]),
      endingInventory: sourceDaily.at(-1)?.optionStock[index] ?? row.inventoryAtStart,
      lostUnits: sum(sourceDaily, day => day.lossByOption[index]),
      receivedUnits: sum(sourceDaily, day => day.receiptsByOption[index])}));
    const forecastRevenue = sum(sourceDaily, 'revenue'), forecastUnits = sum(sourceDaily, 'units');
    const baselineRevenue = sum(baselineDaily, 'revenue');
    const grossProfit = forecastRevenue - sum(sourceDaily, 'cogs');
    const baselineGrossProfit = baselineRevenue - sum(baselineDaily, 'cogs');
    return {id: whole.id, name: whole.name, quantity: whole.quantity, cost: whole.cost,
      forecastUnits, forecastRevenue, grossProfit, endingInventory: sum(options, 'endingInventory'),
      endingInventoryCost: sum(options, row => row.endingInventory * row.unitCost), lostUnits: sum(sourceDaily, 'lostUnits'),
      additionalRevenue: clean(forecastRevenue - baselineRevenue), additionalGrossProfit: clean(grossProfit - baselineGrossProfit),
      arrivalDate: whole.arrivalDate, decisionDate: whole.decisionDate, leadTime: whole.leadTime, moq: whole.moq,
      options, daily, reasons: whole.reasons, risks: whole.risks, blockers: whole.blockers, allowed: whole.allowed,
      approvalQuantity: whole.approvalQuantity, simulationOnly: whole.simulationOnly, runtimeFingerprint,
      baselineRevenue, baselineGrossProfit, inventoryAtStart: whole.inventoryAtStart, receivedUnits: sum(sourceDaily, 'receivedUnits'),
      demandMultiplier: whole.demandMultiplier, from, to: daily.at(-1)?.date || asOf, days, manual: whole.manual,
      coverage: whole.coverage, cashImpact: clean(forecastRevenue - baselineRevenue - whole.cost), rawNeed: whole.rawNeed,
      requestedQuantity: whole.requestedQuantity};
  }

  function simulate(code, scenarioId, horizon = 'ALL', manualBaseQty = null) {
    return summarizeScenario(wholeScenario(code, scenarioId, manualBaseQty), horizon);
  }

  function actionFor(product, obs, result) {
    if (result.quantity > 0 && result.allowed) return 'REORDER';
    if (product.blocked || product.coreSellThrough <= 0.3 || product.cycle > product.maxCycles) return 'HOLD';
    return 'WATCH';
  }

  function analysis(code) {
    if (analysisCache.has(code)) return analysisCache.get(code);
    const product = getProduct(code), obs = observed(code);
    const scenarios = cases.map(caseDef => simulate(code, caseDef.id));
    const balanced = scenarios[1], action = actionFor(product, obs, balanced);
    const summary = action === 'REORDER' ? `옵션별 부족을 보완하는 ${balanced.quantity}개 발주를 검토합니다.`
      : action === 'HOLD' ? '공급 제약 또는 낮은 주요 아소트 판매율로 추가 발주를 보류합니다.'
        : '현재 재고와 최근 관측 수요를 기준으로 발주 없이 추이를 확인합니다.';
    const result = {product, observed: {last7Units: obs.last7Units, prev7Units: obs.prev7Units,
      last28Units: obs.last28Units, last7Revenue: obs.last7Revenue, dailyRate: obs.dailyRate,
      netPrice: obs.netPrice, trendRatio: obs.trendRatio, history: obs.history, exposureDays: obs.exposureDays},
      recommendation: {action, scenarioId: 'balanced', quantity: balanced.quantity, summary,
        reasons: balanced.reasons, risks: [...balanced.blockers, ...balanced.risks]}, scenarios};
    analysisCache.set(code, result);
    return result;
  }

  function portfolio(horizon = 'ALL', scenarioId = 'balanced') {
    if (!caseById.has(scenarioId)) throw new Error(`Unknown scenario ${scenarioId}`);
    let full = portfolioCache.get(scenarioId);
    if (!full) {
      const remaining = Object.fromEntries(Object.entries(policy.budgetByMethod).map(([method, budget]) => [method, budget.availableBudget]));
      const ordered = [...products.values()].sort((a, b) => b.coreSellThrough * (b.brandPriority || 1)
        - a.coreSellThrough * (a.brandPriority || 1) || a.code.localeCompare(b.code));
      const totals = fullDates.map(date => ({date, weekday: policy.weekdayPattern?.labels[(new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7],
        weekdayFactor: factor(date), revenue: 0, cumulativeRevenue: 0, units: 0, inventory: 0,
        lostUnits: 0, baselineRevenue: 0, cumulativeBaselineRevenue: 0, receivedUnits: 0, cogs: 0, baselineCogs: 0, inventoryCost: 0}));
      const reviewedRecommendations = [], counts = {REORDER: 0, WATCH: 0, HOLD: 0};
      let purchaseCost = 0, globalRemaining = policy.availableBudget ?? Infinity;
      for (const product of ordered) {
        let result = wholeScenario(product.code, scenarioId, null);
        const aggregateBudgetBlocked = result.cost > Math.min(remaining[product.productionType], globalRemaining) + 0.01;
        if (aggregateBudgetBlocked) result = wholeScenario(product.code, scenarioId, 0);
        remaining[product.productionType] -= result.cost; purchaseCost += result.cost; globalRemaining -= result.cost;
        const action = actionFor(product, result.observed, result);
        counts[action] += 1;
        reviewedRecommendations.push({code: product.code, action, quantity: result.quantity, scenarioId,
          cost: result.cost, budgetBlocked: aggregateBudgetBlocked});
        result.daily.forEach((day, index) => {
          const target = totals[index], baseline = result.baselineDaily[index];
          target.revenue += day.revenue; target.cumulativeRevenue += day.cumulativeRevenue;
          target.units += day.units; target.inventory += day.inventory; target.lostUnits += day.lostUnits;
          target.baselineRevenue += baseline.revenue; target.cumulativeBaselineRevenue += baseline.cumulativeRevenue;
          target.receivedUnits += day.receivedUnits; target.cogs += day.cogs; target.baselineCogs += baseline.cogs;
          // Every option in this source style shares the same unit cost.
          target.inventoryCost += day.inventory * product.unitCost;
        });
      }
      full = {daily: totals, counts, reviewedRecommendations, purchaseCost, remaining, globalRemaining};
      portfolioCache.set(scenarioId, full);
    }
    const days = horizonDays(horizon), rows = full.daily.slice(0, days);
    const forecastRevenue = sum(rows, 'revenue'), baselineRevenue = sum(rows, 'baselineRevenue');
    const grossProfit = forecastRevenue - sum(rows, 'cogs'), baselineGrossProfit = baselineRevenue - sum(rows, 'baselineCogs');
    return {horizon, scenarioId, days, from, to: rows.at(-1)?.date || asOf, forecastRevenue,
      forecastUnits: sum(rows, 'units'), grossProfit, endingInventory: rows.at(-1)?.inventory || 0,
      endingInventoryCost: rows.at(-1)?.inventoryCost || 0, lostUnits: sum(rows, 'lostUnits'),
      purchaseCost: full.purchaseCost, additionalRevenue: clean(forecastRevenue - baselineRevenue),
      additionalGrossProfit: clean(grossProfit - baselineGrossProfit), baselineRevenue,
      daily: rows, counts: full.counts, reviewedRecommendations: full.reviewedRecommendations, runtimeFingerprint,
      budgetRemainingByMethod: full.remaining,
      availableBudgetRemaining: full.globalRemaining,
      risks: [`${snapshot.meta.quarantinedRows}건의 출시·입고 전 주문을 제외한 ${snapshot.meta.acceptedRows}건이 관측 근거입니다.`,
        `기존 ${snapshot.products.filter(row => row.decision === 'REORDER').length}건 제안과 재검토 결과 ${full.counts.REORDER}건을 구분합니다.`,
        '수요 민감도는 확률이 아니며, 전체 시즌 예측은 짧은 관측 구간을 연장한 시뮬레이션입니다.',
        '매출총이익은 판매 원가만 차감하며, 판관비·세금·폐기비를 차감한 영업이익이 아닙니다.']};
  }

  function backtest() {
    if (backtestCache) return backtestCache;
    const folds = [];
    for (const horizon of [3, 7, 14]) {
      for (const offset of [0, 7]) {
        const to = shift(asOf, -offset), trainThrough = shift(to, -horizon), start = shift(trainThrough, 1);
        if (between(snapshot.meta.windowStart, trainThrough) < 7) continue;
        let predictedUnits = 0, actualUnits = 0, absoluteError = 0, baselinePredictedUnits = 0, baselineAbsoluteError = 0;
        const outputDays = dates(start, to);
        const predicted = outputDays.map(() => 0), actual = outputDays.map(() => 0), baseline = outputDays.map(() => 0);
        for (const product of products.values()) {
          const train = observed(product.code, trainThrough);
          outputDays.forEach((date, index) => { predicted[index] += train.dailyRate * demandFactor(product, train, date, trainThrough); });
          outputDays.forEach((date, index) => { baseline[index] += train.last7Units / 7; });
          for (const option of product.options) for (const row of option.history) {
            const index = outputDays.indexOf(row.date);
            if (index >= 0) actual[index] += row.units;
          }
        }
        predicted.forEach((value, index) => {
          predictedUnits += value; actualUnits += actual[index]; absoluteError += Math.abs(value - actual[index]);
          baselinePredictedUnits += baseline[index]; baselineAbsoluteError += Math.abs(baseline[index] - actual[index]);
        });
        folds.push({horizon, trainingStart: snapshot.meta.windowStart, trainThrough, from: start, to,
          trainingDays: between(snapshot.meta.windowStart, trainThrough), actualUnits, predictedUnits, absoluteError,
          wape: ratio(absoluteError, actualUnits), bias: ratio(predictedUnits - actualUnits, actualUnits),
          baselinePredictedUnits, baselineAbsoluteError, baselineWape: ratio(baselineAbsoluteError, actualUnits),
          baselineMae: baselineAbsoluteError / horizon,
          daily: outputDays.map((date, index) => ({date, actualUnits: actual[index], predictedUnits: predicted[index], baselineUnits: baseline[index]}))});
      }
    }
    const metrics = [3, 7, 14].map(horizon => {
      const selected = folds.filter(fold => fold.horizon === horizon);
      const actualUnits = sum(selected, 'actualUnits'), predictedUnits = sum(selected, 'predictedUnits');
      const absoluteError = sum(selected, 'absoluteError');
      const baselinePredictedUnits = sum(selected, 'baselinePredictedUnits'), baselineAbsoluteError = sum(selected, 'baselineAbsoluteError');
      return {horizon, folds: selected.length, actualUnits, predictedUnits, absoluteError,
        wape: ratio(absoluteError, actualUnits), bias: ratio(predictedUnits - actualUnits, actualUnits),
        mae: selected.length ? absoluteError / (selected.length * horizon) : null, accuracy: null,
        baselinePredictedUnits, baselineAbsoluteError, baselineWape: ratio(baselineAbsoluteError, actualUnits),
        baselineMae: selected.length ? baselineAbsoluteError / (selected.length * horizon) : null};
    });
    backtestCache = {asOf, runtimeFingerprint, method: 'rolling-origin / weekday + trend + declared seasonality / brand-demand-only',
      baselineMethod: '훈련 종료일까지의 최근 7일 단순 평균 판매량', metrics, folds,
      evaluationScope: {unit: '브랜드 일별 관측 판매수량',
        included: ['요일 보정', '훈련 시점의 최근 상승·하락 추이', '명시적 시즌 가중치 계산 경로'],
        notValidated: ['옵션별 아소트 배분 정확도', '과거 입고·재고 원장', 'MOQ·예산을 반영한 발주 적중률', '증분 매출·이익의 실현', '미관측 10~2월 시즌 가중치']},
      limitations: ['훈련 종료 다음 날부터 실제 확보된 주문만 평가합니다. 기준일 이후 결과는 미관측입니다.',
        '28일 합성 주문의 브랜드 단위 판매수량 오차이며, 상품별 리오더 적중률이나 실제 브랜드 정확도가 아닙니다.',
        '과거 옵션 재고 이력이 없어 과거 품절로 잃은 수요는 평가하지 못합니다.',
        '수요 추정 단계만 평가합니다. 옵션 아소트·입고·MOQ·예산·추가 발주 효과·손익의 전체 과정이 검증됐다는 뜻은 아닙니다.',
        '보유 실적은 8~9월뿐입니다. 겨울 및 시즌 말 가중치는 명시적 가정이며 이번 백테스트로 보정된 계수가 아닙니다.']};
    return backtestCache;
  }

  function monitor() {
    if (monitorCache) return monitorCache;
    const output = [];
    function alert(id, severity, code, title, evidence, action, productCodes = [], reasons = []) {
      output.push({id, severity, code, title, evidence, action, productCodes, reasons});
    }
    alert('source-quarantine', 'high', 'SOURCE_QUARANTINE', '출시·입고 전 주문 격리',
      `${snapshot.meta.quarantinedRows}건을 예측 입력에서 제외했습니다.`, '원본 주문일과 옵션 입고일을 대조하세요.', [], snapshot.meta.warnings.slice(0, 2));
    alert('source-opening', 'high', 'OPENING_BALANCE', '기초 누적 판매는 거래 이력이 없습니다',
      `기초 판매 ${f(snapshot.meta.openingUnits)}개는 일별 학습에서 제외했습니다.`, '기초 잔액과 거래 이력을 보강하세요.');
    if (snapshot.targets.initialCost > snapshot.targets.initialBudget) alert('initial-budget', 'high', 'INITIAL_BUDGET_OVERRUN',
      '초도 발주가 계획을 초과합니다', `초도 원가 ${f(snapshot.targets.initialCost)}원 / 초도 계획 ${f(snapshot.targets.initialBudget)}원`,
      '초도 집행을 차감한 방식별 잔여 예산으로 시나리오를 비교하세요.');
    for (const [method, budget] of Object.entries(policy.budgetByMethod)) {
      if (budget.initialCost > budget.productBudget) alert(`method-budget-${method}`, 'high', 'METHOD_BUDGET_OVERRUN',
        `${method === 'MANUFACTURING' ? '제조' : '사입'} 시즌 전체 예산 초과`,
        `브랜드 적용 초도 원가 ${f(budget.initialCost)}원 / 방식별 전체 예산 ${f(budget.productBudget)}원`,
        '해당 방식의 추가 발주를 차단하고 예산 배분을 검토하세요.', snapshot.products.filter(product => product.productionType === method).map(product => product.code));
    }
    const blocked = snapshot.products.filter(product => product.blocked).map(product => product.code);
    if (blocked.length) alert('supplier-block', 'high', 'SUPPLIER_BLOCK', '공급 중단 품목', `${blocked.length}개 스타일에 원자재 발주 차단이 있습니다.`,
      '대체 공급·판매 계획을 검토하세요.', blocked);
    const deferred = snapshot.products.filter(product => product.options.some(option => option.receiptDate > asOf));
    if (deferred.length) alert('pending-initial-receipt', 'medium', 'PENDING_RECEIPT', '아직 도착하지 않은 재고',
      `${deferred.length}개 스타일의 일부 재고는 기준일 이후 입고 예정입니다.`, '입고일부터 판매 가능 재고로 반영합니다.', deferred.map(product => product.code));
    const current = portfolio('ALL');
    const legacy = snapshot.products.filter(product => product.decision === 'REORDER');
    const changed = legacy.filter(product => !current.reviewedRecommendations.some(row => row.code === product.code && row.action === 'REORDER'));
    if (changed.length) alert('revalidated-proposals', 'high', 'PROPOSAL_REVALIDATION', '기존 리오더 제안 재검토',
      `기존 ${legacy.length}개 중 ${changed.length}개는 현재 관측 수요·재고·MOQ 기준으로 유지되지 않습니다.`,
      '상품별 근거와 3가지 수요 시나리오를 확인하세요.', changed.map(product => product.code));
    alert('short-observation', 'medium', 'SHORT_HISTORY', '장기 시즌 예측의 관측 구간이 짧습니다',
      `${snapshot.daily.length}일 주문으로 ${fullDates.length}일을 시뮬레이션합니다.`, '미래 실적이 들어오면 동일 모델로 다시 계산하세요.');
    monitorCache = output;
    return output;
  }

  return {product: code => products.get(code) || null, analysis, simulate, portfolio, backtest, monitor,
    meta: {asOf, seasonEnd, modelVersion: 'ordo-option-ledger-4-post-arrival', contentHash: snapshot.meta.contentHash,
      effectiveWeekdayFactors: [...effectiveWeekdayFactors], sourceWeekdayFactors, hasWeekdayOverrides,
      promotionUnits:promotionUnits?[...promotionUnits]:null,promotionFrom:promotionUnits?from:null,promotionTo:promotionUnits?shift(from,6):null,
      overrideFingerprint, runtimeFingerprint, weekdaySource: hasWeekdayOverrides ? 'MD_RUNTIME_OVERRIDE' : 'SOURCE_CONFIG'},
    scenarios: cases.map(row => ({id: row.id, name: row.name, demandMultiplier: row.multiplier}))};
});
