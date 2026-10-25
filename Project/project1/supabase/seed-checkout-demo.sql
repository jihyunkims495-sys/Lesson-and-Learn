-- Optional fixture for the existing sessionStorage demo cart.
-- Existing catalog products are reused. Refuse conflicting IDs; never overwrite.
begin;
do $$
begin
    if not exists (select 1 from public.products where id=5 and name='블랙 집업 자켓' and sale_price=114460)
       or not exists (select 1 from public.products where id=4 and name='블랙 반팔 티셔츠' and sale_price=56260)
       or not exists (select 1 from public.products where id=1 and name='아이보리 싱글 코트' and sale_price=153260) then
        raise exception 'Demo catalog differs. Update fixture and cart.mock.ts together before running.';
    end if;
    if exists (
        select 1 from (values (1,5,'DEMO-ZIP-JACKET-M','2'),(2,4,'DEMO-TSHIRT-L','3'),(3,1,'DEMO-COAT-L','3'))
        as demo(id,product_id,sku,size_label) join public.product_variants v on v.id=demo.id
        where (v.product_id,v.sku,v.size_label) is distinct from (demo.product_id,demo.sku,demo.size_label)
    ) then raise exception 'Demo variant IDs already used; no data was changed.'; end if;
end; $$;
insert into public.product_variants(id,product_id,sku,size_label,stock_quantity)
overriding system value values
    (1,5,'DEMO-ZIP-JACKET-M','2',100),
    (2,4,'DEMO-TSHIRT-L','3',100),
    (3,1,'DEMO-COAT-L','3',100)
on conflict (id) do nothing;
select setval(pg_get_serial_sequence('public.product_variants','id'),
    greatest((select max(id) from public.product_variants),
        (select last_value from public.product_variants_id_seq)));
commit;
