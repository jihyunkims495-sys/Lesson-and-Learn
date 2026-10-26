'use client';
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import Link from 'next/link';
import Script from 'next/script';
import data from '../data/reference.json';
import details from '../data/details.json';
import {buildAllProducts, categoryGroups, categoryLabel} from '../data/catalog.mjs';

const Language = createContext(false);
const Navigation = createContext(()=>{});
const allProducts = buildAllProducts(data.products, data.collections);
const byHandle = new Map(data.products.map(p => [p.handle, p]));
const seasons = ['fw26', 'ss26', 'fw25', 'ss25'];
const archiveSeasons = ['26fw','26ss','25fw','25ss','24fw','24ss','23fw','23ss','22fw','22ss'];
const tojiGroups = {outer:['outer','jackets'], top:['top','t-shirts','sleeveless','long-sleeves'], bottom:['bottom','pants','shorts','tights'], accessories:['accessories','etc']};
const collaborationHandles = new Set(categoryGroups.collaborations.slice(1).flatMap(s => data.collections['/collections/san-san-gear-'+s] || []));
const money = value => 'KRW ' + Number(value || 0).toLocaleString('en-US');
const localized = (href, en) => en && href.startsWith('/') ? '/en' + (href === '/' ? '' : href) : href;
function A({href, children, onClick, ...props}) {const en=useContext(Language),close=useContext(Navigation);return <Link href={localized(href,en)} {...props} onClick={event=>{onClick?.(event);if(!event.defaultPrevented)close()}}>{children}</Link>}
function Html({html='', ...props}) {return <div {...props} dangerouslySetInnerHTML={{__html:html}}/>}
function SearchIcon(){return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="8"/><path d="m11 11 6 6"/></svg>}
function ChatIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.6 9.6 0 0 1-2.7-.4L4 21l1.3-3.9A8.2 8.2 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4Z"/></svg>}

