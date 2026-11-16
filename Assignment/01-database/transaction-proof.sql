-- schema.sql 실행 후 main.py와 별도로 실행한다.
-- 실습 계정으로 members에 프로필을 만든 상태에서 SQL Editor로 실행한다.
-- SQL Editor는 관리자이므로 여기서의 성공은 RLS 검증을 의미하지 않는다.
-- 모든 업무 테이블 변경은 마지막 ROLLBACK으로 복원된다.
begin;
create temporary table proof_results(test text, passed boolean, detail text) on commit drop;

do $$
declare
  uid uuid;
  pid bigint;
  before_stock integer;
  after_stock integer;
  before_orders bigint;
  after_orders bigint;
begin
  select id into uid from public.members order by id limit 1;
  if uid is null then
    raise exception '실습 members 프로필 1개가 필요합니다. README의 사전 준비를 수행하세요.';
  end if;
  insert into public.products(owner_id,title,price,stock)
    values(uid,'Transaction proof',10000,10) returning id into pid;
  select stock into before_stock from public.products where id=pid;
  select count(*) into before_orders from public.orders where product_id=pid;

  -- 내부 BEGIN/EXCEPTION은 PostgreSQL의 서브트랜잭션이다.
  -- 재고가 먼저 변경된 뒤 INSERT의 CHECK 실패를 발생시킨다.
  begin
    update public.products set stock=stock-2 where id=pid;
    insert into public.orders(member_id,product_id,quantity,unit_price)
      values(uid,pid,0,10000); -- quantity > 0 위반
    raise exception 'CHECK 위반이 발생하지 않았습니다';
  exception when check_violation then
    insert into proof_results values('failure after first write',true,'quantity CHECK violation caught');
  end;

  select stock into after_stock from public.products where id=pid;
  select count(*) into after_orders from public.orders where product_id=pid;
  if before_stock<>after_stock or before_orders<>after_orders then
    raise exception '원자성 실패: stock %, %, orders %, %',before_stock,after_stock,before_orders,after_orders;
  end if;
  insert into proof_results values('rollback atomicity',true,
    format('stock %s → %s; orders %s → %s',before_stock,after_stock,before_orders,after_orders));

  -- 성공 경로는 동일한 외부 트랜잭션 안에서 두 변경을 함께 반영한다.
  update public.products set stock=stock-2 where id=pid;
  insert into public.orders(member_id,product_id,quantity,unit_price) values(uid,pid,2,10000);
  select stock into after_stock from public.products where id=pid;
  if after_stock<>8 then raise exception '성공 경로 재고 검증 실패'; end if;
  insert into proof_results values('successful transaction state',true,'stock 8 and order quantity 2');
end $$;

select * from proof_results;
-- 이 SELECT 결과를 캡처한다. 검증용 변경을 영구 저장하지 않는다.
rollback;

-- 명시적 COMMIT 동작: 업무 데이터 대신 실습용 세션 임시 테이블로 검증.
begin;
create temporary table commit_proof(value integer) on commit preserve rows;
insert into commit_proof values(1);
commit;
select 'committed value exists' as test, count(*)=1 as passed from commit_proof;
drop table commit_proof;
