/* Shared, source-traceable workbench state, navigation, monitoring and MD ledger. */
(function () {
  'use strict';
  const BUILD = 'ORDO ANALYST 2.0';
  const modelVersion = () => model.meta.modelVersion;
  const KEY = 'ordo-workbench-ledger-v2';
  const modes = ['REORDER', 'WATCH', 'HOLD'];
  const ids = ['conservative', 'balanced', 'aggressive'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (n, digits = 0) => Number(n || 0).toLocaleString('ko-KR', {maximumFractionDigits: digits});
  const won = n => '₩' + num(n);
  const shortWon = n => Math.abs(n) >= 1e8 ? '₩' + num(n / 1e8, 2) + '억' : won(n);
  let snapshot = window.OrdoSnapshot;
  let model = window.OrdoModel;
  let hooks = null;
  let bound = null;
  let refreshBusy = false;
  let storageFailure = '';
  let policyFailure = '';
  const emptyLedger = () => ({decisions: [], alertReviews: {}, runs: [], lastRun: null});
  let ledger;
  try {
    const raw = localStorage.getItem(KEY);
    ledger = raw ? JSON.parse(raw) : emptyLedger();
    if (!Array.isArray(ledger.decisions) || !Array.isArray(ledger.runs) || !ledger.alertReviews) throw new Error('Invalid ledger');
  } catch (_) { ledger = emptyLedger(); storageFailure = '이 브라우저의 이력 저장소를 읽지 못했습니다. 기존 저장값은 덮어쓰지 않으며 이번 작업은 메모리에만 기록합니다.'; }
  if (ledger.weekdayFactors) {
    try { model = window.createOrdoModel(snapshot,{weekdayFactors:ledger.weekdayFactors}); window.OrdoModel=model; }
    catch (_) { policyFailure='저장된 요일 가중치가 유효하지 않아 소스 기본값을 사용합니다. 가중치 수정에서 적용 또는 복원하면 설정을 복구합니다.'; }
  }
  const state = {horizon:'D+14', decision:'REORDER', decisionScope:'current', code:snapshot.products.find(p => p.decision === 'REORDER')?.code || snapshot.products[0].code, scenario:'balanced', query:'', method:'ALL', category:'ALL', reportTab:'summary', reportScope:'source', reportView:'aggregate', manualBaseQty:null, guidelineTab:'applied', selectedCodes:[], quantityDrafts:{}, decisionPreview:null};
  let reviewedModel=null, reviewedMap=null;
  function currentRecommendations() {
    if (reviewedModel!==model) { reviewedMap=new Map(model.portfolio('ALL','balanced').reviewedRecommendations.map(r=>[r.code,r])); reviewedModel=model; }
    return reviewedMap;
  }
  function decisionFor(product,scope=state.decisionScope) { return scope==='source'?product.decision:currentRecommendations().get(product.code).action; }
  function alignSelection() {
    const first=filtered()[0];
    if (first && !filtered().some(p=>p.code===state.code)) selectCode(first.code);
  }

  function save() {
    if (storageFailure) return;
    try { localStorage.setItem(KEY, JSON.stringify(ledger)); }
    catch (_) { storageFailure = '브라우저 저장 공간을 사용할 수 없어 현재 세션에만 기록합니다. 보고서를 내려받아 보관하세요.'; }
  }
  function counts(rows = snapshot.products) {
    return Object.fromEntries(modes.map(mode => [mode, rows.filter(p => p.decision === mode).length]));
  }
  function routeState() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    if (['source','current'].includes(params.get('scope'))) state.decisionScope=params.get('scope');
    if (params.has('sku') && model.product(params.get('sku'))) {
      selectCode(params.get('sku'));
    }
    if (['D+3','D+7','D+14','D+21','ALL'].includes(params.get('horizon'))) state.horizon = params.get('horizon');
    if (ids.includes(params.get('scenario'))) state.scenario = params.get('scenario');
    if (modes.includes(params.get('status'))) state.decision = params.get('status');
    if (['summary','evaluation','history'].includes(params.get('report'))) state.reportTab = params.get('report');
    if (['source','current'].includes(params.get('reportScope'))) state.reportScope=params.get('reportScope');
    if (['aggregate','product'].includes(params.get('view'))) state.reportView=params.get('view');
  }
  function routeHash(route) {
    if (route === 'entry' || route === 'today') return route;
    const params = new URLSearchParams();
    if (route === 'overview') params.set('horizon', state.horizon);
    else { params.set('sku', state.code); params.set('scenario', state.scenario); }
    if (route === 'decisions') {params.set('status', state.decision);params.set('scope',state.decisionScope);}
    if (route === 'reports') {params.set('report', state.reportTab);params.set('reportScope',state.reportScope);params.set('view',state.reportView);}
    return route + '?' + params;
  }
  function rememberRoute() {
    const route = document.body.dataset.view;
    history.replaceState(null, '', '#' + routeHash(route));
  }
  function selectCode(code) {
    const product = model.product(code);
    if (!product) return;
    if (state.code !== code) { state.manualBaseQty = state.quantityDrafts[code]?.manualBaseQty ?? null; state.scenario = state.quantityDrafts[code]?.scenarioId || 'balanced'; }
    state.code = code; state.decision = decisionFor(product);
  }
  function title(eyebrow, heading, description, controls = '') {
    return `<div class="page-head"><div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${heading}</h1></div><div class="page-context">${controls}<p>${description}</p></div></div>`;
  }
  function notice() {
    return '';
  }
  function list(items) { return `<ul class="wb-prose-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`; }
  function metric(label, value, detail, key) {
    return `<article class="wb-metric"><span>${label}</span><strong${key ? ` data-wb-metric="${key}"` : ''}>${value}</strong><small>${detail}</small></article>`;
  }
  function forecastChart(portfolio,chartModel=model) {
    const history = snapshot.daily.slice(-7).map(row=>({...row,actual:true}));
    const full=chartModel.portfolio('ALL','balanced'), first=full.daily.find(d=>Math.abs(d.revenue-d.baselineRevenue)>.01);
    const explanation=first&&first.date>portfolio.to?`<div class="wb-warning"><b>이 기간에는 추가 발주의 매출 효과가 아직 없습니다.</b><p>현재 자동 제안의 첫 매출 차이는 ${first.date}부터입니다. 입고만으로 매출이 늘지 않고, 기존 재고로 충족하지 못하는 수요를 추가 재고로 판매할 때 차이가 발생합니다. 전체 시즌 추가 매출 추정 ${won(full.additionalRevenue)}.</p></div>`:'';
    return explanation+`<div class="wb-horizon-chart" data-wb-chart-horizon="${esc(state.horizon)}" aria-live="polite">`+window.OrdoCharts.render([...history,...portfolio.daily],{id:'overview-'+state.horizon,context:[chartModel.meta.runtimeFingerprint,state.horizon,portfolio.to].join(':'),fullPeriod:false,title:`${state.horizon} · 관측에서 미래까지 · 일별 매출`,expected:true,baseline:true,observedThrough:snapshot.meta.asOf})+'</div>';
  }
  function overview() {
    const baseline=model.portfolio(state.horizon,'balanced'), chartModel=overviewModel(), p=chartModel.portfolio(state.horizon,'balanced');
    const change=(key,unit='')=>state.promotionUnits?`기본 ${num(baseline[key],1)}${unit} → ${num(p[key],1)}${unit} / 차이 ${p[key]-baseline[key]>=0?'+':''}${num(p[key]-baseline[key],1)}${unit}`:'';
    const archive = counts();
    const targets = snapshot.targets;
    const controls = `<div class="periods" aria-label="미래 예측 기간">${['D+3','D+7','D+14','D+21','ALL'].map(h => `<button data-wb-horizon="${h}" class="${h===state.horizon?'active':''}" aria-pressed="${h===state.horizon}">${h}</button>`).join('')}</div>`;
    return `<section class="page wb-page">${title('BRAND HEALTH / FORECAST','과거의 근거로,<br>다음 결정을 예측합니다.', 'D+는 기준일 이후 예측 · ALL은 2027-02-28까지', controls)}${notice()}${dailyGuidelines()}<div class="wb-metrics">${metric('기간 예측 순매출',shortWon(p.forecastRevenue),`${p.from}–${p.to} · ${p.days}일 ${change('forecastRevenue','원')}`,'revenue')}${metric('예측 판매 수량',num(p.forecastUnits,1)+'개',change('forecastUnits','개')||'관측 주문이 아닌 기대 판매량','units')}${metric('기간말 잔여 재고',num(p.endingInventory,1)+'개',change('endingInventory','개')||'현재 재고 + 입고 − 예측 판매','inventory')}${metric('옵션 결품 손실',num(p.lostUnits,1)+'개',change('lostUnits','개')||'대체 구매를 가정하지 않은 미충족 수요','lost')}</div><div class="wb-overview-layout"><article class="wb-panel"><div class="section-title"><h2>DAILY REVENUE / 일별 판매 추이</h2><span data-wb-date-range>${esc(p.from)} → ${esc(p.to)}</span></div>${forecastChart(p,chartModel)}<p class="wb-muted">선택 기간의 예측만 KPI에 집계합니다. 누적값이 아닌 하루 매출을 표시해 상승·하락을 드러냅니다. 직전 7일 관측과 미래 예측을 구분합니다. 보정 후 발주량이 0이면 기준선과 예측선이 겹치는 것이 정상입니다.</p><details><summary>날짜별 예측과 기준선 대조</summary><div class="wb-table-scroll"><table class="wb-table"><thead><tr><th>날짜</th><th>예측 매출</th><th>무발주 매출</th><th>판매</th><th>재고</th><th>결품 손실</th></tr></thead><tbody>${p.daily.map(d=>`<tr><td>${d.date}<small class="wb-date-factor">${esc(d.weekday)} · ×${Number(d.weekdayFactor).toFixed(2)}</small></td><td>${won(d.revenue)}</td><td>${won(d.baselineRevenue)}</td><td>${num(d.units,1)}</td><td>${num(d.inventory,1)}</td><td>${num(d.lostUnits,1)}</td></tr>`).join('')}</tbody></table></div></details></article><aside class="wb-panel wb-analyst"><div class="eyebrow">ANALYST BRIEF</div><h2>매출보다 먼저,<br>발주 근거를 확인하세요.</h2><dl class="wb-facts"><div><dt>추정 매출총이익</dt><dd>${shortWon(p.grossProfit)}</dd></div><div><dt>추가 매출 효과</dt><dd>${shortWon(p.additionalRevenue)}</dd></div><div><dt>시즌 제안 발주 현금</dt><dd>${shortWon(p.purchaseCost)}</dd></div><div><dt>잔여 재고 원가</dt><dd>${shortWon(p.endingInventoryCost)}</dd></div><div><dt>관측 주문 전체 매출</dt><dd>${shortWon(snapshot.meta.acceptedRevenue)}</dd></div></dl><p class="wb-muted">연간 목표 ${shortWon(targets.annual)} / FW 목표 ${shortWon(targets.fw)}는 계획값입니다. 관측창 이전 기초 매출을 날짜별 실적으로 분배하거나 목표 달성률을 만들어내지 않습니다.</p>${list(p.risks.slice(0,4).map((risk,i)=>i===0?`관측 근거: 검증 주문 ${num(snapshot.meta.acceptedRows)}건`:risk))}<button class="btn orange-btn" data-wb-open="reports">근거·예측 평가 보고서 →</button>${window.OrdoFx?.render()||''}</aside></div><div class="wb-panel wb-current-review"><div class="section-title"><h2>전체 상품 · 현재 재평가</h2></div><div class="wb-count-grid">${modes.map(mode=>`<button data-wb-scope="current" data-wb-status="${mode}"><span>현재 ${mode}</span><strong>${baseline.counts[mode]}개</strong><small>제조 ${snapshot.products.filter(x=>decisionFor(x,'current')===mode&&x.productionType==='MANUFACTURING').length} / 사입 ${snapshot.products.filter(x=>decisionFor(x,'current')===mode&&x.productionType==='BUYING').length} · 적용 브랜드 분류 / 전체 보기 ↗</small></button>`).join('')}</div><p class="wb-muted">원본 아카이브 REORDER ${archive.REORDER} / WATCH ${archive.WATCH} / HOLD ${archive.HOLD}개는 Decisions의 원본 아카이브 탭에서 별도로 모두 확인할 수 있습니다.</p></div></section>`;
  }
  function overviewModel() {
    if(!state.promotionUnits)return model;
    if(state.promotionSource!==model){state.promotionModel=window.createOrdoModel(snapshot,{weekdayFactors:model.meta.effectiveWeekdayFactors,promotionUnits:state.promotionUnits});state.promotionSource=model;}
    return state.promotionModel;
  }
  function applyPromotion(reset=false) {
    const values=reset?null:[...document.querySelectorAll('[data-wb-promotion]')].map(el=>el.value.trim()===''?NaN:Number(el.value));
    if(values&&(values.length!==7||values.some(v=>!Number.isSafeInteger(v)||v<0||v>1000000))){announce('요일별 판매 수요를 0~1,000,000개 정수로 입력하세요.');return;}
    state.promotionUnits=values;state.promotionSource=null;state.guidelineTab=reset?'applied':'edit';overviewModel().portfolio(state.horizon);redraw();
    announce(reset?'기본 현황으로 복원했습니다.':'다음 7일 판매 수요를 적용했습니다. 재고 한도에 따른 매출·판매·기말재고·결품 손실을 비교하세요.');
  }
  function dailyGuidelines() {
    const labels=['월','화','수','목','금','토','일'], profile=window.OrdoWeeklySales.profile(snapshot,model.meta.effectiveWeekdayFactors);
    const next=model.portfolio('D+7').daily, draft=state.promotionUnits||labels.map((_,i)=>Math.round(next.find(d=>((new Date(d.date+'T00:00:00Z').getUTCDay()+6)%7)===i)?.units||0));
    const total=draft.reduce((a,b)=>a+b,0);
    const todayIndex=(new Date(Date.now()+9*3600000).getUTCDay()+6)%7;
    return `<section class="wb-panel wb-daily-guidelines"><div class="section-title"><h2>주간 판매 비중과 시뮬</h2><div class="segments"><button data-wb-guideline="applied" class="${state.guidelineTab==='applied'?'active':''}">현재 현황</button><button data-wb-guideline="edit" class="${state.guidelineTab==='edit'?'active':''}">수동 시뮬</button></div></div>${window.OrdoWeeklySales.render(snapshot,model.meta.effectiveWeekdayFactors,state.promotionUnits)}<div class="wb-weekdays">${labels.map((label,i)=>`<div class="${i===todayIndex?'current-day':''}" ${i===todayIndex?'aria-current="date"':''}><b>${label}${i===todayIndex?'<em>오늘</em>':''}</b>${state.guidelineTab==='edit'?`<label><input data-wb-promotion="${i}" type="number" min="0" max="1000000" step="1" value="${draft[i]}" aria-label="${label}요일 판매 수량"></label><small>${total?(draft[i]/total*100).toFixed(1):'0.0'}%</small>`:`<strong>${(profile.shares[i]*100).toFixed(1)}%</strong>`}</div>`).join('')}</div>${state.guidelineTab==='edit'?`<div class="wb-actionbar"><button class="btn orange-btn" data-wb-promotion-apply>수동 판매 수량 적용</button><button class="btn ghost" data-wb-promotion-reset>기본 현황 복원</button></div>`:''}</section>`;
  }
  function filtered() {
    const query = state.query.trim().toLocaleLowerCase();
    return snapshot.products.filter(p => decisionFor(p)===state.decision && (state.method==='ALL'||p.productionType===state.method) && (state.category==='ALL'||p.itemType===state.category) && (!query||[p.code,p.name,p.itemType,...p.colors].join(' ').toLocaleLowerCase().includes(query)));
  }
  function decisions() {
    alignSelection();
    const rows=filtered(), recommendations=currentRecommendations();
    const a=model.analysis(state.code), p=a.product, o=a.observed, r=recommendations.get(p.code);
    const current=model.simulate(p.code,'balanced','ALL',r.budgetBlocked?0:null), archived=state.decisionScope==='source';
    const origin=snapshot.products.filter(item=>decisionFor(item)===state.decision);
    const statusCounts=Object.fromEntries(modes.map(mode=>[mode,snapshot.products.filter(item=>decisionFor(item)===mode).length]));
    const scopeName=archived?'원본 아카이브':'현재 재평가';
    const local=latestDecision(p.code);
    const tabs='<div class="segments" aria-label="'+scopeName+' 분류">'+modes.map(mode=>'<button data-wb-status="'+mode+'" class="'+(state.decision===mode?'active':'')+'" aria-pressed="'+(state.decision===mode)+'">'+mode+' '+statusCounts[mode]+'</button>').join('')+'</div>';
    return `<section class="page wb-page">${title('DECISIONS / REVIEW & DECIDE','전체 상품을 분류하고,<br>최종 결정은 직접 내리세요.','',tabs)}${notice()}
      <section class="wb-panel wb-register-scope"><div class="segments"><button data-wb-scope="current" class="${!archived?'active':''}">현재 재평가 · 전체 600개</button><button data-wb-scope="source" class="${archived?'active':''}">원본 아카이브 · REORDER ${counts().REORDER}개</button></div><p>${archived?'원본 과거 제안 · 현재 발주 승인과 구분합니다.':'판매·재고·납기·MOQ·예산 기준 재평가입니다.'} MD 결정은 별도 기록입니다.</p></section>
      <div class="wb-filterbar"><label>상품·코드 검색<input data-wb-search type="search" value="${esc(state.query)}" placeholder="상품명 / 상품코드 / 컬러"></label><label>생산방식<select data-wb-method><option value="ALL">제조 + 사입</option><option value="MANUFACTURING" ${state.method==='MANUFACTURING'?'selected':''}>제조</option><option value="BUYING" ${state.method==='BUYING'?'selected':''}>사입</option></select></label><label>아이템<select data-wb-category><option value="ALL">전체 아이템</option>${[...new Set(origin.map(x=>x.itemType))].sort().map(c=>`<option value="${esc(c)}" ${state.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><div class="wb-filter-count"><b data-wb-visible-count>${rows.length} / ${origin.length}개</b><small>${scopeName} ${state.decision} · 검색 결과</small></div><button class="btn ghost" data-wb-reset-filter>필터 초기화</button></div>
      <section class="wb-panel wb-decision-workspace" aria-label="MD 최종 결정 공간"><div class="section-title"><h2>MD 결정 공간</h2><b data-wb-selected-count>${state.selectedCodes.length}개 선택</b></div><p>목록의 체크박스로 상품을 선택하세요. 최종 확인 전에는 기록하지 않습니다. 수량은 자동 제안 또는 시뮬레이터에서 적용한 가정 수량입니다.</p><div class="wb-actionbar"><button class="btn ghost" data-wb-select-visible>현재 검색 결과 모두 선택 (${rows.length})</button><button class="btn ghost" data-wb-clear-selection>선택 해제</button><button class="btn orange-btn" data-wb-stage="REORDER">선택 상품 리오더 검토</button><button class="btn ghost" data-wb-stage="HOLD">선택 상품 보류</button><button class="btn ghost" data-wb-stage="WATCH">선택 상품 관찰</button><button class="btn orange-btn" data-wb-all-proposals>현재 AI 제안 전체 리오더 검토 (${model.portfolio('ALL','balanced').counts.REORDER})</button></div>${decisionPreviewHtml()}</section>
      <div class="wb-decision-layout"><aside class="wb-panel wb-candidate-panel"><div class="wb-queue-head"><h2>${scopeName} / ${state.decision}</h2><span>체크는 일괄 결정, 상품명은 상세 보기</span></div><div class="wb-candidates">${rows.length?rows.map(item=>{const rec=recommendations.get(item.code), md=latestDecision(item.code);return `<div class="wb-candidate-row"><label class="wb-select-product"><input type="checkbox" data-wb-select-code="${item.code}" aria-label="${esc(item.name)} 선택" ${state.selectedCodes.includes(item.code)?'checked':''}></label><button class="wb-candidate ${p.code===item.code?'active':''}" data-wb-code="${item.code}" aria-pressed="${p.code===item.code}"><b>${esc(item.name)}</b><span>${item.code} · ${item.productionType==='MANUFACTURING'?'제조':'사입'} / ${esc(item.itemType)}</span><small>현재 ${rec.action} · ${num(rec.quantity)}개 / 원본 ${item.decision}</small><small>MD 결정: ${md?esc(md.action)+' · '+num(md.quantity)+'개'+(md.needsReview?' · 규칙 변경 재검토':''):'미결정'}${state.quantityDrafts[item.code]?' · 수동 시나리오 저장됨':''}</small></button></div>`;}).join(''):'<p class="wb-empty">해당 분류·검색 결과가 없습니다. 다른 분류를 선택하세요.</p>'}</div></aside>
      <article class="wb-panel wb-product-detail${rows.length?'':' wb-empty-detail'}" data-wb-selected-product="${p.code}">${!rows.some(x=>x.code===p.code)?'<p class="wb-empty">이 분류·검색 조건에 해당하는 상품이 없습니다. 다른 분류를 선택하거나 필터를 초기화하세요.</p>':''}<div class="wb-detail-head"><div><div class="eyebrow">${p.code} / ${esc(p.itemType)}</div><h2>${esc(p.name)}</h2><p>${p.productionType==='MANUFACTURING'?'제조':'사입'} · ${esc(p.brandRole)} · ${esc(p.colors.join(' / '))}</p></div><div class="wb-decision-badge"><small>현재 재평가</small><strong data-wb-current-status>${r.action}</strong><span>원본 ${p.decision} / MD ${local?esc(local.action)+(local.needsReview?' (규칙 변경 재검토)':''):'미결정'}</span></div></div>
      <div class="wb-metrics wb-detail-metrics">${metric('최근 7일 검증 주문',num(o.last7Units)+'개','직전 7일 '+num(o.prev7Units)+'개','product-sales')}${metric('소스 재고',num(p.inventory)+'개','입고일 이후 판매 가능','product-stock')}${metric('현재 예산 반영 제안',num(r.quantity)+'개','원본 제안 '+num(p.reorderQty)+'개','product-quantity')}${metric('모델 입고일',current.arrivalDate,'검토 슬롯 + 납기 '+current.leadTime+'일','product-arrival')}</div>
      <section class="wb-analysis-report"><h3>판단 근거와 다음 조치</h3><p class="wb-recommendation">${r.budgetBlocked?'상품 단독 계산과 달리 전체 포트폴리오 예산에서 제외되어 WATCH입니다. 예산과 우선순위를 다시 검토하세요.':esc(a.recommendation.summary)}</p>${list(a.recommendation.reasons)}<div class="wb-evidence-grid"><div><h4>과거 · 관측</h4><p>${snapshot.meta.windowStart}–${snapshot.meta.asOf} 검증 판매 ${num(o.last28Units)}개. 최근 7일 매출 ${won(o.last7Revenue)}.</p></div><div><h4>현재 · 제약</h4><p>MOQ ${num(current.moq)}개, 차수 ${p.cycle}/${p.maxCycles}, 위험 ${esc(p.riskType)}. 기초 재고·누적 판매에는 미검증 합성 잔액이 포함됩니다.</p></div><div><h4>미래 · 추정</h4><p>시즌 예상 판매 ${num(current.forecastUnits,1)}개, 매출 ${won(current.forecastRevenue)}, 잔여 ${num(current.endingInventory,1)}개. 실현 성과가 아닙니다.</p></div><div><h4>MD 결정</h4><p>${local?esc(local.action)+' '+num(local.quantity)+'개 · '+esc(local.note||'메모 없음'):'아직 판단을 기록하지 않았습니다. 자동 제안을 검토하거나 시뮬레이터에서 수량을 직접 시험하세요.'}</p></div></div></section>
      <div class="wb-warning wb-decision-risk"><b>판단 리스크</b>${list([...new Set([...a.recommendation.risks,...current.blockers])])}</div><div class="wb-actionbar"><button class="btn orange-btn" data-wb-single-action="REORDER" data-wb-target="${p.code}">이 상품 리오더 검토</button><button class="btn ghost" data-wb-single-action="HOLD" data-wb-target="${p.code}">이 상품 보류</button><button class="btn ghost" data-wb-open="simulator" data-wb-code="${p.code}">수량·시나리오 비교 →</button><button class="btn ghost" data-wb-report-code="${p.code}">상품 분석·리스크 리포트</button></div><details><summary>컬러 × 사이즈 근거</summary><div class="wb-table-scroll"><table class="wb-table"><thead><tr><th>컬러</th><th>사이즈</th><th>재고</th><th>일 수요</th><th>예산 반영 제안</th><th>근거</th></tr></thead><tbody>${current.options.map(opt=>`<tr><td>${esc(opt.color)}</td><td>${esc(opt.size)}</td><td>${num(opt.stock)}</td><td>${num(opt.dailyRate,3)}</td><td>${num(opt.quantity)}</td><td class="wb-text-cell">${esc(opt.reason)}</td></tr>`).join('')}</tbody></table></div></details></article></div></section>`;
  }

  function latestDecision(code) {
    const record=ledger.decisions.find(d=>d.code===code && inCurrentSource(d) && d.status==='SIMULATED_APPROVAL');
    return record?{...record,needsReview:record.runtimeFingerprint!==model.meta.runtimeFingerprint}:null;
  }
  function inCurrentSource(record) {
    const base=snapshot.meta.sourceContentHash||snapshot.meta.contentHash;
    return record.dataHash===base||record.dataHash===snapshot.meta.contentHash||record.dataHash?.startsWith(base+':dev-daily-v1:');
  }
  function decisionPreviewHtml() {
    const preview=state.decisionPreview;
    if (!preview) return '';
    return `<div class="wb-decision-preview" aria-live="polite"><h3>${preview.action} 최종 확인 · ${preview.rows.length}개 중 기록 가능 ${preview.rows.filter(r=>!r.blocked).length}개</h3><p>총 수량 ${num(preview.rows.filter(r=>!r.blocked).reduce((n,r)=>n+r.scenario.quantity,0))}개 · 발주 현금 ${won(preview.cost)}. ${preview.action==='REORDER'?'불가 상품은 아래 사유를 표시하며 기록 대상에서 제외합니다.':'보류·관찰은 신규 발주량 0으로 기록합니다.'}</p>${preview.budgetError?'<p class="wb-danger">'+esc(preview.budgetError)+'</p>':''}<div class="wb-table-scroll"><table class="wb-table"><thead><tr><th>상품</th><th>수량</th><th>현금</th><th>기록 여부 / 사유</th></tr></thead><tbody>${preview.rows.map(row=>`<tr><td class="wb-text-cell">${esc(row.product.name)}<small>${row.product.code}</small></td><td>${num(row.scenario.quantity)}</td><td>${won(row.scenario.cost)}</td><td class="wb-text-cell">${esc(row.blocked||'기록 가능 · '+row.scenario.name)}</td></tr>`).join('')}</tbody></table></div><label>결정 메모<input data-wb-batch-note type="text" maxlength="500" placeholder="판단 근거 또는 다음 확인 조건"></label><div class="wb-actionbar"><button class="btn orange-btn" data-wb-confirm-decision ${preview.budgetError||preview.rows.every(r=>r.blocked)?'disabled':''}>기록 가능 상품 ${preview.action} 확정 (로컬)</button><button class="btn ghost" data-wb-cancel-decision>취소</button></div><p class="wb-muted">실제 발주나 외부 전송은 일어나지 않습니다. 기존 같은 상품의 로컬 결정은 이력으로 남기고 대체합니다.</p></div>`;
  }

  function announce(message) { hooks?.toast(message); }
  function redraw(focusSelector, selection) {
    const scroll = document.querySelector('.wb-candidates')?.scrollTop || 0;
    rememberRoute(); hooks?.render({animate:false});
    const queue = document.querySelector('.wb-candidates'); if (queue) queue.scrollTop = scroll;
    const focus = focusSelector && document.querySelector(focusSelector);
    if (focus) { focus.focus({preventScroll:true}); if (selection && focus.type !== 'search') focus.setSelectionRange?.(...selection); }
  }
  function download(name, body, mime) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([body],{type:mime}));
    link.href=url; link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function selectedScenario() { return model.simulate(state.code,state.scenario,'ALL',state.manualBaseQty); }
  function applyManualQuantity() {
    const input=document.querySelector('[data-wb-manual]');
    if (!input) return;
    const value=input.value===''?null:Number(input.value);
    if (value!==null && (!Number.isSafeInteger(value)||value<0||value>1000000)) {announce('수량은 0~1,000,000 사이 정수로 입력하세요.');input.focus();return;}
    state.manualBaseQty=value;
    state.quantityDrafts[state.code]={manualBaseQty:value,scenarioId:state.scenario};
    state.decisionPreview=null;
    redraw('[data-wb-manual]');
    announce(value===null?'자동 제안 수량으로 다시 계산했습니다.':num(value)+'개 가정을 모든 시나리오·하단 아소트·예측에 적용했습니다.');
  }
  function applyWeights(reset=false) {
    const values=reset?snapshot.policy.weekdayFactors:[...document.querySelectorAll('[data-wb-weight]')].map(input=>input.value.trim()===''?NaN:Number(input.value));
    if(values.length!==7||values.some(n=>!Number.isFinite(n)||n<0||n>5)||!values.some(n=>n>0)) {announce('7개 가중치를 0~5 사이로 입력하고 최소 한 요일은 0보다 크게 설정하세요.');return;}
    try {
      const next=window.createOrdoModel(snapshot,reset?{}:{weekdayFactors:values});
      next.portfolio('ALL','balanced');
      model=next;window.OrdoModel=next;ledger.weekdayFactors=reset?null:values;policyFailure='';
      state.decisionPreview=null;state.guidelineTab='applied';save();redraw();
      announce(reset?'소스 기본 가중치를 복원하고 모든 예측을 재계산했습니다.':'요일 가중치를 저장하고 전체 분석·예측을 재계산했습니다.');
    } catch(error) {announce('가중치를 적용하지 못했습니다. 기존 규칙을 유지합니다. '+error.message);}
  }
  function budgetCheck(rows) {
    const replacing=new Set(rows.map(row=>row.product.code));
    const active=ledger.decisions.filter(d=>inCurrentSource(d)&&d.status==='SIMULATED_APPROVAL'&&!replacing.has(d.code));
    for(const method of ['MANUFACTURING','BUYING']) {
      const budget=snapshot.policy.budgetByMethod[method];
      const limit=typeof budget==='number'?budget:budget.availableBudget;
      const total=active.filter(d=>d.productionType===method).reduce((n,d)=>n+d.cost,0)+rows.filter(r=>r.product.productionType===method).reduce((n,r)=>n+r.scenario.cost,0);
      if(total>limit+0.01) return (method==='MANUFACTURING'?'제조':'사입')+' 잔여 예산 초과: 다른 활성 결정 포함 '+won(total)+' / '+won(limit)+'. 수량 또는 선택 상품을 조정하세요.';
    }
    const total=active.reduce((n,d)=>n+d.cost,0)+rows.reduce((n,r)=>n+r.scenario.cost,0);
    if(total>(snapshot.policy.availableBudget??Infinity)+0.01) return '전체 잔여 예산 초과: 다른 활성 결정 포함 '+won(total)+' / '+won(snapshot.policy.availableBudget);
    return '';
  }
  function stageDecision(action,codes=state.selectedCodes,render=true,autoPlan=false) {
    if(!codes.length) {announce('먼저 목록에서 상품을 선택하세요.');return null;}
    if(codes.some(code=>lockedOrder(code))) {announce('확정 발주서에 포함된 상품입니다. 최종 발주 탭에서 발주서를 취소한 뒤 변경하세요.');return null;}
    const rows=[...new Set(codes)].map(code=>{
      const product=model.product(code); if(!product)return null;
      const draft=autoPlan?null:state.quantityDrafts[code];
      const scenario=model.simulate(code,draft?.scenarioId||'balanced','ALL',action==='REORDER'?(draft?.manualBaseQty??null):0);
      const blocked=action==='REORDER'?(!scenario.allowed&&scenario.blockers.length?scenario.blockers.join(' / '):scenario.quantity<=0?'자동 제안 0개: 현재 재고로 수요를 충족하는지 확인하고 필요할 때만 수동 수량을 시험하세요.':''):'';
      return {product,scenario,blocked,manualBaseQty:action==='REORDER'?(draft?.manualBaseQty??null):0};
    }).filter(Boolean);
    const accepted=rows.filter(row=>!row.blocked);
    const preview={action,rows,cost:accepted.reduce((n,r)=>n+r.scenario.cost,0),budgetError:action==='REORDER'?budgetCheck(accepted):'',fingerprint:model.meta.runtimeFingerprint,dataHash:snapshot.meta.contentHash,autoPlan};
    state.decisionPreview=preview;
    if(render){redraw();document.querySelector('.wb-decision-preview')?.scrollIntoView({block:'center',behavior:'smooth'});}
    return preview;
  }
  function makeDecisionRecord(product,scenario,action,manualBaseQty,note,batchId=null) {
    return {id:crypto.randomUUID(),key:[snapshot.meta.contentHash,model.meta.runtimeFingerprint,product.code,scenario.id,manualBaseQty??'auto',action].join(':'),code:product.code,name:product.name,productionType:product.productionType,sourceDecision:product.decision,scenarioId:scenario.id,quantity:scenario.quantity,cost:scenario.cost,forecastRevenue:scenario.forecastRevenue,forecastUnits:scenario.forecastUnits,additionalRevenue:scenario.additionalRevenue,grossProfit:scenario.grossProfit,endingInventory:scenario.endingInventory,arrivalDate:scenario.arrivalDate,createdAt:new Date().toISOString(),asOf:snapshot.meta.asOf,dataHash:snapshot.meta.contentHash,modelVersion:modelVersion(),runtimeFingerprint:model.meta.runtimeFingerprint,weekdayFactors:[...(model.meta.effectiveWeekdayFactors||snapshot.policy.weekdayFactors)],status:'SIMULATED_APPROVAL',action,outcome:'PENDING',manualBaseQty,note,batchId,options:scenario.options.map(o=>({id:o.id,color:o.color,size:o.size,quantity:o.quantity})),forecastDaily:scenario.daily.map(d=>({date:d.date,units:d.units,revenue:d.revenue}))};
  }
  function confirmDecision() {
    const prior=state.decisionPreview; if(!prior)return;
    const note=document.querySelector('[data-wb-batch-note]')?.value.trim()||'';
    if(prior.fingerprint!==model.meta.runtimeFingerprint||prior.dataHash!==snapshot.meta.contentHash){state.decisionPreview=null;redraw();announce('데이터 또는 규칙이 바뀌어 최종 확인을 다시 진행해 주세요.');return;}
    const preview=stageDecision(prior.action,prior.rows.map(row=>row.product.code),false,prior.autoPlan);
    if(!preview||preview.budgetError){redraw();announce(preview?.budgetError||'기록 대상이 없습니다.');return;}
    const accepted=preview.rows.filter(row=>!row.blocked), batchId=crypto.randomUUID();
    if(!accepted.length){announce('기록 가능한 상품이 없습니다.');return;}
    let count=0;
    for(const row of accepted){
      const record=makeDecisionRecord(row.product,row.scenario,preview.action,row.manualBaseQty,note,batchId);
      if(ledger.decisions.some(d=>d.key===record.key&&d.status==='SIMULATED_APPROVAL'))continue;
      ledger.decisions.filter(d=>d.code===record.code&&inCurrentSource(d)&&d.status==='SIMULATED_APPROVAL').forEach(d=>d.status='SUPERSEDED');
      ledger.decisions.unshift(record);count++;
    }
    save();state.decisionPreview=null;state.selectedCodes=[];redraw();
    announce(count+'개 상품 '+preview.action+' 판단을 기록했습니다. 실제 발주가 아닌 로컬 시연 기록입니다.');
    if(preview.action==='REORDER')hooks.navigate('orders');
  }
  function reconcileOutcomes() {
    let changed = false;
    for (const record of ledger.decisions) {
      if (!model.product(record.code) || !Array.isArray(record.forecastDaily)) continue;
      const observed = new Map(model.analysis(record.code).observed.history.map(day=>[day.date,day]));
      const days = record.forecastDaily.filter(day=>day.date>record.asOf && day.date<=snapshot.meta.asOf && observed.has(day.date));
      if (!days.length || record.evaluationDataHash===snapshot.meta.contentHash) continue;
      const actualUnits=days.reduce((total,day)=>total+observed.get(day.date).units,0);
      const actualRevenue=days.reduce((total,day)=>total+observed.get(day.date).revenue,0);
      const predictedUnits=days.reduce((total,day)=>total+day.units,0);
      Object.assign(record, {outcome:days.length===record.forecastDaily.length?'OBSERVED':'OBSERVED_PARTIAL',evaluatedThrough:days.at(-1).date,coverageDays:days.length,totalForecastDays:record.forecastDaily.length,observedUnits:actualUnits,observedRevenue:actualRevenue,predictedUnitsToDate:predictedUnits,predictedRevenueToDate:days.reduce((total,day)=>total+day.revenue,0),unitsError:actualUnits-predictedUnits,evaluationDataHash:snapshot.meta.contentHash});
      record.outcomeProvenance=snapshot.devFeed&&days.some(day=>day.date>snapshot.devFeed.baseAsOf)?'DEV_GENERATED':'SOURCE_FIXTURE';
      changed = true;
    }
    if (changed) save();
  }
  function commitment(product) {
    // Only current active local review records count; they are never live supplier POs.
    return ledger.decisions.filter(d=>inCurrentSource(d) && d.code!==product.code && d.productionType===product.productionType && d.status==='SIMULATED_APPROVAL').reduce((n,d)=>n+d.cost,0);
  }
  function approve() {
    const scenario=selectedScenario(), product=model.product(state.code);
    if(lockedOrder(state.code)){announce('확정 발주서를 먼저 취소한 뒤 수량을 변경하세요.');return;}
    if (!scenario.allowed && scenario.quantity>0) { announce('차단 조건이 있어 승인할 수 없습니다. 판단 근거를 확인하세요.'); return; }
    const hash=snapshot.meta.contentHash || snapshot.meta.asOf;
    const key=[hash,model.meta.runtimeFingerprint,state.code,state.scenario,state.manualBaseQty??'auto',scenario.quantity>0?'REORDER':'NO_ORDER'].join(':');
    if (ledger.decisions.some(d=>d.key===key&&d.status==='SIMULATED_APPROVAL')) { announce('이미 기록된 동일 상품·시나리오입니다. 중복 기록하지 않았습니다.'); return; }
    const budget = snapshot.policy?.budgetByMethod?.[product.productionType];
    const available = typeof budget==='number' ? budget : budget?.availableBudget;
    if (Number.isFinite(available) && scenario.cost+commitment(product)>available) { announce('다른 로컬 승인 기록을 합산하면 생산방식별 잔여 예산을 초과합니다. 수량을 줄이세요.'); return; }
    const globalCommitted=ledger.decisions.filter(d=>inCurrentSource(d)&&d.code!==product.code&&d.status==='SIMULATED_APPROVAL').reduce((total,d)=>total+d.cost,0);
    if (scenario.cost+globalCommitted>(snapshot.policy.availableBudget ?? Infinity)) { announce('다른 로컬 검토 금액을 포함하면 FW 전체 잔여 예산을 초과합니다.'); return; }
    const note=document.querySelector('[data-wb-note]')?.value.trim() || '';
    ledger.decisions.filter(d=>d.code===state.code&&inCurrentSource(d)&&d.status==='SIMULATED_APPROVAL').forEach(d=>{d.status='SUPERSEDED';});
    ledger.decisions.unshift(makeDecisionRecord(product,scenario,scenario.quantity>0?'REORDER':'NO_ORDER',state.manualBaseQty,note));
    save(); state.reportTab='history';state.reportView='product'; announce(scenario.quantity>0?'최종 발주 검토함에 추가했습니다. 발주서를 검토·확정하세요.':'추가 발주 없음 판단을 기록했습니다. 후속 관측을 기다립니다.'); hooks.navigate(scenario.quantity>0?'orders':'reports');
  }
  function exportResult(type) {
    const product=model.product(state.code), a=model.analysis(state.code), scenario=selectedScenario();
    if (type==='csv') {
      const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
      const rows=[['data_as_of','model_version','style_code','product_name','scenario','option_id','color','size','quantity','unit_cost','note'],...scenario.options.map(o=>[snapshot.meta.asOf,modelVersion(),product.code,product.name,scenario.id,o.id,o.color,o.size,o.quantity,o.unitCost,'SIMULATION_ONLY_NOT_A_PURCHASE_ORDER'])];
      download(`ordo-${product.code}-${scenario.id}.csv`,'\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    } else {
      const report={build:BUILD,dataAsOf:snapshot.meta.asOf,modelVersion:modelVersion(),generatedAt:new Date().toISOString(),analysis:a,selectedScenario:scenario,backtest:model.backtest(),alerts:model.monitor(),localDecisions:ledger.decisions.filter(d=>d.code===product.code),limitations:snapshot.meta.warnings};
      download(`ordo-analysis-${product.code}.json`,JSON.stringify(report,null,2),'application/json');
    }
  }
  function recordRun(changed, error=null) {
    const alerts=model.monitor();
    const run={at:new Date().toISOString(),dataAsOf:snapshot.meta.asOf,dataHash:snapshot.meta.contentHash||snapshot.meta.asOf,changed,alertCount:alerts.length,error};
    ledger.lastRun=run.at; ledger.runs.unshift(run); ledger.runs=ledger.runs.slice(0,100);
    save();
    document.querySelectorAll('[data-wb-last-run]').forEach(el=>el.textContent='마지막 검사 '+new Date(run.at).toLocaleTimeString('ko-KR')+(error?' · 갱신 확인 실패':''));
    return run;
  }
  async function refresh(userInitiated=false,manualCollect=false) {
    if (refreshBusy) return;
    refreshBusy=true;
    try {
      const response=await fetch('data-snapshot.json',{cache:'no-store'});
      if (!response.ok) throw new Error('HTTP '+response.status);
      const base=await response.json();
      const next=window.OrdoDevFeed.sync(window.OrdoDemoCalibration.calibrate(base),{manual:manualCollect});
      if (!next.meta?.contentHash || !Array.isArray(next.products) || !Array.isArray(next.daily)) throw new Error('Invalid data snapshot');
      const changed=next.meta.contentHash!==snapshot.meta.contentHash;
      if (changed) {
        const nextModel=window.createOrdoModel(next,ledger.weekdayFactors&&!policyFailure?{weekdayFactors:ledger.weekdayFactors}:{});
        nextModel.portfolio('D+3'); // Validate calculation before accepting new source version.
        state.promotionUnits=null;state.promotionSource=null;snapshot=next; model=nextModel; window.OrdoSnapshot=next; window.OrdoModel=nextModel;
        state.decisionPreview=null;
        if (!model.product(state.code)) state.code=next.products[0].code;
        document.querySelector('.data-status b').textContent=next.meta.asOf.replaceAll('-','.');
        // A new dataset requires alert review again; keep prior review history in runs/decisions.
        Object.values(ledger.alertReviews).forEach(review=>{review.previousStatus=review.status;review.status='needs-review';});
        reconcileOutcomes();
      }
      recordRun(changed);
      if (userInitiated) announce(changed?`DEV ${next.meta.asOf}까지 주문을 수집하고 매출·재고·위험을 재계산했습니다.`:`${next.meta.asOf}까지 수집 완료 상태입니다. 중복 주문은 추가하지 않았습니다.`);
      if ((changed || userInitiated) && hooks) hooks.render();
    } catch (error) {
      recordRun(false,String(error.message));
      if (userInitiated) announce('데이터 갱신 확인에 실패했습니다. 기존 스냅샷을 유지하며 오류를 기록했습니다.');
    } finally { refreshBusy=false; }
  }
  function bind(root) {
    bound?.abort(); bound=new AbortController(); const options={signal:bound.signal};
    updateOrderTotal(root);window.OrdoWeeklySales?.bind(root);window.OrdoFx?.bind(root);
    root.addEventListener('change',event=>{if(event.target.matches('[data-order-select]'))updateOrderTotal(root);},options);
    root.addEventListener('click',event=>{
      const el=event.target.closest('button,a'); if (!el||!root.contains(el)) return;
      if(orderAction(el,root))return;
      if (el.hasAttribute('data-wb-code')) selectCode(el.dataset.wbCode);
      if (el.hasAttribute('data-wb-open')) { if(el.dataset.wbOpen==='reports'){state.reportView=el.hasAttribute('data-wb-code')?'product':'aggregate';state.reportTab='summary';} hooks.navigate(el.dataset.wbOpen); return; }
      if (el.hasAttribute('data-wb-status')) { if(el.dataset.wbScope)state.decisionScope=el.dataset.wbScope;state.decision=el.dataset.wbStatus;state.query='';state.method='ALL';state.category='ALL';alignSelection();hooks.navigate('decisions');return; }
      if (el.hasAttribute('data-wb-scope')) {state.decisionScope=el.dataset.wbScope;state.category='ALL';state.query='';alignSelection();redraw();return;}
      if (el.hasAttribute('data-wb-code')) { redraw(`[data-wb-code="${state.code}"]`); return; }
      if (el.hasAttribute('data-wb-horizon')) {state.horizon=el.dataset.wbHorizon;redraw(`[data-wb-horizon="${state.horizon}"]`);return;}
      if(el.hasAttribute('data-wb-promotion-apply')){applyPromotion();return;}
      if(el.hasAttribute('data-wb-promotion-reset')){applyPromotion(true);return;}
      if (el.hasAttribute('data-wb-guideline')) {state.guidelineTab=el.dataset.wbGuideline;redraw();return;}
      if (el.hasAttribute('data-wb-weights-apply')) {applyWeights();return;}
      if (el.hasAttribute('data-wb-weights-reset')) {applyWeights(true);return;}
      if (el.hasAttribute('data-wb-scenario')) {state.scenario=el.dataset.wbScenario;if(state.quantityDrafts[state.code])state.quantityDrafts[state.code].scenarioId=state.scenario;state.decisionPreview=null;redraw(`[data-wb-scenario="${state.scenario}"]`);return;}
      if (el.hasAttribute('data-wb-report-tab')) {state.reportTab=el.dataset.wbReportTab;redraw(`[data-wb-report-tab="${state.reportTab}"]`);return;}
      if (el.hasAttribute('data-wb-report-scope')) {state.reportScope=el.dataset.wbReportScope;state.reportView='aggregate';redraw();return;}
      if (el.hasAttribute('data-wb-report-view')) {state.reportView=el.dataset.wbReportView;state.reportTab='summary';redraw();return;}
      if (el.hasAttribute('data-wb-report-code')) {selectCode(el.dataset.wbReportCode);state.reportView='product';state.reportTab='summary';hooks.navigate('reports');return;}
      if (el.hasAttribute('data-wb-reset-filter')) {state.query='';state.method='ALL';state.category='ALL';redraw('[data-wb-search]');return;}
      if (el.hasAttribute('data-wb-source-qty')) {state.manualBaseQty=model.product(state.code).reorderQty;state.quantityDrafts[state.code]={manualBaseQty:state.manualBaseQty,scenarioId:state.scenario};state.decisionPreview=null;redraw();return;}
      if (el.hasAttribute('data-wb-reset-qty')) {state.manualBaseQty=null;delete state.quantityDrafts[state.code];state.decisionPreview=null;redraw();return;}
      if (el.hasAttribute('data-wb-manual-apply')) {applyManualQuantity();return;}
      if (el.hasAttribute('data-wb-select-visible')) {state.selectedCodes=[...new Set([...state.selectedCodes,...filtered().map(p=>p.code)])];state.decisionPreview=null;redraw();return;}
      if (el.hasAttribute('data-wb-clear-selection')) {state.selectedCodes=[];state.decisionPreview=null;redraw();return;}
      if (el.hasAttribute('data-wb-stage')) {stageDecision(el.dataset.wbStage);return;}
      if (el.hasAttribute('data-wb-single-action')) {stageDecision(el.dataset.wbSingleAction,[el.dataset.wbTarget]);return;}
      if (el.hasAttribute('data-wb-all-proposals')) {stageDecision('REORDER',[...currentRecommendations().values()].filter(r=>r.action==='REORDER').map(r=>r.code),true,true);return;}
      if (el.hasAttribute('data-wb-cancel-decision')) {state.decisionPreview=null;redraw();return;}
      if (el.hasAttribute('data-wb-confirm-decision')) {confirmDecision();return;}
      if (el.hasAttribute('data-wb-approve')) {approve();return;}
      if (el.hasAttribute('data-wb-export')) {exportResult(el.dataset.wbExport);return;}
      if (el.hasAttribute('data-wb-refresh')) {refresh(true);return;}
      if (el.hasAttribute('data-wb-collect-yesterday')) {refresh(true,true);return;}
      if (el.hasAttribute('data-wb-dev-export')) {const rows=snapshot.devFeed?.orders||[];download('ordo-dev-orders.csv','\uFEFFid,date,code,optionId,units,revenue,source\r\n'+rows.map(o=>[o.id,o.date,o.code,o.optionId,o.units,o.revenue,o.source].join(',')).join('\r\n'),'text/csv;charset=utf-8');return;}
      if (el.hasAttribute('data-wb-zero-days')) {state.showZeroDays=!state.showZeroDays;redraw();return;}
      if (el.hasAttribute('data-wb-alert')) {
        const status=el.dataset.wbAlertAction;
        ledger.alertReviews[el.dataset.wbAlert]={status,timestamp:new Date().toISOString(),dataHash:snapshot.meta.contentHash};
        save();
        if(status==='snoozed'){
          const card=el.closest('[data-lab-alert]');
          card?.classList.add('is-dismissing');
          el.disabled=true;
          const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:250;
          setTimeout(()=>{announce('보류한 알림을 Today 목록에서 숨겼습니다.');redraw();},delay);
        }else{
          announce('확인한 알림을 의사결정 아카이브에 남겼습니다.');redraw();
        }
        return;
      }
    },options);
    root.addEventListener('input',event=>{
      const el=event.target;
      if (el.hasAttribute('data-wb-search')) {state.query=el.value;redraw('[data-wb-search]');}
    },options);
    root.addEventListener('change',event=>{
      const el=event.target;
      if (el.hasAttribute('data-wb-product')) {selectCode(el.value);redraw('[data-wb-product]');}
      if (el.hasAttribute('data-wb-method')) {state.method=el.value;redraw('[data-wb-method]');}
      if (el.hasAttribute('data-wb-category')) {state.category=el.value;redraw('[data-wb-category]');}
      if (el.hasAttribute('data-wb-select-code')) {state.selectedCodes=el.checked?[...new Set([...state.selectedCodes,el.dataset.wbSelectCode])]:state.selectedCodes.filter(code=>code!==el.dataset.wbSelectCode);state.decisionPreview=null;redraw(`[data-wb-select-code="${el.dataset.wbSelectCode}"]`);}
    },options);
    root.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.hasAttribute('data-wb-manual')){event.preventDefault();applyManualQuantity();}},options);
  }
  function init(settings) {
    hooks=settings; document.body.dataset.build=BUILD;
    const status=document.querySelector('.data-status b');if(status)status.textContent=snapshot.meta.asOf.replaceAll('-','.');
    Object.values(ledger.alertReviews).forEach(review=>{if(review.dataHash!==snapshot.meta.contentHash){review.previousStatus=review.status;review.status='needs-review';}});
    reconcileOutcomes();
    recordRun(ledger.runs.length?ledger.runs[0].dataHash!==snapshot.meta.contentHash:!!snapshot.devFeed);
    setInterval(()=>{if(document.visibilityState==='visible')refresh(false);},60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(false);});
  }
  function lockedOrder(code) {
    return (ledger.orders||[]).find(order=>order.status==='DEV_CONFIRMED'&&order.lines.some(line=>line.code===code));
  }
  function orderCandidates() {
    return ledger.decisions.filter(d=>d.status==='SIMULATED_APPROVAL'&&d.action==='REORDER'&&d.quantity>0&&!lockedOrder(d.code));
  }
  function orderProblem(record) {
    if(record.dataHash!==snapshot.meta.contentHash||record.runtimeFingerprint!==model.meta.runtimeFingerprint)return '데이터·가중치 변경: 시뮬레이터에서 다시 검토하세요.';
    const s=model.simulate(record.code,record.scenarioId,'ALL',record.manualBaseQty);
    if(!s.allowed)return s.blockers.join(' / ')||'발주 조건 불충족';
    if(s.quantity!==record.quantity||s.cost!==record.cost)return '수량·금액이 변경되었습니다. 다시 검토하세요.';
    return '';
  }
  function ordersPage() {
    const rows=orderCandidates(), history=ledger.orders||[];
    return `<section class="page wb-page wb-orders-page">${title('ORDERS / FINAL REVIEW','선택한 상품을,<br>발주서로 확정합니다.','상품 선택 → 수량·옵션 검토 → 발주서 확정 · 외부 전송 없음','<div class="wb-page-actions"><button class="btn orange-btn" data-wb-open="decisions">상품 선택하기 →</button></div>')}${notice()}<article class="wb-panel"><h2>최종 발주 검토함 · ${rows.length}개</h2><p>Decisions에서 REORDER를 기록하거나 Simulator에서 검토를 기록한 상품입니다. 체크한 상품만 확정합니다. 수량 변경은 상품별 시뮬레이터에서 다시 검토하세요.</p><p class="wb-order-handoff">최종 검토 후 발주서 생성과 전달이 가능합니다.</p>${rows.length?`<div class="wb-table-scroll"><table class="wb-table"><thead><tr><th>선택</th><th>상품 / 옵션별 수량</th><th>발주 수량</th><th>금액</th><th>예상 입고 / 점검</th></tr></thead><tbody>${rows.map(d=>{const problem=orderProblem(d);return `<tr><td><input type="checkbox" data-order-select value="${esc(d.id)}" aria-label="${esc(d.name)} 발주 선택" ${problem?'disabled':'checked'}></td><td class="wb-text-cell"><b>${esc(d.name)}</b><small>${esc(d.code)} · ${esc(d.productionType)}</small><details><summary>옵션 아소트 확인</summary>${d.options.filter(o=>o.quantity>0).map(o=>`<p>${esc(o.color)} / ${esc(o.size)} · ${num(o.quantity)}개</p>`).join('')}</details><button class="btn ghost" data-wb-code="${esc(d.code)}" data-wb-open="simulator">수량·근거 재검토</button></td><td>${num(d.quantity)}개</td><td>${won(d.cost)}</td><td class="wb-text-cell">${esc(d.arrivalDate)}<small>${esc(problem||'재고·MOQ·납기·예산 점검 통과')}</small></td></tr>`;}).join('')}</tbody></table></div><p data-order-total aria-live="polite"></p><label><input type="checkbox" data-order-ack> 수량·옵션·금액·예상 납기를 확인했습니다. DEV 로컬 발주서이며 공급사로 전송되지 않습니다.</label><div class="wb-actionbar"><button class="btn orange-btn" data-order-confirm>선택 상품 발주서 확정 (DEV)</button></div>`:'<p>검토함이 비어 있습니다. 상품 선택하기에서 목록 체크 → REORDER 검토·기록 후 돌아오세요.</p>'}</article><article class="wb-panel"><h2>확정 발주서 · ${history.length}건</h2><p>원본 데이터·가중치·옵션별 수량을 확정 시점 그대로 보관합니다. 확정 후 데이터가 변경되어도 자동 수정하지 않습니다. 실제 전송·공급사 접수·입고 처리는 연결되지 않았습니다.</p>${history.map(o=>`<section class="wb-panel"><h3>${esc(o.id)} · ${o.status==='CANCELLED'?'취소됨':'DEV 확정 / 미전송'}</h3><p>${esc(o.createdAt)} · ${o.lines.length}개 상품 / ${num(o.quantity)}개 / ${won(o.cost)}</p><p>${o.lines.map(d=>esc(d.name)+' '+num(d.quantity)+'개').join(' · ')}</p><div class="wb-actionbar"><button class="btn ghost" data-order-export="${esc(o.id)}">옵션별 발주서 CSV</button>${o.status==='DEV_CONFIRMED'?`<button class="btn ghost" data-order-cancel="${esc(o.id)}">발주서 취소</button>`:''}</div></section>`).join('')||'<p>아직 확정한 발주서가 없습니다.</p>'}</article></section>`;
  }
  function updateOrderTotal(root) {
    const ids=new Set([...root.querySelectorAll('[data-order-select]:checked')].map(el=>el.value));
    const rows=orderCandidates().filter(d=>ids.has(d.id)), output=root.querySelector('[data-order-total]');
    if(output)output.textContent=`선택 ${rows.length}개 상품 · ${num(rows.reduce((n,d)=>n+d.quantity,0))}개 · ${won(rows.reduce((n,d)=>n+d.cost,0))}`;
  }
  function confirmOrder(root) {
    const ids=new Set([...root.querySelectorAll('[data-order-select]:checked')].map(el=>el.value));
    const rows=orderCandidates().filter(d=>ids.has(d.id));
    if(!rows.length||!root.querySelector('[data-order-ack]')?.checked){announce('발주할 상품을 선택하고 최종 확인란을 체크하세요.');return;}
    const problem=rows.map(orderProblem).find(Boolean)||budgetCheck(rows.map(d=>({product:model.product(d.code),scenario:model.simulate(d.code,d.scenarioId,'ALL',d.manualBaseQty)})));
    if(problem){announce(problem);redraw();return;}
    if(storageFailure){announce('저장소 오류로 발주서를 확정할 수 없습니다.');return;}
    const order={id:'DEV-PO-'+crypto.randomUUID(),status:'DEV_CONFIRMED',transmission:'NOT_SENT',createdAt:new Date().toISOString(),dataHash:snapshot.meta.contentHash,runtimeFingerprint:model.meta.runtimeFingerprint,lines:JSON.parse(JSON.stringify(rows)),quantity:rows.reduce((n,d)=>n+d.quantity,0),cost:rows.reduce((n,d)=>n+d.cost,0)};
    order.lines.forEach(line=>line.options.forEach(option=>{option.unitCost=model.product(line.code).options.find(o=>o.id===option.id)?.unitCost??0;}));
    ledger.orders=ledger.orders||[];ledger.orders.unshift(order);save();
    if(storageFailure){ledger.orders.shift();announce('저장 실패: 발주서는 확정하지 않았습니다.');return;}
    redraw();announce('DEV 발주서를 확정했습니다. 실제 전송은 하지 않았습니다. CSV를 내려받을 수 있습니다.');
  }
  function orderAction(el,root) {
    if(el.hasAttribute('data-order-confirm')){confirmOrder(root);return true;}
    const id=el.dataset.orderExport||el.dataset.orderCancel;if(!id)return false;
    const order=(ledger.orders||[]).find(o=>o.id===id);if(!order)return true;
    if(el.hasAttribute('data-order-export')){
      const rows=[['order_id','status','transmission','product_code','product_name','option_id','color','size','quantity','unit_cost','option_cost','arrival_date','data_hash'],...order.lines.flatMap(d=>d.options.filter(o=>o.quantity>0).map(o=>[order.id,order.status,order.transmission,d.code,d.name,o.id,o.color,o.size,o.quantity,o.unitCost,o.quantity*o.unitCost,d.arrivalDate,order.dataHash]))];
      download(order.id+'.csv','\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8');
    }else if(order.status==='DEV_CONFIRMED'&&window.confirm('이 DEV 발주서를 취소하고 예약 금액을 해제할까요? 취소 이력은 보관됩니다.')){
      if(storageFailure){announce('저장소 오류로 취소할 수 없습니다.');return true;}
      const prior=JSON.stringify(ledger);order.status='CANCELLED';order.cancelledAt=new Date().toISOString();
      const recordIds=new Set(order.lines.map(d=>d.id));ledger.decisions.filter(d=>recordIds.has(d.id)).forEach(d=>d.status='SUPERSEDED');save();
      if(storageFailure){ledger=JSON.parse(prior);announce('저장 실패: 취소되지 않았습니다.');return true;}
      redraw();announce('DEV 발주서를 취소했습니다. 상품을 다시 검토할 수 있습니다.');
    }
    return true;
  }
  function render(route) {
    if (route==='orders') return ordersPage();
    if (route==='overview') return overview();
    if (route==='decisions') return decisions();
    return window.OrdoDecisionLab[route](state,model,ledger);
  }
  function dataPanel() {
    return `<div class="eyebrow">${BUILD} / SOURCE CONTRACT</div><h2>Data & model</h2><p>DEV 반영 ${snapshot.meta.asOf} / 원본 ${snapshot.meta.sourceAsOf||snapshot.meta.asOf} · ${snapshot.products.length}개 상품 · 정적 합성 데이터. 매일 KST 08:00 이후 전일 DEV 주문을 반영하며, 열린 동안 60초마다 검사하고 미접속 일자는 다음 접속에 보충합니다. 외부 주문 수집·백그라운드 서버·LLM API는 연결되지 않았습니다.</p><div class="drawer-section"><b>계산 가능한 분석, 숨기지 않는 한계</b><p>최근 7일과 이전 관측 일수의 주문 속도, 요일, 옵션 재고, 실제 입고, 다음 검토일, 납기, MOQ, 차수, 예산을 같은 모델에서 계산합니다. 수요 70/100/130%는 가정 민감도이지 예측 적중률이 아닙니다.</p></div>${snapshot.calibration?`<div class="drawer-section"><b>DEV 재고 보정 · 별도 가정</b><p>관측 주문·상품 가격·납기·MOQ는 보존했습니다. 수요 근거가 있는 상품의 재고를 납기와 검토 간격 기준으로 다시 구성하고 초도 집행액을 함께 계산했습니다. 근거 없는 원본 재고는 그대로 남깁니다. 실제 재고 복원·실적 검증이 아니며 원본 재고·재무값도 별도 보관합니다.</p><p>현재 가정: 원본 REORDER 재고 커버 = (납기+7일)×0.35–0.80 / WATCH ×1.20–1.80 / HOLD ×2.50–4.00. 매출 차이를 임의로 더하지 않고 옵션별 소진·입고를 계산합니다.</p></div>`:''}<div class="drawer-section"><b>데이터 품질 경고</b>${list(snapshot.meta.warnings)}</div><div class="drawer-section"><b>관측 결과와 예측</b><p>미래 데이터가 없는 기간의 결과는 대기입니다. 과거 예측 평가는 시간순 분리 검증으로만 제공합니다. MD 기록은 이 브라우저에 저장되며 실제 발주가 아닙니다.</p><a href="WORKBENCH_REVIEW.md" target="_blank" rel="noopener">통합 분석·검증 보고서 ↗</a></div>`;
  }
  window.OrdoWorkbench={state,init,bind,render,routeState,routeHash,selectCode,dataPanel,refresh,inCurrentSource,getLedger:()=>ledger,getSnapshot:()=>snapshot,build:BUILD};
})();