export default function Storefront({path:fullPath}) {
  const en=fullPath==='/en'||fullPath.startsWith('/en/');
  const path=(en?fullPath.slice(3):fullPath)||'/';
  const product=path.includes('/products/')?byHandle.get(path.split('/products/').at(-1)):null;
  const isToji=path.includes('/toji')||path.startsWith('/blogs/season')||product?.tags.some(t=>t.toLowerCase()==='toji');
  const home=path==='/', tojiHome=path==='/pages/toji';
  const catalog=(path.startsWith('/collections/')&&!path.includes('/products/'))||path==='/search';
  const article=path.startsWith('/blogs/')&&path.split('/').filter(Boolean).length>2;
  const [mobileOpen,setMobileOpen]=useState(false),[desktopOpen,setDesktopOpen]=useState(false);
  const [brand,setBrand]=useState(isToji?'tj':'ss'),[submenu,setSubmenu]=useState(''),[group,setGroup]=useState('');
  const [panel,setPanel]=useState(''),[cart,setCart]=useState([]),[ready,setReady]=useState(false),[query,setQuery]=useState('');
  const [scroll,setScroll]=useState({past:false,se:false,hide:false});
  const panelRef=useRef(null),lastFocus=useRef(null),lastScroll=useRef(0);
  const count=cart.reduce((sum,item)=>sum+item.quantity,0);
  const classes=[home?'h':tojiHome?'h_':catalog?'cl p0':product?'pd p0':'',isToji?'tj__':'',article?'av_':'',mobileOpen?'nv--on fixed':'',scroll.past?'s-on':'',scroll.se?'se__':'',scroll.hide?'hid-n':''].join(' ');
  useEffect(()=>{
    try{setCart(JSON.parse(localStorage.getItem('ssg-clone-cart')||'[]'))}catch{}
    setQuery(new URLSearchParams(location.search).get('q')||'');setReady(true);
    let frame;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const y=window.scrollY;setScroll(s=>({past:y>120,se:y>innerHeight/2,hide:y<120?false:y>lastScroll.current+2?true:y<lastScroll.current-12?false:s.hide}));lastScroll.current=y})};
    update();window.addEventListener('scroll',update,{passive:true});
    const resize=()=>{document.documentElement.style.setProperty('--sw',(innerWidth-document.documentElement.clientWidth)+'px');if(innerWidth>920)setMobileOpen(false)};resize();window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',resize)};
  },[]);
  useEffect(()=>{document.body.className=classes;document.documentElement.lang=en?'en':'ko';return()=>{document.body.className=''}},[classes,en]);
  useEffect(()=>{if(ready)localStorage.setItem('ssg-clone-cart',JSON.stringify(cart))},[cart,ready]);
  useEffect(()=>{
    if(!panel&&!mobileOpen)return;
    lastFocus.current=document.activeElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';
    const key=event=>{if(event.key==='Escape'){setPanel('');setMobileOpen(false);setDesktopOpen(false)}
      if(event.key==='Tab'&&panelRef.current){const nodes=[...panelRef.current.querySelectorAll('button,a,input,select')].filter(n=>n.offsetParent!==null);if(!nodes.length)return;if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1).focus()}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus()}}
    };document.addEventListener('keydown',key);panelRef.current?.querySelector('input,button,a')?.focus();
    return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);lastFocus.current?.focus?.()};
  },[panel,mobileOpen]);
  const closeMenu=()=>{setMobileOpen(false);setDesktopOpen(false);setSubmenu('');setGroup('')};
  const open=name=>{closeMenu();setPanel(name)};
  const add=(p,v)=>{setCart(items=>{const found=items.find(item=>item.id===v.id);return found?items.map(item=>item.id===v.id?{...item,quantity:item.quantity+1}:item):[...items,{id:v.id,handle:p.handle,title:p.title,image:p.images[0],variant:v.size||v.title,color:v.color,price:v.price,quantity:1}]});open('cart')};
  return <Language.Provider value={en}><Navigation.Provider value={closeMenu}><div className={classes} aria-busy={!ready}>
    <Script src="https://use.typekit.net/yhn2vme.js" strategy="afterInteractive" onLoad={()=>{try{window.Typekit.load({async:true})}catch{}}}/>
    <header onKeyDown={e=>{if(e.key==='Escape'){closeMenu();setPanel('')}if(e.key==='ArrowDown'&&e.target.closest('.ss-tab')){e.preventDefault();setDesktopOpen(true)}}} className={`${desktopOpen?'nv-on ':''}${submenu?'sub-on ':''}${panel==='search'?'sc-on ':''}${brand}-on`}>
      <i className="over header-surface"/>
      <button id="m-btn" className={mobileOpen?'on':''} aria-label={mobileOpen?'메뉴 닫기':'메뉴 열기'} aria-expanded={mobileOpen} onClick={()=>{setPanel('');setMobileOpen(v=>!v);setBrand(isToji?'tj':'ss');setSubmenu('');setGroup('')}}><span className="b1"/><span className="b2"/><i className="over"/></button>
      <A href={isToji?'/pages/toji':'/'} className="logo" aria-label={isToji?'TOJI 홈':'SAN SAN GEAR 홈'}><span/></A>
      <div className="in">
        <div className="nv" onMouseEnter={()=>{if(innerWidth>920){setBrand(isToji?'tj':'ss');setDesktopOpen(true);setPanel('')}}} onMouseLeave={()=>{if(innerWidth>920){setDesktopOpen(false);setSubmenu('');setBrand(isToji?'tj':'ss')}}}>
          <nav className={`ss-menu ${group?'secondary--sub-on':''}`} aria-label="메인 메뉴">
            <form action={localized('/search/',en)} className="s__ m__ menu-search"><input name="q" placeholder="search here :" aria-label="메뉴 상품 검색"/><button type="submit" aria-label="검색"><SearchIcon/></button></form>
            <div className="ss-tab"><ul>{[['ss','SAN SAN GEAR','/'],['tj','TOJI','/pages/toji']].map(([id,label,href])=><li key={id} className={`goto-${id} ${brand===id?'sltd':''}`}><A href={href} onMouseEnter={()=>{if(innerWidth>920){setBrand(id);setDesktopOpen(true)}}} onFocus={()=>{if(innerWidth>920){setBrand(id);setDesktopOpen(true)}}} onClick={event=>{if(mobileOpen){event.preventDefault();setBrand(id);setSubmenu('');setGroup('')}}}><span>{label}</span></A></li>)}</ul></div>
            {['ss','tj'].map(id=><ul key={id} className={`m menu-${id}`} aria-hidden={brand!==id}>
              <li className="h"><A href={id==='tj'?'/pages/toji':'/'}><span>HOME</span></A></li>
              {['Shop','Archive','Info'].map(name=><li key={name} className={`s ${name.toLowerCase()} ${submenu===name?'on':''}`} onMouseEnter={()=>{if(innerWidth>920)setSubmenu(name)}} onMouseLeave={()=>{if(innerWidth>920)setSubmenu('')}}>
                <a href="#" aria-expanded={submenu===name} onClick={event=>{event.preventDefault();setSubmenu(s=>s===name?'':name);setGroup('')}}><span>{name}</span></a>
                <div className="i-sub"><div className="in">
                  {name==='Shop'?<MenuShop toji={id==='tj'} group={group} setGroup={setGroup}/>:name==='Archive'?<ul>{(id==='tj'?['fw26','ss26']:archiveSeasons).map(s=><li key={s}><A href={`/blogs/${id==='tj'?'season':'archive'}?sn=${s}`}><span>{s.toUpperCase()}</span></A></li>)}</ul>:<div><ul><li><A href={id==='tj'?'/pages/toji-stores':'/pages/stores'}><span>stores</span></A></li></ul></div>}
                </div><i className="over"/></div>
              </li>)}
              <li><a href="https://careers.sansangear.com/" target="_blank" rel="noreferrer"><span>CAREERS</span></a></li>
            </ul>)}
          </nav>
          <div className="m__ m_m"><div className="l"><ul><li className="log"><a href="#" onClick={e=>{e.preventDefault();open('login')}}>LOGIN</a></li><li className="ln_"><Link href={path} className={!en?'sltd':''}>KR</Link><span>/</span><Link href={'/en'+(path==='/'?'':path)} className={en?'sltd':''}>EN</Link></li></ul></div><div className="r"><ul><li className="cart"><a href="#" onClick={e=>{e.preventDefault();open('cart')}}><span>CART</span><i>{count}</i></a></li></ul></div></div>
        </div>
        <div className="n-2"><ul>
          <li className="p_ s__"><a href="#" className="search-trigger" aria-label="검색" aria-expanded={panel==='search'} onClick={e=>{e.preventDefault();open(panel==='search'?'':'search')}}><SearchIcon/></a></li>
          <li className="ct__"><a href="#" aria-label="Chat" onClick={e=>{e.preventDefault();open('chat')}}><span className="ct-label">CHAT</span><ChatIcon/><i className="over"/></a></li>
          <li className="p_"><a href="#" onClick={e=>{e.preventDefault();open('login')}}><span>LOGIN</span></a></li>
          <li className={`cart ${!count?'empty':''}`}><a href="#" aria-label={`장바구니 ${count}개`} onClick={e=>{e.preventDefault();open('cart')}}><span>CART</span><i><span>{count}</span></i></a></li>
        </ul></div>
      </div>
      {(desktopOpen||panel==='search')&&<div className="header-veil" onMouseEnter={()=>{if(desktopOpen){setDesktopOpen(false);setSubmenu('')}}} onClick={()=>{closeMenu();setPanel('')}}/>}
      {panel==='search'&&<Search query={query} setQuery={setQuery} close={()=>setPanel('')} panelRef={panelRef}/>}
    </header>
    <main id="MainContent">
      {home?<Home/>:tojiHome?<Toji/>:catalog?<Catalog path={path} query={query} setQuery={setQuery}/>:product?<Product product={product} path={path} add={add}/>:article?<ArchiveArticle path={path}/>:path==='/blogs/archive'||path==='/blogs/season'?<Archive toji={isToji}/>:path==='/pages/stores'||path==='/pages/toji-stores'?<Stores toji={isToji}/>:path==='/cart'?<CartPage cart={cart} setCart={setCart} checkout={()=>open('checkout')}/>:path==='/account'?<Account/>:<Information slug={path.split('/').at(-1)}/>}
    </main>
    {!tojiHome&&!article&&<Footer path={path} en={en} toji={isToji} login={()=>open('login')}/>}
    {panel&&panel!=='search'&&<div className="local-overlay" onClick={()=>setPanel('')}><section className={`local-dialog ${panel==='cart'?'cart-dialog':''}`} role="dialog" aria-modal="true" aria-label={panel==='cart'?'YOUR CART':panel.toUpperCase()} ref={panelRef} onClick={e=>e.stopPropagation()}><h2>{panel==='cart'?'YOUR CART':panel==='chat'?'SAN SAN GEAR':panel.toUpperCase()}</h2><button className="clos dialog-close" aria-label="닫기" onClick={()=>setPanel('')}/>
      {panel==='cart'?<><CartContents cart={cart} setCart={setCart} checkout={()=>setPanel('checkout')} close={()=>setPanel('')}/><A href="/cart" className="cart--btn">VIEW CART</A></>:panel==='login'?<Account/>:panel==='chat'?<div className="service-dialog"><p>산산기어 고객 서비스</p><A href="/pages/customer-service">CUSTOMER SERVICE →</A></div>:<div className="service-dialog"><p>{en?'Checkout is not connected in this local preview.':'로컬 미리보기에서는 실제 결제가 진행되지 않습니다.'}</p><p>{count} ITEMS · {money(cart.reduce((s,x)=>s+x.price*x.quantity,0))}</p><button className="btn1" onClick={()=>setPanel('cart')}>BACK TO CART</button></div>}
    </section></div>}
  </div></Navigation.Provider></Language.Provider>;
}

