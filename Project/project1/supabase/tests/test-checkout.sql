-- Run in Supabase SQL Editor AFTER the migration and demo seed.
-- All test orders, payments and ledger entries are rolled back.
begin;
do $$
declare
    v_uid uuid; v_key uuid:=gen_random_uuid(); v_snapshot jsonb; v_repeat jsonb;
    v_shipping jsonb:='{"recipientName":"결제 검증","recipientPhone":"010-0000-0000","postalCode":"04524","addressLine1":"테스트 주소","addressLine2":"","shippingMessage":""}';
    v_items jsonb:='[{"productVariantId":1,"quantity":2},{"productVariantId":2,"quantity":1}]';
    v_total bigint; v_stock integer; v_order uuid; v_approval jsonb;
begin
    select id into v_uid from public.profiles order by id limit 1;
    if v_uid is null then raise exception 'Create a test member first.'; end if;
    select sum(p.sale_price::bigint*x.quantity) into v_total
        from jsonb_to_recordset(v_items) as x("productVariantId" integer,quantity integer)
        join public.product_variants v on v.id=x."productVariantId" join public.products p on p.id=v.product_id;
    select stock_quantity into v_stock from public.product_variants where id=1;
    v_snapshot:=public.prepare_test_checkout(v_uid,v_key,v_items,v_shipping,v_total);
    v_repeat:=public.prepare_test_checkout(v_uid,v_key,v_items,v_shipping,v_total);
    if v_snapshot->>'orderId'<>v_repeat->>'orderId' then raise exception 'Prepare idempotency failed'; end if;
    if (v_snapshot->>'amount')::bigint<>v_total then raise exception 'DB price quote failed'; end if;
    begin
        perform public.prepare_test_checkout(v_uid,gen_random_uuid(),v_items,v_shipping,1);
        raise exception 'TEST_EXPECTED_REJECTION';
    exception when raise_exception then
        if sqlerrm<>'AMOUNT_CHANGED' then raise; end if;
    end;
    begin
        perform public.prepare_test_checkout(v_uid,v_key,v_items,v_shipping||'{"recipientName":"다른 배송지"}'::jsonb,v_total);
        raise exception 'TEST_EXPECTED_REJECTION';
    exception when raise_exception then
        if sqlerrm<>'CHECKOUT_CHANGED' then raise; end if;
    end;
    begin
        perform public.bind_test_payment(gen_random_uuid(),v_snapshot->>'orderId','sql_test_key',v_total);
        raise exception 'TEST_EXPECTED_REJECTION';
    exception when raise_exception then
        if sqlerrm<>'ORDER_NOT_FOUND' then raise; end if;
    end;
    begin
        perform public.bind_test_payment(v_uid,v_snapshot->>'orderId','sql_test_key',1);
        raise exception 'TEST_EXPECTED_REJECTION';
    exception when raise_exception then
        if sqlerrm<>'AMOUNT_MISMATCH' then raise; end if;
    end;
    perform public.bind_test_payment(v_uid,v_snapshot->>'orderId','sql_test_key',v_total);
    begin
        perform public.bind_test_payment(v_uid,v_snapshot->>'orderId','different_key',v_total);
        raise exception 'TEST_EXPECTED_REJECTION';
    exception when raise_exception then
        if sqlerrm<>'PAYMENT_KEY_MISMATCH' then raise; end if;
    end;
    v_approval:=jsonb_build_object('method','카드','balanceAmount',v_total,
        'requestedAt',now(),'approvedAt',now(),'transactionKey','sql_test_transaction_'||v_key::text);
    -- Force a ledger constraint failure and verify payment update is rolled back too.
    begin
        perform public.complete_test_payment(v_uid,v_snapshot->>'orderId','sql_test_key',v_total,
            v_approval||jsonb_build_object('approvalNumber','too-long-approval-number'));
        raise exception 'TEST_EXPECTED_REJECTION';
    exception when string_data_right_truncation then null;
    end;
    if (public.test_checkout_snapshot(v_uid,v_snapshot->>'orderId')->>'status')<>'IN_PROGRESS' then
        raise exception 'Payment/ledger atomicity failed'; end if;
    v_repeat:=public.complete_test_payment(v_uid,v_snapshot->>'orderId','sql_test_key',v_total,v_approval);
    perform public.complete_test_payment(v_uid,v_snapshot->>'orderId','sql_test_key',v_total,v_approval);
    if v_repeat->>'status'<>'DONE' then raise exception 'Approval persistence failed'; end if;
    select order_id into v_order from public.payments where toss_order_id=v_snapshot->>'orderId';
    if (select count(*) from public.payment_transactions t join public.payments p on p.id=t.payment_id where p.order_id=v_order)<>1 then
        raise exception 'Duplicate approval ledger'; end if;
    if (select count(*) from public.order_items where order_id=v_order)<>2 then raise exception 'Order item snapshot failed'; end if;
    if (select stock_quantity from public.product_variants where id=1)<>v_stock then raise exception 'Test changed stock'; end if;
    if has_function_privilege('anon','public.complete_test_payment(uuid,text,text,bigint,jsonb)','EXECUTE')
        or has_function_privilege('authenticated','public.prepare_test_checkout(uuid,uuid,jsonb,jsonb,bigint)','EXECUTE') then
        raise exception 'Client can write authoritative payment state'; end if;
    perform set_config('test.checkout_owner',v_uid::text,true);
    perform set_config('test.checkout_order',v_order::text,true);
end; $$;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub',current_setting('test.checkout_owner'),true); end; $$;
do $$
begin
    if (select count(*) from public.orders where id=current_setting('test.checkout_order')::uuid)<>1
       or (select count(*) from public.order_items where order_id=current_setting('test.checkout_order')::uuid)<>2
       or (select count(*) from public.payments where order_id=current_setting('test.checkout_order')::uuid)<>1
       or (select count(*) from public.payment_transactions t join public.payments p on p.id=t.payment_id
            where p.order_id=current_setting('test.checkout_order')::uuid)<>1 then
        raise exception 'Owner history RLS failed'; end if;
end; $$;
do $$ begin perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true); end; $$;
do $$
begin
    if exists (select 1 from public.orders where id=current_setting('test.checkout_order')::uuid)
       or exists (select 1 from public.order_items where order_id=current_setting('test.checkout_order')::uuid)
       or exists (select 1 from public.payments where order_id=current_setting('test.checkout_order')::uuid)
       or exists (select 1 from public.payment_transactions t join public.payments p on p.id=t.payment_id
            where p.order_id=current_setting('test.checkout_order')::uuid) then
        raise exception 'Another member can read checkout history'; end if;
end; $$;
rollback;
select 'PASS: DB pricing, ownership, idempotency, immutable payment key, atomic ledger, test stock, backend-only RPC, owner history RLS; all test rows rolled back' as test_result;
