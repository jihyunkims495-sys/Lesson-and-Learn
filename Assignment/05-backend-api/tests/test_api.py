"""실제 ASGI HTTP 검사. PostgreSQL은 전용 로컬 검증 DB만 허용한다."""
import os
from datetime import datetime, timedelta, timezone

import jwt
import pytest
os.environ['DATABASE_URL']='sqlite+pysqlite:///:memory:'
os.environ['JWT_SECRET']='local-test-only-secret-32-characters-minimum'
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app,Base,User,db_session,JWT_SECRET


@pytest.fixture
def client_and_sessions():
    database_url = os.environ.get('BOARD_TEST_DATABASE_URL')
    if database_url:
        url = make_url(database_url)
        if (url.get_backend_name() != 'postgresql'
                or url.host not in {'127.0.0.1', 'localhost'}
                or not (url.database or '').startswith('practice_board_validation_')):
            pytest.fail('BOARD_TEST_DATABASE_URL must target a dedicated local practice_board_validation_ database')
        engine = create_engine(database_url, pool_pre_ping=True)
    else:
        engine = create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(engine, expire_on_commit=False)
    def override():
        with sessions() as db:
            yield db
    app.dependency_overrides[db_session] = override
    try:
        with TestClient(app) as client:
            yield client, sessions
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()


def register(client, email='one@example.com'):
    credentials = {'email': email, 'password': 'test-password-123'}
    response = client.post('/auth/signup', json=credentials)
    assert response.status_code == 201
    assert set(response.json()) == {'id', 'email', 'role'}
    token = client.post('/auth/login', json=credentials).json()['access_token']
    return {'Authorization': 'Bearer ' + token}

def test_crud_and_authorization(client_and_sessions):
    client, _ = client_and_sessions
    headers = [register(client), register(client, 'two@example.com')]
    payload={'title':'Slacks reorder','body':'Review stock before ordering'}
    assert client.post('/posts',json=payload).status_code==401
    assert client.post('/posts',json={'title':' ','body':'x'},headers=headers[0]).status_code==422
    created=client.post('/posts',json=payload,headers=headers[0]);assert created.status_code==201
    pid=created.json()['id']
    assert client.get('/posts/'+str(pid)).status_code==200
    assert client.get('/posts').json()['total']==1
    assert client.put('/posts/'+str(pid),json=payload,headers=headers[1]).status_code==403
    assert client.delete('/posts/'+str(pid),headers=headers[1]).status_code==403
    assert client.put('/posts/'+str(pid),json={**payload,'title':'Updated'},headers=headers[0]).json()['title']=='Updated'
    deleted=client.delete('/posts/'+str(pid),headers=headers[0])
    assert deleted.status_code==204 and deleted.content==b''
    assert client.get('/posts/'+str(pid)).status_code==404


def test_signup_duplicate_and_login_errors(client_and_sessions):
    client, _ = client_and_sessions
    header = register(client)
    assert client.get('/auth/me', headers=header).json()['role'] == 'member'
    duplicate = client.post('/auth/signup', json={'email':'ONE@example.com','password':'test-password-123'})
    assert duplicate.status_code == 409
    assert client.get('/posts').status_code == 200
    for email in ['one@example.com','missing@example.com']:
        response = client.post('/auth/login', json={'email':email,'password':'wrong-password'})
        assert response.status_code == 401
        assert response.headers['www-authenticate'] == 'Bearer'
        assert set(response.json()) == {'error'}


def test_expired_missing_and_tampered_tokens(client_and_sessions):
    client, _ = client_and_sessions
    header = register(client)
    uid = client.get('/auth/me', headers=header).json()['id']
    now = datetime.now(timezone.utc)
    token = jwt.encode({'sub':str(uid),'iat':now-timedelta(hours=1),'exp':now-timedelta(seconds=1),
                        'iss':'learning-board','aud':'learning-board-client'},JWT_SECRET,algorithm='HS256')
    for value in [None, 'invalid', token]:
        response = client.get('/auth/me', headers={} if value is None else {'Authorization':'Bearer '+value})
        assert response.status_code == 401
        assert response.headers['www-authenticate'] == 'Bearer'


def test_admin_authorization(client_and_sessions):
    client, sessions = client_and_sessions
    owner = register(client)
    admin = register(client,'admin@example.com')
    admin_id = client.get('/auth/me',headers=admin).json()['id']
    with sessions() as db:
        db.get(User,admin_id).role='admin'
        db.commit()
    post = client.post('/posts',headers=owner,json={'title':'Owner','body':'Body'}).json()
    assert client.put('/posts/'+str(post['id']),headers=admin,json={'title':'Admin','body':'Revised'}).status_code == 200
    assert client.delete('/posts/'+str(post['id']),headers=admin).status_code == 204


def test_upload_request_boundaries(client_and_sessions):
    client, _ = client_and_sessions
    header = register(client)
    def upload(body, kind='text/plain'):
        return client.post('/uploads/preview',headers={**header,'Content-Type':kind},content=body)
    assert upload('안녕하세요'.encode()).json() == {'bytes':15,'preview':'안녕하세요'}
    assert upload(b'x'*65536).status_code == 200
    assert upload(b'x'*65537).status_code == 413
    assert upload(b'x','image/png').status_code == 415
    assert upload(b'\xff').status_code == 422


def test_operations_headers_and_schema(client_and_sessions):
    client, _ = client_and_sessions
    assert client.get('/health').json() == {'status':'ok'}
    assert client.get('/meta').headers['cache-control'] == 'public, max-age=60'
    response = client.get('/posts')
    assert response.headers['cache-control'] == 'no-store'
    assert response.headers['x-content-type-options'] == 'nosniff'
    assert float(response.headers['x-process-time']) >= 0
    assert client.get('/docs').status_code == 200
    schema=client.get('/openapi.json').json()
    assert 'text/plain' in schema['paths']['/uploads/preview']['post']['requestBody']['content']
    assert client.get('/posts?limit=101').status_code == 422
    assert client.get('/posts?offset=-1').status_code == 422
    response=client.options('/posts',headers={'Origin':'http://localhost:3000','Access-Control-Request-Method':'POST'})
    assert response.headers['access-control-allow-origin'] == 'http://localhost:3000'


def test_database_error_response(client_and_sessions):
    client, _ = client_and_sessions
    def failed_database():
        raise SQLAlchemyError('private connection detail')
        yield
    app.dependency_overrides[db_session] = failed_database
    response = client.get('/health')
    assert response.status_code == 503
    assert response.json() == {'error':{'code':'DATABASE_ERROR','message':'데이터베이스 요청 처리 실패'}}
    assert 'private connection detail' not in response.text
