# Supabase API·SDK·Auth 학습 노트

- 학습 날짜: 2026-09-09
- Level / Week: LV.2 / Week 6
- 실제 학습 범위: DDL·DML, 트랜잭션·ACID, API·API 문서·SDK, Supabase Python 조회와 인증
- 근거: 당일 대화에서 확인된 질문·오류와 당일 2장·3장 예습 노트
- 상태: 개념 설명과 오류 원인 분석 완료. 수정 코드의 재실행 성공은 확인되지 않음.

## 1. DDL과 DML

### DDL

DDL(Data Definition Language)은 데이터베이스의 **구조**를 정의하거나 변경한다.

```sql
CREATE TABLE document (
    category TEXT
);
```

위 예시는 `document`라는 테이블과 `category`라는 `TEXT` 컬럼을 만드는 작업이므로 DDL이다.

대표 명령:

- `CREATE`: 테이블 등 객체 생성
- `ALTER`: 기존 객체 구조 변경
- `DROP`: 객체 삭제

### DML

DML(Data Manipulation Language)은 테이블 안의 **데이터**를 생성·조회·수정·삭제한다.

```sql
INSERT INTO document (category) VALUES ('database');
SELECT category FROM document;
UPDATE document SET category = 'supabase';
DELETE FROM document WHERE category = 'supabase';
```

핵심 구분:

```text
DDL = 그릇의 구조를 만든다.
DML = 그릇 안의 데이터를 다룬다.
```

## 2. 트랜잭션과 ACID

트랜잭션은 여러 데이터 변경을 **하나의 작업 단위**로 묶는 것이다.

```sql
BEGIN;

-- 함께 성공해야 하는 여러 DML

COMMIT;
-- 또는 COMMIT 전에 ROLLBACK;
```

- `COMMIT`: 지금까지의 변경을 확정한다.
- `ROLLBACK`: 현재 트랜잭션의 확정되지 않은 변경을 취소한다.
- 일반적인 `ROLLBACK`으로 취소할 수 있는 것은 `COMMIT` 전의 변경이다.
- 이미 `COMMIT`한 변경을 되돌리려면 반대 작업을 수행하는 별도 보상 트랜잭션 등이 필요하다.

ACID는 신뢰할 수 있는 트랜잭션의 네 가지 성질이다.

| 성질 | 의미 |
|---|---|
| Atomicity, 원자성 | 전부 성공하거나 전부 취소된다. |
| Consistency, 일관성 | 제약조건과 데이터 규칙이 유지된다. |
| Isolation, 격리성 | 동시에 실행되는 트랜잭션이 서로 함부로 간섭하지 않는다. |
| Durability, 지속성 | `COMMIT`된 결과가 보존된다. |

`ROLLBACK`은 ACID 전체가 아니라, 실패한 작업을 취소해 원자성을 지키는 데 사용되는 명령이다.

## 3. API·API 문서·SDK

### API

API는 한 프로그램이 다른 프로그램의 기능이나 데이터에 접근하기 위한 **요청·응답 규칙과 통로**다.

### API 문서

API 문서는 개발자가 요청을 올바르게 만들 수 있도록 다음 정보를 제공한다.

- 사용할 메서드와 함수 이름
- 필요한 인자와 데이터 형식
- 인증 방식
- 요청 예제
- 반환값
- 오류와 제한 사항

강사가 공식 문서의 코드를 가져다 쓰는 이유는 메서드 이름과 입력 구조를 기억에 의존하지 않고, 현재 SDK가 요구하는 공식 사용법을 확인하기 위해서다. 예제는 그대로 끝내는 정답이라기보다, 테이블명·컬럼명·필터·인증값을 현재 프로젝트에 맞게 바꾸는 출발점이다.

### SDK

SDK(Software Development Kit)는 API 요청을 언어별 메서드로 편리하게 작성하도록 도와주는 개발 도구 모음이다.

```text
Python 코드
→ Supabase Python SDK
→ Supabase API
→ PostgreSQL
→ 응답 객체
```

SDK는 데이터베이스도 아니고 데이터를 저장하는 장소도 아니다. 개발자 코드와 API 사이의 통신을 편리하게 감싼 도구다.

## 4. Supabase Python 요청 흐름

```python
response = (
    supabase.table("documents")
    .select("id,title,content,users(id,email)")
    .execute()
)

rows = response.data
```

각 단계의 역할:

1. `.table("documents")`: 요청 대상 테이블 선택
2. `.select(...)`: 반환받을 컬럼과 참조 테이블 지정
3. `.execute()`: 구성한 요청을 실제로 전송
4. `response.data`: 반환된 행 데이터 확인

`users(id,email)` 같은 표현은 외래 키 관계가 설정된 참조 테이블의 컬럼을 함께 조회하는 문법이다. 실제로 동작하려면 Supabase가 인식할 수 있는 외래 키 관계가 존재해야 한다.

## 5. Supabase 인증 흐름

이메일과 비밀번호 로그인에 사용하는 현재 Python SDK 메서드는 다음과 같다.

```python
response = supabase.auth.sign_in_with_password({
    "email": "<email>",
    "password": "<password>",
})

user = response.user
```

- `user`: 로그인한 사용자의 ID·이메일 등 사용자 정보
- `session`: 로그인 상태를 유지하는 인증 세션과 토큰 정보
- 실제 비밀번호와 세션 토큰은 학습 노트나 공개 저장소에 기록하지 않는다.

## 6. 핵심 관계

```text
DDL로 테이블 구조 정의
→ DML로 데이터 처리
→ 트랜잭션으로 여러 변경 보호
→ API로 외부 프로그램이 데이터 기능 요청
→ SDK로 API 요청을 Python 메서드로 표현
→ Auth로 사용자 식별
→ RLS로 사용자별 행 접근을 데이터베이스에서 강제
```

## 공식 참고 자료

- [Supabase Python select](https://supabase.com/docs/reference/python/select)
- [Supabase Python sign in with password](https://supabase.com/docs/reference/python/auth-signinwithpassword)

## 다음 확인 항목

- 실제 프로젝트의 테이블명이 `document`인지 `documents`인지 Dashboard에서 확인한다.
- `documents`와 `users` 사이의 외래 키 관계가 실제로 설정되어 있는지 확인한다.
- 수정한 조회·로그인 코드를 다시 실행하고 반환 자료형을 확인한다.
- 인증 사용자의 `user.id`와 문서의 `user_id` 연결 및 RLS 동작은 아직 확인되지 않았다.

[← Week 6](../README.md)
