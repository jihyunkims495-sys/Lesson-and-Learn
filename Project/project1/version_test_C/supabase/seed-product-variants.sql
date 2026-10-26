-- 상품별 사이즈 옵션을 추가해 19개 상품 모두 장바구니 담기·결제가 가능하게 합니다.
-- 의류(아우터·상의·하의): 1 / 2 / 3 / 4 (상품 상세 사이즈 가이드 표와 같은 이름)
-- 신발: 250 / 260 / 270 / 280, 가방·액세서리: FREE
-- 옵션마다 재고 100개, SKU는 P상품번호-사이즈 (예: P2-3).
-- 기존 데모 옵션 3개는 번호·SKU를 유지하고 사이즈 이름만 M→2, L→3으로 맞춥니다.
-- 다시 실행해도 이미 있는 옵션은 건너뜁니다. 기존 옵션은 삭제하지 않습니다.
begin;

update public.product_variants set size_label='2', sort_order=2
    where id=1 and product_id=5 and size_label in ('M','2');
update public.product_variants set size_label='3', sort_order=3
    where id in (2,3) and product_id in (4,1) and size_label in ('L','3');

insert into public.product_variants(product_id, sku, size_label, stock_quantity, sort_order)
select p.id, 'P' || p.id || '-' || s.size, s.size, 100, s.ord
from public.products p
cross join lateral unnest(case
    when p.category_id in ('11','12','13','21','22','23','31','32','33')
        then array['1','2','3','4']
    when p.category_id = '41' then array['250','260','270','280']
    when p.category_id in ('42','43') then array['FREE']
end) with ordinality as s(size, ord)
on conflict (product_id, size_label) do nothing;

commit;

-- 확인: 상품별 옵션 목록
select p.id, p.name, string_agg(v.size_label, ', ' order by v.sort_order, v.id) as sizes,
    count(v.id) as variant_count
from public.products p
left join public.product_variants v on v.product_id = p.id and v.is_active
group by p.id, p.name
order by p.id;
