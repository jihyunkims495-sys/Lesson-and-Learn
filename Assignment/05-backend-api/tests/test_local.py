"""네트워크 없는 SQLite + 직접 서비스/ASGI 함수 검증. HTTP E2E와 구분한다."""
import os
import unittest
from datetime import datetime, timedelta, timezone

os.environ['DATABASE_URL'] = 'sqlite+pysqlite:///:memory:'
os.environ['JWT_SECRET'] = 'local-test-only-secret-32-characters-minimum'

import jwt
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError
from starlette.requests import Request
from app import main as api


def run_in_memory(coroutine):
    """외부 I/O가 없는 async 함수를 직접 실행한다. HTTP 이벤트 루프 테스트가 아니다."""
    try:
        coroutine.send(None)
    except StopIteration as completed:
        return completed.value
    finally:
        coroutine.close()
    raise AssertionError('이 테스트에서 외부 비동기 대기가 발생했습니다')


class BoardTests(unittest.TestCase):
    def setUp(self):
        api.Base.metadata.drop_all(api.engine)
        api.Base.metadata.create_all(api.engine)
        self.db = api.SessionLocal()
        self.user = api.signup(api.Signup(email='one@example.com', password='password-one-123'), self.db)
        self.other = api.signup(api.Signup(email='two@example.com', password='password-two-123'), self.db)

    def tearDown(self):
        self.db.close()

    def test_crud_and_paginated_listing(self):
        post = api.create_post(api.PostInput(title='Reorder', body='Stock review'), self.db, self.user)
        self.assertEqual(api.read_post(post.id, self.db).title, 'Reorder')
        self.assertEqual(api.list_posts(self.db, 0, 20)['total'], 1)
        self.assertEqual(api.list_posts(self.db, 1, 20)['items'], [])
        api.update_post(post.id, api.PostInput(title='Updated', body='Updated body'), self.db, self.user)
        self.assertEqual(post.title, 'Updated')
        api.delete_post(post.id, self.db, self.user)
        with self.assertRaises(HTTPException) as caught:
            api.read_post(post.id, self.db)
        self.assertEqual(caught.exception.status_code, 404)

    def test_owner_and_admin_authorization(self):
        post = api.create_post(api.PostInput(title='Item', body='Body'), self.db, self.user)
        with self.assertRaises(HTTPException) as caught:
            api.delete_post(post.id, self.db, self.other)
        self.assertEqual(caught.exception.status_code, 403)
        self.other.role = 'admin'
        api.update_post(post.id, api.PostInput(title='Admin revised', body='Body'), self.db, self.other)
        self.assertEqual(post.title, 'Admin revised')

    def test_duplicate_email_rolls_back(self):
        with self.assertRaises(HTTPException) as caught:
            api.signup(api.Signup(email='one@example.com', password='different-password'), self.db)
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(api.list_posts(self.db, 0, 20)['total'], 0)

    def test_password_salt_and_serialization(self):
        encoded = api.password_hash.hash('secret-123')
        self.assertNotEqual(encoded, api.password_hash.hash('secret-123'))
        self.assertTrue(api.password_hash.verify('secret-123', encoded))
        self.assertFalse(api.password_hash.verify('wrong', encoded))
        self.assertNotIn('password_hash', api.UserOut.model_validate(self.user).model_dump())

    def test_login_and_token_validation(self):
        token = api.login(api.Login(email='one@example.com', password='password-one-123'), self.db)
        credential = HTTPAuthorizationCredentials(scheme='Bearer', credentials=token.access_token)
        self.assertEqual(api.current_user(self.db, credential).id, self.user.id)
        with self.assertRaises(HTTPException) as caught:
            api.login(api.Login(email='one@example.com', password='wrong'), self.db)
        self.assertEqual(caught.exception.status_code, 401)

    def test_missing_expired_tampered_token(self):
        now = datetime.now(timezone.utc)
        payload = {'sub':str(self.user.id),'iat':now-timedelta(hours=1),'exp':now-timedelta(seconds=1),'iss':'learning-board','aud':'learning-board-client'}
        expired = jwt.encode(payload, api.JWT_SECRET, algorithm='HS256')
        for credential in [None, HTTPAuthorizationCredentials(scheme='Bearer',credentials=expired), HTTPAuthorizationCredentials(scheme='Bearer',credentials='invalid')]:
            with self.assertRaises(HTTPException) as caught:
                api.current_user(self.db, credential)
            self.assertEqual(caught.exception.status_code, 401)

    def test_input_and_openapi(self):
        for value in ['', ' ', 'x'*121]:
            with self.assertRaises(ValidationError):
                api.PostInput(title=value, body='body')
        schema = api.app.openapi()
        self.assertIn('delete', schema['paths']['/posts/{post_id}'])
        self.assertIn('text/plain', schema['paths']['/uploads/preview']['post']['requestBody']['content'])

    def test_error_schema(self):
        response = api.error_response(401, '401', 'Unauthorized')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.headers['www-authenticate'], 'Bearer')
        self.assertIn(b'"error"', response.body)

    def test_cache_middleware_preserves_public_policy(self):
        async def check():
            async def downstream(request):
                return api.meta()
            response = await api.timing(None, downstream)
            self.assertEqual(response.headers['cache-control'], 'public, max-age=60')
            self.assertIn('x-process-time', response.headers)
            async def private_downstream(request):
                return JSONResponse({'private': True})
            private = await api.timing(None, private_downstream)
            self.assertEqual(private.headers['cache-control'], 'no-store')
        run_in_memory(check())

    def test_async_upload_validation(self):
        async def check():
            async def upload(data, content_type):
                async def receive():
                    return {'type':'http.request','body':data,'more_body':False}
                request = Request({'type':'http','method':'POST','path':'/uploads/preview','headers':[(b'content-type',content_type.encode())]}, receive)
                return await api.preview(request, self.user)
            self.assertEqual((await upload(b'hello', 'text/plain'))['bytes'], 5)
            for data, kind, expected in [(b'x'*65537,'text/plain',413),(b'x','image/png',415),(b'\xff','text/plain',422)]:
                with self.assertRaises(HTTPException) as caught:
                    await upload(data, kind)
                self.assertEqual(caught.exception.status_code, expected)
        run_in_memory(check())


if __name__ == '__main__':
    unittest.main(verbosity=2)
