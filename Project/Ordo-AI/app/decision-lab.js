(function () {
  'use strict';
  const scenarioIds = ['conservative', 'balanced', 'aggressive'];
  const scenarioLabels = { conservative: '보수적 방어', balanced: '균형 성장', aggressive: '적극적 검토' };
  const fmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
  const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const number = value => fmt.format(n(value));
  const units = value => decimal.format(n(value));
  const won = value => `₩${number(value)}`;
  const deltaWon = value => `${n(value) > 0 ? '+' : n(value) < 0 ? '−' : ''}₩${number(Math.abs(n(value)))}`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = value => Array.isArray(value) ? value : [];
  const sum = (rows, key) => rows.reduce((total, row) => total + n(row[key]), 0);
  const outcomeLabel = row => row?.outcome?.startsWith('OBSERVED') ? (row.outcomeProvenance==='DEV_GENERATED'?'DEV 가상 사후 관측':'관측 구간 확보') : 'PENDING';
  const snapshot = () => window.OrdoSnapshot || { meta: {}, products: [], daily: [] };
  let renderModelMeta = {};
  const timestamp = value => {
    if (!value) return '아직 실행되지 않음';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? esc(value) : esc(date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }));
  };

  function header(eyebrow, title, description, controls = '') {
    return `<div class="page-head"><div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="page-context">${controls}<p>${description}</p></div></div>`;
  }
  function notice(view = '') {
    return view === 'simulator' ? '<div class="source-notice source-notice-compact"><span>전일 주문</span></div>' : '';
  }
  function selectedProduct(state, model) {
    return model.product(state.code) || snapshot().products.find(product => product.decision === 'REORDER') || snapshot().products[0];
  }
  function canonicalAnalysis(model, code) {
    const analysis = model.analysis(code);
    const funded = list(model.portfolio('ALL', 'balanced').reviewedRecommendations).find(row => row.code === code);
    if (!funded) return analysis;
    const budgetReason = '포트폴리오 방식별·전체 예산 우선순위 적용 후 예산 부족으로 추가 발주 0개';
    return { ...analysis, standaloneRecommendation: analysis.recommendation, funded,
      recommendation: { ...analysis.recommendation, action: funded.action, quantity: funded.quantity,
        summary: funded.budgetBlocked ? budgetReason : analysis.recommendation.summary,
        reasons: funded.budgetBlocked ? [budgetReason, ...list(analysis.recommendation.reasons)] : analysis.recommendation.reasons } };
  }
  function productSelect(product) {
    const products = snapshot().products;
    const candidateCount = products.filter(item => item.decision === 'REORDER').length;
    return `<div class="lab-product-control"><label for="lab-product">상품 선택 · 소스 후보 ${candidateCount}개 포함 전체 ${products.length}개</label><select id="lab-product" data-wb-product>${['REORDER', 'WATCH', 'HOLD'].map(decision => {
      const rows = products.filter(item => item.decision === decision);
      return `<optgroup label="원본 ${decision} · ${rows.length}개">${rows.map(item => `<option value="${esc(item.code)}" ${item.code === product.code ? 'selected' : ''}>${esc(item.code)} · ${esc(item.name)} · ${esc(item.productionType)}</option>`).join('')}</optgroup>`;
    }).join('')}</select></div>`;
  }
  function productBanner(product) {
    const roleNames = { MAIN: '메인', MAIN_CONCEPT: '메인 · 아이덴티티', SEASONAL_MAIN: '시즌 메인', PLANNING: '기획', CONCEPT: '컨셉', SEASONLESS: '시즌리스' };
    const identity = list(snapshot().brandProfile?.identities).find(item => item.code === product.identityCode);
    return `<div class="lab-product-banner" data-lab-product="${esc(product.code)}"><div><span class="mono-label">SELECTED PRODUCT</span><h2>${esc(product.name)}</h2><p>${esc(product.code)} · ${product.productionType === 'MANUFACTURING' ? '제조' : '사입'} · ${esc(product.category)} / ${esc(product.itemType)}</p><div class="lab-product-tags"><span>${esc(roleNames[product.brandRole || product.role] || product.role)}</span>${product.identityProduct ? `<span>BRAND IDENTITY · ${esc(identity?.label || product.identityCode)}</span>` : ''}</div></div><span class="lab-badge">원본 ${esc(product.decision)} · 현재 판단과 구분</span></div>`;
  }
  function weekdayGuide(analysis, forecast) {
    const product = analysis.product, observed = analysis.observed;
    const factors = list(renderModelMeta.effectiveWeekdayFactors || snapshot().policy?.weekdayFactors);
    const customWeekdays = Boolean(renderModelMeta.hasWeekdayOverrides);
    const factorMin = Math.min(...factors), factorMax = Math.max(...factors);
    const curve = snapshot().brandProfile?.seasonality?.[product.brandFamily] || {};
    const baseMonth = Number(String(snapshot().meta.asOf).slice(5, 7));
    const baseSeason = n(curve[baseMonth]) || n(curve[9]) || 1;
    const trend = observed.trendRatio == null ? 1 : Math.max(.85, Math.min(1.15, n(observed.trendRatio)));
    return `<section class="lab-card lab-weekday-guide"><div class="lab-section-heading"><div><span class="mono-label">DAILY SALES GUIDELINE / APPLIED MODEL RULE</span><h2>요일별 판매 지침이 매일의 예측에 반영됩니다.</h2></div><span>규칙 출처: ${customWeekdays ? '이 브라우저에서 편집한 MD 요일 가정' : '기본 MD 요일 정책'} · 관측값 아님</span></div><p><b>${customWeekdays ? '수정한 요일 가중치를 적용 중입니다. 요일의 높고 낮음은 아래 현재 계수에 따릅니다.' : '월·금은 높게, 화·수·목은 낮게, 주말은 피크로 계산합니다.'}</b> 아래 배수는 관측 매출이 아니며 상품별 기준 수요 ${n(observed.dailyRate).toFixed(3)}개/일에 적용됩니다. 실제 날짜별 결과에는 시즌·최근 추세·시나리오·입고와 재고 제한까지 반영합니다.</p><div class="lab-weekday-grid">${['월', '화', '수', '목', '금', '토', '일'].map((day, index) => `<div><span>${day}</span><b>×${n(factors[index]).toFixed(2)}</b><small>${customWeekdays ? factorMax === factorMin ? '동일 가정' : n(factors[index]) === factorMax ? '최대 가정' : n(factors[index]) === factorMin ? '최소 가정' : '편집된 가정' : index === 5 || index === 6 ? '주말 피크' : index === 0 || index === 4 ? '상승 요일' : '저점 요일'}</small></div>`).join('')}</div><div class="lab-formula">기준 일 수요 × 요일 × 월 시즌성 × 최근 추세 × 시나리오 수요 → 옵션 재고·입고일 한도 내 판매</div><div class="lab-rule-facts"><p><b>선택 수요 가정</b> ×${n(forecast.demandMultiplier).toFixed(2)} · 최근 추세는 ${trend.toFixed(2)}배까지 28일에 걸쳐 적용</p><p><b>품목 월 시즌성</b> ${Object.keys(curve).length ? [9,10,11,12,1,2].map(month => `${month}월 ×${((n(curve[month]) || 1) / baseSeason).toFixed(2)}`).join(' · ') : '별도 곡선 없음 · 1.00배'}<br><small>기준월 대비 상대 배수 · 과거 실적에서 학습한 계수가 아닌 샘플 시즌 가정</small></p><p><b>브랜드 역할</b> ${esc(product.brandRole || product.role)}${product.identityProduct ? ' · 브랜드 아이덴티티 유지 대상' : ''} · 역할 가중치는 포트폴리오 예산 우선순위에 적용하며, 낮은 수요나 MOQ·납기·예산 차단을 해제하지 않습니다.</p></div>${snapshot().brandProfile?.derived ? `<details><summary>브랜드 정책·아이덴티티 매핑 근거</summary><p>${esc(snapshot().brandProfile.derivation)}</p><ul class="lab-reasons">${list(snapshot().brandProfile.identities).map(item => `<li>${esc(item.season)} · ${esc(item.label)} — ${esc(item.sampleStatus)}</li>`).join('')}</ul><p>원본 품명·역할·생산방식은 source 필드로 보존했습니다. ${esc(product.sourceName)} / ${esc(product.sourceProductionType)} / ${esc(product.sourceRole)}</p></details>` : ''}</section>`;
  }
  function evidenceList(items, empty = '추가 기록 없음') {
    return items?.length ? `<ul class="lab-reasons">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : `<p class="lab-muted">${empty}</p>`;
  }
  function metric(label, value, detail = '') {
    return `<article class="lab-metric"><span>${label}</span><strong>${value}</strong>${detail ? `<small>${detail}</small>` : ''}</article>`;
  }
  function riskRows(analysis, forecast) {
    const product = analysis.product, observed = analysis.observed, risks = [];
    const add = (id, title, phase, severity, evidence, action, trigger) => risks.push({ id, title, phase, severity, evidence, action, trigger });
    if (list(forecast.blockers).length) add('policy-block', '발주 차단 조건', '현재 제약', 'high', forecast.blockers.join(' · '), '차단 근거와 공급사·예산·차수 조건을 확인하고 발주를 보류합니다.', '차단 조건이 해제되거나 납기·예산·검토 차수가 변경될 때 재계산');
    if (product.riskType && product.riskType !== 'NONE') add('supply', '공급·납기 위험', '현재 → 미래', product.blocked ? 'high' : 'medium', `${product.riskType} · 납기 ${number(forecast.leadTime)}일 · 모델 도착 ${forecast.arrivalDate}`, '공급사 확약과 실제 입고 가능일을 대조합니다.', '실제 입고일 또는 공급 위험 상태 변경');
    if (n(forecast.lostUnits) > .01) add('lost-demand', '예상 미충족 수요', '미래 가정', 'high', `동일 수요 가정에서 ${units(forecast.lostUnits)}개 미충족 · 추가 매출 ${deltaWon(forecast.additionalRevenue)}`, '옵션별 부족 날짜와 도착 전 품절 구간을 검토합니다.', '일별 미충족 수요가 0보다 큰 상태 지속 또는 가용 재고 변동');
    if (n(forecast.endingInventory) > .01) add('ending-stock', '시즌말 잔여재고 노출', '미래 가정', 'medium', `예상 잔여 ${units(forecast.endingInventory)}개 · 원가 ${won(forecast.endingInventoryCost)}`, '추가 발주 현금과 잔여 원가를 함께 비교하고 판매 계획을 점검합니다.', '최근 판매가 예상보다 낮아지거나 기말 재고 전망이 증가할 때');
    if (n(forecast.cost) > n(forecast.additionalRevenue)) add('cash-recovery', '추가 발주 현금 회수 부족', '미래 가정', 'high', `발주 현금 ${won(forecast.cost)} > 무발주 대비 추가 매출 ${won(forecast.additionalRevenue)}`, '회수 부족을 확인하고 수량 축소 또는 추가 발주 보류를 검토합니다.', '추가 매출 전망 또는 공급 원가가 바뀔 때');
    if (n(observed.last7Units) < n(observed.prev7Units)) add('sales-down', '최근 관측 판매 하락', '과거 → 현재', 'medium', `이전 7일 ${number(observed.prev7Units)}개 → 최근 7일 ${number(observed.last7Units)}개`, '프로모션·품절·시즌 전환 여부를 확인합니다. 하락의 원인은 단정하지 않습니다.', '다음 7일 검증 주문의 수량·옵션 구성 갱신');
    if (n(observed.last28Units) < 10) add('sparse-history', '희소한 수요 근거', '현재 근거', 'medium', `28일 검증 주문 ${number(observed.last28Units)}개 · 모델 희소 표본 기준 10개 미만`, '추가 관측을 확보하고 큰 수량 확대를 보수적으로 검토합니다.', '검증 주문 누적 표본 및 최근 판매 패턴 변화');
    add('source-quality', '재고·기초잔액 미검증', '공통 데이터 한계', 'medium', `소스 재고 ${number(product.inventory)}개는 합성 스냅샷 · 날짜 없는 기초 판매 포함`, '거래 이력·옵션 실재고·초도 집행 예산을 원본과 대조합니다.', '새 주문·실재고·예산 데이터 연결 또는 기존 오류 보정');
    return risks;
  }
  function productRiskSection(analysis, forecast) {
    const risks = riskRows(analysis, forecast);
    return `<section class="lab-card lab-risk-section"><div class="lab-section-heading"><div><span class="mono-label">WHY FORECAST / RISK REGISTER</span><h2>현재와 미래의 위험을 함께 검토합니다.</h2></div><span>우선순위는 검토 순서이며 발생 확률·확신도가 아닙니다.</span></div><p class="lab-muted">관측된 사실과 모델 가정을 구분합니다. 예측의 목적은 매출 수치만 보는 것이 아니라 품절·잔여 재고·현금·납기 노출에 대한 다음 행동을 결정하는 것입니다.</p><div class="lab-table-scroll"><table class="lab-table lab-risk-table"><thead><tr><th>위험 / 구간</th><th>검토 우선순위</th><th>근거</th><th>권장 확인 행동</th><th>다시 확인할 조건</th></tr></thead><tbody>${risks.map(risk => `<tr><th scope="row">${esc(risk.title)}<small>${esc(risk.phase)}</small></th><td><span class="lab-severity ${risk.severity}">${risk.severity === 'high' ? '우선 확인' : '관찰·검증'}</span></td><td>${esc(risk.evidence)}</td><td>${esc(risk.action)}</td><td>${esc(risk.trigger)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function scenarioCard(scenario, selected, index, sensitivity) {
    const metrics = [['발주 현금', won(scenario.cost)], ['예상 매출', won(scenario.forecastRevenue)], ['무발주 대비 추가 매출', deltaWon(scenario.additionalRevenue)], ['무발주 대비 매출총이익', deltaWon(scenario.additionalGrossProfit)], ['시즌말 재고 / 원가', `${units(scenario.endingInventory)}개 / ${won(scenario.endingInventoryCost)}`], ['예상 미충족 수요', `${units(scenario.lostUnits)}개`]];
    return `<button type="button" class="lab-scenario ${scenario.id === selected.id ? 'active' : ''}" data-lab-scenario="${scenario.id}" data-wb-scenario="${scenario.id}" aria-pressed="${scenario.id === selected.id}" aria-label="${esc(scenario.name)} 선택, ${scenario.manual ? '가상 시험' : '제안'} ${number(scenario.quantity)}개, 예상 매출 ${won(scenario.forecastRevenue)}"><span class="lab-scenario-select"><span>SCENARIO 0${index + 1} · ${scenario.id === selected.id ? '선택됨' : '카드 전체를 눌러 선택'}</span><b class="lab-scenario-title">${esc(scenario.name || scenarioLabels[scenario.id])}</b><strong>${number(scenario.quantity)}<small>개 ${scenario.manual ? '가상 시험' : '제안'}</small></strong><span>${sensitivity ? `수요 가정 ×${units(scenario.demandMultiplier)}` : '공통 수요 기준'} · ${scenario.manual ? '수동 수량 적용' : '자동 산정'}</span></span><span class="lab-scenario-metrics">${metrics.map(([label, value]) => `<span class="lab-scenario-metric"><span>${label}</span><b>${value}</b></span>`).join('')}</span><span class="lab-scenario-status">${scenario.allowed ? '정책 조건 내 시뮬레이션' : '발주 차단 조건 있음'}</span><span class="lab-scenario-reason">${esc(list(scenario.blockers)[0] || list(scenario.reasons).at(-1) || '실발주 전 소스 재고와 예산을 재확인하세요.')}</span></button>`;
  }
  function chart(rows, { title, amountKey = 'revenue', expected = false, baseline = false } = {}) {
    if (!rows.length) return '<p class="lab-empty">표시할 관측 행이 없습니다.</p>';
    const state = window.OrdoWorkbench?.state || {};
    const context = [state.code || title, state.scenario || 'balanced', state.manualBaseQty ?? 'auto', snapshot().meta.contentHash, renderModelMeta.runtimeFingerprint || ''].join(':');
    const graph = window.OrdoCharts
      ? window.OrdoCharts.render(rows.map(row => ({ ...row, revenue: row[amountKey] })), { id: `lab-${state.code || ''}-${title}`, title, expected, baseline, context, observedThrough: snapshot().meta.asOf })
      : '<p class="lab-muted">대화형 차트를 불러오지 못했습니다. 아래 날짜별 표에서 값을 확인하세요.</p>';
    const weekday = date => (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;
    const traded=rows.filter(row=>n(row.units)!==0||n(row[amountKey])!==0);
    const visibleRows=expected?rows:(state.showZeroDays?rows:traded).slice().reverse();
    const observedSummary=expected?'':`<div class="lab-observed-summary"><b>기간 합계 ${units(sum(rows,'units'))}개 · ${won(sum(rows,amountKey))}</b><p>주문이 있는 날짜 ${traded.length}일 / 전체 ${rows.length}일 · 최근 날짜부터 표시합니다. ${traded.length?'0인 날짜는 해당 상품의 주문이 없는 날입니다.':'이 상품에는 해당 기간의 관측 주문이 없습니다. 누락 여부를 확인해야 하며 가짜 매출을 채우지 않습니다.'}</p><button class="btn ghost" data-wb-zero-days aria-pressed="${!!state.showZeroDays}">${state.showZeroDays?'판매 발생일만 보기':'무판매일(0)도 포함해서 보기'}</button><small>원본 합성 주문과 DEV 생성 주문을 포함한 관측 원장입니다. 실제 브랜드 실적이 아닙니다.</small></div>`;
    const tableRows = visibleRows.map(row => `<tr data-lab-date="${esc(row.date)}"><td>${esc(row.date)}<small>${['월','화','수','목','금','토','일'][weekday(row.date)]}${snapshot().devFeed&&row.date>snapshot().devFeed.baseAsOf?' · DEV 생성':''}</small></td>${expected ? `<td>×${n(row.weekdayFactor ?? (renderModelMeta.effectiveWeekdayFactors || snapshot().policy?.weekdayFactors)?.[weekday(row.date)]).toFixed(2)}</td>` : ''}<td>${units(row.units)}</td><td>${won(row[amountKey])}</td>${expected ? `<td>${units(row.inventory)}</td><td>${number(row.receivedUnits)}</td><td>${units(row.lostUnits)}</td>` : ''}${baseline ? `<td>${won(row.baselineRevenue)}</td>` : ''}</tr>`).join('');
    return `<figure class="lab-chart">
      <figcaption><b>${esc(title || '일별 순주문액')}</b><span>${expected ? '예측 · 실현값 아님' : '관측 · 검증 주문 기준'}</span></figcaption>
      ${graph}
      ${observedSummary}
      <details ${expected ? 'open' : ''}><summary>${expected ? '날짜별 예상 수량·매출·재고 · 요일 지침 적용 결과' : '정확한 관측 일별 값 확인'}</summary><div class="lab-table-scroll" tabindex="0" aria-label="날짜별 ${expected ? '예상' : '관측'} 값, 표 안에서 세로와 가로 스크롤"><table class="lab-table"><thead><tr><th>날짜</th>${expected ? '<th>요일 계수*</th>' : ''}<th>${expected ? '예상 판매량' : '검증 수량'}</th><th>${expected ? '예상 매출' : '순주문액'}</th>${expected ? '<th>일말 재고</th><th>입고량</th><th>미충족 수요</th>' : ''}${baseline ? '<th>무발주 기준</th>' : ''}</tr></thead><tbody>${tableRows}</tbody></table></div>${expected ? '<p class="lab-muted">* 요일 계수 외에 월별 시즌성·최근 추세·선택 수요 가정을 함께 적용합니다. 입고와 일말 재고는 날짜별 수불 계산값이며 실제 입출고 이력이 아닙니다.</p>' : ''}</details>
    </figure>`;
  }

  function simulator(state, model, ledger = {}) {
    renderModelMeta = model.meta || {};
    const product = selectedProduct(state, model);
    if (!product) return '<section class="page lab-page"><p>선택 가능한 상품이 없습니다.</p></section>';
    const analysis = canonicalAnalysis(model, product.code);
    const scenarios = scenarioIds.map(id => model.simulate(product.code, id, 'ALL', state.manualBaseQty ?? null));
    const selected = scenarios.find(scenario => scenario.id === state.scenario) || scenarios[1];
    const recommendation = analysis.recommendation;
    const recorded = list(ledger.decisions).filter(row => row.code === product.code);
    const funding = snapshot().policy?.budgetByMethod?.[product.productionType];
    const availableBudget = n(typeof funding === 'number' ? funding : funding?.availableBudget);
    const activeCommitments = list(ledger.decisions).filter(row => (window.OrdoWorkbench?.inCurrentSource?.(row) ?? row.dataHash === snapshot().meta.contentHash) && row.code !== product.code && row.status === 'SIMULATED_APPROVAL');
    const reservedBudget = sum(activeCommitments.filter(row => row.productionType === product.productionType), 'cost');
    const globalRemaining = (snapshot().policy?.availableBudget ?? Infinity) - sum(activeCommitments, 'cost');
    const remainingBudget = Math.max(0, Math.min(availableBudget - reservedBudget, globalRemaining));
    const noOrder = scenarios.every(scenario => n(scenario.quantity) === 0);
    const selectedBlocked = n(selected.quantity) > 0 && (!selected.allowed || selected.cost > remainingBudget);
    const demandCases = [...new Set(scenarios.map(scenario => scenario.demandMultiplier))];
    const sensitivity = demandCases.length > 1;
    return `<section class="page audited-page lab-page" data-lab-view="simulator">${header('SIMULATOR / PRODUCT DECISION LAB', '수량의 근거를 보고,<br>MD가 최종 판단합니다.', '현재 권고는 전체 예산 배분 후 판단 · 아래 카드는 선택 상품의 수량·수요 가정 비교', productSelect(product))}${notice('simulator')}<div class="lab-container">${productBanner(product)}
      <div class="lab-model-note"><b>${state.manualBaseQty != null ? '수동 수량 스트레스 테스트' : '검증 주문 기반 자동 검토'}</b><span>${sensitivity ? '세 카드는 수요 민감도 가정이 다릅니다. 매출 상승만으로 우열을 판단하지 않으며, 각 카드의 추가 효과는 같은 수요의 무발주 기준과 비교합니다.' : '세 카드는 동일 수요·가격·예측 기간을 사용합니다. 발주 수량에 따른 결과를 같은 무발주 기준과 비교합니다.'} 모두 ${esc(selected.from)}–${esc(selected.to)}. 카드와 하단 결과는 선택 상품의 독립 시험이며, 기록 시에는 다른 상품의 예약 현금을 포함한 잔여 예산을 다시 확인합니다.</span></div>
      <div class="lab-card lab-metrics">${metric('초도 차감 후 방식별 예산', won(availableBudget), `${esc(product.productionType)} · 원본 계획 기준`)}${metric('다른 상품 검토 예약', won(reservedBudget), '동일 소스의 활성 로컬 검토 기록')}${metric('이 상품 검토 가능액', won(remainingBudget), '방식별·전체 예산 중 작은 잔액 · 같은 상품 기록은 교체')}${metric('현재 판매 가능 재고', number(selected.inventoryAtStart) + '개', `소스 잔액 ${number(product.inventory)}개 · 입고 전 옵션 판매 제한`)}</div>
      <div class="lab-recommendation"><div><span class="mono-label">CURRENT FUNDED MODEL RECOMMENDATION</span><h2>${esc(recommendation.action)} · ${number(recommendation.quantity)}개</h2><p>${esc(recommendation.summary)}</p></div><div>${evidenceList(recommendation.reasons)}</div></div>
      ${noOrder ? '<p class="lab-zero-note"><b>세 시나리오 모두 0개를 제안합니다.</b> 숫자를 다르게 보이게 하기 위해 발주량을 만들지 않았습니다. 아래 재고·최근 수요·예산·차단 사유를 확인하세요. 필요하면 별도 수동 수량으로 민감도를 시험할 수 있습니다.</p>' : ''}
      <div class="lab-scenarios" role="group" aria-label="상품별 시나리오 선택">${scenarios.map((scenario, index) => scenarioCard(scenario, selected, index, sensitivity)).join('')}</div>
      <section class="lab-card lab-manual"><div><h2>가정 수량 시험 · 입력 후 적용</h2><p>입력만으로 값이 바뀌지 않습니다. 적용 버튼을 누르면 아래 요약·옵션·그래프가 동일한 수량을 사용합니다. 수동 시험은 입력 ${state.manualBaseQty == null ? '수량' : number(state.manualBaseQty) + '개'}을 그대로 계산하며 MOQ ${number(selected.moq)}개나 차단 조건에 맞지 않아도 가상 결과는 보여줍니다. 조건을 통과하지 못한 수량은 승인할 수 없습니다.</p><p class="lab-applied-quantity" data-lab-applied-qty>${state.manualBaseQty == null ? '현재 적용: 자동 산정 · 자동 제안은 MOQ를 반영' : `현재 적용: 수동 입력 ${number(state.manualBaseQty)}개 = 가상 입고 ${number(selected.quantity)}개 · 승인 가능 ${number(selected.approvalQuantity ?? (selected.allowed ? selected.quantity : 0))}개`}</p></div><div class="lab-input-row"><label for="lab-manual">선택 상품 총 리오더 수량 (전체 컬러·사이즈 합계)<input id="lab-manual" type="number" min="0" max="1000000" step="1" inputmode="numeric" data-wb-manual value="${esc(state.manualDraftQty ?? (state.manualBaseQty == null ? '' : n(state.manualBaseQty)))}" placeholder="수량 입력 후 적용"></label><button type="button" class="btn orange-btn" data-wb-manual-apply>입력 수량 적용</button><button type="button" class="btn ghost" data-wb-source-qty ${!n(product.reorderQty) ? 'disabled' : ''}>원본 제안 ${number(product.reorderQty)}개 적용</button><button type="button" class="btn ghost" data-wb-reset-qty ${state.manualBaseQty == null ? 'disabled' : ''}>자동 제안으로 복원</button></div></section>
      <section class="lab-card lab-selected-summary" data-lab-selected-scenario="${selected.id}"><div class="lab-section-heading"><h2>선택한 시나리오: ${esc(selected.name)}</h2><span>수요 ×${units(selected.demandMultiplier)} · 도착 후 검토 ${number(selected.coverage)}일 · ${state.manualBaseQty == null ? '자동 제안' : selected.simulationOnly ? '수동 가상 시험 · 승인 불가' : '수동 수량 적용'}</span></div><div class="lab-metrics">${metric(selected.manual ? '가상 시험 수량' : '자동 제안 수량', `${number(selected.quantity)}개`, `승인 가능 ${number(selected.approvalQuantity ?? (selected.allowed ? selected.quantity : 0))}개 · MOQ ${number(selected.moq)}개`)}${metric('발주 현금', won(selected.cost))}${metric('예상 매출', won(selected.forecastRevenue), `무발주 대비 ${deltaWon(selected.additionalRevenue)}`)}${metric('시즌말 재고', `${units(selected.endingInventory)}개`, `원가 ${won(selected.endingInventoryCost)}`)}</div>${selected.simulationOnly ? `<p class="lab-zero-note"><b>승인 불가 가상 시험입니다.</b>${esc(list(selected.blockers).join(' · '))} 아래 옵션·그래프는 입력 수량이 가상으로 입고된 경우이며 실제 승인·입고가 아닙니다.</p>` : !n(selected.quantity) ? `<p class="lab-zero-note">0개인 이유: ${esc(list(selected.blockers).join(' · ') || list(selected.reasons).at(-1) || '추가 발주 필요량이 없습니다.')} 예측과 무발주 기준이 겹치면 추가 발주 효과도 0원입니다.</p>` : ''}</section>
      ${productRiskSection(analysis, selected)}
      <section class="lab-card"><div class="lab-section-heading"><div><span class="mono-label">COLOR × SIZE ALLOCATION</span><h2>${esc(product.name)} · ${esc(selected.name || scenarioLabels[selected.id])}</h2></div><span>도착 ${esc(selected.arrivalDate)} · 물리 리드타임 ${number(selected.leadTime)}일</span></div><p class="lab-muted">옵션별 최근 검증 수요·가용 재고·도착 후 부족량을 함께 사용합니다. 소스 재고에는 아직 입고되지 않은 옵션이 포함될 수 있어 판매는 입고·출시일 이후에만 계산합니다. 예상 판매량은 소수점 기대값이며 실제 주문 수량이 아닙니다.</p><div class="lab-table-scroll" tabindex="0" aria-label="색상 사이즈별 시뮬레이션 표, 좁은 화면에서 가로 스크롤"><table class="lab-table lab-options"><thead><tr><th>컬러 / 사이즈</th><th>소스 재고</th><th>일 수요</th><th>발주 배분</th><th>예상 판매</th><th>예상 매출</th><th>기말 재고</th><th>미충족 수요</th><th>배분 근거</th></tr></thead><tbody>${list(selected.options).map(option => `<tr data-lab-option="${esc(option.id)}"><th scope="row">${esc(option.color)} / ${esc(option.size)}<small>${esc(option.id)}</small></th><td>${number(option.stock)}</td><td>${units(option.dailyRate)}</td><td><b>${number(option.quantity)}</b><small>${(n(option.share) * 100).toFixed(1)}%</small></td><td>${units(option.forecastUnits)}</td><td>${won(option.forecastRevenue)}</td><td>${units(option.endingInventory)}</td><td>${units(option.lostUnits)}</td><td class="lab-option-reason">${esc(option.reason)}</td></tr>`).join('')}</tbody><tfoot><tr><th>합계</th><td>${number(sum(selected.options, 'stock'))}</td><td>${units(sum(selected.options, 'dailyRate'))}</td><td>${number(selected.quantity)}</td><td>${units(selected.forecastUnits)}</td><td>${won(selected.forecastRevenue)}</td><td>${units(selected.endingInventory)}</td><td>${units(selected.lostUnits)}</td><td>발주 배분 합계 ${number(sum(selected.options, 'quantity'))}개</td></tr></tfoot></table></div></section>
      <div class="lab-two-columns"><section class="lab-card"><h2>왜 이 결과인가</h2>${evidenceList(selected.reasons)}<h3>검토해야 할 위험</h3>${evidenceList([...new Set([...list(selected.risks), ...list(selected.blockers)])])}</section><section class="lab-card lab-approval"><span class="mono-label">MD REVIEW / NO SUPPLIER ACTION</span><h2>${n(selected.quantity) === 0 ? '추가 발주 없이 관찰합니다.' : '수량과 납기를 확인하고 기록하세요.'}</h2><p>검토 기록은 이 브라우저에만 저장합니다. 실제 주문 전송·매입 확정·성과 실현이 아닙니다.</p>${selectedBlocked ? `<p class="lab-blocked">이 수량은 차단 조건이 있어 승인 기록을 만들 수 없습니다.</p>${evidenceList(selected.blockers)}` : ''}<label for="lab-note">MD 판단 메모 (선택)<textarea id="lab-note" data-wb-note maxlength="600" rows="3" placeholder="선택 근거, 확인할 재고 또는 공급사 조건"></textarea></label><div class="lab-actions"><button type="button" class="btn orange-btn" data-wb-approve ${selectedBlocked ? 'disabled' : ''}>${n(selected.quantity) === 0 ? '0개 · 관찰 결정 기록' : '시뮬레이션 검토 기록'} →</button><button type="button" class="btn ghost" data-wb-export="csv">옵션 CSV</button></div><p class="lab-muted">이 상품의 저장된 검토 ${recorded.length}건 · 향후 실적이 들어오기 전 성과 상태는 PENDING입니다.</p></section></div>
      <section class="lab-card">${chart(list(selected.daily), { title: '일별 예상 매출과 무발주 기준', expected: true, baseline: true })}</section>
    </div></section>`;
  }

  function reportSummary(state, model, ledger, product) {
    const analysis = canonicalAnalysis(model, product.code);
    const observed = analysis.observed;
    const forecast = model.simulate(product.code, state.scenario || 'balanced', 'ALL', state.manualBaseQty ?? null);
    const portfolio = model.portfolio('ALL', 'balanced');
    const lastDecision = list(ledger.decisions).filter(row => row.code === product.code).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const trend = !n(observed.prev7Units) ? '이전 7일 판매 0 · 비율 계산 불가' : `이전 7일 원수량 대비 ${((n(observed.last7Units) / n(observed.prev7Units) - 1) * 100).toFixed(1)}%`;
    return `${productBanner(product)}<div class="lab-timeline"><div><span>01 · 과거</span><b>이전 7일 ${number(observed.prev7Units)}개</b><small>검증 주문만 집계</small></div><div><span>02 · 최근 / 현재</span><b>최근 7일 ${number(observed.last7Units)}개</b><small>${esc(trend)} · 재고 ${number(product.inventory)}개</small></div><div><span>03 · 미래 가정</span><b>예상 매출 ${won(forecast.forecastRevenue)}</b><small>${esc(forecast.from)}–${esc(forecast.to)} · 선택 상품 독립 시나리오 · 실적 아님</small></div><div><span>04 · 사후 결과</span><b>${outcomeLabel(lastDecision)}</b><small>${lastDecision?.outcome?.startsWith('OBSERVED') ? `${number(lastDecision.coverageDays)}일 관측 · 인과적 추가 성과 아님` : '기준일 이후 실제 관측이 필요'}</small></div></div><div class="lab-two-columns"><section class="lab-card">${chart(list(observed.history), { title: `${product.code} · 최근 관측 이력` })}</section><section class="lab-card">${chart(list(forecast.daily), { title: `${product.code} · 미래 시뮬레이션`, expected: true, baseline: true })}</section></div><section class="lab-card"><div class="lab-section-heading"><div><span class="mono-label">DETERMINISTIC ANALYST REPORT / FUNDED RECOMMENDATION</span><h2>${esc(analysis.recommendation.action)} · ${esc(analysis.recommendation.summary)}</h2></div><button class="btn ghost" data-wb-open="simulator" data-wb-code="${esc(product.code)}">상품 시나리오 다시 보기 →</button></div><div class="lab-analysis-grid"><article><h3>판단 근거</h3>${evidenceList(analysis.recommendation.reasons)}</article><article><h3>다른 선택의 비용</h3><p>선택 시나리오의 발주 현금은 ${won(forecast.cost)}, 무발주 대비 추가 매출은 ${deltaWon(forecast.additionalRevenue)}, 매출총이익 차이는 ${deltaWon(forecast.additionalGrossProfit)}입니다.</p><p>시즌말 ${units(forecast.endingInventory)}개 / ${won(forecast.endingInventoryCost)}의 재고 원가가 남고, 수요 ${units(forecast.lostUnits)}개는 충족하지 못할 수 있습니다. 추가 매출 0일 때 구매 현금을 투입해도 판매가 늘었다고 해석하지 않습니다.</p></article><article><h3>판단의 한계</h3>${evidenceList([...new Set([...list(analysis.recommendation.risks), ...list(forecast.risks), ...list(forecast.blockers)])])}</article></div><p class="lab-muted">외부 LLM이 작성하거나 검증한 리포트가 아닙니다. 동일 입력·동일 규칙으로 재현되는 모델 근거입니다. 매출총이익은 판매 원가 차감 후 금액이며 운영비·세금 포함 영업이익이 아닙니다.</p></section><section class="lab-card"><div class="lab-section-heading"><h2>전체 포트폴리오 · 균형 가정</h2><span>선택 상품과 구분 · ${snapshot().products.length}개 상품</span></div><div class="lab-metrics">${metric('예상 매출', won(portfolio.forecastRevenue), `${esc(portfolio.from)}–${esc(portfolio.to)}`)}${metric('발주 현금', won(portfolio.purchaseCost), '자동 제안 기준 · 수동 시험 제외')}${metric('추가 매출', deltaWon(portfolio.additionalRevenue), '같은 수요의 무발주 대비')}${metric('기말 재고 원가', won(portfolio.endingInventoryCost), '비용이 사라진 것으로 처리하지 않음')}</div><p class="lab-muted">현재 재산정 ${Object.entries(portfolio.counts || {}).map(([key, value]) => `${esc(key)} ${number(value)}개`).join(' · ')}. 소스 REORDER 91개는 이전 누적 모델의 후보 목록으로 별도 보존합니다.</p></section>`;
  }

  function reportEvaluation(model) {
    const backtest = model.backtest();
    const metrics = list(backtest.metrics);
    const percent = value => value == null ? '계산 불가' : `${(n(value) * 100).toFixed(1)}%`;
    return `<section class="lab-card"><span class="mono-label">HISTORICAL HOLDOUT / NOT FUTURE ACCURACY</span><h2>과거 분리 검증</h2><p>${esc(backtest.method)}</p><p class="lab-muted">훈련 종료일 다음의 관측만 평가합니다. 아래 값은 합성 주문의 제한된 과거 성능이며, ‘미래 AI 적중률’이 아닙니다. 브랜드 일별 수량의 오차를 평가하며 상품별 적중률로 해석하지 않습니다. 분모 0은 계산 불가입니다.</p><div class="lab-evaluation-cards">${metrics.map(row => `<article class="lab-evaluation-metric"><h3>${number(row.horizon)}일 예측</h3><b>${percent(row.wape)}</b><span>WAPE · 낮을수록 오차 작음</span><dl><div><dt>검증 구간</dt><dd>${number(row.folds)}개</dd></div><div><dt>실제 / 예측 수량</dt><dd>${units(row.actualUnits)} / ${units(row.predictedUnits)}</dd></div><div><dt>일별 MAE</dt><dd>${row.mae == null ? '계산 불가' : `${units(row.mae)}개`}</dd></div><div><dt>수량 편향</dt><dd>${percent(row.bias)}</dd></div><div><dt>단순 기준 WAPE</dt><dd>${row.baselineWape == null ? '미산출' : percent(row.baselineWape)}</dd></div></dl></article>`).join('')}</div><p class="lab-muted">WAPE = 절대오차 합계 ÷ 실제 수량 합계. 양의 편향은 과대 예측, 음의 편향은 과소 예측입니다. 검증 구간은 겹칠 수 있으므로 전체 행을 독립적인 새로운 표본으로 더하지 않습니다.</p><div class="lab-table-scroll"><table class="lab-table"><thead><tr><th>검증 구간</th><th>훈련 시작–종료</th><th>평가 시작</th><th>평가 종료</th><th>훈련 / 평가 일수</th><th>실제 수량</th><th>예측 수량</th><th>WAPE</th></tr></thead><tbody>${list(backtest.folds).map((fold, index) => `<tr><th scope="row">FOLD ${index + 1} · ${number(fold.horizon)}일</th><td>${esc(fold.trainingStart)}<br>${esc(fold.trainThrough)}</td><td>${esc(fold.from)}</td><td>${esc(fold.to)}</td><td>${number(fold.trainingDays)} / ${number(fold.horizon)}</td><td>${units(fold.actualUnits)}</td><td>${units(fold.predictedUnits)}</td><td>${percent(fold.wape)}</td></tr>`).join('')}</tbody></table></div><h3>평가 범위와 한계</h3>${evidenceList(backtest.limitations)}</section>`;
  }

  function reportHistory(ledger) {
    const decisions = list(ledger.decisions).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const reviewed = Object.entries(ledger.alertReviews || {});
    const decisionLabel = row => ({ REORDER: 'REORDER · 리오더 검토', WATCH: 'WATCH · 관찰', HOLD: 'HOLD · 보류', NO_ORDER: 'NO_ORDER · 추가 발주 없음' }[row.action] || (n(row.quantity) ? 'REORDER · 리오더 검토' : 'NO_ORDER · 추가 발주 없음'));
    const recordStatus = row => row.status === 'SUPERSEDED' ? '대체된 이전 결정' : row.status === 'SIMULATED_APPROVAL' ? '현재 로컬 검토 · 실발주 아님' : '현재 로컬 판단';
    const outcomes = row => {
      const changed = row.needsReview || row.runtimeFingerprint !== renderModelMeta.runtimeFingerprint;
      const policy = changed ? `<span class="lab-policy-warning">${row.runtimeFingerprint ? '계산 규칙 변경 · 재검토 필요' : '계산 규칙 버전 미기록 · 재검토 필요'}</span><small>기록 당시 예측을 보존했습니다. 현재 정책으로 자동 승인되지 않습니다.</small>` : '';
      const superseded = row.status === 'SUPERSEDED' ? '<small>다음 검토로 교체된 이전 기록</small>' : '';
      return policy + superseded + (row.outcome === 'OBSERVED' || row.outcome === 'OBSERVED_PARTIAL'
        ? `<b>${outcomeLabel(row)}</b><small>${esc(row.evaluatedThrough)}까지 ${number(row.coverageDays)} / ${number(row.totalForecastDays)}일</small><small>관측 ${units(row.observedUnits)}개 / ${won(row.observedRevenue)}</small><small>같은 구간 예측 ${units(row.predictedUnitsToDate)}개 / ${won(row.predictedRevenueToDate)}</small><small>수량 차이 ${units(row.unitsError)}개 · 인과적 추가 성과 아님</small>`
        : '<b>PENDING</b><small>후속 실제 주문 관측 필요</small>');
    };
    return `<section class="lab-card"><div class="lab-section-heading"><div><span class="mono-label">LOCAL REVIEW LOG</span><h2>MD 검토 이력 ${decisions.length}건</h2></div><button type="button" class="btn ghost" data-wb-export="report">검토 리포트 내보내기</button></div><p class="lab-muted">이 브라우저에 저장된 시뮬레이션 검토입니다. 기록만으로 발주가 실행되지 않습니다. 미래 관측이 없는 건은 완료나 적중으로 표시하지 않습니다. 사후 관측도 발주로 얻은 인과적 추가 매출이나 ROI가 아닙니다.</p>${decisions.length ? `<div class="lab-table-scroll"><table class="lab-table lab-history"><thead><tr><th>검토 시점 / 상품</th><th>결정 / 시나리오</th><th>수량 / 현금</th><th>기록 당시 예상 매출</th><th>데이터 기준</th><th>사후 실적</th><th>MD 메모</th></tr></thead><tbody>${decisions.map(row => `<tr><th scope="row">${timestamp(row.createdAt)}<button type="button" class="lab-text-link" data-wb-open="simulator" data-wb-code="${esc(row.code)}">${esc(row.code)} ↗</button></th><td>${decisionLabel(row)}<small>${recordStatus(row)}</small><small>${esc(scenarioLabels[row.scenarioId] || row.scenarioId)}${row.manualBaseQty == null ? ' · 자동' : ' · 수동 시험'}</small></td><td>${number(row.quantity)}개<small>${won(row.cost)}</small></td><td>${won(row.forecastRevenue)}<small>무발주 대비 ${deltaWon(row.additionalRevenue)}</small></td><td>${esc(row.asOf || '—')}<small>${esc(row.modelVersion || '')}</small></td><td>${outcomes(row)}</td><td>${esc(row.note || '메모 없음')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="lab-empty"><h3>아직 기록된 결정이 없습니다.</h3><p>Simulator에서 상품을 선택한 뒤 MD 검토를 기록하면 여기에 표시됩니다. 예시 승인 이력을 만들지 않았습니다.</p><button class="btn orange-btn" data-wb-open="simulator">상품 검토 시작 →</button></div>'}</section><section class="lab-card"><h2>모니터링 확인 이력 ${reviewed.length}건</h2>${reviewed.length ? `<ul class="lab-review-log">${reviewed.map(([id, review]) => `<li><b>${esc(id)}</b><span>${review.status === 'snoozed' ? '보류' : '확인'} · ${timestamp(review.timestamp)}</span></li>`).join('')}</ul>` : '<p class="lab-muted">아직 알림을 확인하거나 보류하지 않았습니다.</p>'}</section>`;
  }

  function aggregateReports(state, model) {
    const source = snapshot().products.filter(product => product.decision === 'REORDER');
    const portfolio = model.portfolio('ALL', 'balanced');
    const reviewedByCode = new Map(list(portfolio.reviewedRecommendations).map(row => [row.code, row]));
    const currentCodes = new Set([...reviewedByCode.values()].filter(row => row.action === 'REORDER').map(row => row.code));
    const current = snapshot().products.filter(product => currentCodes.has(product.code));
    const scope = state.reportScope === 'current' ? 'current' : 'source';
    const products = scope === 'current' ? current : source;
    const reports = products.map(product => {
      const analysis = model.analysis(product.code);
      const reviewed = reviewedByCode.get(product.code) || analysis.recommendation;
      const forecast = model.simulate(product.code, 'balanced', 'ALL', reviewed.budgetBlocked ? 0 : null);
      const fundedForecast = reviewed.budgetBlocked ? { ...forecast, blockers: [...list(forecast.blockers), '포트폴리오 방식별·전체 예산 우선순위 적용 후 가용 예산 부족 · 추가 발주 0개'] } : forecast;
      return { product, analysis, reviewed, forecast: fundedForecast, risks: riskRows(analysis, fundedForecast) };
    });
    const groupedRisks = new Map();
    reports.forEach(report => report.risks.forEach(risk => {
      if (!groupedRisks.has(risk.id)) groupedRisks.set(risk.id, { ...risk, affected: [] });
      groupedRisks.get(risk.id).affected.push({ code: report.product.code, name: report.product.name, evidence: risk.evidence });
    }));
    const highCount = reports.filter(report => report.risks.some(risk => risk.severity === 'high')).length;
    const actionCounts = ['REORDER', 'WATCH', 'HOLD'].map(action => `${action} ${reports.filter(report => report.reviewed.action === action).length}개`).join(' · ');
    const totals = reports.map(report => report.forecast);
    const forecastTotal = key => sum(totals, key);
    const aggregateMetrics = [
      metric('개별 리포트', `${products.length}개`, actionCounts),
      metric('후보 최근 7일 주문', `${number(reports.reduce((total, row) => total + n(row.analysis.observed.last7Units), 0))}개`, '검증 조건을 통과한 관측 주문'),
      metric('우선 확인 위험 상품', `${highCount}개`, '중복 위험은 상품별 한 번만 집계'),
      metric('예산 반영 제안 수량', `${number(reports.reduce((total, row) => total + n(row.reviewed.quantity), 0))}개`, '포트폴리오 방식별·전체 예산 적용'),
      metric('범위 전체 예상 매출', won(forecastTotal('forecastRevenue')), `${esc(portfolio.from)}–${esc(portfolio.to)} · 실적 아님`),
      metric('같은 수요의 무발주 매출', won(forecastTotal('baselineRevenue')), '발주 효과의 비교 기준'),
      metric('무발주 대비 추가 매출', deltaWon(forecastTotal('additionalRevenue')), '매출 전체를 발주 성과로 해석하지 않음'),
      metric('제안 발주 현금', won(forecastTotal('cost')), '자동·예산 배분 반영 · 수동 시험 제외'),
      metric('시즌말 재고 원가', won(forecastTotal('endingInventoryCost')), `${units(forecastTotal('endingInventory'))}개 잔여 가정`),
      metric('예상 미충족 수요', `${units(forecastTotal('lostUnits'))}개`, '날짜별 옵션 부족 기대량'),
      metric('예상 판매량', `${units(forecastTotal('forecastUnits'))}개`, '관측 주문과 구분한 미래 가정'),
      metric('무발주 대비 매출총이익', deltaWon(forecastTotal('additionalGrossProfit')), '운영비·세금 포함 영업이익이 아님')
    ].join('');
    return `<section class="lab-card lab-report-scope"><div class="lab-section-heading"><div><span class="mono-label">ALL CANDIDATE REPORTS / AGGREGATE FIRST</span><h2>${scope === 'source' ? '원본 리오더 후보' : '현재 재산정 리오더 후보'} ${products.length}개 전체 리포트</h2></div><div class="segments" aria-label="리포트 후보 범위"><button type="button" data-wb-report-scope="source" class="${scope === 'source' ? 'active' : ''}" aria-pressed="${scope === 'source'}">원본 후보 ${source.length}</button><button type="button" data-wb-report-scope="current" class="${scope === 'current' ? 'active' : ''}" aria-pressed="${scope === 'current'}">현재 재산정 ${current.length}</button></div></div><p>기본 화면은 특정 상품 한 개가 아니라 선택 범위의 모든 후보입니다. 원본 후보는 누적 소스 모델의 기록이며 현재 발주 권고와 다릅니다. 각 행에서 해당 상품의 전체 분석·일별 예측·위험 리포트를 열 수 있습니다.</p><div class="lab-metrics lab-aggregate-metrics" data-lab-aggregate-metrics>${aggregateMetrics}</div></section>
      <section class="lab-card lab-aggregate-risks"><div class="lab-section-heading"><div><span class="mono-label">RISK ACROSS ALL CANDIDATES</span><h2>전체 후보 위험 지도</h2></div></div><p class="lab-muted">왜 예측하는지 드러내는 검토 목록입니다. ‘우선 확인’은 발생 확률이 아니라 납기·공급·수요 미충족·현금 조건에 대한 검토 순서입니다. 날짜 없는 기초잔액은 모든 후보의 공통 한계입니다.</p><div class="lab-risk-types">${[...groupedRisks.values()].map(risk => `<article class="lab-risk-type" data-lab-risk-type="${risk.id}"><div><span class="lab-severity ${risk.severity}">${risk.severity === 'high' ? '우선 확인' : '관찰·검증'}</span><h3>${esc(risk.title)}</h3><b>${risk.affected.length}개 상품</b></div><p>${esc(risk.action)}</p><small>재점검: ${esc(risk.trigger)}</small><details><summary>영향 상품 ${risk.affected.length}개와 근거 보기</summary><ul>${risk.affected.map(item => `<li><button type="button" data-wb-report-code="${esc(item.code)}">${esc(item.code)} · ${esc(item.name)} ↗</button><span>${esc(item.evidence)}</span></li>`).join('')}</ul></details></article>`).join('') || '<p class="lab-empty">이 범위에 현재 재산정 후보가 없습니다. 원본 후보 범위에서 제외 사유를 확인하세요.</p>'}</div></section>
      <section class="lab-card"><div class="lab-section-heading"><h2>후보별 분석 리포트 ${reports.length}개</h2><span>모든 행 개별 열람 가능 · 각 수치는 상품코드별 계산</span></div><div class="lab-candidate-reports">${reports.map(({ product, analysis, reviewed, forecast, risks }) => {
        const observed = analysis.observed;
        const change = observed.prev7Units ? `${((observed.last7Units / observed.prev7Units - 1) * 100).toFixed(1)}%` : '이전 0개 · 비율 미산출';
        const priority = risks.filter(risk => risk.severity === 'high');
        return `<article class="lab-candidate-report" data-lab-report-code="${esc(product.code)}"><header><div><span class="mono-label">${esc(product.code)} · ${product.productionType === 'MANUFACTURING' ? '제조' : '사입'}</span><h3>${esc(product.name)}</h3><p>원본 ${esc(product.decision)} → 예산 배분 후 <b>${esc(reviewed.action)}</b> · 제안 ${number(reviewed.quantity)}개</p></div><button type="button" class="btn orange-btn" data-wb-report-code="${esc(product.code)}">이 상품 전체 리포트 →</button></header><div class="lab-candidate-facts"><p><b>과거·현재 주문</b>이전 7일 ${number(observed.prev7Units)}개 → 최근 7일 ${number(observed.last7Units)}개<br>${esc(change)} · ${won(observed.last7Revenue)}</p><p><b>미래 가정</b>예상 매출 ${won(forecast.forecastRevenue)}<br>미충족 ${units(forecast.lostUnits)}개 · 기말 ${units(forecast.endingInventory)}개</p><p><b>현재 판단 근거</b>${reviewed.budgetBlocked ? '포트폴리오 예산 우선순위 적용 후 예산 부족 · 발주 0개' : esc(analysis.recommendation.summary)}<br>개별 수요 검토: ${esc(analysis.recommendation.action)} · ${number(analysis.recommendation.quantity)}개<br>${esc(list(analysis.recommendation.reasons)[0])}</p><p><b>주요 위험 ${risks.length}개</b>${(priority.length ? priority : risks).slice(0, 2).map(risk => `${esc(risk.title)}: ${esc(risk.evidence)}`).join('<br>')}</p></div></article>`;
      }).join('') || '<div class="lab-empty"><h3>현재 범위에 후보가 없습니다.</h3><p>원본 후보를 선택해 보류·관찰 근거를 검토하세요.</p></div>'}</div></section>`;
  }

  function reports(state, model, ledger = {}) {
    renderModelMeta = model.meta || {};
    const product = selectedProduct(state, model);
    if (!product) return '<section class="page lab-page"><p>분석할 상품이 없습니다.</p></section>';
    const tabs = [['summary', 'ANALYST REPORT'], ['evaluation', 'EVALUATION'], ['history', 'HISTORY']];
    const tab = tabs.some(item => item[0] === state.reportTab) ? state.reportTab : 'summary';
    const controls = `<div class="segments" role="tablist" aria-label="리포트 종류">${tabs.map(([id, label]) => `<button type="button" role="tab" id="lab-tab-${id}" aria-controls="lab-report-panel" aria-selected="${tab === id}" class="${tab === id ? 'active' : ''}" data-wb-report-tab="${id}">${label}</button>`).join('')}</div>`;
    const productView = state.reportView === 'product';
    const analysis = productView ? canonicalAnalysis(model, product.code) : null;
    const forecast = productView ? model.simulate(product.code, state.scenario || 'balanced', 'ALL', state.manualBaseQty ?? null) : null;
    const viewControls = `<div class="lab-report-view-controls"><button type="button" class="btn ${!productView ? 'orange-btn' : 'ghost'}" data-wb-report-view="aggregate" aria-pressed="${!productView}">전체 후보 리포트</button>${productView ? `<span>${esc(product.code)} 개별 리포트</span>` : '<span>기본: 원본 후보 전체 · 현재 재산정 후보와 분리</span>'}</div>`;
    const summary = productView ? productSelect(product) + weekdayGuide(analysis, forecast) + productRiskSection(analysis, forecast) + reportSummary(state, model, ledger, product) : aggregateReports(state, model);
    return `<section class="page audited-page lab-page" data-lab-view="reports" data-lab-report-view="${productView ? 'product' : 'aggregate'}">${header('REPORTS / EVIDENCE AND OUTCOMES', '전체 후보의 근거와,<br>예측해야 할 위험을 봅니다.', '전체 집계 → 개별 상품 분석 → 위험·후속 결과 추적', controls)}${notice()}<div class="lab-container">${tab === 'summary' ? viewControls : ''}<div id="lab-report-panel" role="tabpanel" aria-labelledby="lab-tab-${tab}">${tab === 'summary' ? summary : tab === 'evaluation' ? reportEvaluation(model) : reportHistory(ledger)}</div></div></section>`;
  }

  function dailyFeedPanel() {
    const s=snapshot(), feed=s.devFeed, last=feed?.batches.at(-1);
    const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
    const reference=[today,s.meta.asOf].sort().at(-1), week=window.OrdoCalendar?.nextWeek(reference);
    return `<div class="lab-next-week"><b>다음주 일정 · ${week?.from||'—'}–${week?.to||'—'}</b><span>${week?.events.length?week.events.map(e=>esc(e.date.slice(5))+' '+esc(e.title)).join(' / '):'캘린더에 등록된 주요 일정이 없습니다.'}</span><small>메인 캘린더 기준</small></div><section class="lab-card lab-dev-feed"><div class="lab-section-heading"><div><span class="mono-label">DAILY ORDER FEED</span><h2>${s.meta.asOf}까지 반영</h2></div></div>${window.OrdoDevFeed?.warning?`<p class="lab-blocked">${esc(window.OrdoDevFeed.warning)}</p>`:''}<details><summary>주문 원장 · ${feed?.rows||0}건 (최근 200건 표시)</summary><button class="btn ghost" data-wb-dev-export>전체 주문 CSV</button><div class="lab-table-scroll"><table class="lab-table"><thead><tr><th>주문 ID / 날짜</th><th>상품·옵션</th><th>수량</th><th>매출</th></tr></thead><tbody>${(feed?.orders||[]).slice(-200).reverse().map(o=>`<tr><td>${esc(o.id)}<small>${o.date}</small></td><td>${esc(o.code)}<small>${esc(o.optionId)}</small></td><td>${number(o.units)}</td><td>${won(o.revenue)}</td></tr>`).join('')}</tbody></table></div></details></section>`;
  }
  function today(state, model, ledger = {}) {
    const alerts = list(model.monitor());
    const reviews = ledger.alertReviews || {};
    const active = alerts.filter(alert => !reviews[alert.id] || reviews[alert.id].status === 'needs-review');
    const archived = alerts.filter(alert => reviews[alert.id]?.status === 'reviewed');
    const reviewedCount = archived.length;
    const snoozedCount = alerts.filter(alert => reviews[alert.id]?.status === 'snoozed').length;
    const high = active.filter(alert => ['critical', 'high', 'CRITICAL', 'HIGH'].includes(alert.severity));
    const portfolio = model.portfolio('ALL', 'balanced');
    const asOf = snapshot().meta.asOf;
    const runs = list(ledger.runs).slice(0, 5);
    const latest = runs[0];

    const alertCard = (alert, archive = false) => {
      const review = reviews[alert.id]?.status === 'needs-review' ? null : reviews[alert.id];
      const severity = String(alert.severity || 'info').toLowerCase();
      const evidence = typeof alert.evidence === 'string' ? alert.evidence
        : Array.isArray(alert.evidence) ? alert.evidence.join(' · ')
          : Object.entries(alert.evidence || {}).map(([key, value]) => `${key}: ${value}`).join(' · ');
      const archiveClass = archive ? 'reviewed reviewed-archive' : reviews[alert.id]?.status === 'needs-review' ? 'needs-review' : '';
      return `<article class="lab-alert ${archiveClass}" data-lab-alert="${esc(alert.id)}"><div class="lab-alert-heading"><span class="lab-severity ${esc(severity)}">${esc(severity.toUpperCase())}</span><h3>${esc(alert.title)}</h3><span class="lab-review-state">${archive ? '✓ 확인 아카이브' : reviews[alert.id]?.status === 'needs-review' ? '새 데이터 · 재검토 필요' : '미확인'}</span></div><p>${esc(evidence)}</p>${evidenceList(list(alert.reasons), '')}<div class="lab-alert-footer"><span>${esc(alert.action || '내용을 확인하고 MD가 판단합니다.')}${archive && review ? ` · ${timestamp(review.timestamp)}` : ''}</span>${archive ? '' : `<div class="lab-actions"><button type="button" class="btn ghost" data-wb-alert="${esc(alert.id)}" data-wb-alert-action="reviewed">확인</button><button type="button" class="btn ghost" data-wb-alert="${esc(alert.id)}" data-wb-alert-action="snoozed">보류</button></div>`}</div></article>`;
    };

    const priorityList = active.length
      ? active.map(alert => alertCard(alert)).join('')
      : '<div class="lab-empty"><h3>미확인 우선순위가 없습니다.</h3><p>확인한 항목은 아래 아카이브에 남고, 보류한 항목은 Today 목록에서 숨겨집니다.</p></div>';
    const archiveList = archived.length
      ? `<section class="lab-card lab-reviewed-archive"><div class="lab-section-heading"><h2>확인 아카이브</h2><span>주요 의사결정 근거로 남긴 항목 · ${number(archived.length)}건</span></div><div class="lab-alerts">${archived.map(alert => alertCard(alert, true)).join('')}</div></section>`
      : '';

    return `<section class="page audited-page lab-page" data-lab-view="today">${header('TODAY / LOCAL MONITOR', '지금 확인할 변화를,<br>근거와 함께 정리합니다.', '', '<div class="lab-today-actions"><button type="button" class="btn orange-btn" data-wb-collect-yesterday>전일 주문 수집 ↓</button><button type="button" class="btn ghost" data-wb-refresh>지금 다시 점검 ↻</button></div>')}${notice()}<div class="lab-container">${dailyFeedPanel()}<div class="lab-run-status"><span class="lab-badge">LOCAL CHECK</span><p>마지막 실행 <b>${timestamp(ledger.lastRun || latest?.at)}</b></p><span>검토 기록 ${list(ledger.decisions).length}건</span></div><div class="lab-metrics lab-card">${metric('미확인 알림', number(active.length), `확인 아카이브 ${reviewedCount} / 보류 숨김 ${snoozedCount} / 전체 ${alerts.length}건`)}${metric('우선 확인', number(high.length), 'critical / high 중 미확인')}${metric('현재 재산정 REORDER', number(portfolio.counts?.REORDER), '원본 후보 91개와 구분')}${metric('전체 균형 발주 현금', won(portfolio.purchaseCost), '미검증 재고·예산 제약 적용')}</div><section class="lab-card"><div class="lab-section-heading"><h2>검토 우선순위</h2><span>확인한 항목은 의사결정 아카이브에 남고, 보류한 항목은 Today에서 숨겨집니다. 주문·재고·발주 상태는 바뀌지 않습니다.</span></div><div class="lab-alerts">${priorityList}</div></section>${archiveList}<section class="lab-card"><div class="lab-section-heading"><h2>최근 로컬 점검</h2><span>수동 수집과 재점검 실행 이력을 기록합니다.</span></div>${runs.length ? `<div class="lab-table-scroll"><table class="lab-table"><thead><tr><th>실행 시점</th><th>데이터 기준</th><th>소스 변화</th><th>감지 알림</th></tr></thead><tbody>${runs.map(run => `<tr><td>${timestamp(run.at)}</td><td>${esc(run.dataAsOf)}</td><td>${run.changed ? '변경 감지' : '동일 스냅샷'}</td><td>${number(run.alertCount)}건</td></tr>`).join('')}</tbody></table></div>` : '<p class="lab-muted">아직 점검 실행 기록이 없습니다. ‘지금 다시 점검’으로 첫 기록을 만드세요.</p>'}</section></div></section>`;
  }

  window.OrdoDecisionLab = Object.freeze({ simulator, reports, today });
}());
