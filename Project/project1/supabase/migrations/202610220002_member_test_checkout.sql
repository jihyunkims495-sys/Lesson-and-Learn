-- 서버 전용 키 없이 로그인 회원 권한으로 테스트 결제를 저장합니다.
-- 회원 ID는 브라우저 값이 아니라 auth.uid()로만 정하며, 기존 함수의 검증을 그대로 사용합니다.
-- 테스트 전용: 로그인 회원은 자기 주문에 한해 승인 저장 함수를 직접 호출할 수 있습니다.
begin;

create or replace function public.prepare_my_test_checkout(
    p_idempotency_key uuid, p_items jsonb, p_shipping jsonb, p_expected_amount bigint)
returns jsonb language sql security definer set search_path = '' as $$
    select public.prepare_test_checkout((select auth.uid()), p_idempotency_key,
        p_items, p_shipping, p_expected_amount);
$$;

create or replace function public.bind_my_test_payment(
    p_toss_order_id text, p_payment_key text, p_amount bigint)
returns jsonb language sql security definer set search_path = '' as $$
    select public.bind_test_payment((select auth.uid()), p_toss_order_id,
        p_payment_key, p_amount);
$$;

create or replace function public.complete_my_test_payment(
    p_toss_order_id text, p_payment_key text, p_amount bigint, p_approval jsonb)
returns jsonb language sql security definer set search_path = '' as $$
    select public.complete_test_payment((select auth.uid()), p_toss_order_id,
        p_payment_key, p_amount, p_approval);
$$;

-- 비회원은 호출할 수 없습니다. 기존 p_user_id 함수는 계속 서버 전용입니다.
revoke all on function public.prepare_my_test_checkout(uuid,jsonb,jsonb,bigint) from public,anon;
revoke all on function public.bind_my_test_payment(text,text,bigint) from public,anon;
revoke all on function public.complete_my_test_payment(text,text,bigint,jsonb) from public,anon;
grant execute on function public.prepare_my_test_checkout(uuid,jsonb,jsonb,bigint) to authenticated;
grant execute on function public.bind_my_test_payment(text,text,bigint) to authenticated;
grant execute on function public.complete_my_test_payment(text,text,bigint,jsonb) to authenticated;
commit;

-- 새 함수를 API에서 바로 찾을 수 있게 스키마 캐시를 갱신합니다.
notify pgrst, 'reload schema';
