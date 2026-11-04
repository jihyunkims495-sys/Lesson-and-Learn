# 인증·인가와 JWT 보안 흐름

> 2026-11-04 · LV.2 · Week 12

인증 도메인의 코드를 읽으며 인증, 인가, Token, JWT, HMAC, PyJWT가 각각 어떤 책임을 갖는지 정리했다. 아래 내용은 개념 학습과 정적 코드 확인을 바탕으로 하며, 서버·데이터베이스·HTTP 동작은 아직 실행 검증하지 않았다.

## 1. 인증, 인가, OAuth의 차이

| 구분 | 확인하는 질문 | 예시 |
|---|---|---|
| 인증(Authentication) | 누구인가? | 아이디와 비밀번호로 로그인 |
| 인가(Authorization) | 무엇을 할 수 있는가? | 관리자만 공연을 삭제하도록 제한 |
| OAuth | 다른 서비스의 권한을 어떻게 위임받는가? | 사용자의 동의를 받아 외부 계정 정보에 접근 |

OAuth는 인증이나 인가와 같은 범주의 단어라기보다 권한 위임을 위한 표준이다. OAuth 기반 로그인에서는 사용자 신원 확인을 위해 OpenID Connect가 함께 사용될 수 있다.

## 2. Token과 JWT

Token은 서버가 사용자를 매번 아이디와 비밀번호로 다시 확인하지 않도록, 인증 결과나 접근 권한을 나타내는 문자열이다. JWT(JSON Web Token)는 Token을 표현하는 방식 중 하나다.

JWT는 점(`.`)으로 구분된 세 부분으로 구성된다.

```text
Header.Payload.Signature
```

- Header: 서명 알고리즘과 Token 종류
- Payload: 사용자와 만료 시간 같은 Claim
- Signature: Header와 Payload가 변경되지 않았는지 검증하는 값

자주 쓰는 Claim의 의미는 다음과 같다.

- `sub`: Token의 주체
- `jti`: Token의 고유 식별자
- `iat`: 발급 시각
- `exp`: 만료 시각

Payload는 암호화된 비밀 공간이 아니다. 인코딩된 값이므로 비밀번호나 민감정보를 넣어서는 안 된다.

## 3. HMAC와 HS512

HMAC은 비밀키와 해시 함수를 함께 사용해 메시지가 변조되지 않았음을 확인하는 방식이다. JWT에서 HS512를 사용한다면 서버는 같은 비밀키로 Signature를 만들고 검증한다.

```text
서명 생성: HMAC(secret, encoded_header + "." + encoded_payload)
검증: 다시 계산한 값과 Token의 Signature 비교
```

HMAC은 내용을 숨기는 암호화가 아니라 무결성과 발급 주체를 확인하는 서명 방식이다. 대칭키 방식이므로 비밀키가 노출되면 누구든 유효한 Token을 만들 수 있어 키 관리가 중요하다.

## 4. PyJWT의 역할

PyJWT는 Python에서 JWT를 생성하고 검증하는 라이브러리다.

```python
import jwt

token = jwt.encode(payload, secret_key, algorithm="HS512")
claims = jwt.decode(token, secret_key, algorithms=["HS512"])
```

라이브러리는 서명과 Claim 검증을 도와주지만 다음 정책까지 자동으로 결정하지는 않는다.

- Access Token과 Refresh Token의 만료 시간
- 로그아웃된 Token의 차단 방식
- 사용자별 권한 검사
- 인증 실패와 권한 부족에 사용할 응답

따라서 PyJWT 사용과 애플리케이션의 인증·인가 정책은 구분해야 한다.

## 5. `passlib[bcrypt]` 읽기와 의미

`passlib[bcrypt]`는 보통 “패스립 비크립트”라고 읽는다. 대괄호는 Python 패키지 설치에서 선택 기능(extra)을 함께 설치한다는 뜻이다.

```bash
pip install "passlib[bcrypt]"
```

이는 Passlib의 비밀번호 해싱 기능과 Bcrypt 사용에 필요한 추가 의존성을 함께 설치한다. 비밀번호는 복호화 가능한 형태로 저장하는 대신 Bcrypt 같은 단방향 해시로 저장하고, 로그인할 때 입력값을 검증한다.

## 6. `Generic[T]`의 의미

`Generic[T]`는 하나의 클래스가 여러 데이터 타입을 안전하게 감싸도록 만드는 Python 타입 표현이다. API 공통 응답에 적용하면 응답 구조는 유지하면서 `data`의 타입만 바꿀 수 있다.

```python
from typing import Generic, TypeVar

T = TypeVar("T")

class ApiResponse(Generic[T]):
    data: T
```

예를 들어 `ApiResponse[User]`와 `ApiResponse[list[Show]]`는 같은 응답 틀을 사용하지만 `data`의 타입은 서로 다르다.

## 7. 인증 요청과 4계층의 연결

로그인 요청을 계층별 책임으로 나누면 다음과 같이 볼 수 있다.

1. Presentation: HTTP 요청을 받고 입력 형식을 검증한다.
2. Application: 로그인 유스케이스의 순서를 조정한다.
3. Domain: 사용자와 인증에 관한 핵심 규칙을 표현한다.
4. Infrastructure: 사용자 조회, 비밀번호 해시 검증, JWT 생성 같은 기술 구현을 담당한다.

로그아웃에서는 Token의 `jti`와 만료 시각을 이용해 차단 목록을 관리할 수 있다. 이후 보호된 API에서 Token을 검증할 때 차단 여부도 함께 확인해야 로그아웃된 Token의 재사용을 막을 수 있다.

## 8. 검증 범위

- 확인함: 인증 관련 Python 파일들의 구문 구조와 계층 간 연결
- 확인 결과: 정적 구문 검사 대상 12개 파일이 모두 파싱됨
- 확인하지 않음: 실제 서버 기동, 데이터베이스 연결, 로그인·로그아웃 HTTP 요청, Token 차단, 401·403 응답

정적 검사가 통과했다는 사실은 문법 구조가 유효하다는 뜻이지, 인증 기능이 실제 환경에서 정상 동작한다는 뜻은 아니다.

## 다음 학습

1. 로그인 요청 한 건이 네 계층을 통과하는 순서를 실행으로 추적한다.
2. 로그아웃 전후 동일 Token으로 보호 API에 접근해 차단 여부를 확인한다.
3. 인증 실패의 401과 권한 부족의 403을 실제 응답으로 비교한다.

[TIL 보기](./04-til-01-authentication-jwt-security.md) · [Week 12로 돌아가기](../README.md)
