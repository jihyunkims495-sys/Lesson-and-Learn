# Supabase SDK·Auth·RLS·사용자별 CRUD — 3장 1강~8강 예습

- 학습 날짜: 2026-09-10
- Level / Week: LV.2 / Week 6
- 교안 범위: 3장 1강~8강, PDF 8개 전체 18페이지
- 상태: 실제 교안을 바탕으로 작성한 예습 노트. 수업·SDK 실행·연결 성공·이해도 확인 결과가 아니다.

## 오늘 학습 목표

1. Supabase Database, 자동 생성 REST API, SDK의 역할을 구분한다.
2. 환경변수를 불러온 뒤 Supabase Client를 초기화하는 순서를 설명한다.
3. SQL CRUD를 Python SDK의 `insert`, `select`, `update`, `delete` 호출과 연결한다.
4. Authentication의 `user.id`를 문서의 `user_id`와 연결한다.
5. 코드의 사용자 필터와 데이터베이스의 RLS 정책이 왜 함께 필요한지 설명한다.
6. 인증된 사용자의 문서 CRUD를 함수로 나누고 하나의 미니 앱 흐름으로 설계한다.

## 전체 구조와 선후 관계

```text
PostgreSQL Database
→ 테이블 기반 REST API 자동 생성
→ SDK로 API 요청 표현
→ .env와 Client로 연결 준비
→ insert / select / update / delete 구현
→ Auth로 로그인 사용자 식별
→ user.id와 documents.user_id 연결
→ RLS로 행 단위 접근 강제
→ 사용자별 문서 CRUD 미니 앱 통합
```

2장의 SQL이 데이터베이스에 직접 내리는 명령이었다면, 3장은 애플리케이션 코드가 SDK를 통해 같은 데이터 작업을 요청하는 과정이다.

## 선행 개념

- 테이블, 행, 열과 기본 키·외래 키
- `NOT NULL`, 기본값 등 제약조건
- SQL의 `INSERT`, `SELECT`, `UPDATE`, `DELETE`
- `WHERE` 조건 없이 수정·삭제할 때의 위험
- Python 함수, 매개변수, 딕셔너리, 리스트, 반복문, `try/except`
- 환경변수와 `.gitignore`의 역할

## 2장 SQL과 3장 SDK의 연결

| 2장의 SQL 개념 | 3장의 SDK 표현 | 공통 확인 항목 |
|---|---|---|
| `INSERT INTO documents ...` | `.table("documents").insert({...}).execute()` | 입력 키, DB 컬럼, 제약조건, 생성 결과 |
| `SELECT ... WHERE ...` | `.select(...).eq(...).execute()` | 출력 컬럼, 필터 조건, 빈 결과 |
| `ORDER BY`, `LIMIT` | `.order(...)`, `.limit(...)` | 정렬 방향, 반환 개수 |
| `UPDATE ... WHERE ...` | `.update({...}).eq(...).execute()` | 변경값, 대상 행 조건 |
| `DELETE ... WHERE ...` | `.delete().eq(...).execute()` | 삭제 대상, 사후 검증 |
| 사용자 ID·외래 키 | Auth의 `user.id`를 `user_id`에 저장 | 데이터 소유자 |
| 권한 규칙 | RLS의 `auth.uid() = user_id` | 서버에서 강제하는 행 접근 범위 |

공통 안전 원칙은 조건 없이 수정·삭제하지 않고, 요청 뒤 실제 결과를 다시 확인하는 것이다.

## 강의별 예습 지도

