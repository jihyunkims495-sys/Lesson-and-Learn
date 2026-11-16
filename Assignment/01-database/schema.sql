-- 신규 실습 전용 Supabase 프로젝트에서 실행. auth.users는 Supabase Auth가 관리한다.
begin;
create table public.members (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 1 and 80)
);
create table public.products (
 id bigint generated always as identity primary key,
 owner_id uuid not null references public.members(id),
 title text not null check (length(trim(title)) between 1 and 120),
 price numeric(12,2) not null check (price >= 0),
 stock integer not null default 0 check (stock >= 0)
);
-- 한 주문에 한 상품인 실습 범위. 다품목 주문으로 확장할 때 order_items 분리.
create table public.orders (
 id bigint generated always as identity primary key,
 member_id uuid not null references public.members(id),
 product_id bigint not null references public.products(id),
 quantity integer not null check (quantity > 0),
 unit_price numeric(12,2) not null check (unit_price >= 0),
 created_at timestamptz not null default now()
);
create index orders_member_idx on public.orders(member_id);
create index orders_product_idx on public.orders(product_id);
create index products_owner_idx on public.products(owner_id);
alter table public.products add column description text not null default '';
-- CREATE/ALTER/DROP 데모는 업무 테이블을 삭제하지 않는 임시 객체로 수행.
create temporary table ddl_demo(id integer primary key);
alter table ddl_demo add column note text;
drop table ddl_demo;
alter table public.members enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
create policy members_own on public.members for all to authenticated using (id=auth.uid()) with check(id=auth.uid());
create policy products_read on public.products for select to authenticated using(true);
create policy products_insert on public.products for insert to authenticated with check(owner_id=auth.uid());
create policy products_update on public.products for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy products_delete on public.products for delete to authenticated using(owner_id=auth.uid());
create policy orders_own on public.orders for all to authenticated using(member_id=auth.uid()) with check(member_id=auth.uid());
revoke all on public.members,public.products,public.orders from public,anon;
grant select,insert,update,delete on public.members,public.products,public.orders to authenticated;
grant usage,select on sequence public.products_id_seq,public.orders_id_seq to authenticated;
-- invoker 권한으로 실행되므로 RLS 유지. 예외 발생 시 함수 전체가 원자적으로 롤백된다.
create function public.place_order(p_product_id bigint,p_quantity integer) returns public.orders
language plpgsql security invoker set search_path=public as $$
declare chosen public.products; result public.orders;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'quantity must be positive'; end if;
 select * into chosen from public.products where id=p_product_id for update;
 if not found then raise exception 'product not found'; end if;
 -- 실습자는 자기 상품에 대해서만 재고를 변경할 수 있다.
 if chosen.owner_id<>auth.uid() then raise exception 'only own demonstration product allowed'; end if;
 if chosen.stock<p_quantity then raise exception 'insufficient stock'; end if;
 update public.products set stock=stock-p_quantity where id=p_product_id;
 insert into public.orders(member_id,product_id,quantity,unit_price)
 values(auth.uid(),p_product_id,p_quantity,chosen.price) returning * into result;
 return result;
end $$;
revoke all on function public.place_order(bigint,integer) from public;
grant execute on function public.place_order(bigint,integer) to authenticated;
commit;
