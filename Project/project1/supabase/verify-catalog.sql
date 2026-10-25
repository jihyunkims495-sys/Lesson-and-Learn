-- SQL Editor에서 실행하는 읽기 전용 확인용 SQL입니다.
select 'categories' as name, count(*) from public.categories
union all select 'products', count(*) from public.products
union all select 'product_images', count(*) from public.product_images;

-- 비공개 버킷이면 public = false가 정상입니다.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'product-images';

-- SQL 입력 + 이미지 업로드 완료 후 누락된 파일이 없어야 합니다.
select i.product_id, i.storage_path as missing_file
from public.product_images i
left join storage.objects o on o.bucket_id = 'product-images' and o.name = i.storage_path
where o.id is null
order by i.product_id, i.sort_order;

-- 비로그인 사용자에게 공개 상품이 조회되는지 기존 RLS도 확인합니다.
begin;
set local role anon;
select id, name, sale_price,
    (select count(*) from public.product_images i where i.product_id = p.id) as image_count
from public.products p where status = 'active' order by sort_order, id;
rollback;
