"""No-network checks for anonymous output, denial classification and cleanup scope."""
import unittest
from types import SimpleNamespace
import httpx
from supabase import ClientOptions, create_client
from postgrest.exceptions import APIError
from demo_support import anonymous, cleanup_created
from verify_rls import denied


class DemoSupportTests(unittest.TestCase):
    def test_anonymous_output_replaces_nested_user_identifiers(self):
        user = 'synthetic-user'
        result = anonymous({'id': user, 'nested': [{'owner_id': user, 'price': 100}]}, user)
        self.assertNotIn(user, repr(result))
        self.assertEqual(result['nested'][0]['price'], 100)

    def test_only_permission_errors_are_denials(self):
        def error(code):
            raise APIError({'code': code, 'message': 'synthetic', 'details': None, 'hint': None})
        self.assertTrue(denied(lambda: error('42501')))
        self.assertTrue(denied(lambda: SimpleNamespace(data=[])))
        self.assertFalse(denied(lambda: SimpleNamespace(data=[{'id': 'synthetic'}])))
        with self.assertRaises(APIError):
            denied(lambda: error('PGRST301'))
        def offline():
            raise ConnectionError('synthetic')
        with self.assertRaises(ConnectionError):
            denied(offline)

    def test_cleanup_recovers_product_after_lost_insert_response(self):
        marker = {'product_title': 'Synthetic product marker', 'member_names': ['Synthetic A', 'Synthetic B']}
        state = {'product': True, 'order': True, 'member': True}
        observed = []
        def handler(request):
            table = request.url.path.rsplit('/', 1)[-1]
            params = dict(request.url.params)
            observed.append((request.method, table, params))
            if table == 'products':
                self.assertEqual(params.get('owner_id'), 'eq.synthetic-user')
                self.assertEqual(params.get('title'), 'eq.' + marker['product_title'])
                if request.method == 'DELETE':
                    self.assertEqual(params.get('id'), 'eq.7')
                    self.assertFalse(state['order'])
                    state['product'] = False
                data = [{'id': 7}] if state['product'] else []
            elif table == 'orders':
                self.assertEqual(params.get('member_id'), 'eq.synthetic-user')
                self.assertEqual(params.get('product_id'), 'eq.7')
                if request.method == 'DELETE':
                    state['order'] = False
                data = [{'id': 9}] if state['order'] else []
            elif table == 'members':
                self.assertEqual(params.get('id'), 'eq.synthetic-user')
                self.assertTrue(params.get('display_name', '').startswith('in.('))
                self.assertIn('Synthetic A', params['display_name'])
                self.assertIn('Synthetic B', params['display_name'])
                if request.method == 'DELETE':
                    self.assertFalse(state['product'])
                    state['member'] = False
                data = [{'id': 'synthetic-user'}] if state['member'] else []
            else:
                self.fail('cleanup accessed an unrelated table')
            return httpx.Response(200, json=data)
        transport = httpx.Client(transport=httpx.MockTransport(handler))
        client = create_client('https://example.supabase.co', 'public-test-key', options=ClientOptions(
            httpx_client=transport, persist_session=False, auto_refresh_token=False))
        self.assertTrue(cleanup_created(client, 'synthetic-user', marker))
        self.assertEqual(state, {'product': False, 'order': False, 'member': False})
        self.assertEqual([table for method, table, _ in observed if method == 'DELETE'], ['orders', 'products', 'members'])
        transport.close()

    def test_cleanup_does_not_claim_success_when_transport_fails(self):
        def handler(request):
            raise RuntimeError('synthetic transport failure')
        transport = httpx.Client(transport=httpx.MockTransport(handler))
        client = create_client('https://example.supabase.co', 'public-test-key', options=ClientOptions(
            httpx_client=transport, persist_session=False, auto_refresh_token=False))
        marker = {'product_title': 'Synthetic', 'member_names': ['Synthetic A', 'Synthetic B']}
        self.assertFalse(cleanup_created(client, 'synthetic-user', marker))
        transport.close()


if __name__ == '__main__':
    unittest.main()
