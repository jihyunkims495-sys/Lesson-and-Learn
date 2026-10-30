# 공연·공연 회차 API 명세 초안

기준일: 2026-10-29. 공연·공연 회차 10개 기능의 검토용 API 초안이다. 실제 구현·HTTP 테스트 결과가 아니며, API 공통 접두사는 `/v1`이다.

각 기능은 Description / Header / Request Body / Response Field / Response Code / ERROR의 여섯 항목으로 구성한다. 요청·응답 예시와 필드별 설명, 검증 규칙 및 합의할 정책을 함께 정리한다.

## SHOW-01 · 공연 목록 조회

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 |
| 기능명 | 공연 목록 조회 |
| API Path | /v1/shows |
| http method | GET |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json

path / query
query: page: integer=1 (>=1), size: integer=20 (1~100), keyword: string? (title 검색), type: string?, venues_id: integer? (>0)

body
없음
```

**응답 상세 속성**

```text
HTTP 200
header
- Content-Type: application/json

body
{
  "items": [
    {
      "show_id": 101,
      "venues_id": 1,
      "title": "예시 공연",
      "description": "공연 소개",
      "performer": "예시 출연자",
      "type": "CONCERT",
      "runtime": 120,
      "created_at": "2026-10-29T17:00:00+09:00",
      "updated_at": null
    }
  ],
  "page": 1,
  "size": 20,
  "total": 1
}

실패
422 페이지·크기·필터 형식/범위 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 공연 목록 조회
- API: `GET /v1/shows`
- 인증·권한: 공개
- 관련 테이블: shows, venues, users

**처리 규칙**

- 공연 목록은 비회원도 조회하는 안이다.
- 목록은 show_id 오름차순을 기본으로 제안한다. 검색·필터를 적용한 전체 건수를 total에 반환한다.
- 조회 결과가 없으면 200과 items: [], total: 0을 반환한다. GET에서 데이터 상태를 변경하지 않는다.

**팀 확인 필요**

shows.user_id의 등록자/소유자 의미, SELLER 본인 공연과 ADMIN의 변경 범위, 공연 분류 코드, runtime 단위·범위, 목록 응답의 필드와 정렬을 팀에서 확인한다. user_id는 공개 응답에서 제외한 안이며 노출 범위는 별도 합의한다. 공연장명·포스터·첫 공연일 필요 여부와 필터의 미존재 공연장 처리(빈 목록/404)를 확인한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

query: page: integer=1 (>=1), size: integer=20 (1~100), keyword: string? (title 검색), type: string?, venues_id: integer? (>0)

**Body**

없음. URL 경로·쿼리로 조회/삭제 대상을 전달한다.

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| page | integer | 선택·기본 1 | 1 | 조회 페이지. 양수 제안. |
| size | integer | 선택·기본 20 | 20 | 1~100 제안. |
| keyword | string | 선택 | 예시 | title 검색. performer 포함 여부 확인. |
| type | string | 선택 | CONCERT | 분류 코드 목록 합의 필요. |
| venues_id | integer | 선택 | 1 | 공연장 필터. 양수 제안. |


### Response Field

**성공: HTTP 200**

