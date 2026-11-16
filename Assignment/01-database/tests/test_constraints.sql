\set ON_ERROR_STOP on
create temporary table evaluation_checks(name text primary key, passed boolean not null);

do $$
begin
  if (select count(*) from pg_constraint where contype='p'
      and conrelid in ('public.members'::regclass,'public.products'::regclass,'public.orders'::regclass))<>3 then
    raise exception 'expected three primary keys';
  end if;
  if (select count(*) from pg_constraint where contype='f'
      and conrelid in ('public.members'::regclass,'public.products'::regclass,'public.orders'::regclass))<>4 then
    raise exception 'expected four foreign keys';
  end if;
  if (select count(*) from pg_constraint where contype='c'
      and conrelid in ('public.members'::regclass,'public.products'::regclass,'public.orders'::regclass))<>6 then
    raise exception 'expected six CHECK constraints';
  end if;
  if not exists(select 1 from information_schema.columns
      where table_schema='public' and table_name='products' and column_name='description') then
    raise exception 'ALTER-added description missing';
  end if;
  if to_regclass('ddl_demo') is not null then raise exception 'temporary DROP demo left a table'; end if;
end $$;
insert into evaluation_checks values('schema: 3 PK, 4 FK, 6 CHECK, ALTER and DROP',true);

set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$
declare pid bigint; oid bigint;
begin
  insert into public.members(id,display_name) values(auth.uid(),'Before');
  if (select display_name from public.members where id=auth.uid())<>'Before' then
    raise exception 'member create/read failed';
  end if;
  update public.members set display_name='After' where id=auth.uid();
  if (select display_name from public.members where id=auth.uid())<>'After' then
    raise exception 'member update/read failed';
  end if;
  insert into public.products(owner_id,title,price) values(auth.uid(),'Product',100) returning id into pid;
  if pid<=0 or (select stock from public.products where id=pid)<>0
      or (select description from public.products where id=pid)<>'' then
    raise exception 'product identity/default/read failed';
  end if;
  update public.products set price=200,stock=5 where id=pid;
  if (select price from public.products where id=pid)<>200
      or (select stock from public.products where id=pid)<>5 then
    raise exception 'product update/read failed';
  end if;
  select id into oid from public.place_order(pid,2);
  if oid<=0 or (select quantity from public.orders where id=oid)<>2
      or (select unit_price from public.orders where id=oid)<>200
      or (select created_at from public.orders where id=oid) is null
      or (select stock from public.products where id=pid)<>3 then
    raise exception 'order create/read and stock failed';
  end if;
  update public.orders set unit_price=150 where id=oid;
  if (select unit_price from public.orders where id=oid)<>150 then
    raise exception 'order update/read failed';
  end if;
  delete from public.orders where id=oid;
  if exists(select 1 from public.orders where id=oid) then raise exception 'order delete failed'; end if;
  delete from public.products where id=pid;
  if exists(select 1 from public.products where id=pid) then raise exception 'product delete failed'; end if;
  delete from public.members where id=auth.uid();
  if exists(select 1 from public.members where id=auth.uid()) then raise exception 'member delete failed'; end if;
end $$;
reset role;
insert into evaluation_checks values
 ('member: create/read/update/delete as owner',true),
 ('product: create/read/update/delete, identity and defaults',true),
 ('order: create/read/update/delete, snapshot price and timestamp',true);

