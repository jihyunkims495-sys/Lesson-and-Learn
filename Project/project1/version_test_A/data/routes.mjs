import {categoryGroups} from './catalog.mjs';
export function storeRoutes(data, details) {
  const routes=new Set([...Object.keys(data.collections),...Object.keys(data.pages).map(k=>'/pages/'+k),...data.products.map(p=>'/products/'+p.handle),...details.archives.map(a=>a.href),'/collections/all','/collections/san-san-gear-collaborations','/pages/stores','/pages/toji-stores','/blogs/archive','/blogs/season','/search','/account','/cart']);
  const categoryKeys=Object.values(categoryGroups).flat();
  for(const season of ['fw26','ss26','fw25','ss25'])for(const key of categoryKeys)routes.add('/collections/san-san-gear-'+season+'-'+key);
  const tojiKeys=['outer','jackets','top','t-shirts','sleeveless','long-sleeves','bottom','pants','shorts','tights','accessories','etc'];
  for(const key of tojiKeys){routes.add('/collections/toji-'+key);for(const s of ['fw26','ss26'])routes.add('/collections/toji-'+s+'-'+key)}
  routes.add('/collections/toji-ss26');
  const collab=new Set(categoryGroups.collaborations.slice(1).flatMap(k=>data.collections['/collections/san-san-gear-'+k]||[]));
  for(const collection of [...routes].filter(p=>p.startsWith('/collections/')&&p!=='/collections/all')){
    let handles=data.collections[collection];
    if(!handles){const toji=collection.startsWith('/collections/toji-');let key=collection.replace(toji?'/collections/toji-':'/collections/san-san-gear-','');let season='';for(const s of ['fw26','ss26','fw25','ss25'])if(key===s||key.startsWith(s+'-')){season=s;key=key.slice(s.length).replace(/^-/,'')||'all';break}
      const base=season?new Set(data.collections['/collections/'+(toji?'toji-':'san-san-gear-')+season]||[]):null;
      handles=data.products.filter(p=>(!base||base.has(p.handle))&&(!toji||(data.collections['/collections/toji-fw26']||[]).includes(p.handle))&&(key==='all'||key==='collaborations'&&collab.has(p.handle)||(data.collections['/collections/san-san-gear-'+key]||[]).includes(p.handle)||p.tags.some(t=>t.toLowerCase()===key))).map(p=>p.handle);
    }
    for(const h of handles)routes.add(collection+'/products/'+h);
  }
  return [...routes].flatMap(p=>[p,'/en'+p]).concat('/en');
}