function MenuShop({toji,group,setGroup}) {
  const groups=toji?tojiGroups:categoryGroups,prefix=toji?'/collections/toji-':'/collections/san-san-gear-';
  const collectionSeasons=toji?['fw26','ss26']:seasons;
  const SeasonLinks=()=> <ul>{!toji&&<li><A href="/collections/all"><span>all products</span></A></li>}{collectionSeasons.map(s=><li key={s}><A href={prefix+s}><span>{s.replace(/(fw|ss)/,'$1 ')}</span></A></li>)}</ul>;
  return <><div className="v-a p_"><SeasonLinks/></div><div className={`m_ ${group==='collections'?'on':''}`}><span role="button" tabIndex={0} onClick={()=>setGroup(group==='collections'?'':'collections')} onKeyDown={e=>{if(e.key==='Enter')setGroup(group==='collections'?'':'collections')}}><span>collections</span></span><SeasonLinks/></div>
    {Object.entries(groups).map(([name,items])=><div className={group===name?'on':''} key={name}><span role="button" tabIndex={0} onClick={()=>setGroup(group===name?'':name)} onKeyDown={e=>{if(e.key==='Enter')setGroup(group===name?'':name)}}><span>{name}</span></span><ul className={name==='collaborations'?'tn':''}>{(name==='collaborations'?items.slice(1):items).map((s,i)=><li key={s}><A href={prefix+s}><span>{name==='collaborations'?({nothing:'NOTHING',sealson:'SEALSON',yuminha:'yuminha',puma:'PUMA',oasis:'OASIS',beautiful:'b.Eautiful','ryoji-ikeda':'ryoji ikeda'}[s]):i===0?'all':categoryLabel(s).toLowerCase()}</span></A></li>)}</ul></div>)}
  </>;
}

function Footer({path,en,toji,login}) {
  const [languages,setLanguages]=useState(false);
  return <footer><div className="in"><div className="credit"><span>© 2026 {toji?'TOJI':'SAN SAN GEAR'}.</span><div className="ft--info"><ul>{[['ceo','Lee Sang Yup'],['contact','010-2704-2697'],['online register','2022-서울마포-2041호'],['business license','361-86-02697']].map(([label,value])=><li key={label}><label>{label}</label><span>{value}</span></li>)}</ul><ul><li><span>(04042) 36, Jandari-ro, Mapo-gu, Seoul</span></li></ul></div></div><div className="ft--nv l"><ul><li><A href="/pages/help"><span>HELP</span></A></li><li><A href="/pages/terms-of-use"><span>LEGAL</span></A></li><li><a href="#" onClick={e=>{e.preventDefault();login()}}><span>ACCOUNT</span></a></li></ul></div><div className="ft--nv r"><ul><li className="social"><a href="https://www.instagram.com/sansan_gear/" target="_blank" rel="noreferrer"><span>@sansan_gear</span></a></li><li className={`ln_ ${languages?'on':''}`}><Link href={path} className={!en?'sltd':''} onClick={e=>{if(!en){e.preventDefault();setLanguages(!languages)}}}><span>KR</span><i/></Link><Link href={'/en'+(path==='/'?'':path)} className={en?'sltd':''} onClick={e=>{if(en){e.preventDefault();setLanguages(!languages)}}}><span>EN</span><i/></Link></li></ul></div></div></footer>;
}

