"""Two-account RLS verification with bounded cleanup and anonymous output."""
import os
from getpass import getpass
from dotenv import load_dotenv
from supabase import create_client
from postgrest.exceptions import APIError
from demo_support import DemoRunError, cleanup_created, new_marker, record, require


def login(label):
    client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_PUBLISHABLE_KEY'])
    result = client.auth.sign_in_with_password({
        'email': getpass(f'{label} 전용 이메일 (숨김 입력): '),
        'password': getpass(f'{label} 비밀번호: '),
    })
    return client, result.user.id


def denied(operation):
    """Only an actual permission error or zero affected rows is a denial."""
    try:
        result = operation()
    except APIError as error:
        if error.code == '42501':
            return True
        raise
    return not result.data


def run_rls(a, a_id, b, b_id, emit=print):
    require(a_id != b_id, 'distinct_accounts_required')
    if a.table('members').select('id').eq('id', a_id).execute().data:
        raise DemoRunError('requires_new_member_profile', True)
    marker = new_marker('RLS')
    events = []
    stage = 'create_rls_rows'
    failure = None
    try:
        a.table('members').insert({'id': a_id, 'display_name': marker['member_names'][0]}).execute()
        product = a.table('products').insert({
            'owner_id': a_id, 'title': marker['product_title'], 'price': 1000, 'stock': 3,
        }).execute().data[0]
        product_id = product['id']
        order = a.rpc('place_order', {'p_product_id': product_id, 'p_quantity': 1}).execute().data
        order_id = (order[0] if isinstance(order, list) else order)['id']
        record(events, emit, stage, {'created': True}, a_id)
        checks = [
            ('other_member_read_empty', lambda: not b.table('members').select('id').eq('id', a_id).execute().data),
            ('other_order_read_empty', lambda: not b.table('orders').select('id').eq('id', order_id).execute().data),
            ('product_read_allowed', lambda: bool(b.table('products').select('id').eq('id', product_id).execute().data)),
            ('other_member_update_denied', lambda: denied(lambda: b.table('members').update(
                {'display_name': 'blocked'}).eq('id', a_id).execute())),
            ('other_member_delete_denied', lambda: denied(lambda: b.table('members').delete().eq('id', a_id).execute())),
            ('other_order_delete_denied', lambda: denied(lambda: b.table('orders').delete().eq('id', order_id).execute())),
            ('other_product_update_denied', lambda: denied(lambda: b.table('products').update(
                {'stock': 999}).eq('id', product_id).execute())),
            ('other_product_delete_denied', lambda: denied(lambda: b.table('products').delete().eq('id', product_id).execute())),
            ('forged_order_denied', lambda: denied(lambda: b.table('orders').insert({
                'member_id': a_id, 'product_id': product_id, 'quantity': 1, 'unit_price': 1000,
            }).execute())),
        ]
        for label, operation in checks:
            stage = label
            require(operation(), stage)
            record(events, emit, stage, {'passed': True}, a_id)
        stage = 'other_product_rpc_denied'
        try:
            b.rpc('place_order', {'p_product_id': product_id, 'p_quantity': 1}).execute()
        except APIError as error:
            require(error.code == 'P0001' and error.message in (
                'product not found', 'only own demonstration product allowed'), stage)
        else:
            raise RuntimeError(stage)
        record(events, emit, stage, {'passed': True}, a_id)
        stage = 'owner_requery_unchanged'
        require(a.table('products').select('stock').eq('id', product_id).single().execute().data['stock'] == 2, stage)
        require(a.table('members').select('display_name').eq('id', a_id).single().execute().data[
            'display_name'] == marker['member_names'][0], stage)
        require(len(a.table('orders').select('id').eq('id', order_id).execute().data) == 1, stage)
        record(events, emit, stage, {'passed': True}, a_id)
    except Exception:
        failure = stage
    finally:
        cleanup_complete = cleanup_created(a, a_id, marker)
        record(events, emit, 'cleanup', {'complete': cleanup_complete}, a_id)
    if failure or not cleanup_complete:
        raise DemoRunError(failure or 'cleanup_failed', cleanup_complete)
    return {'status': 'passed', 'cleanup_complete': True, 'events': events}


def main():
    load_dotenv()
    clients = []
    try:
        a, a_id = login('A')
        clients.append(a)
        b, b_id = login('B')
        clients.append(b)
        run_rls(a, a_id, b, b_id)
    except DemoRunError as error:
        print(f'FAIL: {error.stage}; cleanup_complete={error.cleanup_complete}')
        raise SystemExit(1) from None
    except Exception:
        print('FAIL: configuration_or_login')
        raise SystemExit(1) from None
    finally:
        for client in clients:
            try:
                client.auth.sign_out()
            except Exception:
                print('로그아웃 상태를 확인하지 못했습니다.')


if __name__ == '__main__':
    main()
