const state = { route: 'entry', period: '14', decision: 'REORDER', selectedSku: 0, scenario: 1, report: 'P&L', carousel: 2 };

const pageRoot = document.querySelector('#page-root');
const fmt = n => new Intl.NumberFormat('ko-KR').format(n);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routeNames = {entry:'ENTRY',research:'RESEARCH',today:'TODAY',overview:'OVERVIEW',decisions:'DECISIONS',simulator:'SIMULATOR',orders:'FINAL ORDER',reports:'REPORTS'};

function head(eyebrow, title, desc, extra='') { return `<div class="page-head"><div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="page-context">${extra}<p>${desc}</p></div></div>`; }
function spark(color, points='0,75 35,62 70,69 105,39 140,46 175,18 210,25') { return `<svg viewBox="0 0 210 90" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="4"/><line x1="0" y1="84" x2="210" y2="84" stroke="#ccc"/></svg>`; }

function signalDots(seed=0){
  return Array.from({length:96},(_,i)=>{
    const row=Math.floor(i/12), col=i%12;
    const center=5.5+Math.sin(row*.92+seed)*2.45;
    const echo=5.5+Math.sin(row*.92+seed+Math.PI)*2.45;
    const distance=Math.min(Math.abs(col-center),Math.abs(col-echo)+1.15);
    const scale=Math.max(.16,1.18-distance*.25)*(row===0||row===7?.72:1);
    return `<i style="--s:${scale.toFixed(2)};--hi:${(scale*1.32).toFixed(2)};--lo:${(scale*.78).toFixed(2)};--o:${Math.min(.96,.3+scale*.55).toFixed(2)};--d:-${(i*.018+seed*.11).toFixed(2)}s;--row:${row};--col:${col}"></i>`;
  }).join('');
}

function brandCalendar(){ return window.OrdoCalendar.render(); }

function entryPage(){
  const cards=[
    {name:'RESEARCH',route:'research',meta:'DAILY · TREND INTELLIGENCE',copy:'매일의 시장흐름-상품 트렌드를 리포트 합니다.',color:'#b8c7b2',symbol:'R'},
    {name:'OVERVIEW',route:'overview',meta:'01 · BRAND HEALTH',copy:'일별 판매 추이와 예측, 상품별 재고와 위험을 한눈에',color:'#b8c7b2',symbol:'O'},
    {name:'MAIN',route:'today',meta:'00 · AI DAILY BRIEF',copy:'오늘의 변화와 의사결정을 한눈에',color:'#ff7d42',symbol:'AI'},
    {name:'SIMULATION',route:'simulator',meta:'02 · DECISION LAB',copy:'판매·재고·납기 조건별 시나리오 비교',color:'#e3b058',symbol:'S'}
  ];
  return `<section class="page entry"><nav class="entry-nav"><button data-panel="how">HOW TO USE</button><div class="entry-nav-right"><button data-panel="search">⌕ &nbsp; SEARCH <kbd>/</kbd></button><button data-panel="calendar">CALENDAR</button><button type="button" data-theme-toggle aria-label="다크모드" aria-pressed="false"><span aria-hidden="true">☾</span><span>DARK</span></button></div></nav><div class="entry-top"><h1 class="hero-halftone"><span>Hello,</span><strong><em>Ordo</em> AI</strong></h1><p class="entry-promise">Stop guessing. Start growing.</p><p class="entry-subline">판매·재고·납기를 함께 보고, 발주 전에 대안을 비교하세요.</p></div><div class="carousel-shell"><div class="carousel" id="carousel">${cards.map((c,i)=>`<a href="#${c.route}" class="portal-card ${i===state.carousel?'active':''}" data-index="${i}" data-route="${c.route}" aria-label="${c.name} 페이지로 이동" style="--card-color:${c.color};--tilt:${i<state.carousel?'10deg':'-10deg'}"><div class="card-meta"><span>◉ &nbsp; ${c.meta}</span><span>${String(i+1).padStart(2,'0')}</span></div><div class="portal-signal signal-${i}" aria-hidden="true">${signalDots(i*1.7)}</div><div class="portal-copy"><h2>${c.name}</h2><p>${c.copy}</p></div><span class="card-foot">ENTER <b>↗</b></span></a>`).join('')}</div></div><div class="swipe-note"><span>←</span> DRAG OR SWIPE TO EXPLORE <span>→</span></div><div class="entry-footer"><button class="entry-pill" id="import-btn" aria-haspopup="dialog">＋ &nbsp; IMPORT.FILE</button><button class="entry-pill" data-panel="admin" aria-haspopup="dialog">▦ &nbsp; OTHER</button></div><span class="entry-status">샘플 브랜드 체험 · MD 최종 승인</span></section>`;
}