function Home() {
  const vertical=useRef(null),horizontal=useRef(null);
  useEffect(()=>{
    const pointer=e=>{const p=e.touches?.[0]||e;if(vertical.current)vertical.current.style.left=p.clientX+'px';if(scrollY<=innerHeight/2&&horizontal.current)horizontal.current.style.top=p.clientY+'px'};
    const progress=()=>{if(scrollY>innerHeight/2&&horizontal.current){const h=document.documentElement.scrollHeight-innerHeight;horizontal.current.style.top=(h?scrollY/h*100:0)+'%'}};
    window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('touchmove',pointer,{passive:true});window.addEventListener('scroll',progress,{passive:true});progress();
    return()=>{window.removeEventListener('pointermove',pointer);window.removeEventListener('touchmove',pointer);window.removeEventListener('scroll',progress)};
  },[]);
  return <><h1 className="visually-hidden">SAN SAN GEAR 산산기어</h1><section className="i__hero"><A href="/collections/san-san-gear-sealson" aria-label={data.hero.label}><div className="media"><span><video autoPlay muted loop playsInline preload="auto" poster={data.hero.poster} src={data.hero.video}/></span></div><div className="txt">{data.hero.label}</div></A></section><i ref={vertical} className="ln__ l__1"/><i ref={horizontal} className="ln__ l__2"/><section className="i__grid"><div className="in">{data.home.map((item,i)=><div className={item.className} key={i}>{(item.images.length>0||item.text)&&<a className={item.linkClass} {...(item.href?{href:item.href}: {role:'presentation'})}>{item.images.length>0&&<div className="media" style={!item.className.includes('w-auto')?{width:'100%'}:undefined}>{item.images.map((im,j)=><img key={j} src={im.src} alt={im.alt} width={im.width} height={im.height} loading={i<8?'eager':'lazy'} style={{aspectRatio:`${im.width} / ${im.height}`}}/>)}</div>}{item.text&&<Html className="txt" html={item.text}/>}</a>}</div>)}</div></section></>;
}

function matches(product,key) {
  if(key==='all')return true;
  if(key==='collaborations')return collaborationHandles.has(product.handle);
  const handles=data.collections['/collections/san-san-gear-'+key];
  return handles?.includes(product.handle)||product.tags.some(t=>t.toLowerCase()===key);
}
function collectionInfo(path) {
  const toji=path.startsWith('/collections/toji-');
  const prefix=toji?'/collections/toji-':'/collections/san-san-gear-';
  let key=path.replace(prefix,''),season='';
  for(const s of seasons){if(key===s||key.startsWith(s+'-')){season=s;key=key.slice(s.length).replace(/^-/,'')||'all';break}}
  const groups=toji?tojiGroups:categoryGroups;
  const parent=Object.keys(groups).find(g=>groups[g].includes(key));
  let products;
  if(path==='/collections/all')products=allProducts;
  else if(data.collections[path])products=data.collections[path].map(h=>byHandle.get(h)).filter(Boolean);
  else if(season){const base=data.collections[prefix+season]||[];products=base.map(h=>byHandle.get(h)).filter(p=>p&&matches(p,key))}
  else if(toji)products=(data.collections['/collections/toji-fw26']||[]).map(h=>byHandle.get(h)).filter(p=>p&&matches(p,key));
  else products=allProducts.filter(p=>matches(p,key));
  return {toji,prefix,key,season,parent,groups,products};
}
function Catalog({path,query,setQuery}) {
  const search=path==='/search';const info=collectionInfo(path);
  const [cols,setCols]=useState(6),[mobileCols,setMobileCols]=useState(2),[limit,setLimit]=useState(36),[sort,setSort]=useState('manual'),[searchCategory,setSearchCategory]=useState('all');
  const grid=useRef(null),more=useRef(null);
  const parent=info.parent;
  const navigation=parent?['all',...info.groups[parent].slice(1)]:['all',...Object.keys(info.groups)];
  const active=search?searchCategory:parent?(info.key===parent?'all':info.key):'all';
  let products=search?allProducts.filter(p=>(p.title+' '+p.handle+' '+p.tags.join(' ')).toLowerCase().includes(query.toLowerCase())&&matches(p,searchCategory)):[...info.products];
  if(sort==='low')products.sort((a,b)=>a.variants[0].price-b.variants[0].price);
  if(sort==='high')products.sort((a,b)=>b.variants[0].price-a.variants[0].price);
  const hrefFor=key=>{
    const next=key==='all'&&parent?parent:key;
    if(path==='/collections/all'&&next==='all')return '/collections/all';
    return info.prefix+(info.season?info.season+(next==='all'?'':'-'):'')+(next==='all'&&info.season?'':next);
  };
  useEffect(()=>{setLimit(36)},[path,query,sort,searchCategory]);
  useEffect(()=>{
    if(limit>=products.length||!more.current)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))setLimit(n=>Math.min(n+36,products.length))},{rootMargin:'600px'});observer.observe(more.current);return()=>observer.disconnect();
  },[limit,products.length]);
  useEffect(()=>{if(!grid.current)return;const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}})},{rootMargin:'0px 0px 40% 0px'});grid.current.querySelectorAll('li').forEach((el,i)=>{el.style.setProperty('--i',String(i%36));observer.observe(el)});return()=>observer.disconnect()},[limit,path,sort,query]);
  const switchGrid=(n,mobile)=>{
    const elements=[...(grid.current?.children||[])],before=elements.map(el=>el.getBoundingClientRect());
    flushSync(()=>mobile?setMobileCols(n):setCols(n));
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    elements.forEach((el,i)=>{const after=el.getBoundingClientRect();el.animate([{transform:`translate(${before[i].left-after.left}px,${before[i].top-after.top}px)`},{transform:'translate(0,0)'}],{duration:450,easing:'cubic-bezier(.4,.55,.05,.96)'})});
  };
  const title=search?'SEARCH':path==='/collections/all'?'ALL PRODUCTS':categoryLabel((info.season?info.season+' ':'')+info.key);
  return <div className="cl__"><h1 className="visually-hidden">{title}</h1><aside className="cl__nv" aria-label="상품 목록 도구"><div className="cl-switch"><div className="p_">{[3,4,6].map(n=><span className={cols===n?'on':''} key={n}><button aria-label={`${n}열 보기`} onClick={()=>switchGrid(n,false)}>{n}</button></span>)}</div><div className="m_"><span className={mobileCols===3?'deactive':''}><button aria-label="상품 작게 보기" disabled={mobileCols===3} onClick={()=>switchGrid(mobileCols+1,true)}>−</button></span><span className={mobileCols===1?'deactive':''}><button aria-label="상품 크게 보기" disabled={mobileCols===1} onClick={()=>switchGrid(mobileCols-1,true)}>+</button></span></div></div>
      <div className="cl-nv"><ul aria-label={parent?categoryLabel(parent)+' 소분류':'상품 카테고리'}>{navigation.map(key=><li key={key} className={key===active?'active':''}>{search?<button onClick={()=>setSearchCategory(key==='all'?'all':key)}><span>{categoryLabel(key)}</span></button>:<A href={hrefFor(key)} aria-current={key===active?'page':undefined}><span>{categoryLabel(key)}</span></A>}</li>)}</ul></div>
    </aside>
    {search&&<form className="catalog-search" onSubmit={e=>{e.preventDefault();history.replaceState(null,'','?q='+encodeURIComponent(query))}}><input aria-label="검색어" placeholder="search here :" value={query} onChange={e=>setQuery(e.target.value)}/><button aria-label="검색"><SearchIcon/></button><span role="status">{products.length} RESULTS</span></form>}
    <p className="visually-hidden" role="status">{products.length} PRODUCTS · {Math.min(limit,products.length)} SHOWN</p>
    <ul className={`p tp--${cols===3?1:cols===4?2:3} tp--m${mobileCols}`} ref={grid} data-columns={cols} data-mobile-columns={mobileCols}>{products.slice(0,limit).map((p,i)=><ProductCard key={p.handle} product={p} index={i} collection={search?'':path}/>)}</ul>
    {!products.length&&<div className="empty-results"><p>NO PRODUCTS FOUND.</p><A href="/collections/all">ALL PRODUCTS →</A></div>}
    {limit<products.length&&<div ref={more} className="catalog-more"><button onClick={()=>setLimit(n=>Math.min(n+36,products.length))}>LOAD MORE</button></div>}
  </div>;
}
function ProductCard({product:p,index=0,collection=''}) {
  const sold=!p.variants.some(v=>v.available);
  const href=collection&&collection!=='/collections/all'?collection+'/products/'+p.handle:'/products/'+p.handle;
  return <li className={`${sold?'sold-out ':''}product-card`}><div className="in"><A className="img" href={href}><span><img className="i1" src={p.images[0]} alt={p.title+' '+p.variants[0]?.color} loading={index<6?'eager':'lazy'}/>{p.tags.some(t=>t.toLowerCase()==='toji')&&p.images[1]&&<img className="i2" src={p.images[1]} alt="" loading="lazy"/>}</span></A><div className="dsc"><div className="card__info"><A className="i--1" href={href}><span>{p.title}</span><span>{p.variants[0]?.color}</span></A><div className="price">{money(p.variants[0]?.price)}</div>{sold&&<div className="card__badge"><span className="badge">SOLD OUT</span></div>}</div></div></div></li>;
}