create function pg_temp.expect_rejected(test_name text, statement text, expected_code text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate=expected_code then
      insert into evaluation_checks values(test_name,true);
      return;
    end if;
    raise exception 'unexpected SQLSTATE for %: %',test_name,sqlstate;
  end;
  raise exception 'invalid input accepted: %',test_name;
end $$;
insert into public.members values('00000000-0000-0000-0000-000000000001','Constraint fixture');
insert into public.products(owner_id,title,price,stock)
 values('00000000-0000-0000-0000-000000000001','Constraint product',100,10);

select pg_temp.expect_rejected('member duplicate PK',
 $$insert into public.members values('00000000-0000-0000-0000-000000000001','duplicate')$$,'23505');
select pg_temp.expect_rejected('member missing Auth FK',
 $$insert into public.members values('00000000-0000-0000-0000-000000000099','unknown')$$,'23503');
select pg_temp.expect_rejected('member blank display name',
 $$insert into public.members values('00000000-0000-0000-0000-000000000002','   ')$$,'23514');
select pg_temp.expect_rejected('member oversized display name',
 $$insert into public.members values('00000000-0000-0000-0000-000000000002',repeat('x',81))$$,'23514');
select pg_temp.expect_rejected('member null display name',
 $$insert into public.members values('00000000-0000-0000-0000-000000000002',null)$$,'23502');
select pg_temp.expect_rejected('product blank title',
 $$insert into public.products(owner_id,title,price) values('00000000-0000-0000-0000-000000000001','   ',100)$$,'23514');
select pg_temp.expect_rejected('product oversized title',
 $$insert into public.products(owner_id,title,price) values('00000000-0000-0000-0000-000000000001',repeat('x',121),100)$$,'23514');
select pg_temp.expect_rejected('product negative price',
 $$insert into public.products(owner_id,title,price) values('00000000-0000-0000-0000-000000000001','Invalid',-1)$$,'23514');
select pg_temp.expect_rejected('product negative stock',
 $$insert into public.products(owner_id,title,price,stock) values('00000000-0000-0000-0000-000000000001','Invalid',100,-1)$$,'23514');
select pg_temp.expect_rejected('product missing member FK',
 $$insert into public.products(owner_id,title,price) values('00000000-0000-0000-0000-000000000099','Invalid',100)$$,'23503');
select pg_temp.expect_rejected('order zero quantity',
 $$insert into public.orders(member_id,product_id,quantity,unit_price) select '00000000-0000-0000-0000-000000000001',id,0,100 from public.products$$,'23514');
select pg_temp.expect_rejected('order negative unit price',
 $$insert into public.orders(member_id,product_id,quantity,unit_price) select '00000000-0000-0000-0000-000000000001',id,1,-1 from public.products$$,'23514');
select pg_temp.expect_rejected('order missing product FK',
 $$insert into public.orders(member_id,product_id,quantity,unit_price) values('00000000-0000-0000-0000-000000000001',9223372036854775807,1,100)$$,'23503');
select pg_temp.expect_rejected('order missing member FK',
 $$insert into public.orders(member_id,product_id,quantity,unit_price) select '00000000-0000-0000-0000-000000000099',id,1,100 from public.products$$,'23503');

-- Force an error after the original RPC's stock UPDATE and prove full rollback.
create function pg_temp.fail_order_insert() returns trigger language plpgsql as $$
begin raise exception 'evaluation forced insert failure'; end $$;
create trigger evaluation_fail_order before insert on public.orders
 for each row execute function pg_temp.fail_order_insert();
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$
declare before_stock integer;
begin
  select stock into before_stock from public.products;
  begin
    perform public.place_order((select id from public.products),2);
    raise exception 'forced failure was not raised';
  exception when raise_exception then
    if sqlerrm<>'evaluation forced insert failure' then raise; end if;
  end;
  if (select stock from public.products)<>before_stock or exists(select 1 from public.orders) then
    raise exception 'RPC write-then-fail rollback violated';
  end if;
end $$;
reset role;
drop trigger evaluation_fail_order on public.orders;
insert into evaluation_checks values('original RPC: forced failure after stock write rolls back',true);
set role anon;
do $$
begin
  begin perform count(*) from public.members; raise exception 'anonymous members access accepted';
    exception when insufficient_privilege then null; end;
  begin perform count(*) from public.products; raise exception 'anonymous products access accepted';
    exception when insufficient_privilege then null; end;
  begin perform count(*) from public.orders; raise exception 'anonymous orders access accepted';
    exception when insufficient_privilege then null; end;
  begin perform public.place_order(1,1); raise exception 'anonymous RPC accepted';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into evaluation_checks values('anonymous table and RPC privileges denied',true);
delete from public.orders;
delete from public.products;
delete from public.members;
do $$
begin
  if exists(select 1 from public.members) or exists(select 1 from public.products)
      or exists(select 1 from public.orders) then raise exception 'supplemental cleanup failed'; end if;
end $$;
insert into evaluation_checks values('supplemental cleanup: zero application rows',true);
select name,passed from evaluation_checks order by name;
select count(*) as supplemental_checks, bool_and(passed) as all_passed from evaluation_checks;
