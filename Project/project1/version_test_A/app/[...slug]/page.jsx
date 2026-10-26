import data from '../../data/reference.json';
import details from '../../data/details.json';
import {storeRoutes} from '../../data/routes.mjs';
import Storefront from '../../components/Storefront';
export function generateStaticParams(){return storeRoutes(data,details).map(path=>({slug:path.split('/').filter(Boolean)}))}
export async function generateMetadata({params}) {
  const {slug}=await params;const path='/'+slug.join('/');
  const product=path.includes('/products/')?data.products.find(p=>p.handle===path.split('/products/').at(-1)):null;
  const label=product?product.title+' '+product.variants[0]?.color:path.split('/').at(-1).replaceAll('-',' ').replace('san san gear ','').toUpperCase();
  return {title:path==='/en'?'SAN SAN GEAR':label+' — SAN SAN GEAR'};
}
export default async function Page({params}){const {slug}=await params;return <Storefront key={slug.join('/')} path={'/'+slug.join('/')}/>}
