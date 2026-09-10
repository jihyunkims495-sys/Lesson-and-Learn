# TIL — 데이터베이스 명령에서 Supabase SDK까지

- 날짜: 2026-09-09
- Level / Week: LV.2 / Week 6

## 오늘 배운 핵심

데이터베이스를 사용하는 Python 코드를 이해하려면 Database, API, SDK를 한 덩어리로 보지 않고 각 역할을 구분해야 한다.

```text
Database = 데이터가 실제로 저장되는 곳
API = 다른 프로그램이 기능과 데이터를 요청하는 규칙과 통로
SDK = API 요청을 Python 메서드로 편리하게 작성하게 해 주는 도구
```

DDL과 DML도 같은 기준으로 구분할 수 있었다.

```text
DDL = 테이블·컬럼 같은 구조 정의
DML = 구조 안의 데이터 생성·조회·수정·삭제
```

여러 DML이 함께 성공해야 한다면 트랜잭션으로 묶는다. `COMMIT`은 변경을 확정하고, 일반적인 `ROLLBACK`은 `COMMIT` 전의 변경을 취소한다. ACID는 트랜잭션이 신뢰할 수 있기 위한 원자성·일관성·격리성·지속성이다.

## 생각이 바뀐 부분

공식 API 문서의 코드를 복사하는 것은 단순 암기가 아니라, 현재 버전에서 정확한 메서드 이름·입력 형식·반환값을 확인하는 개발 과정이다. 예제 코드를 가져온 뒤 현재 프로젝트의 테이블명과 컬럼명에 맞게 수정해야 한다.

또한 ImportError나 AttributeError 같은 오류가 항상 패키지 미설치를 의미하지 않는다. 객체가 만들어진 뒤 특정 메서드가 없다는 오류라면 먼저 메서드 이름과 설치 버전의 공식 인터페이스를 확인해야 한다.

## 실제 오류에서 배운 점

### 테이블명은 정확히 일치해야 한다

`public.document`를 찾지 못하고 `public.documents`를 제안한 `PGRST205` 오류를 통해, 코드의 테이블 이름과 실제 Supabase 스키마가 일치해야 한다는 점을 확인했다.

### SDK 메서드 이름은 공식 문서에서 확인한다

`sign_in_with_email_and_password`는 현재 객체에 없는 메서드였고, 공식 Python 인터페이스는 `sign_in_with_password`를 사용한다.

## 아직 확인하지 못한 것

- 테이블명을 확인하고 수정한 조회 요청의 성공 여부
- `users(id,email)` 참조 조회에 필요한 외래 키 관계
- `sign_in_with_password` 수정 후 실제 로그인 성공 여부
- `response.user`와 `response.session`의 실제 반환 내용
- 사용자 ID와 문서 `user_id`, RLS 정책의 연결

## 다음 학습에서 확인할 순서

1. 실제 프로젝트와 테이블명을 확인한다.
2. 가장 단순한 `.select("*").execute()`로 연결을 검증한다.
3. 참조 테이블 조회를 추가한다.
4. 공식 Auth 메서드로 로그인한다.
5. 로그인 사용자의 ID를 문서 소유자와 연결한다.
6. 다른 사용자의 데이터가 RLS로 차단되는지 확인한다.

[Learning Notes](./02-learning-notes-03-supabase-api-sdk-auth.md) · [Practice](./03-practice-03-supabase-python-error-analysis.md) · [← Week 6](../README.md)
