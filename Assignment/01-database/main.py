"""Supabase CRUD demonstration with anonymous output and run-scoped cleanup."""
import os
from getpass import getpass
from dotenv import load_dotenv
from supabase import create_client
from postgrest.exceptions import APIError
from demo_support import DemoRunError, cleanup_created, new_marker, record, require


def run_demo(client, user_id, emit=print):
    """Run on a dedicated authenticated account; leave its Auth user unchanged."""
    if client.table('members').select('id').eq('id', user_id).execute().data:
        raise DemoRunError('requires_new_member_profile', True)
    marker = new_marker('Demo')
    events = []
    stage = 'member_create'
    failure = None
    try:
        member = client.table('members').insert({
            'id': user_id, 'display_name': marker['member_names'][0]}).execute().data
        record(events, emit, stage, member, user_id)
        stage = 'member_read'
        record(events, emit, stage, client.table('members').select('*').eq('id', user_id).execute().data, user_id)
        stage = 'member_update'
        member = client.table('members').update({'display_name': marker['member_names'][1]}).eq(
            'id', user_id).select('*').single().execute().data
        require(member['display_name'] == marker['member_names'][1], stage)
        record(events, emit, stage, member, user_id)
        stage = 'product_create'
        product = client.table('products').insert({
            'owner_id': user_id, 'title': marker['product_title'], 'price': 39000, 'stock': 10,
        }).execute().data[0]
        product_id = product['id']
        record(events, emit, stage, product, user_id)
        stage = 'product_read'
        record(events, emit, stage, client.table('products').select('*').eq('id', product_id).execute().data, user_id)
        stage = 'product_update'
        product = client.table('products').update({'price': 35000}).eq('id', product_id).select('*').single().execute().data
        require(product['price'] == 35000, stage)
        record(events, emit, stage, product, user_id)
        stage = 'order_create'
        order = client.rpc('place_order', {'p_product_id': product_id, 'p_quantity': 2}).execute().data
        if isinstance(order, list):
            order = order[0]
        order_id = order['id']
        require(order['quantity'] == 2 and order['unit_price'] == 35000, stage)
        record(events, emit, stage, order, user_id)
        stage = 'order_read'
        record(events, emit, stage, client.table('orders').select('*').eq('id', order_id).execute().data, user_id)
        stage = 'order_update'
        # A CRUD example, not a production order-price editing policy.
        order = client.table('orders').update({'unit_price': 34000}).eq('id', order_id).select('*').single().execute().data
        require(order['unit_price'] == 34000, stage)
        record(events, emit, stage, order, user_id)
        stage = 'insufficient_stock_rollback'
        before = client.table('products').select('stock').eq('id', product_id).single().execute().data
        before_orders = client.table('orders').select('id').eq('product_id', product_id).execute().data
        try:
            client.rpc('place_order', {'p_product_id': product_id, 'p_quantity': 999}).execute()
        except APIError as error:
            if error.code != 'P0001' or 'insufficient stock' not in error.message:
                raise
        else:
            raise RuntimeError(stage)
        after = client.table('products').select('stock').eq('id', product_id).single().execute().data
        after_orders = client.table('orders').select('id').eq('product_id', product_id).execute().data
        require(before == after and before_orders == after_orders, stage)
        record(events, emit, stage, {'before': before, 'after': after, 'orders_unchanged': True}, user_id)
        for table, identifier in [('orders', order_id), ('products', product_id), ('members', user_id)]:
            stage = f'{table}_delete'
            deleted = client.table(table).delete().eq('id', identifier).execute().data
            require(bool(deleted), stage)
            require(not client.table(table).select('id').eq('id', identifier).execute().data, stage)
            record(events, emit, stage, deleted, user_id)
    except Exception:
        failure = stage
    finally:
        cleanup_complete = cleanup_created(client, user_id, marker)
        record(events, emit, 'cleanup', {'complete': cleanup_complete}, user_id)
    if failure or not cleanup_complete:
        raise DemoRunError(failure or 'cleanup_failed', cleanup_complete)
    return {'status': 'passed', 'cleanup_complete': True, 'events': events}


def main():
    load_dotenv()
    client = None
    try:
        client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_PUBLISHABLE_KEY'])
        session = client.auth.sign_in_with_password({
            'email': getpass('전용 계정 이메일 (숨김 입력): '), 'password': getpass('비밀번호: '),
        })
        run_demo(client, session.user.id)
    except DemoRunError as error:
        print(f'FAIL: {error.stage}; cleanup_complete={error.cleanup_complete}')
        raise SystemExit(1) from None
    except Exception:
        print('FAIL: configuration_or_login')
        raise SystemExit(1) from None
    finally:
        if client is not None:
            try:
                client.auth.sign_out()
            except Exception:
                print('로그아웃 상태를 확인하지 못했습니다.')


if __name__ == '__main__':
    main()