```json
{
  "items": [
    {
      "show_id": 101,
      "venues_id": 1,
      "title": "예시 공연",
      "description": "공연 소개",
      "performer": "예시 출연자",
      "type": "CONCERT",
      "runtime": 120,
      "created_at": "2026-10-29T17:00:00+09:00",
      "updated_at": null
    }
  ],
  "page": 1,
  "size": 20,
  "total": 1
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| items | array<공연> | 필수 | 이번 페이지의 공연 목록. 아래 items[] 필드 참고. |
| page | integer | 필수 | 현재 페이지. 기본 1 제안. |
| size | integer | 필수 | 페이지당 최대 건수. 실제 items 개수와 다를 수 있음. |
| total | integer | 필수 | 동일 검색·필터 조건 전체 건수. |
| items[].show_id | integer | 필수 | 공연 식별값. 서버 생성. |
| items[].venues_id | integer | 필수 | 공연장 연결 ID. 이름은 별도 조인 필드이며 현재 예시에는 포함하지 않음. |
| items[].title | string | 필수 | 공연명. |
| items[].description | string 또는 null | 제공·null 가능 | 공연 소개. |
| items[].performer | string 또는 null | 제공·null 가능 | 출연자. |
| items[].type | string | 필수 | 공연 분류 코드. 허용 코드 합의 필요. |
| items[].runtime | integer 또는 null | 제공·null 가능 | 러닝타임. 분 단위는 검토안. |
| items[].created_at | string (date-time) | 필수 | 서버 생성시각. |
| items[].updated_at | string (date-time) 또는 null | 제공·null 가능 | 서버 수정시각, 미수정이면 null. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 422 | 페이지·크기·필터 형식/범위 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 422**

```json
{
  "detail": {
    "code": "VALIDATION_ERROR",
    "message": "요청 입력값을 확인해 주세요."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 422 | 페이지·크기·필터 형식/범위 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## SHOW-02 · 공연 상세 조회

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 |
| 기능명 | 공연 상세 조회 |
| API Path | /v1/shows/{show_id} |
| http method | GET |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json

path / query
path: show_id: integer >0

body
없음
```

**응답 상세 속성**

```text
HTTP 200
header
- Content-Type: application/json

body
{
  "show_id": 101,
  "venues_id": 1,
  "title": "예시 공연",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 120,
  "created_at": "2026-10-29T17:00:00+09:00",
  "updated_at": null
}

실패
404 공연 없음; 422 show_id 형식·범위 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 공연 상세 조회
- API: `GET /v1/shows/{show_id}`
- 인증·권한: 공개
- 관련 테이블: shows, venues, users

**처리 규칙**

- show_id로 공연을 조회하고 없으면 404를 반환하는 안이다.
- 공연장 ID는 포함하지만 공연장명·주소 조인, 회차 포함 여부는 별도 합의한다.
- 공개 응답에서 소유자 user_id는 제외한 안이다.

**팀 확인 필요**

shows.user_id의 등록자/소유자 의미, SELLER 본인 공연과 ADMIN의 변경 범위, 공연 분류 코드, runtime 단위·범위, 목록 응답의 필드와 정렬을 팀에서 확인한다. user_id는 공개 응답에서 제외한 안이며 노출 범위는 별도 합의한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: show_id: integer >0

**Body**

없음. URL 경로·쿼리로 조회/삭제 대상을 전달한다.

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| show_id | integer | Path 필수 | 101 | 조회할 공연 ID. |


### Response Field

**성공: HTTP 200**

```json
{
  "show_id": 101,
  "venues_id": 1,
  "title": "예시 공연",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 120,
  "created_at": "2026-10-29T17:00:00+09:00",
  "updated_at": null
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| show_id | integer | 필수 | 공연 식별값. 서버 생성. |
| venues_id | integer | 필수 | 공연장 연결 ID. 이름은 별도 조인 필드이며 현재 예시에는 포함하지 않음. |
| title | string | 필수 | 공연명. |
| description | string 또는 null | 제공·null 가능 | 공연 소개. |
| performer | string 또는 null | 제공·null 가능 | 출연자. |
| type | string | 필수 | 공연 분류 코드. 허용 코드 합의 필요. |
| runtime | integer 또는 null | 제공·null 가능 | 러닝타임. 분 단위는 검토안. |
| created_at | string (date-time) | 필수 | 서버 생성시각. |
| updated_at | string (date-time) 또는 null | 제공·null 가능 | 서버 수정시각, 미수정이면 null. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 404 | 공연 없음 |
| 422 | show_id 형식·범위 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 404**

```json
{
  "detail": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 대상을 찾을 수 없습니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 404 | 공연 없음 |
| 422 | show_id 형식·범위 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## SHOW-03 · 공연 등록

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 |
| 기능명 | 공연 등록 |
| API Path | /v1/shows |
| http method | POST |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json
- Content-Type: application/json
- Authorization: Bearer <access_token>

path / query
없음

body
{
  "venues_id": 1,
  "title": "예시 공연",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 120
}
```

**응답 상세 속성**

```text
HTTP 201
header
- Content-Type: application/json
- Location: /v1/shows/101

body
{
  "show_id": 101,
  "venues_id": 1,
  "title": "예시 공연",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 120,
  "created_at": "2026-10-29T17:00:00+09:00",
  "updated_at": null
}

실패
401 인증 실패; 403 등록 권한 없음; 404 공연장 없음; 422 필수값·길이·형식·허용하지 않은 필드 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 공연 등록
- API: `POST /v1/shows`
- 인증·권한: 로그인 + 역할·소유권 검사 제안. SELLER의 본인 공연과 ADMIN의 변경 범위는 팀 합의 전.
- 관련 테이블: shows, venues, users

**처리 규칙**

- 인증 사용자 및 변경 권한을 검사한다.
- venues_id의 공연장이 존재하는지, 필수값과 형식이 맞는지 검사한다.
- user_id는 인증 사용자에서 정하고 공연·생성시각을 저장한다.
- 생성 후 공개 조회 계약에 맞는 공연 객체를 반환하는 안이다.

**팀 확인 필요**

shows.user_id의 등록자/소유자 의미, SELLER 본인 공연과 ADMIN의 변경 범위, 공연 분류 코드, runtime 단위·범위, 목록 응답의 필드와 정렬을 팀에서 확인한다. user_id는 공개 응답에서 제외한 안이며 노출 범위는 별도 합의한다. 공연명 중복을 금지하는 정책은 현재 ERD만으로 확정하지 않는다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 요청 | Authorization | Bearer <access_token> | 변경 권한·현재 사용자 검사를 위한 방식 제안 |
| 요청 | Content-Type | application/json | 요청 Body 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |
| 응답 | Location | /v1/shows/101 | 생성 자원 URI 제안 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

없음

**Body**

```json
{
  "venues_id": 1,
  "title": "예시 공연",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 120
}
```

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| venues_id | integer | 필수 | 1 | 존재하는 공연장 ID. 양수 제안. |
| title | string | 필수 | 예시 공연 | NOT NULL VARCHAR(255). 공백 제거 후 1~255자 검증 제안. |
| description | string 또는 null | 선택 | 공연 소개 | TEXT, NULL 허용. 목록 전체 본문 포함 여부는 검토. |
| performer | string 또는 null | 선택 | 예시 출연자 | VARCHAR(255), NULL 허용. |
| type | string | 필수 | CONCERT | NOT NULL VARCHAR(50). 허용 코드 목록은 합의 전이며 예시는 CONCERT. |
| runtime | integer 또는 null | 선택 | 120 | INTEGER, NULL 허용. 분 단위·양수 검증은 제안. |

show_id, user_id, created_at, updated_at은 요청 입력으로 받지 않는 안이다. 새 user_id는 인증 정보에서 서버가 결정하고 기존 소유자 변경은 이 API 범위에 포함하지 않는다.

### Response Field

**성공: HTTP 201**

```json
{
  "show_id": 101,
  "venues_id": 1,
  "title": "예시 공연",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 120,
  "created_at": "2026-10-29T17:00:00+09:00",
  "updated_at": null
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| show_id | integer | 필수 | 공연 식별값. 서버 생성. |
| venues_id | integer | 필수 | 공연장 연결 ID. 이름은 별도 조인 필드이며 현재 예시에는 포함하지 않음. |
| title | string | 필수 | 공연명. |
| description | string 또는 null | 제공·null 가능 | 공연 소개. |
| performer | string 또는 null | 제공·null 가능 | 출연자. |
| type | string | 필수 | 공연 분류 코드. 허용 코드 합의 필요. |
| runtime | integer 또는 null | 제공·null 가능 | 러닝타임. 분 단위는 검토안. |
| created_at | string (date-time) | 필수 | 서버 생성시각. |
| updated_at | string (date-time) 또는 null | 제공·null 가능 | 서버 수정시각, 미수정이면 null. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 201 | 생성 성공 |
| 401 | 인증 실패 |
| 403 | 등록 권한 없음 |
| 404 | 공연장 없음 |
| 422 | 필수값·길이·형식·허용하지 않은 필드 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 401**

```json
{
  "detail": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "로그인이 필요합니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 401 | 인증 실패 |
| 403 | 등록 권한 없음 |
| 404 | 공연장 없음 |
| 422 | 필수값·길이·형식·허용하지 않은 필드 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## SHOW-04 · 공연 수정

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 |
| 기능명 | 공연 수정 |
| API Path | /v1/shows/{show_id} |
| http method | PATCH |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json
- Content-Type: application/json
- Authorization: Bearer <access_token>

path / query
path: show_id: integer >0

body
{
  "title": "변경 공연명",
  "runtime": 130
}
```

**응답 상세 속성**

```text
HTTP 200
header
- Content-Type: application/json

body
{
  "show_id": 101,
  "venues_id": 1,
  "title": "변경 공연명",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 130,
  "created_at": "2026-10-29T17:00:00+09:00",
  "updated_at": "2026-10-29T18:00:00+09:00"
}

실패
401 인증 실패; 403 수정 권한 없음; 404 공연/변경 대상 공연장 없음; 409 연결 회차·좌석·예매로 인해 변경 불가; 422 입력·null·허용하지 않은 필드 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 공연 수정
- API: `PATCH /v1/shows/{show_id}`
- 인증·권한: 로그인 + 역할·소유권 검사 제안. SELLER의 본인 공연과 ADMIN의 변경 범위는 팀 합의 전.
- 관련 테이블: shows, venues, users

**처리 규칙**

- 공연 존재와 인증 사용자 역할·소유권을 확인한다.
- 허용 필드만 기존 값에 병합하고 전체 규칙을 재검사한다.
- 회차가 연결된 뒤 venues_id 변경은 409로 거절하는 안이다.
- show_id·user_id·생성시각은 유지하고 updated_at을 서버에서 갱신한다.

**팀 확인 필요**

shows.user_id의 등록자/소유자 의미, SELLER 본인 공연과 ADMIN의 변경 범위, 공연 분류 코드, runtime 단위·범위, 목록 응답의 필드와 정렬을 팀에서 확인한다. user_id는 공개 응답에서 제외한 안이며 노출 범위는 별도 합의한다. 회차·판매·예매 이후 변경 가능한 필드 범위를 합의한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 요청 | Authorization | Bearer <access_token> | 변경 권한·현재 사용자 검사를 위한 방식 제안 |
| 요청 | Content-Type | application/json | 요청 Body 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: show_id: integer >0

**Body**

```json
{
  "title": "변경 공연명",
  "runtime": 130
}
```

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| show_id | integer | Path 필수 | 101 | 수정할 공연 ID. |
| venues_id | integer | 선택·최소 1개 | 1 | 존재하는 공연장 ID. 양수 제안. |
| title | string | 선택·최소 1개 | 예시 공연 | NOT NULL VARCHAR(255). 공백 제거 후 1~255자 검증 제안. |
| description | string 또는 null | 선택·최소 1개 | 공연 소개 | TEXT, NULL 허용. 목록 전체 본문 포함 여부는 검토. |
| performer | string 또는 null | 선택·최소 1개 | 예시 출연자 | VARCHAR(255), NULL 허용. |
| type | string | 선택·최소 1개 | CONCERT | NOT NULL VARCHAR(50). 허용 코드 목록은 합의 전이며 예시는 CONCERT. |
| runtime | integer 또는 null | 선택·최소 1개 | 120 | INTEGER, NULL 허용. 분 단위·양수 검증은 제안. |

PATCH는 최소 하나의 허용 필드를 보낸다. 생략은 기존 값 유지, 선택 필드의 null은 비움, NOT NULL 필드의 null은 422로 거절하는 안이다. 변경 후 전체 객체의 규칙을 재검사한다.
show_id, user_id, created_at, updated_at은 요청 입력으로 받지 않는 안이다. 새 user_id는 인증 정보에서 서버가 결정하고 기존 소유자 변경은 이 API 범위에 포함하지 않는다.

### Response Field

**성공: HTTP 200**

```json
{
  "show_id": 101,
  "venues_id": 1,
  "title": "변경 공연명",
  "description": "공연 소개",
  "performer": "예시 출연자",
  "type": "CONCERT",
  "runtime": 130,
  "created_at": "2026-10-29T17:00:00+09:00",
  "updated_at": "2026-10-29T18:00:00+09:00"
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| show_id | integer | 필수 | 공연 식별값. 서버 생성. |
| venues_id | integer | 필수 | 공연장 연결 ID. 이름은 별도 조인 필드이며 현재 예시에는 포함하지 않음. |
| title | string | 필수 | 공연명. |
| description | string 또는 null | 제공·null 가능 | 공연 소개. |
| performer | string 또는 null | 제공·null 가능 | 출연자. |
| type | string | 필수 | 공연 분류 코드. 허용 코드 합의 필요. |
| runtime | integer 또는 null | 제공·null 가능 | 러닝타임. 분 단위는 검토안. |
| created_at | string (date-time) | 필수 | 서버 생성시각. |
| updated_at | string (date-time) 또는 null | 제공·null 가능 | 서버 수정시각, 미수정이면 null. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 401 | 인증 실패 |
| 403 | 수정 권한 없음 |
| 404 | 공연/변경 대상 공연장 없음 |
| 409 | 연결 회차·좌석·예매로 인해 변경 불가 |
| 422 | 입력·null·허용하지 않은 필드 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 401**

```json
{
  "detail": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "로그인이 필요합니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 401 | 인증 실패 |
| 403 | 수정 권한 없음 |
| 404 | 공연/변경 대상 공연장 없음 |
| 409 | 연결 회차·좌석·예매로 인해 변경 불가 |
| 422 | 입력·null·허용하지 않은 필드 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## SHOW-05 · 공연 삭제 (범위 검토)

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 |
| 기능명 | 공연 삭제 (범위 검토) |
| API Path | /v1/shows/{show_id} |
| http method | DELETE |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json
- Authorization: Bearer <access_token>

path / query
path: show_id: integer >0

body
없음
```

**응답 상세 속성**

```text
HTTP 204
header
없음

body
없음

실패
401 인증 실패; 403 삭제 권한 없음; 404 공연 없음; 409 연결 회차 존재; 422 show_id 형식·범위 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 공연 삭제 (범위 검토)
- API: `DELETE /v1/shows/{show_id}`
- 인증·권한: 로그인 + 역할·소유권 검사 제안. SELLER의 본인 공연과 ADMIN의 변경 범위는 팀 합의 전.
- 관련 테이블: shows, venues, users

**처리 규칙**

- 삭제 기능 자체를 이번 구현 범위에 포함할지 검토한다.
- 대상 존재·권한·연결 회차를 검사한다.
- 연결 회차가 없는 공연만 물리 삭제하는 안이다. shows에 deleted_at 컬럼은 없다.
- 연결 회차가 있으면 409로 거절하고 자동 연쇄 삭제·주문 취소·환불을 수행하지 않는다.

**팀 확인 필요**

shows.user_id의 등록자/소유자 의미, SELLER 본인 공연과 ADMIN의 변경 범위, 공연 분류 코드, runtime 단위·범위, 목록 응답의 필드와 정렬을 팀에서 확인한다. user_id는 공개 응답에서 제외한 안이며 노출 범위는 별도 합의한다. 삭제 대신 공개 비노출이 필요하다면 현재 shows 구조에 별도 정책·필드가 필요한지 검토한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다. 삭제는 주문 취소·환불과 구분하며, 자동 연쇄 삭제를 전제하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 요청 | Authorization | Bearer <access_token> | 변경 권한·현재 사용자 검사를 위한 방식 제안 |
| 응답 | Content-Type | 없음 | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: show_id: integer >0

**Body**

없음. URL 경로·쿼리로 조회/삭제 대상을 전달한다.

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| show_id | integer | Path 필수 | 101 | 삭제할 공연 ID. |


### Response Field

**성공: HTTP 204**

Body 없음. Content-Type도 지정하지 않는 안이다.


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 204 | 삭제 성공, 응답 본문 없음 |
| 401 | 인증 실패 |
| 403 | 삭제 권한 없음 |
| 404 | 공연 없음 |
| 409 | 연결 회차 존재 |
| 422 | show_id 형식·범위 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 401**

```json
{
  "detail": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "로그인이 필요합니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 401 | 인증 실패 |
| 403 | 삭제 권한 없음 |
| 404 | 공연 없음 |
| 409 | 연결 회차 존재 |
| 422 | show_id 형식·범위 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## PERF-01 · 공연별 회차 목록 조회

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 회차 |
| 기능명 | 공연별 회차 목록 조회 |
| API Path | /v1/shows/{show_id}/performances |
| http method | GET |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json

path / query
path: show_id: integer >0; query: date: string? (YYYY-MM-DD, starts_at의 Asia/Seoul 날짜 기준 제안)

body
없음
```

**응답 상세 속성**

```text
HTTP 200
header
- Content-Type: application/json

body
{
  "items": [
    {
      "perf_id": 201,
      "show_id": 101,
      "round_number": 1,
      "starts_at": "2026-11-07T19:00:00+09:00",
      "ends_at": "2026-11-07T21:00:00+09:00",
      "booking_opens_at": "2026-11-01T10:00:00+09:00",
      "booking_closes_at": "2026-11-07T18:00:00+09:00",
      "max_tickets_per_user": 3,
      "status": "SCHEDULED"
    }
  ]
}

실패
404 공연 없음; 422 공연 ID/날짜 형식 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 공연별 회차 목록 조회
- API: `GET /v1/shows/{show_id}/performances`
- 인증·권한: 공개
- 관련 테이블: shows, performances (연결 영향 검사: seats_info, reservations)

**처리 규칙**

- 공연 존재를 먼저 확인한다.
- 해당 공연의 회차만 starts_at, perf_id 오름차순으로 조회하는 안이다.
- 공연이 없으면 404, 공연은 있고 회차가 없으면 200과 items: []를 반환한다.
- 회차 목록 조회는 좌석을 생성·선점하지 않는다.

**팀 확인 필요**

상태 허용값·초기값, 판매기간 경계, 공연 내 round_number 유일성, max_tickets_per_user의 고정/변경 정책을 합의한다. seats_info 생성 담당·시점과 좌석 구성 전 공개/판매 가능 여부를 좌석 담당과 결정한다. 페이징 필요 여부와 종료·취소 회차 노출을 확인한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: show_id: integer >0; query: date: string? (YYYY-MM-DD, starts_at의 Asia/Seoul 날짜 기준 제안)

**Body**

없음. URL 경로·쿼리로 조회/삭제 대상을 전달한다.

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| show_id | integer | Path 필수 | 101 | 회차를 찾을 소속 공연 ID. |
| date | string (date) | Query 선택 | 2026-11-07 | 한국 날짜 기준 필터 제안. |


### Response Field

**성공: HTTP 200**

```json
{
  "items": [
    {
      "perf_id": 201,
      "show_id": 101,
      "round_number": 1,
      "starts_at": "2026-11-07T19:00:00+09:00",
      "ends_at": "2026-11-07T21:00:00+09:00",
      "booking_opens_at": "2026-11-01T10:00:00+09:00",
      "booking_closes_at": "2026-11-07T18:00:00+09:00",
      "max_tickets_per_user": 3,
      "status": "SCHEDULED"
    }
  ]
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| items | array<공연 회차> | 필수 | 소속 공연의 회차 목록. 빈 배열 가능. |
| items[].perf_id | integer | 필수 | 공연 회차 식별값. 서버 생성. |
| items[].show_id | integer | 필수 | 소속 공연 식별값. 생성 시 경로에서 전달. |
| items[].round_number | integer | 필수 | 공연 안에서의 회차 번호. |
| items[].starts_at | string (date-time) | 필수 | 공연 시작 시각. |
| items[].ends_at | string (date-time) | 필수 | 공연 종료 시각. |
| items[].booking_opens_at | string (date-time) | 필수 | 예매 가능 시작 시각. |
| items[].booking_closes_at | string (date-time) | 필수 | 예매 가능 종료 시각. |
| items[].max_tickets_per_user | integer | 필수 | 회원별 회차 한도. DEFAULT 3은 고정 정책을 뜻하지 않음. |
| items[].status | string | 필수 | 회차 상태. SCHEDULED는 예시이며 확정 enum 아님. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 404 | 공연 없음 |
| 422 | 공연 ID/날짜 형식 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 404**

```json
{
  "detail": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 대상을 찾을 수 없습니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 404 | 공연 없음 |
| 422 | 공연 ID/날짜 형식 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## PERF-02 · 회차 상세 조회

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 회차 |
| 기능명 | 회차 상세 조회 |
| API Path | /v1/performances/{perf_id} |
| http method | GET |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json

path / query
path: perf_id: integer >0

body
없음
```

**응답 상세 속성**

```text
HTTP 200
header
- Content-Type: application/json

body
{
  "perf_id": 201,
  "show_id": 101,
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T18:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}

실패
404 회차 없음; 422 perf_id 형식·범위 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 회차 상세 조회
- API: `GET /v1/performances/{perf_id}`
- 인증·권한: 공개
- 관련 테이블: shows, performances (연결 영향 검사: seats_info, reservations)

**처리 규칙**

- perf_id로 회차를 조회하고 없으면 404를 반환하는 안이다.
- 회차 시간·판매기간·매수한도·상태를 반환한다.
- 현재 예시 응답은 seats_info의 좌석 그룹·수량·가격을 포함하지 않는다. 조인/별도 조회 여부는 좌석 담당과 맞춘다.

**팀 확인 필요**

상태 허용값·초기값, 판매기간 경계, 공연 내 round_number 유일성, max_tickets_per_user의 고정/변경 정책을 합의한다. seats_info 생성 담당·시점과 좌석 구성 전 공개/판매 가능 여부를 좌석 담당과 결정한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: perf_id: integer >0

**Body**

없음. URL 경로·쿼리로 조회/삭제 대상을 전달한다.

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| perf_id | integer | Path 필수 | 201 | 조회할 회차 ID. |


### Response Field

**성공: HTTP 200**

```json
{
  "perf_id": 201,
  "show_id": 101,
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T18:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| perf_id | integer | 필수 | 공연 회차 식별값. 서버 생성. |
| show_id | integer | 필수 | 소속 공연 식별값. 생성 시 경로에서 전달. |
| round_number | integer | 필수 | 공연 안에서의 회차 번호. |
| starts_at | string (date-time) | 필수 | 공연 시작 시각. |
| ends_at | string (date-time) | 필수 | 공연 종료 시각. |
| booking_opens_at | string (date-time) | 필수 | 예매 가능 시작 시각. |
| booking_closes_at | string (date-time) | 필수 | 예매 가능 종료 시각. |
| max_tickets_per_user | integer | 필수 | 회원별 회차 한도. DEFAULT 3은 고정 정책을 뜻하지 않음. |
| status | string | 필수 | 회차 상태. SCHEDULED는 예시이며 확정 enum 아님. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 404 | 회차 없음 |
| 422 | perf_id 형식·범위 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 404**

```json
{
  "detail": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 대상을 찾을 수 없습니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 404 | 회차 없음 |
| 422 | perf_id 형식·범위 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## PERF-03 · 회차 등록

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 회차 |
| 기능명 | 회차 등록 |
| API Path | /v1/shows/{show_id}/performances |
| http method | POST |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json
- Content-Type: application/json
- Authorization: Bearer <access_token>

path / query
path: show_id: integer >0

body
{
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T18:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}
```

**응답 상세 속성**

```text
HTTP 201
header
- Content-Type: application/json
- Location: /v1/performances/201

body
{
  "perf_id": 201,
  "show_id": 101,
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T18:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}

실패
401 인증 실패; 403 공연 회차 등록 권한 없음; 404 공연 없음; 409 공연 내 회차번호 중복; 422 시간·필수값·한도·상태·허용하지 않은 필드 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 회차 등록
- API: `POST /v1/shows/{show_id}/performances`
- 인증·권한: 로그인 + 역할·소유권 검사 제안. SELLER의 본인 공연과 ADMIN의 변경 범위는 팀 합의 전.
- 관련 테이블: shows, performances (연결 영향 검사: seats_info, reservations)

**처리 규칙**

- 공연 존재와 해당 공연을 변경할 권한을 검사한다.
- show_id는 경로에서, perf_id는 서버 생성으로 정한다.
- booking_opens_at < booking_closes_at <= starts_at < ends_at을 검증하는 안이다. 시간대가 포함된 시각을 받고 날짜 필터는 Asia/Seoul 기준으로 정하는 안이다.
- round_number의 공연 내 중복 금지와 한도 검증을 제안한다.
- 회차 생성과 seats_info 구성은 별도 처리 경계로 검토하며, 기존 stage_seats 복제/AVAILABLE 좌석 자동 생성은 전제하지 않는다.

**팀 확인 필요**

상태 허용값·초기값, 판매기간 경계, 공연 내 round_number 유일성, max_tickets_per_user의 고정/변경 정책을 합의한다. seats_info 생성 담당·시점과 좌석 구성 전 공개/판매 가능 여부를 좌석 담당과 결정한다. seats_info의 perf_id는 NOT NULL이며 회차 소속이다. 재사용 공연장 기본 그룹과 동일하다고 단정하지 않는다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 요청 | Authorization | Bearer <access_token> | 변경 권한·현재 사용자 검사를 위한 방식 제안 |
| 요청 | Content-Type | application/json | 요청 Body 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |
| 응답 | Location | /v1/performances/201 | 생성 자원 URI 제안 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: show_id: integer >0

**Body**

```json
{
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T18:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}
```

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| show_id | integer | Path 필수 | 101 | 소속 공연. 본문에서 중복 지정하지 않음. |
| round_number | integer | 필수 | 1 | NOT NULL. 양수·공연 안 유일성 검증 제안. |
| starts_at | string (date-time) | 필수 | 2026-11-07T19:00:00+09:00 | TIMESTAMPTZ. 시간대가 포함된 ISO 8601. |
| ends_at | string (date-time) | 필수 | 2026-11-07T21:00:00+09:00 | TIMESTAMPTZ. starts_at보다 뒤인지 검증 제안. |
| booking_opens_at | string (date-time) | 필수 | 2026-11-01T10:00:00+09:00 | TIMESTAMPTZ. 판매 시작 시각. |
| booking_closes_at | string (date-time) | 필수 | 2026-11-07T18:00:00+09:00 | TIMESTAMPTZ. opens < closes <= starts 조건은 제안. |
| max_tickets_per_user | integer | 선택·기본 3 | 3 | ERD DEFAULT 3. 고정 3매인지 회차별 변경 가능한지 합의 필요. 양수 검증 제안. |
| status | string | 현재 예시안에서는 필수 | SCHEDULED | NOT NULL VARCHAR(30), ERD 기본값 없음. 허용값·초기값·상태 전이는 미확정. 서버 초기값으로 바꾸면 생성 입력에서 제외. |

perf_id는 서버 생성, show_id는 생성 경로에서 결정한다. 본문에서 소속 공연을 바꾸지 않는다. status의 초기값·허용값은 합의 전이며 예시를 확정 정책으로 사용하지 않는다.

### Response Field

**성공: HTTP 201**

```json
{
  "perf_id": 201,
  "show_id": 101,
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T18:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| perf_id | integer | 필수 | 공연 회차 식별값. 서버 생성. |
| show_id | integer | 필수 | 소속 공연 식별값. 생성 시 경로에서 전달. |
| round_number | integer | 필수 | 공연 안에서의 회차 번호. |
| starts_at | string (date-time) | 필수 | 공연 시작 시각. |
| ends_at | string (date-time) | 필수 | 공연 종료 시각. |
| booking_opens_at | string (date-time) | 필수 | 예매 가능 시작 시각. |
| booking_closes_at | string (date-time) | 필수 | 예매 가능 종료 시각. |
| max_tickets_per_user | integer | 필수 | 회원별 회차 한도. DEFAULT 3은 고정 정책을 뜻하지 않음. |
| status | string | 필수 | 회차 상태. SCHEDULED는 예시이며 확정 enum 아님. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 201 | 생성 성공 |
| 401 | 인증 실패 |
| 403 | 공연 회차 등록 권한 없음 |
| 404 | 공연 없음 |
| 409 | 공연 내 회차번호 중복 |
| 422 | 시간·필수값·한도·상태·허용하지 않은 필드 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 401**

```json
{
  "detail": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "로그인이 필요합니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 401 | 인증 실패 |
| 403 | 공연 회차 등록 권한 없음 |
| 404 | 공연 없음 |
| 409 | 공연 내 회차번호 중복 |
| 422 | 시간·필수값·한도·상태·허용하지 않은 필드 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## PERF-04 · 회차 수정

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 회차 |
| 기능명 | 회차 수정 |
| API Path | /v1/performances/{perf_id} |
| http method | PATCH |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json
- Content-Type: application/json
- Authorization: Bearer <access_token>

path / query
path: perf_id: integer >0

body
{
  "booking_closes_at": "2026-11-07T17:00:00+09:00"
}
```

**응답 상세 속성**

```text
HTTP 200
header
- Content-Type: application/json

body
{
  "perf_id": 201,
  "show_id": 101,
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T17:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}

실패
401 인증 실패; 403 수정 권한 없음; 404 회차 없음; 409 회차번호 중복/판매·좌석·예매 영향으로 변경 불가; 422 시간·한도·상태·null·허용하지 않은 필드 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 회차 수정
- API: `PATCH /v1/performances/{perf_id}`
- 인증·권한: 로그인 + 역할·소유권 검사 제안. SELLER의 본인 공연과 ADMIN의 변경 범위는 팀 합의 전.
- 관련 테이블: shows, performances (연결 영향 검사: seats_info, reservations)

**처리 규칙**

- 회차와 소속 공연을 조회하여 변경 권한을 검사한다.
- 허용 필드를 기존 값에 병합한 뒤 시간순서·회차번호·한도·상태를 다시 검사한다.
- booking_opens_at < booking_closes_at <= starts_at < ends_at을 검증하는 안이다. 시간대가 포함된 시각을 받고 날짜 필터는 Asia/Seoul 기준으로 정하는 안이다.
- 판매·예매 시작 뒤 일정·한도를 바꾸는 범위는 합의 전이다. 이 초안에서는 연결 예매로 인한 위험한 변경을 409로 거절하는 안이다.
- show_id·perf_id 변경은 허용하지 않는다. CANCELED 등 상태 변경이 관련 주문 취소·환불을 자동 수행한다는 계약은 없다.

**팀 확인 필요**

상태 허용값·초기값, 판매기간 경계, 공연 내 round_number 유일성, max_tickets_per_user의 고정/변경 정책을 합의한다. seats_info 생성 담당·시점과 좌석 구성 전 공개/판매 가능 여부를 좌석 담당과 결정한다. 부분 수정에서 상태 변경을 허용할지, 별도 회차 취소 기능이 필요한지도 합의한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 요청 | Authorization | Bearer <access_token> | 변경 권한·현재 사용자 검사를 위한 방식 제안 |
| 요청 | Content-Type | application/json | 요청 Body 형식 |
| 응답 | Content-Type | application/json | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: perf_id: integer >0

**Body**

```json
{
  "booking_closes_at": "2026-11-07T17:00:00+09:00"
}
```

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| perf_id | integer | Path 필수 | 201 | 수정할 회차. |
| round_number | integer | 선택·최소 1개 | 1 | NOT NULL. 양수·공연 안 유일성 검증 제안. |
| starts_at | string (date-time) | 선택·최소 1개 | 2026-11-07T19:00:00+09:00 | TIMESTAMPTZ. 시간대가 포함된 ISO 8601. |
| ends_at | string (date-time) | 선택·최소 1개 | 2026-11-07T21:00:00+09:00 | TIMESTAMPTZ. starts_at보다 뒤인지 검증 제안. |
| booking_opens_at | string (date-time) | 선택·최소 1개 | 2026-11-01T10:00:00+09:00 | TIMESTAMPTZ. 판매 시작 시각. |
| booking_closes_at | string (date-time) | 선택·최소 1개 | 2026-11-07T18:00:00+09:00 | TIMESTAMPTZ. opens < closes <= starts 조건은 제안. |
| max_tickets_per_user | integer | 선택·최소 1개 | 3 | ERD DEFAULT 3. 고정 3매인지 회차별 변경 가능한지 합의 필요. 양수 검증 제안. |
| status | string | 선택·최소 1개 | SCHEDULED | NOT NULL VARCHAR(30), ERD 기본값 없음. 허용값·초기값·상태 전이는 미확정. 서버 초기값으로 바꾸면 생성 입력에서 제외. |

PATCH는 최소 하나의 허용 필드를 보낸다. 생략은 기존 값 유지, 선택 필드의 null은 비움, NOT NULL 필드의 null은 422로 거절하는 안이다. 변경 후 전체 객체의 규칙을 재검사한다.
perf_id는 서버 생성, show_id는 생성 경로에서 결정한다. 본문에서 소속 공연을 바꾸지 않는다. status의 초기값·허용값은 합의 전이며 예시를 확정 정책으로 사용하지 않는다.

### Response Field

**성공: HTTP 200**

```json
{
  "perf_id": 201,
  "show_id": 101,
  "round_number": 1,
  "starts_at": "2026-11-07T19:00:00+09:00",
  "ends_at": "2026-11-07T21:00:00+09:00",
  "booking_opens_at": "2026-11-01T10:00:00+09:00",
  "booking_closes_at": "2026-11-07T17:00:00+09:00",
  "max_tickets_per_user": 3,
  "status": "SCHEDULED"
}
```

| 필드 | 타입 | 제공 여부 | 의미 |
| --- | --- | --- | --- |
| perf_id | integer | 필수 | 공연 회차 식별값. 서버 생성. |
| show_id | integer | 필수 | 소속 공연 식별값. 생성 시 경로에서 전달. |
| round_number | integer | 필수 | 공연 안에서의 회차 번호. |
| starts_at | string (date-time) | 필수 | 공연 시작 시각. |
| ends_at | string (date-time) | 필수 | 공연 종료 시각. |
| booking_opens_at | string (date-time) | 필수 | 예매 가능 시작 시각. |
| booking_closes_at | string (date-time) | 필수 | 예매 가능 종료 시각. |
| max_tickets_per_user | integer | 필수 | 회원별 회차 한도. DEFAULT 3은 고정 정책을 뜻하지 않음. |
| status | string | 필수 | 회차 상태. SCHEDULED는 예시이며 확정 enum 아님. |


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 200 | 조회·수정 성공 |
| 401 | 인증 실패 |
| 403 | 수정 권한 없음 |
| 404 | 회차 없음 |
| 409 | 회차번호 중복/판매·좌석·예매 영향으로 변경 불가 |
| 422 | 시간·한도·상태·null·허용하지 않은 필드 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 401**

```json
{
  "detail": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "로그인이 필요합니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 401 | 인증 실패 |
| 403 | 수정 권한 없음 |
| 404 | 회차 없음 |
| 409 | 회차번호 중복/판매·좌석·예매 영향으로 변경 불가 |
| 422 | 시간·한도·상태·null·허용하지 않은 필드 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---

## PERF-05 · 회차 삭제 (범위 검토)

| 속성 | 입력할 값 |
| --- | --- |
| 명세 작성 현황 | 검토용 초안 |
| 기능 분류 | 공연 회차 |
| 기능명 | 회차 삭제 (범위 검토) |
| API Path | /v1/performances/{perf_id} |
| http method | DELETE |
| 담당자 | 공연·공연 회차 담당 |
| 테스트 여부 | 미선택 |

**요청 상세 속성**

```text
header
- Accept: application/json
- Authorization: Bearer <access_token>

path / query
path: perf_id: integer >0

body
없음
```

**응답 상세 속성**

```text
HTTP 204
header
없음

body
없음

실패
401 인증 실패; 403 삭제 권한 없음; 404 회차 없음; 409 연결 좌석정보/예매 존재; 422 perf_id 형식·범위 오류
```

**기능명 페이지 본문**

### Description

**검토용 초안 / 구현·실제 테스트 미실시**

- 기능: 회차 삭제 (범위 검토)
- API: `DELETE /v1/performances/{perf_id}`
- 인증·권한: 로그인 + 역할·소유권 검사 제안. SELLER의 본인 공연과 ADMIN의 변경 범위는 팀 합의 전.
- 관련 테이블: shows, performances (연결 영향 검사: seats_info, reservations)

**처리 규칙**

- 삭제 기능 자체를 이번 구현 범위에 포함할지 검토한다.
- 회차 존재와 소속 공연의 변경 권한을 확인한다.
- 연결 seats_info·예매가 없는 경우만 물리 삭제하는 안이다. 연결이 있으면 409로 거절한다.
- 연결 주문의 취소·환불이나 좌석 연쇄 삭제를 이 요청에 자동 포함하지 않는다.

**팀 확인 필요**

상태 허용값·초기값, 판매기간 경계, 공연 내 round_number 유일성, max_tickets_per_user의 고정/변경 정책을 합의한다. seats_info 생성 담당·시점과 좌석 구성 전 공개/판매 가능 여부를 좌석 담당과 결정한다. 판매 종료 후 삭제가 필요한지, 이력 보존·취소 상태로 관리할지 합의한다.

API 공통 접두사는 `/v1`이다. 인증 전달·오류 본문은 팀 공통 계약에 맞춰 통일한다. 이 문서의 Method·Path·검증·상태 규칙은 기능 검토안이며 DB 제약·서버 구현·HTTP 시험 완료를 뜻하지 않는다. 삭제는 주문 취소·환불과 구분하며, 자동 연쇄 삭제를 전제하지 않는다.

### Header

| 구분 | 이름 | 값 | 설명 |
| --- | --- | --- | --- |
| 요청 | Accept | application/json | 수신할 응답 형식 |
| 요청 | Authorization | Bearer <access_token> | 변경 권한·현재 사용자 검사를 위한 방식 제안 |
| 응답 | Content-Type | 없음 | 204는 본문 없음 |

실제 HTTP 헤더는 JSON 객체가 아니라 `이름: 값` 형태로 전달한다. 공개 GET 요청은 인증 헤더 없이 조회하는 안이다.

### Request Body

**Path / Query**

path: perf_id: integer >0

**Body**

없음. URL 경로·쿼리로 조회/삭제 대상을 전달한다.

| 필드 | 타입 | 필수 여부 | 예시 | 설명·검증 |
| --- | --- | --- | --- | --- |
| perf_id | integer | Path 필수 | 201 | 삭제할 회차 ID. |


### Response Field

**성공: HTTP 204**

Body 없음. Content-Type도 지정하지 않는 안이다.


### Response Code

| HTTP | 의미·반환 조건 |
| --- | --- |
| 204 | 삭제 성공, 응답 본문 없음 |
| 401 | 인증 실패 |
| 403 | 삭제 권한 없음 |
| 404 | 회차 없음 |
| 409 | 연결 좌석정보/예매 존재 |
| 422 | perf_id 형식·범위 오류 |

HTTP 상태 코드는 초안 제안이다. 204 성공에는 JSON 본문을 반환하지 않는다.

### ERROR

**실패 응답 예시: HTTP 401**

```json
{
  "detail": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "로그인이 필요합니다."
  }
}
```

| HTTP | 이 API에서 확인할 실패 원인 |
| --- | --- |
| 401 | 인증 실패 |
| 403 | 삭제 권한 없음 |
| 404 | 회차 없음 |
| 409 | 연결 좌석정보/예매 존재 |
| 422 | perf_id 형식·범위 오류 |

오류 본문 객체와 code 이름은 제안이며 팀 공통 목록으로 확정한다. 입력 검증 오류를 FastAPI 기본 detail 배열로 유지할지, 공통 객체로 정규화할지 합의가 필요하다. 내부 SQL·비밀번호 해시·실제 토큰 값은 오류 본문에 노출하지 않는다.

---