function Product({product:p,path,add}) {
  const metadata=details.products[p.handle]||{};
  const siblingMeta=metadata.guide?metadata:data.products.filter(x=>x.title===p.title).map(x=>details.products[x.handle]).find(x=>x?.guide)||metadata;
  const [variant,setVariant]=useState(p.variants.find(v=>v.size==='1')||p.variants[0]);
  const [guide,setGuide]=useState(false),[tab,setTab]=useState(''),[active,setActive]=useState(0),[recent,setRecent]=useState([]),[galleryEnd,setGalleryEnd]=useState(false);
  const gallery=useRef(null),mobileGallery=useRef(null),thumbs=useRef(null),styling=useRef(null);
  const fallback=p.images.map(src=>({src,width:1000,height:1200,alt:p.title}));
  const images=variant.size==='0'&&metadata.zeroGallery?.length?metadata.zeroGallery:metadata.gallery?.length?metadata.gallery:fallback;
  const parent=path.includes('/collections/')?path.split('/products/')[0]:'';
  useEffect(()=>{try{const handles=JSON.parse(localStorage.getItem('ssg-recent')||'[]');setRecent(handles.map(h=>byHandle.get(h)).filter(Boolean).filter(x=>x.handle!==p.handle));localStorage.setItem('ssg-recent',JSON.stringify([p.handle,...handles.filter(h=>h!==p.handle)].slice(0,8)))}catch{}},[p.handle]);
  useEffect(()=>{if(!guide)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const key=e=>{if(e.key==='Escape')setGuide(false)};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key)}},[guide]);
  useEffect(()=>{if(!gallery.current)return;const visible=new Map();const observer=new IntersectionObserver(entries=>{entries.forEach(e=>visible.set(Number(e.target.dataset.index),e.intersectionRatio));let best=0,value=0;visible.forEach((v,k)=>{if(v>value){best=k;value=v}});setActive(best);setGalleryEnd(gallery.current.getBoundingClientRect().bottom<=innerHeight)},{threshold:[0,.25,.5,.75,1]});gallery.current.querySelectorAll('[data-index]').forEach(el=>observer.observe(el));return()=>observer.disconnect()},[images.length]);
  const related=(metadata.related?.length?metadata.related.map(h=>byHandle.get(h)).filter(Boolean):allProducts.filter(x=>x.type===p.type&&x.handle!==p.handle)).slice(0,12);
  return <><div className="p__">

    <div className="flex"><div className={`l product-gallery ${galleryEnd?'s__end':''}`}><div className="g-s"><div className="s__1" ref={gallery}>{images.map((im,i)=><div className="product-media-container" key={im.src} data-index={i}><ZoomMedia image={im} eager={i===0}/></div>)}</div><div className="s__2" ref={thumbs}>{images.map((im,i)=><button className={`swiper-slide ${i===active?'active':''}`} key={im.src} aria-label={`상품 이미지 ${i+1}`} onClick={()=>gallery.current?.children[i]?.scrollIntoView({behavior:'smooth',block:'start'})}><span><img src={im.src.replace(/width=\d+/,'width=120')} alt="" loading="lazy"/></span></button>)}</div><div className="s__m"><div className="mobile-gallery" ref={mobileGallery} onScroll={e=>setActive(Math.round(e.currentTarget.scrollLeft/e.currentTarget.clientWidth))}>{images.map((im,i)=><div className="swiper-slide" key={im.src}><ZoomMedia image={im} eager={i===0}/></div>)}</div><div className="gallery-progress"><span style={{width:`${100/images.length}%`,left:`${active/images.length*100}%`}}/></div></div></div></div>
      <div className="r p__info">{parent&&<A href={parent} className="cl--btn">{categoryLabel(parent.split('/').at(-1).replace('san-san-gear-','').replace('toji-',''))} - {parent.includes('toji-')?'TOJI':'SAN SAN GEAR'}</A>}<section className="in product__info-container"><div className="p__t"><h1 className="nm">{p.title}</h1><span className="color">{variant.color}</span></div><div className="price">{money(variant.price)}</div><variant-selects><fieldset className="product-form__input product-form__input--pill"><legend className="form__label">SIZE</legend>{p.variants.map(v=><span className="size-option" key={v.id}><input type="radio" name="size" id={'size-'+v.id} checked={variant.id===v.id} className={!v.available?'disabled':''} onChange={()=>setVariant(v)}/><label htmlFor={'size-'+v.id}>{v.size||v.title}<span className="visually-hidden">{!v.available?' — SOLD OUT':''}</span></label></span>)}</fieldset>{siblingMeta.guide&&<button className="sg--btn tr_ has--guide" onClick={()=>setGuide(true)}>SIZE GUIDE</button>}</variant-selects><div className="product-form__buttons"><button className="product-form__submit btn1" disabled={!variant.available} onClick={()=>add(p,variant)}>{variant.available?'ADD TO CART':'SOLD OUT'}</button></div></section><div className="dsc__"><div className={`product__description p__dsc ${tab?'on':''}`}><ul>{[['details','DETAILS',p.description],['care','PRODUCT CARE',metadata.care||siblingMeta.care||'세탁 및 관리 시 제품에 부착된 케어라벨의 취급 주의사항을 확인해 주시기 바랍니다.'],['shipping','SHIPPING & RETURNS',metadata.shipping||details.products['crosstalk-t-shirt-brown']?.shipping||'']].map(([key,label,html],i)=><li key={key} className={`p__d${i+1} ${tab===key?'on':''}`}><button aria-expanded={tab===key} onClick={()=>setTab(tab===key?'':key)}>{label}</button><Html html={html}/><button className="plus close-description" aria-label={label+' 닫기'} onClick={()=>setTab('')}/></li>)}</ul></div></div></div>
    </div>
    {metadata.technical&&<Technical html={metadata.technical}/>}
    {metadata.styling?.length>0&&<div className="lb-imgs"><h2><span>STYLING</span></h2><div className="styling-gallery" ref={styling}>{metadata.styling.map(im=><img key={im.src} src={im.src} alt={im.alt} loading="lazy"/>)}</div></div>}
    {related.length>0&&<ProductRail title="YOU MAY ALSO LIKE" products={related}/>}
    {recent.length>0&&<ProductRail title="RECENTLY VIEWED" products={recent}/>}
    {guide&&<div className="s-g on" role="dialog" aria-modal="true" aria-label="SIZE GUIDE"><button className="over" aria-label="실측표 닫기" onClick={()=>setGuide(false)}/><div className="in"><button autoFocus className="clos" aria-label="실측표 닫기" onClick={()=>setGuide(false)}/><h6>SIZE GUIDE</h6><Html html={siblingMeta.guide}/></div></div>}
  </div></>;
}
function ZoomMedia({image,eager}) {
  const [zoom,setZoom]=useState(false),[offset,setOffset]=useState({x:0,y:0}),[pinch,setPinch]=useState(null);
  const drag=useRef(null),moved=useRef(false),touch=useRef(null);
  return <div className={`product__media ${zoom?'zoomed':''} ${pinch?'pinching':''}`} role="button" tabIndex={0} aria-label="상품 이미지 확대/축소" onClick={()=>{if(moved.current){moved.current=false;return}setZoom(z=>!z);setOffset({x:0,y:0})}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setZoom(z=>!z)}if(e.key==='Escape')setZoom(false)}} onPointerDown={e=>{if(!zoom)return;drag.current={x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y};moved.current=false;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!drag.current)return;const dx=(e.clientX-drag.current.x)/2.5,dy=(e.clientY-drag.current.y)/2.5;if(Math.abs(dx)+Math.abs(dy)>3)moved.current=true;setOffset({x:Math.max(-e.currentTarget.clientWidth*.3,Math.min(e.currentTarget.clientWidth*.3,drag.current.ox+dx)),y:Math.max(-e.currentTarget.clientHeight*.3,Math.min(e.currentTarget.clientHeight*.3,drag.current.oy+dy))})}} onPointerUp={()=>{drag.current=null}} onTouchStart={e=>{if(e.touches.length===2){touch.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);moved.current=true}}} onTouchMove={e=>{if(e.touches.length===2&&touch.current){const distance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);setPinch(Math.max(1,Math.min(2.5,distance/touch.current)))}}} onTouchEnd={()=>{touch.current=null;setPinch(null)}}><img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={eager?'eager':'lazy'} draggable={false} style={{'--x':offset.x+'px','--y':offset.y+'px','--pinch-scale':pinch||1}}/></div>;
}
function Technical({html}) {
  const root=useRef(null),[visible,setVisible]=useState(false);
  useEffect(()=>{const update=()=>{if(!root.current)return;const rect=root.current.getBoundingClientRect();setVisible(rect.top < -400&&rect.bottom>innerHeight)};window.addEventListener('scroll',update,{passive:true});update();return()=>window.removeEventListener('scroll',update)},[]);
  const click=event=>{
    const link=event.target.closest('a[data-target]');
    if(link){event.preventDefault();const target=root.current.querySelector('[data-id="'+link.dataset.target+'"]');if(target)window.scrollTo({top:target.getBoundingClientRect().top+scrollY-200,behavior:'smooth'});root.current.querySelectorAll('.idx__nv li').forEach(li=>li.classList.toggle('sltd',li.contains(link)))}
    const item=event.target.closest('.f__nv>li');
    if(item){event.preventDefault();root.current.querySelectorAll('.f__nv>li').forEach(li=>li.classList.toggle('sltd',li===item));root.current.querySelectorAll('.f__item').forEach(el=>el.classList.toggle('on',el.id===item.dataset.id))}
  };
  return <div className={visible?'technical-wrap is--info--on':'technical-wrap'} ref={root} onClick={click} dangerouslySetInnerHTML={{__html:html}}/>;
}
function ProductRail({title,products}) {return <section className="product-rail r-p"><h2><span>{title}</span></h2><ul className="p rail-products">{products.map((p,i)=><ProductCard key={p.handle} product={p} index={i}/>)}</ul></section>}

