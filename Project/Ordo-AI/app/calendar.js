(function () {
  'use strict';

  // A deterministic, explicitly synthetic operating schedule; no external sync.
  const seasons = [
    { id: 'ss-close', label: 'SS CLOSE', year: 2026, month: 7, preferred: 28,
      extras: [[3, 'SALES', 'SS 마감 프로모션', 'campaign', 'overview'], [7, 'CRM', '시즌 마감 고객 안내', 'campaign', 'overview'], [21, 'PROMO', '잔여 재고 판매 점검', 'campaign', 'overview'], [28, 'STOCK', 'SS 재고 실사 검토', 'operations', 'decisions'], [31, 'CLOSE', 'SS 결산 및 이월 검토', 'operations', 'reports']] },
    { id: 'fw-main', label: 'FW MAIN', year: 2026, month: 8, preferred: 18,
      extras: [[1, 'LAUNCH', 'FW 1차 입고 검토', 'operations', 'overview'], [4, 'CRM', '신규 고객 웰컴', 'campaign', 'overview'], [7, 'CAMPAIGN', 'Fall campaign', 'campaign', 'overview'], [18, 'AI CHECK', '주말 피크 전 매출·재고 점검', 'operations', 'decisions'], [28, 'VIP', 'VIP week', 'campaign', 'overview'], [30, 'PLAN', '10월 운영 계획 검토', 'operations', 'simulator']] },
    { id: 'holiday', label: 'HOLIDAY', year: 2026, month: 11, preferred: 18,
      extras: [[4, 'CAMPAIGN', 'Holiday gift campaign', 'campaign', 'overview'], [11, 'CRM', '연말 고객 재방문 기획', 'campaign', 'overview'], [18, 'STOCK', '연말 재고·납기 점검', 'operations', 'decisions'], [21, 'PROMO', '연말 프로모션 점검', 'campaign', 'overview'], [28, 'REPORT', '연간 실적 검토', 'operations', 'reports'], [30, 'PLAN', '신년 운영 계획 검토', 'operations', 'simulator']] },
    { id: 'ss-plan', label: '27 SS PLAN', year: 2027, month: 1, preferred: 1,
      extras: [[1, 'PLAN', '27 SS 초도 아소트 계획', 'operations', 'simulator'], [5, 'LAUNCH', 'SS 출시 준비 점검', 'operations', 'overview'], [12, 'CAMPAIGN', 'Spring preview', 'campaign', 'overview'], [26, 'CLOSE', '26 FW 결산 검토', 'operations', 'reports']] }
  ];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeSeason = 'fw-main';
  let selectedEventId = '';
  let selectedDay = 18;
  let boundRoot = null;
  let eventsController = null;
  let animationFrame = 0;

  function schedule(season) {
    const days = new Date(Date.UTC(season.year, season.month + 1, 0)).getUTCDate();
    const events = season.extras.map((row, index) => ({ id: `${season.id}-extra-${index}`, day: row[0], tag: row[1], title: row[2], kind: row[3] }));
    for (let day = 1; day <= days; day += 1) {
      const weekday = new Date(Date.UTC(season.year, season.month, day)).getUTCDay();
      if (weekday === 2 || weekday === 4) events.push({ id: `${season.id}-reorder-${day}`, day,
        tag: 'REORDER', title: weekday === 2 ? '제조·사입 리오더 검토' : '사입 리오더 검토', kind: 'reorder' });
    }
    return events.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
  }

  function currentSeason() { return seasons.find(season => season.id === activeSeason); }
  function dateLabel(season, day) { return `${months[season.month].slice(0, 3).toUpperCase()} ${String(day).padStart(2, '0')} · ${weekdays[new Date(Date.UTC(season.year, season.month, day)).getUTCDay()]}`; }
  function fullDate(season, day) { return `${season.year}년 ${season.month + 1}월 ${day}일`; }
  function dateIso(season, day) { return `${season.year}-${String(season.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }

  function agendaMarkup(season, events) {
    const dayEvents = events.filter(event => event.day === selectedDay);
    const days = new Date(Date.UTC(season.year, season.month + 1, 0)).getUTCDate();
    const offset = (new Date(Date.UTC(season.year, season.month, 1)).getUTCDay() + 6) % 7;
    const weeks = [];
    for (let first = 1 - offset; first <= days; first += 7) {
      const from = Math.max(1, first), to = Math.min(days, first + 6);
      weeks.push({ from, to, events: events.filter(event => event.day >= from && event.day <= to) });
    }
    const monthly = events.filter(event => event.kind !== 'reorder');
    const count = kind => events.filter(event => event.kind === kind).length;
    return `<section class="calendar-monthly-summary"><div class="section-title"><h3>MONTHLY ISSUES</h3><span>${season.month + 1}월</span></div><p class="calendar-summary-count">리오더 검토 ${count('reorder')}일 · 캠페인 ${count('campaign')}건 · 운영 ${count('operations')}건</p><ul>${monthly.map(event => `<li><time datetime="${dateIso(season, event.day)}">${event.day}일</time><span>${event.title}</span></li>`).join('')}</ul></section>
      <section class="calendar-weekly-summary"><h3>WEEKLY ISSUES</h3><p>날짜 또는 주차를 선택해 그 주의 이슈를 확인하세요.</p>${weeks.map((week, index) => {
        const active = selectedDay >= week.from && selectedDay <= week.to;
        const reorderCount = week.events.filter(event => event.kind === 'reorder').length;
        const other = week.events.filter(event => event.kind !== 'reorder');
        return `<div class="calendar-week ${active ? 'active' : ''}"><button type="button" data-calendar-week="${week.from}" aria-expanded="${active}" aria-controls="calendar-week-${index}"><span>${index + 1}주 · ${week.from}–${week.to}일</span><b>${week.events.length}개 일정</b></button><p>리오더 검토 ${reorderCount}일${other.length ? ' · ' + other.map(event => event.title).join(' / ') : ' · 추가 캠페인 없음'}</p><ul id="calendar-week-${index}" ${active ? '' : 'hidden'}>${week.events.length ? week.events.map(event => `<li><time datetime="${dateIso(season, event.day)}">${event.day}일</time><span>${event.title}</span></li>`).join('') : '<li>등록된 일정 없음</li>'}</ul></div>`;
      }).join('')}</section><div class="calendar-selected-brief"><time datetime="${dateIso(season, selectedDay)}">${dateLabel(season, selectedDay)}</time><p>${dayEvents.length ? dayEvents.map(event => event.title).join(' · ') : '선택한 날짜에 등록된 일정이 없습니다.'}</p></div><p class="calendar-summary-note">선택은 캘린더 안에서만 반영됩니다. 다른 화면으로 이동하거나 발주하지 않습니다.</p>`;
  }

  function markup() {
    const season = currentSeason();
    const events = schedule(season);
    const dayCount = new Date(Date.UTC(season.year, season.month + 1, 0)).getUTCDate();
    const firstDay = (new Date(Date.UTC(season.year, season.month, 1)).getUTCDay() + 6) % 7;
    const cellCount = Math.ceil((firstDay + dayCount) / 7) * 7;
    const counters = [[events.length, 'key events', '주요 일정'], [events.filter(event => event.kind === 'reorder').length, 'reorder slots', '리오더 검토일'], [events.filter(event => event.kind === 'campaign').length, 'campaigns', '캠페인']];
    return `<section class="ordo-calendar" aria-label="브랜드 운영 예시 캘린더">
      <div class="calendar-head"><div><div class="eyebrow">BRAND OPERATING CALENDAR</div><h2>${months[season.month]} <em>${season.year}</em></h2><p>DEV 예시 일정 · 실제 외부 캘린더와 연결되지 않았습니다. 화요일 제조·사입, 목요일 사입 검토 슬롯을 표시합니다.</p></div>
      <div class="calendar-kpis">${counters.map(([value, label, accessibleLabel]) => `<span class="calendar-kpi"><b data-calendar-count="${value}" aria-hidden="true">${value}</b><span aria-hidden="true">${label}</span><span class="calendar-sr">${accessibleLabel} ${value}개</span></span>`).join('')}</div></div>
      <div class="season-rail" role="tablist" aria-label="운영 시즌">${seasons.map(item => `<button type="button" id="calendar-tab-${item.id}" role="tab" aria-controls="calendar-panel" aria-selected="${item.id === activeSeason}" tabindex="${item.id === activeSeason ? 0 : -1}" class="${item.id === activeSeason ? 'active' : ''}" data-calendar-season="${item.id}">${item.label}</button>`).join('')}</div>
      <div class="calendar-layout" id="calendar-panel" role="tabpanel" aria-labelledby="calendar-tab-${activeSeason}"><section class="calendar-board" aria-label="${season.year}년 ${season.month + 1}월 날짜"><header aria-hidden="true">${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => `<b>${day}</b>`).join('')}</header><div class="calendar-days">${Array.from({ length: cellCount }, (_, index) => {
        const day = index - firstDay + 1;
        if (day < 1 || day > dayCount) return '<div class="cal-day muted" aria-hidden="true"></div>';
        const dayEvents = events.filter(event => event.day === day);
        const event = dayEvents[0];
        return `<button type="button" class="cal-day ${event ? 'has-event' : ''} ${day === selectedDay ? 'selected' : ''}" data-calendar-day="${day}" tabindex="${day === selectedDay ? 0 : -1}" aria-pressed="${day === selectedDay}" aria-label="${fullDate(season, day)}, ${dayEvents.length ? dayEvents.map(item => item.title).join(', ') : '일정 없음'}"><span>${String(day).padStart(2, '0')}</span>${event ? `<i data-kind="${event.kind}">${event.tag}</i><b>${event.title}</b>${dayEvents.length > 1 ? `<small>+${dayEvents.length - 1} 일정</small>` : ''}` : ''}</button>`;
      }).join('')}</div><p class="calendar-keyboard-note">날짜: 방향키로 이동 · 시즌 탭: 좌우 방향키 / Home / End</p></section><aside class="calendar-agenda" aria-label="선택 날짜 상세">${agendaMarkup(season, events)}</aside></div>
      <p class="calendar-live calendar-sr" role="status" aria-live="polite"></p>
    </section>`;
  }

  function stopCount() { if (animationFrame) cancelAnimationFrame(animationFrame); animationFrame = 0; }
  function animateCounters() {
    stopCount();
    const nodes = [...boundRoot.querySelectorAll('[data-calendar-count]')];
    if (motionPreference.matches) { nodes.forEach(node => { node.textContent = node.dataset.calendarCount; }); return; }
    const startTime = performance.now();
    nodes.forEach(node => { node.textContent = '0'; });
    const tick = now => {
      if (!boundRoot?.isConnected) { stopCount(); return; }
      const progress = Math.min(1, (now - startTime) / 1150);
      const eased = 1 - Math.pow(1 - progress, 3);
      nodes.forEach(node => { node.textContent = String(Math.round(Number(node.dataset.calendarCount) * eased)); });
      animationFrame = progress < 1 ? requestAnimationFrame(tick) : 0;
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function selectDay(day, eventId, focus) {
    const season = currentSeason();
    selectedDay = day;
    selectedEventId = eventId || '';
    boundRoot.querySelectorAll('[data-calendar-day]').forEach(button => {
      const selected = Number(button.dataset.calendarDay) === day;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    boundRoot.querySelector('.calendar-agenda').innerHTML = agendaMarkup(season, schedule(season));
    boundRoot.querySelector('.calendar-live').textContent = `${fullDate(season, day)} 일정 선택됨`;
    if (focus) boundRoot.querySelector(`[data-calendar-day="${day}"]`)?.focus();
  }

  function selectSeason(id, focus) {
    if (id === activeSeason) return;
    activeSeason = id;
    selectedDay = currentSeason().preferred;
    selectedEventId = '';
    boundRoot.innerHTML = markup();
    animateCounters();
    if (focus) boundRoot.querySelector(`[data-calendar-season="${id}"]`)?.focus();
    boundRoot.querySelector('.calendar-live').textContent = `${currentSeason().year}년 ${currentSeason().month + 1}월 예시 일정`;
  }

  function destroy() {
    stopCount();
    eventsController?.abort();
    eventsController = null;
    boundRoot = null;
  }

  function render() {
    activeSeason = 'fw-main';
    selectedDay = 18;
    selectedEventId = '';
    return markup();
  }

  function bind(root) {
    destroy();
    boundRoot = root;
    if (!root?.querySelector('.ordo-calendar')) { boundRoot = null; return; }
    eventsController = new AbortController();
    const options = { signal: eventsController.signal };
    root.addEventListener('click', event => {
      const target = event.target.closest('button');
      if (!target || !root.contains(target)) return;
      if (target.dataset.calendarSeason) selectSeason(target.dataset.calendarSeason, true);
      else if (target.dataset.calendarDay) selectDay(Number(target.dataset.calendarDay), '', false);
      else if (target.dataset.calendarWeek) selectDay(Number(target.dataset.calendarWeek), '', false);
    }, options);
    root.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-calendar-season]');
      if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        const index = seasons.findIndex(season => season.id === tab.dataset.calendarSeason);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? seasons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + seasons.length) % seasons.length;
        selectSeason(seasons[next].id, true);
      }
      const day = event.target.closest('[data-calendar-day]');
      if (day && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        const season = currentSeason();
        const current = Number(day.dataset.calendarDay);
        const max = new Date(Date.UTC(season.year, season.month + 1, 0)).getUTCDate();
        const next = event.key === 'Home' ? 1 : event.key === 'End' ? max : current + ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]);
        selectDay(Math.max(1, Math.min(max, next)), '', true);
      }
    }, options);
    motionPreference.addEventListener('change', animateCounters, options);
    animateCounters();
  }

  function nextWeek(reference) {
    const date=new Date(reference+'T00:00:00Z');
    const offset=(date.getUTCDay()+6)%7;
    date.setUTCDate(date.getUTCDate()+7-offset);
    const from=date.toISOString().slice(0,10), events=[];
    for(let i=0;i<7;i++){
      const day=new Date(date.getTime()+i*86400000), year=day.getUTCFullYear(), month=day.getUTCMonth();
      const season=seasons.find(s=>s.year===year&&s.month===month)||{id:'regular-'+year+'-'+month,year,month,extras:[]};
      for(const event of schedule(season).filter(e=>e.day===day.getUTCDate()))events.push({...event,date:day.toISOString().slice(0,10)});
    }
    return {from,to:new Date(date.getTime()+6*86400000).toISOString().slice(0,10),events};
  }
  window.OrdoCalendar = Object.freeze({ render, bind, destroy, nextWeek });
}());
