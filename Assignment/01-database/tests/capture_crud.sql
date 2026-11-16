\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
create temporary table capture_steps(seq integer generated always as identity, entity text, action text, snapshot jsonb);
create function pg_temp.sample_rows(entity text) returns jsonb language plpgsql as $$
declare result jsonb;
begin
  if entity='members' then
    select coalesce(jsonb_agg(jsonb_build_object('id','sample-member','display_name',display_name)),'[]'::jsonb)
      into result from public.members where id=auth.uid();
  elsif entity='products' then
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'owner_id','sample-member',
      'title',title,'price',price,'stock',stock)),'[]'::jsonb)
      into result from public.products where owner_id=auth.uid();
  elsif entity='orders' then
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'member_id','sample-member',
      'product_id',product_id,'quantity',quantity,'unit_price',unit_price)),'[]'::jsonb)
      into result from public.orders where member_id=auth.uid();
  else raise exception 'unknown capture entity';
  end if;
  return result;
end $$;

insert into public.members values(auth.uid(),'Anonymous member');
insert into capture_steps(entity,action,snapshot) values('members','CREATE',pg_temp.sample_rows('members'));
insert into capture_steps(entity,action,snapshot) values('members','READ',pg_temp.sample_rows('members'));
update public.members set display_name='Anonymous member updated' where id=auth.uid();
insert into capture_steps(entity,action,snapshot) values('members','UPDATE',pg_temp.sample_rows('members'));
insert into public.products(owner_id,title,price,stock) values(auth.uid(),'Sample notebook',39000,10);
insert into capture_steps(entity,action,snapshot) values('products','CREATE',pg_temp.sample_rows('products'));
insert into capture_steps(entity,action,snapshot) values('products','READ',pg_temp.sample_rows('products'));
update public.products set price=35000 where owner_id=auth.uid();
insert into capture_steps(entity,action,snapshot) values('products','UPDATE',pg_temp.sample_rows('products'));
do $$begin perform public.place_order((select id from public.products where owner_id=auth.uid()),2); end $$;
insert into capture_steps(entity,action,snapshot) values('orders','CREATE',pg_temp.sample_rows('orders'));
insert into capture_steps(entity,action,snapshot) values('orders','READ',pg_temp.sample_rows('orders'));
update public.orders set unit_price=34000 where member_id=auth.uid();
insert into capture_steps(entity,action,snapshot) values('orders','UPDATE',pg_temp.sample_rows('orders'));
delete from public.orders where member_id=auth.uid();
insert into capture_steps(entity,action,snapshot) values('orders','DELETE',pg_temp.sample_rows('orders'));
delete from public.products where owner_id=auth.uid();
insert into capture_steps(entity,action,snapshot) values('products','DELETE',pg_temp.sample_rows('products'));
delete from public.members where id=auth.uid();
insert into capture_steps(entity,action,snapshot) values('members','DELETE',pg_temp.sample_rows('members'));

select jsonb_build_object(
  'engine',concat('PostgreSQL ',current_setting('server_version')),
  'source','Actual local SQL execution; anonymous sample data',
  'steps',(select jsonb_agg(jsonb_build_object('entity',entity,'action',action,'rows',snapshot) order by seq) from capture_steps),
  'constraints',(select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,
    'name',c.conname,'kind',c.contype,'definition',pg_get_constraintdef(c.oid)) order by c.conrelid::regclass::text,c.conname)
    from pg_constraint c where c.conrelid in ('public.members'::regclass,'public.products'::regclass,'public.orders'::regclass)),
  'cleanup_complete',not exists(select 1 from public.members) and not exists(select 1 from public.products)
    and not exists(select 1 from public.orders)
);