function Archive({toji}) {
  const available=toji?['fw26','ss26']:archiveSeasons;
  const [season,setSeason]=useState(available[0]);
  useEffect(()=>{const s=new URLSearchParams(location.search).get('sn');if(available.includes(s))setSeason(s)},[toji]);
  const entries=details.archives.filter(a=>a.href.startsWith('/blogs/'+(toji?'season':'archive')+'/')&&a.season===season);
  const choose=s=>{setSeason(s);history.replaceState(null,'','?sn='+s)};
  return <div className="in w1 archive"><div className="t1__"><h1>ARCHIVE</h1></div><div className="in__"><div><div className="sub--nv"><ul>{available.map(s=><li key={s} className={s===season?'sltd':''}><a href={'?sn='+s} onClick={e=>{e.preventDefault();choose(s)}}><span>{s.toUpperCase()}</span></a></li>)}</ul></div><div className="cont a__">{entries.map(a=><A href={a.href} className="item" key={a.href}><h4>{a.title}</h4><div className="archive-strip">{a.images.map((src,i)=><span key={i}><img src={src} alt={a.title+' '+(i+1)} loading="lazy"/></span>)}</div></A>)}</div></div></div></div>;
}
function ArchiveArticle({path}) {
  const a=details.archives.find(a=>a.href===path),rail=useRef(null),[active,setActive]=useState(0);
  if(!a)return <div className="empty-results">ARCHIVE NOT FOUND</div>;
  return <div className="archive-view"><A className="back--btn s" href={path.split('/').slice(0,3).join('/')+'?sn='+a.season}><i/><span>{a.title}</span></A><div className="archive-gallery" ref={rail} onScroll={e=>{const el=e.currentTarget;const mid=el.scrollLeft+el.clientWidth/2;let nearest=0,distance=Infinity;[...el.children].forEach((child,i)=>{const d=Math.abs(child.offsetLeft+child.clientWidth/2-mid);if(d<distance){distance=d;nearest=i}});setActive(nearest)}}>{a.images.map((src,i)=><img key={src} src={src.replace('width=500','width=1800')} alt={`${a.title} ${i+1}`} loading={i<2?'eager':'lazy'}/>)}</div><div className="archive-thumbs">{a.images.map((src,i)=><button key={src} className={i===active?'active':''} aria-label={`이미지 ${i+1}`} onClick={()=>rail.current?.children[i]?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}><img src={src} alt=""/></button>)}</div></div>;
}
function Stores({toji}) {
  const [active,setActive]=useState(0);
  const stores=toji?data.toji.stores:data.stores;
  return <div className="in w1 st__ stores"><div className="t1__"><h1>STORES</h1></div><div className="in__"><div><Subnav items={[[toji?'/pages/toji-stores':'/pages/stores','Stores'],[toji?'/pages/toji-stockist':'/pages/stockist','Stockist']]} current={toji?'/pages/toji-stores':'/pages/stores'}/><div className="cont"><ul>{stores.map((s,i)=><li key={s.name} className={i===active?'sltd':''}><div><h4><button aria-expanded={i===active} onClick={()=>setActive(i)}>{s.name}</button></h4><div className="info"><div className="img"><img src={s.image} alt={s.name}/></div><div className="dsc"><p dangerouslySetInnerHTML={{__html:s.description}}/><a href={s.map} target="_blank" rel="noreferrer">view map</a></div></div></div></li>)}</ul></div></div></div><div className="i__ p_"><img src={stores[active].image} alt={stores[active].name}/></div></div>;
}
function Subnav({items,current}){return <nav className="sub--nv"><ul>{items.map(([href,label])=><li className={current===href?'sltd':''} key={href}><A href={href}><span>{label}</span></A></li>)}</ul></nav>}
function Information({slug}) {
  const en=useContext(Language);
  const page=(en?data.pagesEN?.[slug]:null)||data.pages[slug];const legal=['terms-of-use','privacy-policy'].includes(slug),stock=slug.endsWith('stockist');
  const items=legal?[['/pages/terms-of-use','Terms of Use'],['/pages/privacy-policy','Privacy Policy']]:stock?[[slug.startsWith('toji-')?'/pages/toji-stores':'/pages/stores','Stores'],[slug.startsWith('toji-')?'/pages/toji-stockist':'/pages/stockist','Stockist']]:[['/pages/help','Shipping'],['/pages/returns','Returns'],['/pages/others','Others'],['/pages/customer-service','Customer Service']];
  return <div className={`in w1 ${legal?'legal__':stock?'st__ stockist':'help__'}`}><div className="t1__"><h1>{legal?'LEGAL':stock?'STORES':page?.title||slug}</h1></div><div className="in__"><div><Subnav items={items} current={'/pages/'+slug}/><Html className="cont" html={page?.html||''}/></div></div></div>;
}
function Toji() {
  const [index,setIndex]=useState(0),videos=useRef([]);
  useEffect(()=>{const current=videos.current[index];if(current){current.currentTime=0;current.play().catch(()=>{})}videos.current.forEach((video,i)=>{if(i!==index)video?.pause()})},[index]);
  return <><section className="toji__ tj__hero"><div className="in"><div className="media"><span>{data.toji.videos.map((src,i)=><video ref={el=>videos.current[i]=el} key={src} muted playsInline preload="metadata" style={{display:i===index?'block':'none'}} onEnded={()=>setIndex(n=>(n+1)%data.toji.videos.length)} src={src}/>)}</span></div><span className="dsc" dangerouslySetInnerHTML={{__html:data.toji.description}}/><div className="txt"><span className="t__1">TOJI 2026 FALL</span><span className="t__sub">1947</span></div><A className="shop--btn" href="/collections/toji-fw26"><span>Shop</span></A></div></section><span className="txt--bottom">© 2026 TOJI</span></>;
}

