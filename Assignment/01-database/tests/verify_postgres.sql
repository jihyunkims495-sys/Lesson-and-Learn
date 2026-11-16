\set ON_ERROR_STOP on
-- Run as the non-owner, non-BYPASSRLS authenticated role.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into public.members values(auth.uid(), 'Local A');
insert into public.products(owner_id,title,price,stock)
 values(auth.uid(),'Local product',39000,10);
update public.products set price=35000 where owner_id=auth.uid();
select public.place_order((select id from public.products),2);
update public.orders set unit_price=34000 where member_id=auth.uid();
do $$
declare before_stock integer; before_count bigint;
begin
  if (select stock from public.products)<>8 then raise exception 'RPC stock failed'; end if;
  if (select unit_price from public.orders)<>34000 then raise exception 'order update failed'; end if;
  select stock into before_stock from public.products;
  select count(*) into before_count from public.orders;
  begin
    perform public.place_order((select id from public.products),999);
    raise exception 'insufficient stock was accepted';
  exception when raise_exception then
    if sqlerrm<>'insufficient stock' then raise; end if;
  end;
  if (select stock from public.products)<>before_stock
     or (select count(*) from public.orders)<>before_count then
    raise exception 'failed RPC modified state';
  end if;
  begin
    insert into public.products(owner_id,title,price,stock) values(auth.uid(),'Invalid',-1,1);
    raise exception 'negative price accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.orders(member_id,product_id,quantity,unit_price)
      values(auth.uid(),9223372036854775807,1,1);
    raise exception 'missing product FK accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.members values(auth.uid(),'duplicate');
    raise exception 'duplicate PK accepted';
  exception when unique_violation then null;
  end;
end $$;
select 'PASS: owner CRUD, RPC stock, failed RPC unchanged, CHECK/FK/PK' as result;

set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$
declare affected bigint;
begin
  if exists(select 1 from public.members) then raise exception 'B sees A member'; end if;
  if exists(select 1 from public.orders) then raise exception 'B sees A order'; end if;
  if (select count(*) from public.products)<>1 then raise exception 'B cannot read products'; end if;
  update public.products set stock=999;
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'B updated A product'; end if;
  update public.members set display_name='attacker';
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'B updated A member'; end if;
  delete from public.orders;
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'B deleted A order'; end if;
  begin
    insert into public.orders(member_id,product_id,quantity,unit_price)
      select '00000000-0000-0000-0000-000000000001',id,1,1 from public.products;
    raise exception 'B forged A order';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.place_order((select id from public.products),1);
    raise exception 'B ordered A demo product';
  exception when raise_exception then
    if sqlerrm not in ('product not found','only own demonstration product allowed') then raise; end if;
  end;
end $$;
select 'PASS: second identity RLS read/write and RPC denial' as result;

set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
begin
  if (select stock from public.products)<>8 then raise exception 'A stock changed by B'; end if;
  if (select display_name from public.members)<>'Local A' then raise exception 'A member changed by B'; end if;
  if (select count(*) from public.orders)<>1 then raise exception 'A order changed by B'; end if;
end $$;
select 'PASS: owner re-read confirms protected state' as result;
reset role;

-- Exercise the submitted write-then-fail rollback and explicit COMMIT proof.
\ir ../transaction-proof.sql

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
delete from public.orders where member_id=auth.uid();
delete from public.products where owner_id=auth.uid();
delete from public.members where id=auth.uid();
reset role;
do $$
begin
  if exists(select 1 from public.orders) or exists(select 1 from public.products)
     or exists(select 1 from public.members) then raise exception 'CRUD cleanup failed'; end if;
end $$;
select 'PASS: owner deletes and no application rows remain' as result;