| 강 | 주제 | 교안의 핵심 흐름 | 수업 전 확인 질문 |
|---|---|---|---|
| 1강 | Database·API·SDK 구조 | SDK 함수 → REST API → 키·권한 확인 → PostgreSQL → 응답 | SDK는 DB인가, DB를 호출하는 도구인가? |
| 2강 | SDK 환경과 연결 테스트 | 패키지 설치 → `.env` 로드 → Client 생성 → 가벼운 SELECT | `load_dotenv()`가 Client 생성보다 먼저인 이유는? |
| 3강 | SDK 데이터 생성 | 입력 딕셔너리 → 컬럼 매핑 → `insert` → `execute` → `response.data` | 딕셔너리 키가 컬럼명과 다르면 무엇이 실패할까? |
| 4강 | SDK 데이터 조회 | `select` → `eq` → `order` → `limit` → 리스트 처리 | 빈 리스트와 오류는 어떻게 구분할까? |
| 5강 | SDK 수정·삭제 | 대상 조건 → `update`/`delete` → 사후 SELECT | `.eq(...)`를 빠뜨리면 어떤 범위가 영향을 받을까? |
| 6강 | Supabase Authentication | 가입 → 로그인 → session/user 확인 → `user.id` 연결 → 로그아웃 | session과 user는 각각 무엇을 담을까? |
| 7강 | 사용자별 접근과 RLS | 코드 필터 → RLS 활성화 → CRUD 정책 → 사용자별 접근 비교 | 코드 필터만으로 보안이 완성되지 않는 이유는? |
| 8강 | 사용자별 문서 CRUD 미니 앱 | 인증 확인 → 생성 → 조회 → 수정 → 삭제 → 오류 처리 → README | 네 CRUD 함수를 어떤 입력·출력으로 나눌까? |

## 1. Database, API, SDK, Client의 역할

- Database: PostgreSQL 테이블과 데이터가 실제로 저장되는 곳이다.
- REST API: 앱이 데이터 생성·조회·수정·삭제를 요청하는 통로다.
- SDK: URL과 헤더를 직접 조립하는 대신 언어별 메서드로 API를 호출하게 해 주는 도구다.
- Client: Project URL과 API key로 초기화하며, 이후 SDK 요청이 나가는 재사용 가능한 진입점이다.

```text
Python 코드
→ Supabase SDK 메서드 호출
→ SDK가 REST API 요청 생성
→ Supabase가 키·세션·RLS 정책 확인
→ PostgreSQL이 허용된 데이터 작업 수행
→ 응답 객체 반환
→ response.data 확인
```

SDK는 데이터베이스 자체도, 데이터를 저장하는 곳도 아니다. 개발자 코드와 Supabase API 사이의 통신을 감싸는 도구다.

## 2. 연결 정보와 Client 초기화

교안의 Python 환경 구성 순서:

```text
프로젝트·가상환경 준비
→ supabase와 python-dotenv 설치
→ .env 작성
→ .gitignore에 .env 추가
→ load_dotenv()
→ 환경변수 읽기
→ create_client(url, key)
→ 가벼운 SELECT로 연결 확인
```

예습용 구조:

```python
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_PUBLISHABLE_KEY")

# 수업에서는 url과 key가 None이 아닌지 먼저 검사한다.
supabase: Client = create_client(url, key)
```

보안 체크:

- `.env`는 Git에 커밋하지 않는다.
- 실제 키·세션 토큰·비밀번호를 출력 결과나 학습 노트에 복사하지 않는다.
- 공개 클라이언트에는 Publishable key를 사용하고 RLS와 최소 권한을 함께 설계한다.
- Secret key와 레거시 `service_role` key는 RLS를 우회하므로 공개 코드나 클라이언트에 넣지 않는다.
- Auth 응답 전체 대신 필요한 성공 여부나 `user.id`만 선택적으로 확인한다.

## 3. SDK 요청의 공통 문법

### 생성

```python
response = (
    supabase.table("documents")
    .insert({
        "title": title,
        "content": content,
        "user_id": user_id,
    })
    .execute()
)
```

- 딕셔너리 키는 DB 컬럼명과 일치해야 한다.
- `execute()` 전에는 요청을 구성하고, `execute()`에서 실제 요청을 보낸다.
- 성공한 `response.data`에는 DB가 만든 `id`, `created_at`, 기본 상태값 등이 포함될 수 있다.
- `NOT NULL` 같은 제약조건 위반은 오류로 처리하고 입력 검증과 `try/except`를 함께 고려한다.

### 조회

```python
response = (
    supabase.table("documents")
    .select("id,title,status,created_at")
    .eq("user_id", user_id)
    .order("created_at", desc=True)
    .limit(10)
    .execute()
)
```

- 여러 행의 조회 결과는 `response.data` 리스트로 다룬다.
- 각 행은 컬럼명을 키로 갖는 딕셔너리처럼 접근한다.
- `[]`는 조건에 맞는 행이 없다는 정상 응답일 수 있다.
- 예외가 발생한 연결·권한·요청 오류와 빈 결과를 구분한다.

