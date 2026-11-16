"""폐기 가능한 로컬 컨테이너의 실제 TCP HTTP 흐름을 검사한다."""
import json
import secrets
import sys
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def main():
    base = sys.argv[1].rstrip('/')
    url = urlsplit(base)
    if url.scheme != 'http' or url.hostname not in {'localhost', '127.0.0.1'}:
        raise SystemExit('Only an isolated local HTTP service may be tested')
    checks = 0

    def request(method, path, expected, payload=None, headers=None, raw=None):
        nonlocal checks
        options = dict(headers or {})
        body = raw
        if payload is not None:
            body = json.dumps(payload).encode()
            options['Content-Type'] = 'application/json'
        req = Request(base + path, data=body, headers=options, method=method)
        try:
            response = urlopen(req, timeout=5)
        except HTTPError as error:
            response = error
        with response:
            assert response.status == expected, (method, path, response.status, expected)
            data = response.read()
            checks += 1
            if data and response.headers.get_content_type() == 'application/json':
                return json.loads(data), response.headers
            return data, response.headers

    assert request('GET', '/health', 200)[0] == {'status': 'ok'}
    assert b'Swagger UI' in request('GET', '/docs', 200)[0]
    assert 'paths' in request('GET', '/openapi.json', 200)[0]
    assert request('GET', '/route-that-does-not-exist', 404)[0]['error']['code'] == '404'
    wrong_method, wrong_method_headers = request('PATCH', '/auth/signup', 405)
    assert wrong_method['error']['code'] == '405'
    assert wrong_method_headers['Allow'] == 'POST'
    accounts = []
    for _ in range(2):
        credentials = {'email': secrets.token_hex(8) + '@example.com', 'password': secrets.token_urlsafe(24)}
        user, _ = request('POST', '/auth/signup', 201, credentials)
        assert set(user) == {'id', 'email', 'role'}
        token, _ = request('POST', '/auth/login', 200, credentials)
        accounts.append({'Authorization': 'Bearer ' + token['access_token']})
    owner, other = accounts
    assert request('GET', '/auth/me', 200, headers=owner)[0]['role'] == 'member'
    post = {'title': 'TCP smoke', 'body': 'Temporary integration data'}
    request('POST', '/posts', 401, post)
    request('POST', '/posts', 422, {'title': ' ', 'body': 'x'}, owner)
    created, _ = request('POST', '/posts', 201, post, owner)
    path = '/posts/' + str(created['id'])
    assert request('GET', path, 200)[0]['title'] == post['title']
    assert request('GET', '/posts', 200)[0]['total'] >= 1
    request('PUT', path, 403, post, other)
    request('DELETE', path, 403, headers=other)
    assert request('PUT', path, 200, {**post, 'title': 'Updated'}, owner)[0]['title'] == 'Updated'
    assert request('DELETE', path, 204, headers=owner)[0] == b''
    request('GET', path, 404)
    request('GET', '/auth/me', 401, headers={'Authorization': 'Bearer invalid'})
    upload_headers = {**owner, 'Content-Type': 'text/plain'}
    assert request('POST', '/uploads/preview', 200, headers=upload_headers, raw=b'hello')[0]['bytes'] == 5
    request('POST', '/uploads/preview', 413, headers=upload_headers, raw=b'x' * 65537)
    assert request('GET', '/meta', 200)[1]['Cache-Control'] == 'public, max-age=60'
    print(f'Container TCP HTTP smoke: {checks} checks PASS')


if __name__ == '__main__':
    main()
