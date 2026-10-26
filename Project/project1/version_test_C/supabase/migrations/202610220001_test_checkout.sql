-- Existing orders / payments schema, Toss TEST payments only.
-- This flow records a virtual purchase; it does not reserve/decrement stock.
begin;

create or replace function public.test_checkout_snapshot(p_user_id uuid, p_toss_order_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
    select jsonb_build_object(
        'orderId', p.toss_order_id, 'orderNumber', o.order_number,
        'amount', p.total_amount, 'status', p.status,
        'paymentKey', p.payment_key, 'confirmIdempotencyKey', p.confirm_idempotency_key,
        'createdAt', p.created_at, 'method', p.method, 'approvedAt', p.approved_at,
        'customerName', o.recipient_name,
        'orderName', left((select oi.product_name from public.order_items oi
            where oi.order_id=o.id order by oi.id limit 1)
            || case when (select count(*) from public.order_items oi where oi.order_id=o.id)>1
                then ' 외 ' || ((select count(*) from public.order_items oi where oi.order_id=o.id)-1)::text || '건'
                else '' end, 100),
        'items', (select jsonb_agg(jsonb_build_object(
            'productVariantId', oi.product_variant_id,
            'quantity', oi.quantity, 'name', oi.product_name,
            'option', oi.option_text, 'unitPrice', oi.unit_price) order by oi.id)
            from public.order_items oi where oi.order_id=o.id))
    into v_result from public.payments p join public.orders o on o.id=p.order_id
    where p.toss_order_id=p_toss_order_id and o.user_id=p_user_id
        and p.provider='toss' and p.environment='test';
    if v_result is null then
        raise exception 'ORDER_NOT_FOUND' using errcode='P0001';
    end if;
    return v_result;
end; $$;

create or replace function public.prepare_test_checkout(
    p_user_id uuid, p_idempotency_key uuid, p_items jsonb,
    p_shipping jsonb, p_expected_amount bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
    v_order_id uuid; v_toss_order_id text; v_total bigint; v_item record;
    v_count integer; v_user uuid;
begin
    -- Serialize retries for one member, without trusting a browser user_id.
    select id into v_user from public.profiles where id=p_user_id for update;
    if v_user is null then raise exception 'LOGIN_REQUIRED'; end if;
    if p_idempotency_key is null or jsonb_typeof(p_items)<>'array'
        or jsonb_array_length(p_items) not between 1 and 30
        or p_expected_amount is null or p_expected_amount<=0 then
        raise exception 'INVALID_CART';
    end if;
    if jsonb_typeof(p_shipping)<>'object'
        or nullif(btrim(p_shipping->>'recipientName'),'') is null
        or nullif(btrim(p_shipping->>'recipientPhone'),'') is null
        or nullif(btrim(p_shipping->>'postalCode'),'') is null
        or nullif(btrim(p_shipping->>'addressLine1'),'') is null then
        raise exception 'INVALID_SHIPPING';
    end if;
    for v_item in select * from jsonb_to_recordset(p_items)
        as x("productVariantId" integer, quantity integer) loop
        if v_item."productVariantId" is null or v_item.quantity is null
            or v_item.quantity not between 1 and 99 then raise exception 'INVALID_CART'; end if;
    end loop;
    if (select count(distinct x->>'productVariantId') from jsonb_array_elements(p_items) x)
        <>jsonb_array_length(p_items) then raise exception 'INVALID_CART'; end if;

    select id into v_order_id from public.orders
        where user_id=p_user_id and idempotency_key=p_idempotency_key;
    if found then
        if not exists (select 1 from public.orders o where o.id=v_order_id
            and o.total_amount=p_expected_amount and o.status='submitted'
            and o.recipient_name=p_shipping->>'recipientName'
            and o.recipient_phone=p_shipping->>'recipientPhone'
            and o.postal_code=p_shipping->>'postalCode'
            and o.address_line1=p_shipping->>'addressLine1'
            and coalesce(o.address_line2,'')=coalesce(p_shipping->>'addressLine2','')
            and coalesce(o.shipping_message,'')=coalesce(p_shipping->>'shippingMessage',''))
            or exists (
                (select oi.product_variant_id,oi.quantity from public.order_items oi where oi.order_id=v_order_id
                 except select x."productVariantId",x.quantity from jsonb_to_recordset(p_items) as x("productVariantId" integer,quantity integer))
                union all
                (select x."productVariantId",x.quantity from jsonb_to_recordset(p_items) as x("productVariantId" integer,quantity integer)
                 except select oi.product_variant_id,oi.quantity from public.order_items oi where oi.order_id=v_order_id)
            ) then raise exception 'CHECKOUT_CHANGED'; end if;
        select toss_order_id into strict v_toss_order_id from public.payments where order_id=v_order_id;
        return public.test_checkout_snapshot(p_user_id,v_toss_order_id);
    end if;

    -- Prices, names and options are read from the database, never from the browser.
    perform v.id from public.product_variants v join jsonb_to_recordset(p_items)
        as x("productVariantId" integer,quantity integer) on x."productVariantId"=v.id
        order by v.id for share of v;
    perform p.id from public.products p join public.product_variants v on v.product_id=p.id
        join jsonb_to_recordset(p_items) as x("productVariantId" integer,quantity integer)
        on x."productVariantId"=v.id order by p.id for share of p;
    select count(*),sum(p.sale_price::bigint*x.quantity) into v_count,v_total
        from jsonb_to_recordset(p_items) as x("productVariantId" integer,quantity integer)
        join public.product_variants v on v.id=x."productVariantId"
        join public.products p on p.id=v.product_id
        where v.is_active and p.status='active' and private.category_is_visible(p.category_id);
    if v_count<>jsonb_array_length(p_items) then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    if v_total<>p_expected_amount then raise exception 'AMOUNT_CHANGED'; end if;
    v_order_id:=gen_random_uuid();
    v_toss_order_id:='test_'||gen_random_uuid()::text;
    insert into public.orders(id,user_id,order_number,idempotency_key,
        subtotal_amount,shipping_fee,total_amount,recipient_name,recipient_phone,
        postal_code,address_line1,address_line2,shipping_message)
    values(v_order_id,p_user_id,
        to_char(clock_timestamp() at time zone 'Asia/Seoul','YYYYMMDD')||'-'||replace(v_order_id::text,'-',''),
        p_idempotency_key,v_total,0,v_total,p_shipping->>'recipientName',p_shipping->>'recipientPhone',
        p_shipping->>'postalCode',p_shipping->>'addressLine1',p_shipping->>'addressLine2',p_shipping->>'shippingMessage');
    insert into public.order_items(order_id,product_variant_id,product_name,option_text,sku,image_storage_path,unit_price,quantity)
        select v_order_id,v.id,p.name,v.size_label,v.sku,
            (select i.storage_path from public.product_images i where i.product_id=p.id and i.role='main' limit 1),
            p.sale_price,x.quantity
        from jsonb_to_recordset(p_items) as x("productVariantId" integer,quantity integer)
        join public.product_variants v on v.id=x."productVariantId" join public.products p on p.id=v.product_id;
    insert into public.payments(order_id,toss_order_id,total_amount)
        values(v_order_id,v_toss_order_id,v_total);
    return public.test_checkout_snapshot(p_user_id,v_toss_order_id);
end; $$;

create or replace function public.bind_test_payment(
    p_user_id uuid,p_toss_order_id text,p_payment_key text,p_amount bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payment public.payments; v_order public.orders;
begin
    select o.* into v_order from public.orders o join public.payments p on p.order_id=o.id
        where p.toss_order_id=p_toss_order_id and o.user_id=p_user_id for update of o;
    if not found then raise exception 'ORDER_NOT_FOUND'; end if;
    select * into strict v_payment from public.payments where toss_order_id=p_toss_order_id for update;
    if v_order.status<>'submitted' or v_payment.environment<>'test' then raise exception 'PAYMENT_STATE_INVALID'; end if;
    if p_amount<>v_payment.total_amount then raise exception 'AMOUNT_MISMATCH'; end if;
    if p_payment_key is null or p_payment_key!~'^[A-Za-z0-9_-]{1,200}$' then raise exception 'INVALID_PAYMENT'; end if;
    if v_payment.payment_key is not null and v_payment.payment_key<>p_payment_key then raise exception 'PAYMENT_KEY_MISMATCH'; end if;
    if v_payment.status not in ('READY','IN_PROGRESS','DONE') then raise exception 'PAYMENT_STATE_INVALID'; end if;
    -- A bound key remains recoverable after 30 minutes if Toss already approved it.
    if v_payment.payment_key is null and v_payment.created_at<now()-interval '30 minutes' then raise exception 'ORDER_EXPIRED'; end if;
    if v_payment.status<>'DONE' then
        update public.payments set payment_key=p_payment_key,status='IN_PROGRESS' where id=v_payment.id;
    end if;
    return public.test_checkout_snapshot(p_user_id,p_toss_order_id);
end; $$;

create or replace function public.complete_test_payment(
    p_user_id uuid,p_toss_order_id text,p_payment_key text,p_amount bigint,p_approval jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_payment public.payments; v_order public.orders;
begin
    select o.* into v_order from public.orders o join public.payments p on p.order_id=o.id
        where p.toss_order_id=p_toss_order_id and o.user_id=p_user_id for update of o;
    if not found then raise exception 'ORDER_NOT_FOUND'; end if;
    select * into strict v_payment from public.payments where toss_order_id=p_toss_order_id for update;
    if v_order.status<>'submitted' or v_payment.environment<>'test'
        or v_payment.status not in ('IN_PROGRESS','DONE') then raise exception 'PAYMENT_STATE_INVALID'; end if;
    if v_payment.payment_key is distinct from p_payment_key or v_payment.total_amount<>p_amount then
        raise exception 'AMOUNT_MISMATCH'; end if;
    if v_payment.status='DONE' then return public.test_checkout_snapshot(p_user_id,p_toss_order_id); end if;
    if nullif(p_approval->>'transactionKey','') is null or nullif(p_approval->>'method','') is null
        or nullif(p_approval->>'approvedAt','') is null or nullif(p_approval->>'requestedAt','') is null
        or (p_approval->>'balanceAmount')::bigint is distinct from p_amount then raise exception 'INVALID_PAYMENT'; end if;
    update public.payments set status='DONE',balance_amount=(p_approval->>'balanceAmount')::bigint,
        method=p_approval->>'method',requested_at=(p_approval->>'requestedAt')::timestamptz,
        approved_at=(p_approval->>'approvedAt')::timestamptz,last_transaction_key=p_approval->>'transactionKey',
        receipt_url=p_approval->>'receiptUrl',failure_code=null,failure_message=null where id=v_payment.id;
    insert into public.payment_transactions(payment_id,transaction_key,transaction_type,status,amount,
        balance_amount,occurred_at,approval_number,idempotency_key)
        values(v_payment.id,p_approval->>'transactionKey','APPROVAL','DONE',p_amount,
            (p_approval->>'balanceAmount')::bigint,(p_approval->>'approvedAt')::timestamptz,
            p_approval->>'approvalNumber',v_payment.confirm_idempotency_key);
    -- Payment update and its approval ledger commit in the SAME transaction.
    return public.test_checkout_snapshot(p_user_id,p_toss_order_id);
end; $$;

-- Only the backend may create/approve payments. Keep existing owner SELECT RLS.
revoke all on function public.test_checkout_snapshot(uuid,text) from public,anon,authenticated;
revoke all on function public.prepare_test_checkout(uuid,uuid,jsonb,jsonb,bigint) from public,anon,authenticated;
revoke all on function public.bind_test_payment(uuid,text,text,bigint) from public,anon,authenticated;
revoke all on function public.complete_test_payment(uuid,text,text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.test_checkout_snapshot(uuid,text) to service_role;
grant execute on function public.prepare_test_checkout(uuid,uuid,jsonb,jsonb,bigint) to service_role;
grant execute on function public.bind_test_payment(uuid,text,text,bigint) to service_role;
grant execute on function public.complete_test_payment(uuid,text,text,bigint,jsonb) to service_role;
commit;