### 수정과 삭제

```python
updated = (
    supabase.table("documents")
    .update({"status": new_status})
    .eq("id", doc_id)
    .execute()
)

deleted = (
    supabase.table("documents")
    .delete()
    .eq("id", doc_id)
    .execute()
)
```

- 변경 대상 조건을 먼저 설계하고 코드에서 `.eq(...)`가 있는지 확인한다.
- `id` 조건만 믿지 않고 Auth와 RLS로 현재 사용자의 소유권도 강제한다.
- 실행 뒤 같은 ID를 다시 조회해 수정값 또는 행 부재를 검증한다.
- 존재하지 않거나 접근할 수 없는 대상은 빈 결과로 보일 수 있으므로 오류와 구분한다.

## 4. Authentication과 데이터 소유자

```text
sign_up
→ 이메일 확인 정책 확인
→ sign_in_with_password
→ session과 user 확인
→ user.id를 documents.user_id에 연결
→ 기능 사용
→ sign_out
```

- `user`: 사용자 ID와 이메일 등 사용자 정보를 담는다.
- `session`: 로그인 상태를 유지하는 인증 토큰 정보를 담는다.
- `user.id`: 로그인 사용자를 식별하는 UUID이며 데이터 소유자 연결에 사용한다.
- 로그인되지 않았다면 사용자별 CRUD를 시작하지 않고 인증 상태를 먼저 확인한다.
- 가입 직후 session이 생기는지는 프로젝트의 이메일 확인 설정에 따라 달라질 수 있다.

## 5. 코드 필터와 RLS의 차이

앱 코드의 다음 조건은 정상적인 실행 흐름에서 본인 문서만 요청하도록 돕는다.

```python
.eq("user_id", user.id)
```

하지만 요청자가 이 조건을 제거하거나 다른 API 클라이언트를 사용하면 코드 필터만으로는 접근을 막을 수 없다. RLS는 데이터베이스가 모든 요청에 정책을 적용하게 한다.

교안의 핵심 조건:

```sql
auth.uid() = user_id
```

- `auth.uid()`: 현재 인증된 요청 사용자의 ID
- `user_id`: 접근하려는 문서 행의 소유자 ID
- 두 값이 같을 때만 해당 행을 허용한다.
- 공식 문서는 의도를 분명히 하기 위해 `auth.uid() IS NOT NULL`을 함께 쓰는 형태도 권장한다.

### `USING`과 `WITH CHECK`

| 검사 | 확인 시점 | 대표 작업 |
|---|---|---|
| `USING` | 이미 존재하는 행을 대상으로 삼을 수 있는가 | SELECT, UPDATE, DELETE |
| `WITH CHECK` | 새로 저장되거나 수정된 행의 값이 허용되는가 | INSERT, UPDATE |

RLS를 활성화하고 SELECT 정책만 만들면 INSERT·UPDATE·DELETE가 자동 허용되는 것이 아니다. 필요한 작업별 정책과 역할의 table grant를 함께 확인한다.

## 6. 교안 스키마에서 주의할 점

