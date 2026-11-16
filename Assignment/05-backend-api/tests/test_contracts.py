"""게시판 API의 데이터 계약, 권한 경계, 쿼리 효율 회귀검사."""
import asyncio
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys

import jwt
import pytest
from sqlalchemy import event, inspect
from sqlalchemy.exc import IntegrityError
from starlette.requests import Request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tests'))
from test_api import client_and_sessions, register
from app import main as api
from app.models import Post, User


def test_listing_query_count_is_bounded_and_relations_indexed(client_and_sessions):
    client, sessions = client_and_sessions
    header = register(client)
    uid = client.get('/auth/me', headers=header).json()['id']
    with sessions() as db:
        db.add_all(Post(author_id=uid, title=f'Post {i}', body='Body') for i in range(100))
        db.commit()
    engine = sessions.kw['bind']
    statements = []
    def collect(_conn, _cursor, statement, _parameters, _context, _executemany):
        if statement.lstrip().upper().startswith('SELECT'):
            statements.append(statement)
    event.listen(engine, 'before_cursor_execute', collect)
    try:
        for limit in [1, 100]:
            statements.clear()
            response = client.get(f'/posts?offset=0&limit={limit}')
            assert response.status_code == 200
            body = response.json()
            assert len(body['items']) == limit and body['total'] == 100
            assert [row['id'] for row in body['items']] == sorted(
                [row['id'] for row in body['items']], reverse=True)
            assert len(statements) == 2, 'Listing should use a page query and a count query, without N+1'
    finally:
        event.remove(engine, 'before_cursor_execute', collect)
    inspector = inspect(engine)
    assert any(index['column_names'] == ['author_id'] for index in inspector.get_indexes('posts'))
    assert any(index['column_names'] == ['email'] and index['unique'] for index in inspector.get_indexes('users'))
    assert any(key['referred_table'] == 'users' and key['constrained_columns'] == ['author_id']
               for key in inspector.get_foreign_keys('posts'))


def test_core_pydantic_contract_validation_and_privilege_input(client_and_sessions):
    client, _ = client_and_sessions
    credentials = {'email':'member@example.com','password':'evaluation-password-123','role':'admin'}
    signup = client.post('/auth/signup', json=credentials)
    assert signup.status_code == 201
    assert signup.json()['role'] == 'member'
    assert set(signup.json()) == {'id','email','role'}
    token = client.post('/auth/login', json=credentials).json()
    assert set(token) == {'access_token','token_type','expires_in'} and token['expires_in'] == 1800
    headers = {'Authorization':'Bearer ' + token['access_token']}
    post = client.post('/posts', headers=headers,
                       json={'title':'  Valid title  ','body':' Body ','author_id':-999})
    assert post.status_code == 201
    assert post.json()['author_id'] == signup.json()['id']
    assert post.json()['title'] == 'Valid title' and post.json()['body'] == 'Body'
    assert set(post.json()) == {'id','title','body','author_id'}
    for data in [{'email':'not-an-email','password':'long-password'},
                 {'email':'other@example.com','password':'short'}]:
        error = client.post('/auth/signup', json=data)
        assert error.status_code == 422
        assert error.json() == {'error':{'code':'VALIDATION_ERROR','message':'입력 형식이 올바르지 않습니다'}}
        assert data['password'] not in error.text
    for title, body in [('x'*121,'Body'),('Title','x'*10001),('Title','   ')]:
        response = client.post('/posts',headers=headers,json={'title':title,'body':body})
        assert response.status_code == 422 and set(response.json()) == {'error'}


@pytest.mark.parametrize('method,path,status,allow',[
    ('GET','/route-that-does-not-exist',404,None),
    ('PATCH','/auth/signup',405,'POST'),
])
def test_framework_errors_use_the_custom_error_envelope(client_and_sessions, method, path, status, allow):
    client, _ = client_and_sessions
    response = client.request(method,path)
    assert response.status_code == status
    assert set(response.json()) == {'error'}, 'Framework route errors must use the documented custom envelope'
    assert set(response.json()['error']) == {'code','message'}
    assert response.json()['error']['code'] == str(status)
    assert response.headers['cache-control'] == 'no-store'
    assert response.headers['x-content-type-options'] == 'nosniff'
    if allow:
        assert response.headers['allow'] == allow


