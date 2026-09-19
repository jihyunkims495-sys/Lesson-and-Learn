/*
 * Independent daily FX reference widget. No brand/customer data leaves the browser.
 * Sources verified 2026-09-18:
 * https://frankfurter.dev/ and https://frankfurter.dev/javascript/ (v2, public CORS)
 * https://frankfurter.dev/providers/bnm/ (Bank Negara Malaysia, daily)
 * https://api.frankfurter.dev/v2/providers/BNM (USD/CNY/VND/KRW coverage)
 * https://www.bnm.gov.my/exchange-rates (underlying official source)
 * GET /v2/rates?base=USD|CNY|VND&quotes=KRW&providers=BNM&from=...&to=...
 * Direct bases preserve precision; no inversion of rounded KRW/USD quotes.
 * Only published observations are drawn. No weekend/holiday/future carry-forward.
 */
(function (global) {
  'use strict';
  const API = 'https://api.frankfurter.dev/v2/rates';
  const CACHE_KEY = 'ordo.fx.bnm.daily.v1';
  const REFRESH_MS = 30 * 60 * 1000;
  const DAY_MS = 86400000;
  const currencies = [{ code: 'USD', name: '미국 달러', unit: 1 }, { code: 'CNY', name: '중국 위안', unit: 1 }, { code: 'VND', name: '베트남 동', unit: 100 }];
  const records = Object.fromEntries(currencies.map(currency => [currency.code, { rows: [], fetchedAt: null, checkedAt: null, cached: false, error: '' }]));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  let selected = 'USD', selectedIndex = null, cacheLoaded = false, active = null;
  const isoDay = value => new Date(value).toISOString().slice(0, 10);
  const today = () => isoDay(Date.now());
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && isoDay(value + 'T00:00:00Z') === value;
  function shiftDate(date, days) { return isoDay(Date.parse(date + 'T00:00:00Z') + days * DAY_MS); }
  function monthStart(date) {
    const value = new Date(date + 'T00:00:00Z'), day = value.getUTCDate();
    value.setUTCDate(1); value.setUTCMonth(value.getUTCMonth() - 1);
    const end = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
    value.setUTCDate(Math.min(day, end)); return isoDay(value);
  }
  function normalizeRows(payload, code, from, to) {
    if (!Array.isArray(payload)) throw new Error('환율 응답 형식을 확인할 수 없습니다.');
    const days = new Map();
    for (const row of payload) {
      if (!row || row.base !== code || row.quote !== 'KRW' || !validDate(row.date) || row.date < from || row.date > to) continue;
      if (typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0) continue;
      if (days.has(row.date) && days.get(row.date).rate !== row.rate) throw new Error('같은 공시일에 서로 다른 환율이 반환되었습니다.');
      days.set(row.date, { date: row.date, base: code, quote: 'KRW', rate: row.rate });
    }
    const rows = [...days.values()].sort((left, right) => left.date.localeCompare(right.date));
    if (!rows.length) throw new Error('최근 한 달의 유효한 공시 환율이 없습니다.');
    return rows;
  }
  function weeklyChange(rows) {
    const latest = rows.at(-1); if (!latest) return null;
    const target = shiftDate(latest.date, -7);
    const baseline = [...rows].reverse().find(row => row.date <= target);
    if (!baseline) return null;
    return { latest, baseline, target, absolute: latest.rate - baseline.rate, percent: (latest.rate / baseline.rate - 1) * 100 };
  }
  function rateText(rate, code) {
    const currency = currencies.find(item => item.code === code);
    return Number(rate * currency.unit).toLocaleString('ko-KR', { minimumFractionDigits: code === 'VND' ? 4 : 2, maximumFractionDigits: code === 'VND' ? 4 : 2 });
  }
  function timeText(value) {
    if (!value) return '없음';
    return new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) + ' KST';
  }
  function loadCache() {
    if (cacheLoaded) return; cacheLoaded = true;
    try {
      const cached = JSON.parse(global.localStorage.getItem(CACHE_KEY));
      for (const currency of currencies) {
        const entry = cached?.[currency.code];
        if (!entry || !Number.isFinite(entry.fetchedAt) || entry.fetchedAt > Date.now()) continue;
        try { records[currency.code] = { rows: normalizeRows(entry.rows, currency.code, monthStart(today()), today()), fetchedAt: entry.fetchedAt, checkedAt: null, cached: true, error: '' }; } catch (_) { /* Invalid/old cache is not presented as a quote. */ }
      }
    } catch (_) { /* Storage is optional; a live public request still works. */ }
  }
  function saveCache() {
    try { global.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(currencies.map(({ code }) => [code, { rows: records[code].rows, fetchedAt: records[code].fetchedAt }])))); } catch (_) { /* Private mode/storage quota must not break rendering. */ }
  }
  function status(record) {
    if (!record.rows.length) return record.error ? '조회 실패 · 환율 없음' : '공개 환율 조회 대기';
    const age = (Date.parse(today()) - Date.parse(record.rows.at(-1).date)) / DAY_MS;
    const delayed = age > 4 ? ` · 오래된 공시 (${age}일 경과)` : '';
    if (record.error) return '갱신 실패 · 저장된 공시값' + delayed;
    if (record.cached) return '브라우저 저장값 · 재확인 대기' + delayed;
    return age > 4 ? '응답 확인 · 공시일 지연' + delayed : '응답 확인 · 일별 기준환율';
  }
  function chartMarkup(record, currency) {
    const rows = record.rows;
    if (!rows.length) return '<div class="or-fx-empty"><b>표시할 공시 환율이 없습니다.</b><p>연결되면 최근 한 달의 실제 제공일만 표시합니다. 조회 실패를 임의 값이나 직선으로 채우지 않습니다.</p></div>';
    const index = Math.max(0, Math.min(rows.length - 1, selectedIndex == null ? rows.length - 1 : selectedIndex));
    const selectedRow = rows[index];
    const min = Math.min(...rows.map(row => row.rate)), max = Math.max(...rows.map(row => row.rate));
    const pad = Math.max((max - min) * .15, max * .001), low = min - pad, high = max + pad;
    const x = row => 58 + ((Date.parse(row.date) - Date.parse(rows[0].date)) / Math.max(DAY_MS, Date.parse(rows.at(-1).date) - Date.parse(rows[0].date))) * 270;
    const y = row => 142 - (row.rate - low) / (high - low) * 116;
    const ticks = [high, (high + low) / 2, low];
    const path = rows.map((row, position) => `${position ? 'L' : 'M'}${x(row).toFixed(2)},${y(row).toFixed(2)}`).join(' ');
    return `<div class="or-fx-chart-head"><b>최근 한 달 · ${currency.unit} ${currency.code} / KRW</b><span>${rows.length}개 공시일</span></div><svg class="or-fx-chart" viewBox="0 0 346 174" role="img" aria-label="${currency.code} 원화 기준환율 추이. 아래 날짜 선택으로 정확한 값을 확인하세요.">${ticks.map(rate => `<line x1="58" x2="328" y1="${y({ rate }).toFixed(2)}" y2="${y({ rate }).toFixed(2)}" class="or-fx-grid"/><text x="49" y="${(y({ rate }) + 3).toFixed(2)}" text-anchor="end">${rateText(rate, currency.code)}</text>`).join('')}<path d="${path}" class="or-fx-line"/>${rows.map((row, position) => `<circle cx="${x(row).toFixed(2)}" cy="${y(row).toFixed(2)}" r="${position === index ? 4.5 : 2}" class="or-fx-dot ${position === index ? 'selected' : ''}"/>`).join('')}<text x="58" y="164">${rows[0].date.slice(5)}</text><text x="328" y="164" text-anchor="end">${rows.at(-1).date.slice(5)}</text><rect x="53" y="17" width="281" height="135" fill="transparent" data-fx-plot/></svg><div class="or-fx-readout" aria-live="polite"><span data-fx-selected-date>${selectedRow.date} 공시</span><strong data-fx-selected-rate>₩${rateText(selectedRow.rate, currency.code)}</strong></div><label class="or-fx-slider">공시일 선택 · 화살표 키로 이동<input type="range" min="0" max="${rows.length - 1}" step="1" value="${index}" data-fx-point aria-label="${currency.code} 공시일 선택" aria-valuetext="${selectedRow.date}, ${currency.unit} ${currency.code} 당 ${rateText(selectedRow.rate, currency.code)}원" ${rows.length === 1 ? 'disabled' : ''}></label><button type="button" class="or-fx-latest" data-fx-latest>최근 공시로 돌아가기</button><details class="or-fx-values"><summary>공시일별 숫자 ${rows.length}건 보기</summary><div><table><thead><tr><th>공시일</th><th>${currency.unit} ${currency.code} → KRW</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.date}</td><td>₩${rateText(row.rate, currency.code)}</td></tr>`).join('')}</tbody></table></div></details>`;
  }
  function contents() {
    const currency = currencies.find(item => item.code === selected), record = records[selected], change = weeklyChange(record.rows);
    const busy = Boolean(active?.busy), current = record.rows.at(-1);
    const week = change ? `${change.percent > 0 ? '+' : ''}${change.percent.toFixed(2)}%` : '비교 자료 없음';
    return `<header class="or-fx-heading"><div><span>IMPORT COST / DAILY FX</span><h2>매입 통화 환율</h2></div><button type="button" data-fx-refresh ${busy ? 'disabled' : ''} aria-label="공개 일별 환율 다시 조회">${busy ? '조회 중…' : '새로고침 ↻'}</button></header><p class="or-fx-intro">외부 일별 기준환율 · 실시간 체결가 아님</p><div class="or-fx-currencies" role="group" aria-label="환율 통화 선택">${currencies.map(item => { const entry = records[item.code], latest = entry.rows.at(-1); return `<button type="button" data-fx-currency="${item.code}" aria-pressed="${selected === item.code}" class="${selected === item.code ? 'active' : ''}"><span>${item.unit} ${item.code}</span><strong>${latest ? '₩' + rateText(latest.rate, item.code) : '—'}</strong><small>${item.name}${entry.error ? ' · 조회 실패' : entry.cached ? ' · 저장값' : ''}</small></button>`; }).join('')}</div><div class="or-fx-week"><span>직전 1주 변화</span><b class="${change && change.percent > 0 ? 'up' : change && change.percent < 0 ? 'down' : ''}" data-fx-weekly>${week}</b><small>${change ? `${change.baseline.date} → ${change.latest.date} · ${change.absolute > 0 ? '+' : change.absolute < 0 ? '−' : ''}₩${rateText(Math.abs(change.absolute), selected)}` : '최근 공시일의 7일 전까지 기준 공시가 필요합니다.'}</small></div><div data-fx-chart-container>${chartMarkup(record, currency)}</div><div class="or-fx-status ${record.error ? 'error' : ''}" role="status"><b>${busy ? '공개 API 확인 중 · ' : ''}${status(record)}</b><span>환율 공시 ${current?.date || '없음'} · 최근 성공 ${timeText(record.fetchedAt)}</span><span>조회 시도 ${timeText(record.checkedAt)}${record.error ? ` · ${esc(record.error)}` : ''}</span></div><p class="or-fx-note">화면에 보이는 동안 30분마다 재확인합니다. 주간 변화는 최신 공시의 7일 전 또는 그 이전 가장 가까운 공시와 비교합니다. 주말·휴장일을 새 공시로 만들지 않으며, 선은 공시점 사이의 안내선입니다. VND는 100동 기준입니다.</p><footer class="or-fx-source"><a href="https://www.bnm.gov.my/exchange-rates" target="_blank" rel="noopener noreferrer">Bank Negara Malaysia ↗</a><a href="https://frankfurter.dev/providers/bnm/" target="_blank" rel="noopener noreferrer">Frankfurter v2 경유 ↗</a><span>브랜드 분석의 합성 데이터와 별도 · 매입 환전 수수료·거래 스프레드 미포함</span></footer>`;
  }
  function render() { loadCache(); return `<section class="or-fx" data-or-fx aria-label="외부 일별 환율">${contents()}</section>`; }
  function paint(binding = active) { if (binding && active === binding && binding.element.isConnected) binding.element.innerHTML = contents(); }
  async function refresh(binding = active) {
    if (!binding || active !== binding || binding.busy || global.document.hidden || !binding.visible) return;
    binding.busy = true; binding.lastAttempt = Date.now();
    const from = monthStart(today()), to = today();
    const controller = new AbortController(); binding.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    for (const currency of currencies) records[currency.code].checkedAt = binding.lastAttempt;
    paint(binding);
    await Promise.all(currencies.map(async ({ code }) => {
      try {
        const params = new URLSearchParams({ base: code, quotes: 'KRW', providers: 'BNM', from, to });
        const response = await global.fetch(`${API}?${params}`, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error(response.status === 429 ? '조회 제한 · 잠시 후 다시 확인하세요.' : `공개 API 응답 오류 (${response.status})`);
        const rows = normalizeRows(await response.json(), code, from, to);
        if (active !== binding) return;
        records[code] = { rows, fetchedAt: Date.now(), checkedAt: binding.lastAttempt, cached: false, error: '' };
      } catch (error) {
        if (active !== binding) return;
        records[code].cached = Boolean(records[code].rows.length);
        records[code].error = error.name === 'AbortError' ? '응답 시간 초과' : error instanceof TypeError ? '연결 실패 · 네트워크/CORS를 확인하세요.' : error.message;
      }
    }));
    clearTimeout(timeout);
    if (active !== binding) return;
    binding.busy = false; binding.controller = null; selectedIndex = null; saveCache(); paint(binding);
  }
  function bind(root = global.document) {
    const element = root.matches?.('[data-or-fx]') ? root : root.querySelector('[data-or-fx]');
    if (active?.element === element && element?.isConnected) return;
    destroy(); if (!element) return;
    const box = element.getBoundingClientRect();
    const binding = { element, busy: false, lastAttempt: 0, visible: box.bottom > 0 && box.top < global.innerHeight, controller: null };
    active = binding;
    const choosePoint = index => {
      const rows = records[selected].rows; if (!rows.length) return;
      selectedIndex = Math.max(0, Math.min(rows.length - 1, Number(index)));
      const row = rows[selectedIndex], currency = currencies.find(item => item.code === selected), input = element.querySelector('[data-fx-point]');
      if (input) { input.value = selectedIndex; input.setAttribute('aria-valuetext', `${row.date}, ${currency.unit} ${selected} 당 ${rateText(row.rate, selected)}원`); }
      element.querySelector('[data-fx-selected-date]').textContent = row.date + ' 공시';
      element.querySelector('[data-fx-selected-rate]').textContent = '₩' + rateText(row.rate, selected);
      element.querySelectorAll('.or-fx-dot').forEach((dot, position) => { dot.setAttribute('r', position === selectedIndex ? '4.5' : '2'); dot.classList.toggle('selected', position === selectedIndex); });
    };
    const click = event => {
      const control = event.target.closest('button'); if (!control || !element.contains(control)) return;
      if (control.dataset.fxCurrency) { selected = control.dataset.fxCurrency; selectedIndex = null; paint(binding); element.querySelector(`[data-fx-currency="${selected}"]`)?.focus({ preventScroll: true }); }
      if (control.hasAttribute('data-fx-refresh')) refresh(binding);
      if (control.hasAttribute('data-fx-latest')) choosePoint(records[selected].rows.length - 1);
    };
    const input = event => { if (event.target.matches('[data-fx-point]')) choosePoint(event.target.value); };
    const point = event => {
      if (!event.target.matches('[data-fx-plot]')) return;
      const rows = records[selected].rows; if (!rows.length) return;
      const rect = event.target.getBoundingClientRect(), fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const target = Date.parse(rows[0].date) + fraction * (Date.parse(rows.at(-1).date) - Date.parse(rows[0].date));
      choosePoint(rows.reduce((nearest, row, index) => Math.abs(Date.parse(row.date) - target) < Math.abs(Date.parse(rows[nearest].date) - target) ? index : nearest, 0));
    };
    const check = () => {
      if (!element.isConnected) { if (active === binding) destroy(); return; }
      if (binding.visible && !global.document.hidden && Date.now() - binding.lastAttempt >= REFRESH_MS) refresh(binding);
    };
    element.addEventListener('click', click); element.addEventListener('input', input); element.addEventListener('pointermove', point); element.addEventListener('pointerdown', point);
    global.document.addEventListener('visibilitychange', check);
    binding.timer = setInterval(check, 60000);
    if (global.IntersectionObserver) { binding.observer = new IntersectionObserver(entries => { binding.visible = entries.some(entry => entry.isIntersecting); if (binding.visible) element.dataset.fxVisible = 'true'; check(); }, { threshold: .35 }); binding.observer.observe(element); }
    else element.dataset.fxVisible = 'true';
    binding.cleanup = () => { element.removeEventListener('click', click); element.removeEventListener('input', input); element.removeEventListener('pointermove', point); element.removeEventListener('pointerdown', point); global.document.removeEventListener('visibilitychange', check); };
    check();
  }
  function destroy() {
    if (!active) return;
    const previous = active; active = null;
    previous.controller?.abort(); clearInterval(previous.timer); previous.observer?.disconnect(); previous.cleanup?.();
  }
  const api = Object.freeze({ render, bind, destroy });
  if (typeof module !== 'undefined' && module.exports) module.exports = { normalizeRows, weeklyChange, monthStart, shiftDate, rateText, REFRESH_MS };
  else global.OrdoFx = api;
}(typeof window !== 'undefined' ? window : globalThis));