function todayPage(){ return window.OrdoWorkbench.render('today'); }
function overviewPage(){ return window.OrdoWorkbench.render('overview'); }
function decisionsPage(){ return window.OrdoWorkbench.render('decisions'); }
function simulatorPage(){ return window.OrdoWorkbench.render('simulator'); }
function reportsPage(){ return window.OrdoWorkbench.render('reports'); }

const pages={entry:entryPage,research:()=>window.OrdoResearch.render(),today:todayPage,overview:overviewPage,decisions:decisionsPage,simulator:simulatorPage,orders:()=>window.OrdoWorkbench.render('orders'),reports:reportsPage};
function navigate(route){ state.route=pages[route]?route:'entry'; const hash=state.route==='research'?'research':window.OrdoWorkbench.routeHash(state.route); history.pushState(null,'','#'+hash); render(); window.scrollTo(0,0); }
function render(options={}){ const previous=options.animate===false?window.OrdoMotion?.capture(pageRoot):null; window.OrdoMotion?.stop(); document.body.classList.toggle('entry-mode',state.route==='entry'); document.body.dataset.view=state.route; pageRoot.innerHTML=pages[state.route](); document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route)); bindPage(); window.OrdoTheme?.sync(); window.OrdoResearch?.bind(pageRoot); window.OrdoWorkbench.bind(pageRoot); window.OrdoCharts.bind(pageRoot); window.OrdoMotion?.start(pageRoot,{previous,charts:options.animate!==false}); }
function setCarousel(dragOffset=0,animate=true){const c=document.querySelector('#carousel'); if(!c)return; const cards=[...c.children]; cards.forEach((el,i)=>el.classList.toggle('active',i===state.carousel)); const gap=parseFloat(getComputedStyle(c).gap)||18,cardWidth=cards[0].offsetWidth,step=cardWidth+gap;c.classList.toggle('dragging',!animate);c.style.transform=`translate3d(${-state.carousel*step-cardWidth/2+dragOffset}px,0,0)`;}
function bindPage(){
 document.querySelectorAll('[data-route]:not(.portal-card)').forEach(x=>x.onclick=e=>navigate(e.currentTarget.dataset.route));
 document.querySelectorAll('[data-panel]').forEach(x=>x.onclick=()=>openPanel(x.dataset.panel));
 document.querySelector('#import-btn')?.addEventListener('click',()=>openFeatureNotice('import'));
 if(state.route==='entry'){
  requestAnimationFrame(()=>setCarousel());
  const c=document.querySelector('#carousel');let startX=0,lastX=0,lastT=0,dragging=false,moved=false,pressedRoute='';
  c.onpointerdown=e=>{dragging=true;moved=false;pressedRoute=e.target.closest('.portal-card')?.dataset.route||'';startX=lastX=e.clientX;lastT=performance.now();c.setPointerCapture(e.pointerId);c.classList.add('is-grabbing')};
  c.onpointermove=e=>{if(!dragging)return;let delta=e.clientX-startX;const last=c.children.length-1;if((state.carousel===0&&delta>0)||(state.carousel===last&&delta<0))delta*=.28;moved=moved||Math.abs(delta)>5;lastX=e.clientX;lastT=performance.now();setCarousel(delta,false)};
  const release=e=>{if(!dragging)return;dragging=false;c.classList.remove('is-grabbing');let delta=e.clientX-startX;const elapsed=Math.max(16,performance.now()-lastT),velocity=(e.clientX-lastX)/elapsed;const threshold=Math.min(115,c.firstElementChild.offsetWidth*.24);if(Math.abs(delta)>threshold||Math.abs(velocity)>.42)state.carousel=Math.max(0,Math.min(c.children.length-1,state.carousel+(delta<0?1:-1)));setCarousel(0,true)};
  c.onclick=e=>{e.preventDefault();if(!moved||e.detail===0){const route=e.target.closest('.portal-card')?.dataset.route||pressedRoute;if(route)navigate(route)}};
  c.onpointerup=release;c.onpointercancel=release;c.onlostpointercapture=e=>{if(dragging)release(e)};
 }
}
function openPanel(type){
 if(type==='admin'){openFeatureNotice('admin');return;}
 window.OrdoCalendar?.destroy();
 const content={how:`<div class="how-guide"><div class="eyebrow">QUICK GUIDE</div><h2>How to use</h2><section class="drawer-section"><div class="how-section-heading"><h3>데일리 트렌드</h3><div class="how-tab-links"><span class="how-tab-link">RESEARCH</span></div></div><p>매일의 시장흐름-상품 트렌드를 리포트 합니다.</p></section><section class="drawer-section"><div class="how-section-heading"><h3>판매 분석</h3><div class="how-tab-links"><span class="how-tab-link">OVERVIEW</span></div></div><p>일별 매출과 재고 흐름을 한눈에 확인해요.</p></section><section class="drawer-section"><div class="how-section-heading"><h3>발주 시뮬레이션</h3><div class="how-tab-links"><span class="how-tab-link">SIMULATOR</span></div></div><p>상품·옵션별 수량과 세 가지 가정을 비교해요.</p></section><section class="drawer-section"><div class="how-section-heading"><h3>결정·리스크 추적</h3><div class="how-tab-links"><span class="how-tab-link">DECISIONS</span><span class="how-tab-link">REPORTS</span></div></div><p>판단과 위험을 기록해요. 실제 발주는 없어요.</p></section><div class="how-final-order"><div class="how-section-heading"><h3>최종 물량 발주</h3><div class="how-tab-links"><span class="how-tab-link">FINAL ORDER</span></div></div><p>Ordo AI와 최적의 물량을 결정해요.</p></div><div class="how-video"><button type="button" class="how-video-button" data-how-video aria-expanded="false"><span><small>3 MINUTE PRODUCT TOUR</small>How to Use</span><b>PLAY <i>↗</i></b></button><div class="how-video-player" data-how-video-player hidden><video controls preload="metadata" playsinline aria-label="Ordo AI 예측·시나리오·리포트 3분 사용 시연 영상"><source src="assets/ordo-ai-how-to-use-20260929.mp4" type="video/mp4">브라우저에서 영상을 재생할 수 없습니다.</video><p>메인 화면부터 AI 시나리오 검토와 최종 발주까지 확인하세요.</p></div></div></div>`,calendar:brandCalendar(),data:window.OrdoWorkbench.dataPanel(),admin:`<div class="admin-menu" aria-label="관리 메뉴"><button type="button" class="entry-pill admin-menu-button">MASTER ADMIN</button><button type="button" class="entry-pill admin-menu-button">BigQuery</button><button type="button" class="entry-pill admin-menu-button">CLIENT PAGE</button></div>`,search:`<div class="eyebrow">GLOBAL SEARCH</div><h2>Search</h2><input class="search-input" id="search-input" placeholder="상품 코드 또는 화면 검색" autofocus><div class="drawer-section" id="search-results"><b>QUICK ACCESS</b><p>Research · Today · Overview · Decisions · Simulator · Reports</p></div>`};
 const drawer=document.querySelector('#drawer');document.querySelector('#drawer-content').innerHTML=content[type]||'';drawer.classList.toggle('calendar-drawer',type==='calendar');drawer.classList.toggle('how-drawer',type==='how');drawer.classList.add('open');document.querySelector('#panel-backdrop').classList.add('open');drawer.setAttribute('aria-hidden','false');
 const howVideoButton=document.querySelector('[data-how-video]');
 if(type==='how'){
   const guide=document.querySelector('.how-guide');
   const evidence=document.createElement('section');evidence.className='drawer-section how-evidence';
   evidence.innerHTML='<h3>어떻게 계산하나요?</h3><p>Codex·Claude 등 AI 도구로 구현한 샘플 브랜드 체험입니다. 수량과 금액은 판매·재고·납기·최소발주수량·예산 규칙으로 계산하며, 최종 결정은 MD가 합니다.</p><a class="btn ghost" href="#reports?report=evaluation" data-evidence-link>예측 검증 근거 보기 ↗</a><p class="how-evidence-note">합성 데이터의 평가 기간과 단순 평균 대비 오차를 확인하세요.</p>';
   guide.insertBefore(evidence,guide.querySelector('.how-video'));
   guide.querySelector('[data-evidence-link]').onclick=e=>{e.preventDefault();closePanel();window.OrdoWorkbench.state.reportTab='evaluation';navigate('reports');};
   guide.querySelector('.how-video-player p').textContent='3분 안에 예측 원리, 수동 판매 시뮬레이션, 세 가지 시나리오와 선택 후 리포트·검토 기록·발주서 CSV까지 확인하세요.';
 }
 howVideoButton?.addEventListener('click',()=>{const player=document.querySelector('[data-how-video-player]');const willOpen=player.hidden;player.hidden=!willOpen;howVideoButton.setAttribute('aria-expanded',String(willOpen));howVideoButton.classList.toggle('active',willOpen);if(willOpen){requestAnimationFrame(()=>player.scrollIntoView({behavior:'smooth',block:'nearest'}));}else{player.querySelector('video')?.pause();}});
  document.querySelector('#search-input')?.addEventListener('input',e=>{const v=e.target.value.trim().toLowerCase();const matches=Object.entries(routeNames).filter(x=>x[1].toLowerCase().includes(v)||x[0].includes(v));const products=v?window.OrdoWorkbench.getSnapshot().products.filter(p=>[p.code,p.name,p.itemType].join(' ').toLowerCase().includes(v)):[];document.querySelector('#search-results').innerHTML=matches.map(x=>`<button class="btn ghost" data-search-route="${x[0]}">${x[1]}</button>`).join('')+products.slice(0,30).map(p=>`<button class="btn ghost" data-search-sku="${escapeHtml(p.code)}">${escapeHtml(p.name)} · ${escapeHtml(p.code)}</button>`).join('')+(products.length>30?'<p>상위 30개 표시 · Decisions에서 전체 검색하세요.</p>':'')||'<p>검색 결과가 없습니다.</p>';document.querySelectorAll('[data-search-route]').forEach(b=>b.onclick=()=>{closePanel();navigate(b.dataset.searchRoute)});document.querySelectorAll('[data-search-sku]').forEach(b=>b.onclick=()=>{window.OrdoWorkbench.selectCode(b.dataset.searchSku);closePanel();navigate('decisions')})});
 if(type==='calendar')window.OrdoCalendar.bind(document.querySelector('#drawer-content'),route=>{closePanel();navigate(route)});
}
function closePanel(){window.OrdoCalendar?.destroy();document.querySelectorAll('#drawer video').forEach(video=>video.pause());const d=document.querySelector('#drawer');d.classList.remove('open','calendar-drawer','how-drawer');document.querySelector('#panel-backdrop').classList.remove('open');d.setAttribute('aria-hidden','true')}
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2600)}
function openFeatureNotice(type){
 const notices={
   import:['IMPORT.FILE / COMING NEXT','브랜드의 맥락까지, 물량 판단의 근거로.','브랜드 DB, 브랜드 콘셉트, 타깃 고객·유저 데이터 등 추가 자료를 연결하는 공간을 준비하고 있습니다. AI가 판매·재고 수치뿐 아니라 브랜드의 방향성과 고객 특성까지 함께 고려해 물량을 판단하고, 더 다양한 가정으로 시뮬레이션할 수 있도록 확장할 예정입니다. 현재는 기능 안내만 제공하며, 파일을 선택·업로드하거나 자료를 수집·전송하지 않습니다.'],
   admin:['OTHER','추가 연결 기능을 준비하고 있어요.','관리자 화면, BigQuery, 고객 페이지는 현재 연결되지 않았습니다. 확인하고 싶은 항목을 선택하세요.'],
   master:['MASTER ADMIN','관리자 기능은 준비 중입니다.','현재 체험 화면에서는 계정·권한·원본 데이터를 변경하지 않습니다.'],
   bigquery:['BigQuery','BigQuery 연결은 준비 중입니다.','외부 데이터 조회·전송은 실행되지 않습니다. 현재 샘플 데이터로 판매와 발주 시나리오를 비교할 수 있습니다.'],
   client:['CLIENT PAGE','브랜드별 고객 페이지는 준비 중입니다.','현재는 가상 브랜드 하나의 샘플을 체험합니다. 실제 고객 계정이나 브랜드 데이터는 연결되지 않았습니다.'],
   order:['FINAL ORDER','발주서를 내려받아 직접 전달하세요.','MD가 수량·옵션·금액·예상 납기를 확인하면 이 브라우저에 발주서가 기록됩니다. 확정 발주서의 CSV 버튼으로 내려받아 전달할 수 있으며, 공급처 자동 전송·접수·입고 처리는 연결되지 않았습니다.']
 };
 const item=notices[type]||notices.admin, dialog=document.querySelector('#feature-dialog');
 document.querySelector('#feature-dialog-kicker').textContent=item[0];
 document.querySelector('#feature-dialog-title').textContent=item[1];
 document.querySelector('#feature-dialog-description').textContent=item[2];
 document.querySelector('#feature-dialog-options').hidden=type!=='admin';
 if(!dialog.open)dialog.showModal();
 document.querySelector('[data-feature-close]').focus();
}
document.querySelectorAll('[data-feature-close]').forEach(button=>button.onclick=()=>document.querySelector('#feature-dialog').close());
document.querySelector('#feature-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const rect=e.currentTarget.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)e.currentTarget.close();}});
document.addEventListener('click',e=>{const button=e.target.closest('[data-feature-notice]');if(button)openFeatureNotice(button.dataset.featureNotice);});
document.querySelector('.drawer-close').onclick=closePanel;document.querySelector('#panel-backdrop').onclick=closePanel;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel();if(e.key==='/'&&!e.target.closest('input,textarea,select,[contenteditable="true"]')&&!document.querySelector('#drawer').classList.contains('open')){e.preventDefault();openPanel('search')}if(state.route==='entry'&&!document.querySelector('#drawer').classList.contains('open')&&['ArrowLeft','ArrowRight'].includes(e.key)){const last=Math.max(0,(document.querySelector('#carousel')?.children.length||1)-1);state.carousel=Math.max(0,Math.min(last,state.carousel+(e.key==='ArrowRight'?1:-1)));setCarousel()}});
function restoreRoute(){const route=location.hash.slice(1).split('?')[0]; state.route=pages[route]?route:'entry'; window.OrdoWorkbench.routeState(); render();}
window.addEventListener('hashchange',restoreRoute);
window.addEventListener('popstate',restoreRoute);
window.addEventListener('resize',()=>{if(state.route==='entry')setCarousel(0,false);});
// Use ENTRY only when there is no valid deep link. Explicit page URLs such as
// #research must survive a fresh navigation so shared links open their target.
const initialRoute=location.hash.slice(1).split('?')[0];
if(!pages[initialRoute])history.replaceState(null,'','#entry');
window.OrdoWorkbench.init({render,navigate,toast});
restoreRoute();