def test_jwt_rejects_wrong_issuer_audience_missing_claim_and_algorithm(client_and_sessions):
    client, _ = client_and_sessions
    header = register(client)
    uid = client.get('/auth/me',headers=header).json()['id']
    now = datetime.now(timezone.utc)
    base = {'sub':str(uid),'iat':now,'exp':now+timedelta(minutes=5),
            'iss':'learning-board','aud':'learning-board-client'}
    variants = [({**base,'iss':'wrong-issuer'},'HS256'),
                ({**base,'aud':'wrong-audience'},'HS256'),
                ({key:value for key,value in base.items() if key != 'exp'},'HS256'),
                ({**base,'iat':now+timedelta(hours=1)},'HS256'),
                (base,'HS384')]
    for payload, algorithm in variants:
        signing_key = api.JWT_SECRET if algorithm == 'HS256' else 'evaluation-only-alternate-algorithm-signing-key-64-characters-long'
        token = jwt.encode(payload,signing_key,algorithm=algorithm)
        response = client.get('/auth/me',headers={'Authorization':'Bearer '+token})
        assert response.status_code == 401
        assert response.headers['www-authenticate'] == 'Bearer'
        assert set(response.json()) == {'error'}


def test_async_upload_handles_multiple_yielded_chunks_without_exceeding_limit():
    async def check():
        async def request(chunks):
            async def receive():
                await asyncio.sleep(0)
                chunk = chunks.pop(0)
                return {'type':'http.request','body':chunk,'more_body':bool(chunks)}
            scope = {'type':'http','method':'POST','path':'/uploads/preview',
                     'headers':[(b'content-type',b'text/plain')]}
            return await api.preview(Request(scope,receive),None)
        result = await request([b'a'*32768,b'b'*32768])
        assert result == {'bytes':65536,'preview':'a'*200}
        with pytest.raises(api.HTTPException) as caught:
            await request([b'a'*32768,b'b'*32768,b'c'])
        assert caught.value.status_code == 413
        encoded = '한글'.encode()
        assert (await request([encoded[:2],encoded[2:]]))['preview'] == '한글'
    asyncio.run(check())


def test_openapi_covers_core_success_error_and_upload_contracts(client_and_sessions):
    client, _ = client_and_sessions
    schema = client.get('/openapi.json').json()
    snapshot = json.loads((ROOT/'openapi.json').read_text(encoding='utf-8'))
    methods = {'get','post','put','delete','patch','options','head'}
    operations = lambda document: {(path,method) for path,item in document['paths'].items()
                                    for method in item if method in methods}
    assert operations(schema) == operations(snapshot)
    for path,method,status,model in [('/auth/signup','post','201','UserOut'),
                                     ('/auth/login','post','200','TokenOut'),
                                     ('/auth/me','get','200','UserOut'),
                                     ('/posts','get','200','PostList'),
                                     ('/posts','post','201','PostOut'),
                                     ('/posts/{post_id}','get','200','PostOut'),
                                     ('/posts/{post_id}','put','200','PostOut')]:
        operation=schema['paths'][path][method]
        assert operation['responses'][status]['content']['application/json']['schema']['$ref'].endswith('/'+model)
        assert operation['responses']['422']['content']['application/json']['schema']['$ref'].endswith('/ErrorOut')
    assert schema['components']['securitySchemes']['HTTPBearer']['scheme'] == 'bearer'
    assert schema['paths']['/posts']['post']['security'] == [{'HTTPBearer':[]}]
    upload = schema['paths']['/uploads/preview']['post']
    assert upload['requestBody']['content']['text/plain']['schema']['format'] == 'binary'
    assert {'413','415','422'} <= set(upload['responses'])


def test_postgresql_constraints_and_bidirectional_relationship(client_and_sessions):
    client, sessions = client_and_sessions
    if sessions.kw['bind'].dialect.name != 'postgresql':
        pytest.skip('Requires the dedicated local PostgreSQL verification database')
    header = register(client)
    uid = client.get('/auth/me',headers=header).json()['id']
    with sessions() as db:
        db.add(Post(author_id=-999,title='Invalid author',body='Body'))
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
        user = db.get(User,uid)
        user.role = 'not-a-valid-role'
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
        post = Post(author_id=uid,title='Relation',body='Body')
        db.add(post)
        db.commit()
        db.expire_all()
        assert db.get(Post,post.id).author.id == uid
        assert post.id in [item.id for item in db.get(User,uid).posts]
