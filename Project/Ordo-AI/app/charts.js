(function (root) {
  'use strict';
  const registry = new Map();
  const bindings = new Map();
  function pruneBindings() {
    for (const [section, binding] of bindings) {
      if (section.isConnected) continue;
      binding.controller.abort(); binding.observer?.disconnect(); binding.visibilityObserver?.disconnect();
      delete section.dataset.chartBound; bindings.delete(section);
    }
    const liveKeys = new Set([...bindings.keys()].map(section => section.dataset.chartKey));
    for (const key of registry.keys()) {
      if (registry.size <= 40) break;
      if (!liveKeys.has(key)) registry.delete(key);
    }
  }
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const finite = value => value !== null && value !== undefined && Number.isFinite(Number(value));
  const number = value => finite(value) ? Number(value) : null;
  const addDate = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
  const dateTime = date => Date.parse(date + 'T00:00:00Z');
  const shortDate = date => date ? date.slice(5).replace('-', '.') : '—';
  const money = value => value === null ? '—' : `₩${Math.round(value).toLocaleString('ko-KR')}`;
  const count = value => value === null ? '—' : Number(value.toFixed(1)).toLocaleString('ko-KR');
  const axisMoney = value => Math.abs(value) >= 1e8 ? `${Number((value / 1e8).toFixed(2))}억`
    : Math.abs(value) >= 1e4 ? `${Number((value / 1e4).toFixed(1))}만` : Number(value.toFixed(1)).toLocaleString('ko-KR');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const labelFor = (key, item) => key === 'actual' ? '관측 실적' : key === 'forecast' ? '예측 매출' : '무발주 기준';

  function normalize(input, options) {
    return input.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && finite(row.revenue))
      .map(row => ({date: row.date, endDate: row.date, revenue: Number(row.revenue),
        baselineRevenue: number(row.baselineRevenue), units: number(row.units), inventory: number(row.inventory),
        weekdayFactor: number(row.weekdayFactor), actual: options.expected === false || row.actual === true
          || Boolean(options.observedThrough && row.date <= options.observedThrough)}))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function weekly(rows) {
    const buckets = [];
    for (const row of rows) {
      const weekday = (new Date(row.date + 'T00:00:00Z').getUTCDay() + 6) % 7;
      const key = `${addDate(row.date, -weekday)}:${row.actual ? 'actual' : 'forecast'}`;
      let bucket = buckets.at(-1);
      if (!bucket || bucket.key !== key) {
        bucket = {key, date: row.date, endDate: row.date, revenue: 0, baselineRevenue: null,
          units: null, inventory: null, weekdayFactor: null, actual: row.actual, sourceDays: 0};
        buckets.push(bucket);
      }
      bucket.endDate = row.date; bucket.revenue += row.revenue; bucket.sourceDays += 1;
      if (row.baselineRevenue !== null) bucket.baselineRevenue = (bucket.baselineRevenue || 0) + row.baselineRevenue;
      if (row.units !== null) bucket.units = (bucket.units || 0) + row.units;
      bucket.inventory = row.inventory;
    }
    return buckets;
  }

  function view(item) {
    if (item.options.fullPeriod || item.state.mode === 'all') return item.rows;
    if (item.state.mode === 'weekly') return weekly(item.rows);
    const size = Number(item.state.mode);
    item.state.start = Math.max(0, Math.min(item.state.start, Math.max(0, item.rows.length - size)));
    return item.rows.slice(item.state.start, item.state.start + size);
  }

  function seriesValue(row, key) {
    if (key === 'actual') return row.actual ? row.revenue : null;
    if (key === 'forecast') return row.actual ? null : row.revenue;
    return row.actual ? null : row.baselineRevenue;
  }

  function activeIndex(item, rows) {
    const found = rows.findIndex(row => row.date <= item.state.pointDate && row.endDate >= item.state.pointDate);
    return found >= 0 ? found : Math.max(0, rows.length - 1);
  }

  function effectSummary(item, rows) {
    if (!item.available.includes('baseline')) return '';
    const current = rows.filter(row => !row.actual && row.baselineRevenue !== null);
    if (!current.length) return '';
    const currentEffect = current.reduce((total, row) => total + row.revenue - row.baselineRevenue, 0);
    const signedMoney = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${money(Math.abs(value))}`;
    return `<div class="or-chart-effect"><strong>표시 구간 발주 매출 효과 ${signedMoney(currentEffect)}</strong><p>같은 수요 가정의 예측 매출 − 무발주 기준입니다.</p></div>`;
  }

  function readout(item, row) {
    if (!row) return '<p class="or-chart-empty">표시할 거래 또는 예측 데이터가 없습니다.</p>';
    const weeklyMode = item.state.mode === 'weekly';
    const date = row.date === row.endDate ? `${row.date} ${weekdays[new Date(row.date + 'T00:00:00Z').getUTCDay()]}` : `${row.date} — ${row.endDate}`;
    const difference = !row.actual && row.baselineRevenue !== null ? row.revenue - row.baselineRevenue : null;
    const delta = difference === null ? null : `${difference > 0 ? '+' : difference < 0 ? '−' : ''}${money(Math.abs(difference))}`;
    const values = [[row.actual ? '관측 매출' : '예측 매출', money(row.revenue)]];
    if (!row.actual && item.available.includes('baseline') && row.baselineRevenue !== null) {
      values.push(['무발주 기준', money(row.baselineRevenue)], ['발주 효과 차이', delta]);
    }
    if (row.units !== null) values.push(['판매수량', `${count(row.units)}개`]);
    if (row.inventory !== null) values.push([weeklyMode ? '구간 마지막 재고' : '마감 재고', `${count(row.inventory)}개`]);
    if (!row.actual && (weeklyMode || row.weekdayFactor !== null)) values.push(['요일 가중치', weeklyMode ? '일별 가중치 반영' : `×${row.weekdayFactor.toFixed(2)}`]);
    return `<div class="or-chart-point-title"><b>${escape(date)}</b><span>${row.actual ? '관측 구간 · 예측 대상 아님' : '예측 구간'}${weeklyMode ? ` · ${row.sourceDays}일 합계` : ''}</span></div>
      <dl class="or-chart-values">${values.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
  }

  function markup(item, width = 960) {
    const rows = view(item), weeklyMode = item.state.mode === 'weekly';
    const fullView = item.options.fullPeriod || item.state.mode === 'all' || weeklyMode;
    const available = item.available;
    const series = available.filter(key => item.state.visible[key]);
    const controls = item.options.fullPeriod ? '' : `<div class="or-chart-window-controls">${['all', 7, 14, 28, 'weekly'].map(mode => `<button type="button" data-chart-mode="${mode}" aria-pressed="${item.state.mode === mode}">${mode === 'all' ? '전체 · 일별' : mode === 'weekly' ? '전체 · 주간' : `${mode}일 · 일별`}</button>`).join('')}</div>`;
    const legends = available.map(key => `<button type="button" class="or-chart-legend ${key}" data-chart-series="${key}" aria-pressed="${item.state.visible[key]}" ${series.length === 1 && item.state.visible[key] ? 'disabled' : ''}><i></i>${labelFor(key, item)}</button>`).join('');
    if (!rows.length) return `<div class="or-chart-heading"><h3>${escape(item.options.title || '매출 추이')}</h3></div><p class="or-chart-empty">표시할 데이터가 없습니다.</p>`;
    const chartWidth = Math.max(280, width), height = width < 500 ? 270 : 300;
    const pad = {left: width < 500 ? 42 : 54, right: 18, top: 30, bottom: 34};
    const plotWidth = chartWidth - pad.left - pad.right, plotHeight = height - pad.top - pad.bottom;
    const values = rows.flatMap(row => series.map(key => seriesValue(row, key)).filter(value => value !== null));
    rows.forEach((row, index) => {
      if (!row.actual && index > 0 && rows[index - 1].actual && series.some(key => key !== 'actual' && seriesValue(row, key) !== null)) values.push(rows[index - 1].revenue);
    });
    const low = Math.min(0, ...values), maximum = Math.max(0, ...values);
    const high = maximum > 0 ? maximum * 1.1 : 1, range = high - low || 1;
    const startTime = dateTime(rows[0].date), endTime = dateTime(rows.at(-1).endDate);
    const xTime = time => pad.left + (endTime === startTime ? plotWidth / 2 : (time - startTime) / (endTime - startTime) * plotWidth);
    const x = index => xTime(dateTime(rows[index].date));
    const y = value => pad.top + (high - value) / range * plotHeight;
    item.layout = {rows, width: chartWidth, height, pad, plotWidth, x, y};
    let grid = '';
    for (let tick = 0; tick <= 4; tick += 1) {
      const value = low + (high - low) * tick / 4, pos = y(value);
      grid += `<line class="or-chart-gridline" x1="${pad.left}" x2="${chartWidth - pad.right}" y1="${pos}" y2="${pos}"/><text class="or-chart-axis" x="${pad.left - 8}" y="${pos + 4}" text-anchor="end">${axisMoney(value)}</text>`;
    }
    const tickIndices = [...new Set([0, 1, 2, 3].map(tick => {
      const target = startTime + (endTime - startTime) * tick / 3;
      return rows.reduce((nearest, row, index) => Math.abs(dateTime(row.date) - target) < Math.abs(dateTime(rows[nearest].date) - target) ? index : nearest, 0);
    }))];
    for (const index of tickIndices) grid += `<text class="or-chart-axis" x="${x(index)}" y="${height - 9}" text-anchor="middle">${shortDate(rows[index].date)}</text>`;
    let paths = '', pointDots = '';
    for (const key of series) {
      let drawing = false, commands = [];
      rows.forEach((row, index) => {
        const value = seriesValue(row, key);
        if (value === null) { drawing = false; return; }
        // A geometry-only handoff joins the first forecast to the last observed
        // point. No historical forecast or future actual value is added to rows.
        if (!drawing && key !== 'actual' && index > 0 && rows[index - 1].actual) {
          commands.push(`M${x(index - 1).toFixed(2)},${y(rows[index - 1].revenue).toFixed(2)}`);
          drawing = true;
        }
        commands.push(`${drawing ? 'L' : 'M'}${x(index).toFixed(2)},${y(value).toFixed(2)}`); drawing = true;
      });
      paths += `<path class="or-chart-line ${key}" pathLength="1" d="${commands.join(' ')}"/>`;
      // A one-point series needs a visible point, not a zero-length path.
      rows.forEach((row, index) => {
        const value = seriesValue(row, key);
        if (value !== null && rows.filter(point => seriesValue(point, key) !== null).length === 1) paths += `<circle class="or-chart-dot ${key}" cx="${x(index)}" cy="${y(value)}" r="3.5"/>`;
        if (value !== null && rows.length <= 35) pointDots += `<circle class="or-chart-data-dot ${key}" cx="${x(index)}" cy="${y(value)}" r="2.8"/>`;
      });
    }
    let boundaries = '';
    const lastActual = item.rows.filter(row => row.actual).at(-1);
    const observedBoundary = item.available.includes('forecast') && lastActual ? item.options.observedThrough || lastActual.endDate : null;
    for (const boundary of [{date: observedBoundary, text: '관측 → 예측', kind: 'observed'}, {date: item.options.arrivalDate, text: '입고', kind: 'arrival'}]) {
      if (!boundary.date || boundary.date < rows[0].date || boundary.date > rows.at(-1).endDate) continue;
      const time = dateTime(boundary.date) + (boundary.kind === 'observed' ? 43200000 : 0);
      const position = xTime(Math.min(endTime, time));
      const anchor = position > chartWidth / 2 ? 'end' : 'start';
      boundaries += `<line class="or-chart-boundary" data-chart-boundary="${boundary.kind}" x1="${position}" x2="${position}" y1="${pad.top}" y2="${height - pad.bottom}"/><text class="or-chart-boundary-label" x="${position + (anchor === 'end' ? -5 : 5)}" y="${boundary.kind === 'arrival' ? 29 : 16}" text-anchor="${anchor}">${boundary.text} ${shortDate(boundary.date)}</text>`;
    }
    const selected = activeIndex(item, rows), current = rows[selected];
    item.state.pointDate = current.date;
    const pointKey = series.find(key => seriesValue(current, key) !== null);
    const pointY = pointKey ? y(seriesValue(current, pointKey)) : y(0);
    const pointX = x(selected);
    const pointLabelAnchor = pointX > chartWidth - 90 ? 'end' : pointX < pad.left + 80 ? 'start' : 'middle';
    const pointLabelX = pointX + (pointLabelAnchor === 'end' ? -8 : pointLabelAnchor === 'start' ? 8 : 0);
    const pointLabelY = Math.max(17, pointY - 13);
    const comparison = rows.filter(row => !row.actual && row.baselineRevenue !== null);
    const coincident = comparison.length && comparison.every(row => Math.abs(row.revenue - row.baselineRevenue) < 0.01);
    const zero = rows.every(row => row.revenue === 0 && (row.baselineRevenue === null || row.baselineRevenue === 0));
    return `<div class="or-chart-heading"><div><h3>${escape(item.options.title || '매출 추이')}</h3><p>${weeklyMode ? '주간 매출·수량 합계 · 재고는 마지막 일자' : '일별 원값 · 날짜 간격에 비례한 가로축'}</p></div>${controls}</div>
      <div class="or-chart-navigation">${fullView ? '' : `<button type="button" data-chart-shift="-1" aria-label="이전 날짜 구간" ${item.state.start === 0 ? 'disabled' : ''}>←</button>`}<b>${escape(rows[0].date)} — ${escape(rows.at(-1).endDate)}</b>${fullView ? '' : `<button type="button" data-chart-shift="1" aria-label="다음 날짜 구간" ${item.state.start + Number(item.state.mode) >= item.rows.length ? 'disabled' : ''}>→</button>`}</div>
      <div class="or-chart-legends">${legends}<span>단위: 원 · ${weeklyMode ? `${rows.length}개 주간 구간` : `${rows.length}일`}</span></div>
      <div class="or-chart-interaction-hint"><b>INTERACTIVE</b><span>범례 클릭 · 그래프 이동/터치 · 키보드 ← →</span></div>
      ${effectSummary(item, rows)}
      <div class="or-chart-plot"><svg role="application" tabindex="0" data-chart-grain="${weeklyMode ? 'weekly' : 'daily'}" data-chart-row-count="${rows.length}" aria-label="${escape(item.options.title || '매출 차트')} · 좌우 방향키로 날짜별 값 확인" viewBox="0 0 ${chartWidth} ${height}" preserveAspectRatio="none">
      ${grid}${boundaries}${paths}${pointDots}<line data-chart-cursor class="or-chart-cursor" x1="${pointX}" x2="${pointX}" y1="${pad.top}" y2="${height - pad.bottom}"/>
      <circle data-chart-point class="or-chart-cursor-dot" cx="${pointX}" cy="${pointY}" r="6" ${pointKey ? '' : 'visibility="hidden"'}/>
      <text data-chart-point-label class="or-chart-point-label" x="${pointLabelX}" y="${pointLabelY}" text-anchor="${pointLabelAnchor}" ${pointKey ? '' : 'visibility="hidden"'}>${shortDate(current.date)}</text></svg></div>
      ${zero ? '<p class="or-chart-explanation">이 구간의 매출 값은 0입니다. 가상의 변동을 추가하지 않았습니다.</p>' : coincident ? '<p class="or-chart-explanation">선이 겹치는 구간은 예측과 무발주 기준이 같은 값입니다. 해당 구간의 추가 발주 효과는 0원입니다.</p>' : ''}
      <div class="or-chart-readout" aria-live="polite" aria-atomic="true">${readout(item, current)}</div>
      <p class="or-chart-help">범례로 선을 켜고 끄거나 그래프를 터치해 값을 확인하세요. 키보드 ← → / Home / End도 사용할 수 있습니다.</p>`;
  }

  function render(input, options = {}) {
    pruneBindings();
    const id = String(options.id || `chart-${registry.size + 1}`);
    const rows = normalize(Array.isArray(input) ? input : [], options);
    const signature = `${options.context || ''}|${options.observedThrough || ''}|${Boolean(options.fullPeriod)}|${rows.map(row => `${row.date}:${row.actual ? 1 : 0}:${row.revenue}:${row.baselineRevenue}`).join(',')}`;
    const old = registry.get(id);
    const available = [];
    if (rows.some(row => row.actual)) available.push('actual');
    if (rows.some(row => !row.actual)) available.push('forecast');
    if (options.expected !== false && options.baseline !== false && rows.some(row => !row.actual && row.baselineRevenue !== null)) available.push('baseline');
    const peakEffect=rows.filter(row=>!row.actual&&row.baselineRevenue!==null).reduce((best,row)=>!best||Math.abs(row.revenue-row.baselineRevenue)>Math.abs(best.revenue-best.baselineRevenue)?row:best,null);
    const state = old?.signature === signature ? old.state : {mode: 'all',
      start: 0, pointDate: peakEffect&&Math.abs(peakEffect.revenue-peakEffect.baselineRevenue)>.01?peakEffect.date:rows.at(-1)?.date, visible: {actual: true, forecast: true, baseline: true}};
    if (!available.some(key => state.visible[key]) && available[0]) state.visible[available[0]] = true;
    const item = {id, rows, options, available, state, signature, layout: null};
    registry.set(id, item);
    return `<section class="or-chart" data-chart-key="${escape(id)}">${markup(item)}</section>`;
  }

  function redraw(section, item, focusSelector) {
    const width = section.querySelector('.or-chart-plot')?.clientWidth || section.clientWidth;
    section.innerHTML = markup(item, width);
    const binding = bindings.get(section);
    if (binding?.visibilityObserver && !section.dataset.chartVisible) {
      binding.visibilityObserver.disconnect();
      binding.visibilityObserver.observe(section.querySelector('.or-chart-plot') || section);
    }
    if (focusSelector) section.querySelector(focusSelector)?.focus({preventScroll: true});
  }

  function selectPoint(section, item, index) {
    const layout = item.layout;
    if (!layout?.rows.length) return;
    index = Math.min(layout.rows.length - 1, Math.max(0, index));
    const row = layout.rows[index]; item.state.pointDate = row.date;
    const current = item.available.find(key => item.state.visible[key] && seriesValue(row, key) !== null);
    const y = layout.y(current ? seriesValue(row, current) : 0), x = layout.x(index);
    const line = section.querySelector('[data-chart-cursor]'), point = section.querySelector('[data-chart-point]');
    const pointLabel = section.querySelector('[data-chart-point-label]');
    line?.setAttribute('x1', x); line?.setAttribute('x2', x);
    point?.setAttribute('cx', x); point?.setAttribute('cy', y);
    point?.setAttribute('visibility', current ? 'visible' : 'hidden');
    if (pointLabel) {
      const anchor = x > layout.width - 90 ? 'end' : x < layout.pad.left + 80 ? 'start' : 'middle';
      pointLabel.setAttribute('x', x + (anchor === 'end' ? -8 : anchor === 'start' ? 8 : 0));
      pointLabel.setAttribute('y', Math.max(17, y - 13));
      pointLabel.setAttribute('text-anchor', anchor);
      pointLabel.setAttribute('visibility', current ? 'visible' : 'hidden');
      pointLabel.textContent = shortDate(row.date);
    }
    section.dataset.chartInteracted = 'true';
    const readoutElement = section.querySelector('.or-chart-readout');
    if (readoutElement) readoutElement.innerHTML = readout(item, row);
  }

  function bind(container = document) {
    pruneBindings();
    const sections = [...(container.matches?.('.or-chart') ? [container] : []), ...container.querySelectorAll('.or-chart')];
    for (const section of sections) {
      if (section.dataset.chartBound) continue;
      section.dataset.chartBound = 'true';
      let item = registry.get(section.dataset.chartKey);
      if (!item) continue;
      const controller = new AbortController(), listenerOptions = {signal: controller.signal};
      const binding = {controller, observer: null, visibilityObserver: null}; bindings.set(section, binding);
      redraw(section, item);
      if (typeof IntersectionObserver !== 'undefined') {
        const visibilityObserver = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          section.dataset.chartVisible = 'true';
          visibilityObserver.disconnect();
        }, {threshold: .12});
        visibilityObserver.observe(section.querySelector('.or-chart-plot') || section);
        binding.visibilityObserver = visibilityObserver;
      } else {
        section.dataset.chartVisible = 'true';
      }
      section.addEventListener('click', event => {
        item = registry.get(section.dataset.chartKey);
        const button = event.target.closest('button');
        if (!button || !section.contains(button) || button.disabled) return;
        if (button.dataset.chartMode) {
          item.state.mode = ['weekly', 'all'].includes(button.dataset.chartMode) ? button.dataset.chartMode : Number(button.dataset.chartMode);
          redraw(section, item, `[data-chart-mode="${button.dataset.chartMode}"]`);
        } else if (button.dataset.chartShift) {
          item.state.start += Number(button.dataset.chartShift) * Number(item.state.mode);
          item.state.pointDate = item.rows[Math.max(0, Math.min(item.state.start, item.rows.length - 1))]?.date;
          redraw(section, item, `[data-chart-shift="${button.dataset.chartShift}"]`);
        } else if (button.dataset.chartSeries) {
          const key = button.dataset.chartSeries;
          if (item.state.visible[key] && item.available.filter(series => item.state.visible[series]).length === 1) return;
          item.state.visible[key] = !item.state.visible[key];
          redraw(section, item, `[data-chart-series="${key}"]`);
        }
      }, listenerOptions);
      const inspect = event => {
        const svg = event.target.closest('svg');
        if (!svg || !section.contains(svg)) return;
        item = registry.get(section.dataset.chartKey);
        const bounds = svg.getBoundingClientRect(), layout = item.layout;
        const relative = (event.clientX - bounds.left) / bounds.width * layout.width;
        // Find the nearest date in screen space, including non-contiguous dates
        // and unequal weekly buckets on the same proportional time axis.
        const index = layout.rows.reduce((nearest, row, candidate) => Math.abs(layout.x(candidate) - relative) < Math.abs(layout.x(nearest) - relative) ? candidate : nearest, 0);
        selectPoint(section, item, index);
      };
      section.addEventListener('pointermove', inspect, listenerOptions);
      section.addEventListener('pointerdown', inspect, listenerOptions);
      section.addEventListener('keydown', event => {
        if (event.target.tagName.toLowerCase() !== 'svg') return;
        item = registry.get(section.dataset.chartKey);
        const current = activeIndex(item, item.layout.rows);
        const index = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: item.layout.rows.length - 1}[event.key];
        if (index === undefined) return;
        event.preventDefault(); selectPoint(section, item, index);
      }, listenerOptions);
      if (typeof ResizeObserver !== 'undefined') {
        let priorWidth = section.clientWidth;
        const observer = new ResizeObserver(entries => {
          if (!section.isConnected) { observer.disconnect(); return; }
          const width = entries[0].contentRect.width;
          if (Math.abs(width - priorWidth) > 2) { priorWidth = width; redraw(section, registry.get(section.dataset.chartKey)); }
        });
        binding.observer = observer; observer.observe(section);
      }
    }
  }

  root.OrdoCharts = {render, bind};
})(typeof window !== 'undefined' ? window : globalThis);
