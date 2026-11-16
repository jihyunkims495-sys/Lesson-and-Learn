"""Shared, bounded cleanup and anonymous output for the CRUD demonstration."""
import json
from uuid import uuid4


class DemoRunError(RuntimeError):
    def __init__(self, stage, cleanup_complete):
        super().__init__(stage)
        self.stage = stage
        self.cleanup_complete = cleanup_complete


def require(condition, label):
    if not condition:
        raise RuntimeError(label)


def new_marker(prefix):
    suffix = uuid4().hex[:12]
    return {
        'member_names': [f'{prefix} {suffix}', f'{prefix} updated {suffix}'],
        'product_title': f'{prefix} product {suffix}',
    }


def anonymous(value, user_id):
    if isinstance(value, dict):
        return {key: anonymous(item, user_id) for key, item in value.items()}
    if isinstance(value, list):
        return [anonymous(item, user_id) for item in value]
    return 'sample-member' if value == user_id else value


def record(events, emit, stage, data, user_id):
    event = {'step': stage, 'result': anonymous(data, user_id)}
    events.append(event)
    if emit is not None:
        emit(json.dumps(event, ensure_ascii=False, default=str))


def cleanup_created(client, user_id, marker):
    """Only remove rows carrying this run's unique marker, including lost responses."""
    complete = True
    products = []
    try:
        products = client.table('products').select('id').eq('owner_id', user_id).eq(
            'title', marker['product_title']).execute().data
    except Exception:
        complete = False
    for product in products:
        product_id = product['id']
        try:
            client.table('orders').delete().eq('member_id', user_id).eq('product_id', product_id).execute()
            remaining = client.table('orders').select('id').eq('member_id', user_id).eq(
                'product_id', product_id).execute().data
            if remaining:
                complete = False
        except Exception:
            complete = False
        try:
            client.table('products').delete().eq('id', product_id).eq('owner_id', user_id).eq(
                'title', marker['product_title']).execute()
        except Exception:
            complete = False
    try:
        client.table('members').delete().eq('id', user_id).in_('display_name', marker['member_names']).execute()
    except Exception:
        complete = False
    try:
        remaining_products = client.table('products').select('id').eq('owner_id', user_id).eq(
            'title', marker['product_title']).execute().data
        remaining_members = client.table('members').select('id').eq('id', user_id).in_(
            'display_name', marker['member_names']).execute().data
        complete = complete and not remaining_products and not remaining_members
    except Exception:
        complete = False
    return bool(complete)
