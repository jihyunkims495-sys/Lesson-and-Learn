(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:1});
  const launch=document.createElement('button');launch.className='dt-launch';launch.innerHTML='<span>●</span> DAYTONA · 서버 시뮬레이션';launch.setAttribute('aria-haspopup','dialog');
  const dialog=document.createElement('dialog');dialog.className='dt-dialog';dialog.setAttribute('aria-labelledby','dt-title');
  dialog.innerHTML='<div class="dt-head"><span>ORDO × DAYTONA / INDEPENDENT DEMO</span><button type="button" class="dt-close" aria-label="Daytona 시연 닫기">×</button></div><h2 id="dt-title">같은 상품, 세 가지 물량 시나리오.</h2><p>현재 화면과 동일한 계산 코드를 <b>Daytona 서버에서 직접 실행</b>합니다.<br>기존 제출 사이트와 분리된 시연 버전입니다.</p><form id="dt-form"><div class="dt-grid"><label>분석할 상품<select id="dt-sku" name="sku"></select></label><label>예측 기간<select id="dt-horizon"><option value="D+3">D+3</option><option value="D+7">D+7</option><option value="D+14">D+14</option><option value="D+21">D+21</option><option value="ALL">전체 판매 기간</option></select></label><label>수동 기준 물량 (선택)<input id="dt-qty" type="number" min="0" max="1000000" step="1" placeholder="비워두면 자동"></label></div><p class="dt-safety" id="dt-input-note"></p><button class="dt-submit" type="submit">Daytona에서 3개 시나리오 계산 →</button></form><div class="dt-status" role="status" aria-live="polite"></div><div id="dt-result"></div><p class="dt-safety">합성 데이터 기반 DEV 시연 · 독립 SKU 계산(포트폴리오 예산 배분 전)<br>Nosana·외부 LLM 미사용 · 실제 발주 전송 없음 · 최종 판단은 MD가 수행합니다.</p>';
  document.body.append(launch,dialog);
  const q=s=>dialog.querySelector(s),state=()=>window.OrdoWorkbench.state;
  let weekly,weights;
  launch.addEventListener('click',()=>{
    const products=window.OrdoWorkbench.getSnapshot().products;
    q('#dt-sku').innerHTML=products.map(p=>`<option value="${esc(p.code)}">${esc(p.code)} · ${esc(p.name)}</option>`).join('');
    q('#dt-sku').value=state().code;q('#dt-horizon').value=state().horizon;
    q('#dt-qty').value=state().manualBaseQty??'';
    weekly=state().promotionUnits?state().promotionUnits.slice():undefined;
    weights=window.OrdoModel.meta.effectiveWeekdayFactors?.slice();
    q('#dt-input-note').textContent=weekly?'OVERVIEW에서 적용한 월–일 수동 판매 수량: '+weekly.join(' / '):'기본 요일별 판매 패턴 적용 · OVERVIEW에서 수동 시뮬을 적용하면 해당 입력을 함께 전달합니다.';
    q('#dt-result').replaceChildren();q('.dt-status').textContent='상품과 기간을 선택한 뒤 서버 계산을 실행하세요.';
    dialog.showModal();
  });
  q('.dt-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>launch.focus());
  q('#dt-form').addEventListener('submit',async e=>{
    e.preventDefault();const button=q('.dt-submit'),status=q('.dt-status');button.disabled=true;status.classList.remove('dt-error');status.textContent='Daytona에서 계산 중…';q('#dt-result').replaceChildren();
    const input={sku:q('#dt-sku').value,horizon:q('#dt-horizon').value,asOf:window.OrdoWorkbench.getSnapshot().meta.asOf,weekdayFactors:weights,manualBaseQty:q('#dt-qty').value===''?null:Number(q('#dt-qty').value)};
    if(weekly)input.promotionUnits=weekly;
    try {
      const response=await fetch('/api/simulate',{method:'POST',headers:{'Content-Type':'application/json','X-Daytona-Skip-Preview-Warning':'true'},body:JSON.stringify(input),signal:AbortSignal.timeout(20000)});
      const result=await response.json();if(!response.ok)throw Error(result.error||'서버 계산에 실패했습니다.');
      const c=result.calculation;
      status.textContent='✓ Daytona 서버 계산 완료 · '+new Date(result.executedAt).toLocaleTimeString('ko-KR');
      q('#dt-result').innerHTML=`<div class="dt-result-note"><b>${esc(c.sku)} · ${esc(c.horizon)} · 자동 권고 ${esc(c.recommendation.action)}</b><br>기준일 ${esc(input.asOf)} · 최근 7일 판매 ${num(c.observed.last7Units)}개<br>실행 ID: ${esc(result.executionId)}</div><div class="dt-table-wrap"><table class="dt-table"><thead><tr><th>시나리오</th><th>수량</th><th>원가</th><th>예상 매출</th><th>검토 상태</th></tr></thead><tbody>${c.scenarios.map(s=>`<tr><td>${esc(s.name)}</td><td>${num(s.quantity)}개</td><td>₩${num(s.cost)}</td><td>₩${num(s.forecastRevenue)}</td><td>${s.allowed?'MD 검토 가능':'제약 확인 필요'}</td></tr>`).join('')}</tbody></table></div><p class="dt-safety">이 결과는 서버에서 새로 계산했으며 기존 브라우저 발주 기록을 변경하지 않습니다. 수동 기준 물량 입력 시 시나리오 수량에 반영되며, 자동 권고 분류와는 구분됩니다.</p>`;
    }catch(error){status.classList.add('dt-error');status.textContent='계산을 완료하지 못했습니다. '+(error.name==='TimeoutError'?'응답 시간이 초과되었습니다.':error.message)+' 기존 화면은 계속 사용할 수 있습니다.';}
    finally{button.disabled=false;}
  });
})();