3장 예시는 다음 형태의 `documents` 테이블을 사용한다.

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  user_id uuid,
  status text default 'draft',
  created_at timestamptz default now()
);
```

수업 전에 확인할 것:

1. 현재 `documents.id`의 실제 자료형과 기본값
2. 현재 `documents.user_id`의 실제 자료형
3. Auth의 `user.id`와 `documents.user_id`가 같은 UUID 계열인지
4. `user_id`의 외래 키 연결 여부
5. RLS 활성화 여부, 정책 대상 역할, CRUD별 `USING`·`WITH CHECK`

예제 UUID는 구조를 보여 주기 위한 값이다. 실제 실행에서는 로그인 응답과 DB가 생성한 ID를 사용한다.

## 7. 사용자별 CRUD 미니 앱 설계

완성 코드를 복사하기 전에 함수의 입력·출력과 보호 조건을 정한다.

| 함수 | 입력 후보 | 출력·확인 | 보호 조건 |
|---|---|---|---|
| `create_document` | title, content, 현재 user ID | 생성된 행 | 로그인, 필수값, 본인 `user_id` |
| `get_documents` | 현재 user ID | 본인 문서 리스트 | 사용자 필터, RLS |
| `update_document_status` | doc ID, 새 status | 변경된 행 또는 대상 없음 | 본인 문서, 허용 상태값 |
| `delete_document` | doc ID | 삭제 결과 또는 대상 없음 | 본인 문서, 삭제 전 대상 확인 |

권장 실행 흐름:

```text
환경변수 검증
→ Client 초기화
→ 로그인 상태 확인
→ 현재 user.id 확보
→ 문서 생성
→ 본인 문서 조회
→ 방금 생성한 문서 ID 확보
→ 상태 수정과 검증
→ 삭제와 검증
→ 오류·빈 결과 구분
```

## 예상 난점

1. Database, API, SDK, Client를 같은 것으로 생각하기
2. `.execute()` 전후의 요청 구성과 실제 전송을 구분하지 못하기
3. `response.data == []`를 무조건 연결 오류로 판단하기
4. 딕셔너리 키와 DB 컬럼명이 어긋나기
5. 수정·삭제에 `.eq(...)` 조건을 누락하기
6. 예제 UUID를 실제 데이터 ID처럼 재사용하기
7. session과 user 객체의 역할을 혼동하기
8. 코드의 사용자 필터만 믿고 RLS를 생략하기
9. RLS의 `USING`과 `WITH CHECK` 검사 시점을 혼동하기
10. RLS 정책과 table grant의 역할을 구분하지 못하기
11. 로그인 여부를 확인하기 전에 `user.id`를 사용하기
12. Auth 응답 전체를 출력해 토큰을 로그에 노출하기

## 예정 실습 체크리스트

- [ ] 3장 예시와 현재 DB 스키마의 ID 자료형을 대조한다.
- [ ] 격리된 프로젝트 환경에 SDK와 dotenv를 설치한다.
- [ ] `.env`가 `.gitignore`에 포함됐는지 확인한다.
- [ ] 환경변수 누락을 확인한 뒤 Client를 초기화한다.
- [ ] 가벼운 SELECT의 성공·빈 결과·오류를 구분한다.
- [ ] 입력값과 DB 컬럼을 표로 매핑한 뒤 문서를 생성한다.
- [ ] 사용자별 조회에 필터·정렬·개수 제한을 적용한다.
- [ ] 수정·삭제 전후 같은 문서를 다시 조회한다.
- [ ] 가입·로그인·사용자 확인·로그아웃 흐름을 실행한다.
- [ ] 현재 `user.id`를 문서 `user_id`에 연결한다.
- [ ] RLS와 table grant를 확인한다.
- [ ] 다른 사용자의 접근이 실제로 차단되는지 비교한다.
- [ ] 네 CRUD 함수를 하나의 실행 흐름으로 통합한다.
- [ ] README에 설치·환경변수 이름·실행 명령을 적되 실제 값은 넣지 않는다.

## 수업 전 확인 질문

정답은 학습 세션에서 한 문제씩 확인한다.

1. SDK 한 줄이 실제 데이터에 도달할 때 Database, API, SDK는 각각 무슨 역할을 하는가?
2. `.env` 값을 읽기 전에 Client를 만들면 어떤 값이 누락될 수 있는가?
3. `insert` 딕셔너리의 키가 DB 컬럼과 같아야 하는 이유는 무엇인가?
4. 조회 결과 `[]`와 예외 발생은 어떻게 다른가?
5. update/delete 요청에 조건과 사후 검증이 모두 필요한 이유는 무엇인가?
6. 로그인 결과의 session과 user는 각각 무엇에 사용하는가?
7. 앱 코드에 사용자 필터가 있어도 RLS가 필요한 이유는 무엇인가?
8. `USING`과 `WITH CHECK`는 기존 행과 새 값을 각각 언제 검사하는가?
9. RLS 정책과 table grant는 각각 어떤 권한을 결정하는가?
10. 사용자별 문서 CRUD 앱에서 기능 실행 전에 가장 먼저 검사할 상태는 무엇인가?

## 교안 사실과 코치 보충의 구분

### 교안에서 확인한 사실

- Supabase는 PostgreSQL 테이블을 기반으로 REST API를 자동 제공하고, SDK는 이 API 호출을 언어별 메서드로 감싼다.
- Python 예시는 `supabase`, `python-dotenv`, `.env`, `create_client`로 연결을 구성한다.
- CRUD 결과는 `response.data`로 다루며, 조회의 빈 리스트와 오류를 구분한다.
- Authentication으로 가입·로그인·로그아웃과 session/user를 다루고 `user.id`를 문서 소유자와 연결한다.
- 사용자별 코드 필터만으로는 충분하지 않으며 RLS가 행 단위 접근을 데이터베이스에서 강제한다.
- 마지막 과제는 사용자별 문서 CRUD 함수를 하나의 실행 파일로 통합하고 README에 실행법을 남기는 것이다.

### 공식 문서로 보충한 현재 확인 사항

- Python Client는 Project URL과 key를 `create_client()`에 전달해 초기화한다.
- 2026년 공식 키 체계는 공개 클라이언트용 Publishable key와 서버 전용 Secret key를 중심으로 안내한다. 교안의 `service role`은 레거시 고권한 키 명칭이며 Secret key와 마찬가지로 RLS를 우회하므로 외부에 노출하지 않는다.
- RLS는 table grant를 대신하지 않는다. 역할이 작업 자체를 수행할 수 있는지는 grant가, 어떤 행을 대상으로 할 수 있는지는 policy가 결정한다.
- 인증되지 않은 요청의 `auth.uid()`는 `NULL`이므로, 정책 의도를 명확히 하려면 `auth.uid() IS NOT NULL`을 함께 검사할 수 있다.

공식 참고:

- [Python Client 초기화](https://supabase.com/docs/reference/python/initializing)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [데이터 접근 보안](https://supabase.com/docs/guides/database/secure-data)

### 코치가 보충한 학습 전략

- 2장 SQL과 3장 SDK 메서드를 한 줄씩 대응시켜 같은 데이터 작업임을 추적한다.
- SDK 호출 전 `대상 테이블 → 입력값 → 조건 → 예상 결과 → 검증 방법`을 먼저 적는다.
- ID를 예시 숫자나 UUID 문자열로 암기하지 않고 현재 스키마의 자료형과 실제 생성값을 확인한다.
- Auth 응답은 필요한 필드만 확인하고 토큰·키·비밀번호를 로그와 학습 기록에서 제외한다.
- 기능 성공뿐 아니라 다른 사용자의 요청이 실제로 차단되는지도 확인한다.

## 원본 교안과 확인 범위

| 강 | 원본 | 확인 범위 |
|---|---|---|
| 1강 | Supabase Database, API, SDK 구조 | 전체 3페이지: 역할, 자동 API, 키, 요청 흐름, 환경 준비 |
| 2강 | SDK 개발 환경 구성과 연결 테스트 | 전체 2페이지: 설치, 환경변수, Client, 연결 확인 |
| 3강 | SDK 기반 데이터 생성 구현 | 전체 2페이지: insert, 컬럼 매핑, 응답, 오류 |
| 4강 | SDK 기반 데이터 조회 구현 | 전체 2페이지: select, 필터, 정렬, 리스트, 빈 결과 |
| 5강 | SDK 기반 데이터 수정·삭제 구현 | 전체 2페이지: update, delete, 조건, 검증 |
| 6강 | Supabase Authentication 기본 흐름 | 전체 2페이지: 가입, 로그인, 세션, 사용자, 로그아웃 |
| 7강 | 사용자별 데이터 접근과 권한 관리 | 전체 3페이지: user_id 필터, RLS, CRUD 정책 |
| 8강 | 사용자별 문서 CRUD 미니 과제 | 전체 2페이지: 함수 분리, Auth 연결, 통합, README |

## 실행·검증 상태

- 8개 PDF의 전체 18페이지를 텍스트로 추출하고 모든 페이지를 렌더링해 제목·본문·표·코드·실습 절을 확인했다.
- 교안의 예시 이메일·UUID·응답값은 실제 자격 증명이나 오늘 실행 결과로 취급하지 않았다.
- 이 문서의 코드 조각은 구조 이해용이며 로컬 Python이나 실제 Supabase 프로젝트에서 실행하지 않았다.
- 패키지 버전, Dashboard 메뉴, 이메일 확인 설정, 실제 스키마·grant·RLS 정책·연결 성공 여부는 수업 환경에서 확인해야 한다.

[← Week 6](../README.md)