function Search({query,setQuery,close,panelRef}) {
  const en=useContext(Language);
  const products=query?allProducts.filter(p=>(p.title+' '+p.handle+' '+p.tags.join(' ')).toLowerCase().includes(query.toLowerCase())).slice(0,6):[];
  return <div className="header-search" ref={panelRef} role="dialog" aria-label="검색"><form action={localized('/search/',en)}><input autoFocus name="q" type="search" placeholder="search here :" aria-label="상품 검색" value={query} onChange={e=>setQuery(e.target.value)}/><button aria-label="검색"><SearchIcon/></button><button type="button" className="clos visually-hidden" aria-label="검색 닫기" onClick={close}/></form>{query&&<div className="predictive-products">{products.map(p=><A href={'/products/'+p.handle} key={p.handle}><img src={p.images[0]} alt={p.title}/><span>{p.title}<br/>{p.variants[0]?.color}<br/>{money(p.variants[0]?.price)}</span></A>)}{!products.length&&<p>NO RESULTS FOUND.</p>}<A className="all-results" href={'/search?q='+encodeURIComponent(query)}>SEARCH FOR “{query}” →</A></div>}</div>;
}
function CartContents({cart,setCart,checkout,close}) {
  const en=useContext(Language);
  if(!cart.length)return <div className="cart-empty"><p>{en?'Your cart is empty':'장바구니가 비어 있습니다.'}</p><A href="/collections/all" onClick={close}>CONTINUE SHOPPING</A></div>;
  return <><div className="local-cart-lines">{cart.map(item=><div className="local-cart-line" key={item.id}><A href={'/products/'+item.handle}><img src={item.image} alt={item.title}/></A><div><A href={'/products/'+item.handle}>{item.title}</A><p>{item.color} / {item.variant}</p><p>{money(item.price)}</p><div className="cart-quantity"><button aria-label={item.title+' 수량 줄이기'} onClick={()=>setCart(items=>items.map(x=>x.id===item.id?{...x,quantity:x.quantity-1}:x).filter(x=>x.quantity>0))}>−</button><span>{item.quantity}</span><button aria-label={item.title+' 수량 늘리기'} onClick={()=>setCart(items=>items.map(x=>x.id===item.id?{...x,quantity:x.quantity+1}:x))}>+</button><button className="remove" onClick={()=>setCart(items=>items.filter(x=>x.id!==item.id))}>REMOVE</button></div></div></div>)}</div><div className="cart-checkout"><div><span>TOTAL</span><span>{money(cart.reduce((sum,x)=>sum+x.quantity*x.price,0))}</span></div><p>{en?'Shipping calculated at checkout.':'배송료는 결제 시 계산됩니다.'}</p><button className="btn1" onClick={checkout}>CHECK OUT</button></div></>;
}
function CartPage(props){return <div className="cart-page"><h1>YOUR CART</h1><CartContents {...props}/></div>}
function Account(){const [message,setMessage]=useState('');return <div className="account-content"><h1>LOGIN</h1><form onSubmit={e=>{e.preventDefault();setMessage('로컬 미리보기에서는 계정 인증이 연결되지 않습니다.')}}><input type="email" autoComplete="off" aria-label="Email" placeholder="Email" required/><input type="password" autoComplete="off" aria-label="Password" placeholder="Password" required/><button className="btn1">LOGIN</button></form><p role="status">{message}</p><p className="account-caption">로컬 미리보기 · 계정 인증 연결 없음</p></div>}
