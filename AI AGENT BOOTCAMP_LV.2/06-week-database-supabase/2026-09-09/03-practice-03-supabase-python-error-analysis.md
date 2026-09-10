# Supabase Python 오류 분석 실습

- 학습 날짜: 2026-09-09
- Level / Week: LV.2 / Week 6
- 실행 근거: 사용자가 Jupyter Notebook에서 확인한 Traceback 2건
- 해결 상태: 직접 원인과 최소 수정 방향 확인. 수정 후 성공 실행은 미확인.

## 실습 1. 존재하지 않는 테이블명 조회

### 실행한 요청

```python
response = (
    supabase.table("document")
    .select("id,title,content,users(id,email)")
    .execute()
)
```

### 실제 오류

```text
APIError
code: PGRST205
message: Could not find the table 'public.document' in the schema cache
hint: Perhaps you meant the table 'public.documents'
```

### 최초로 잘못된 상태

`.table("document")`에서 요청한 이름과 Supabase가 인식한 실제 테이블 후보 `public.documents`가 일치하지 않았다.

### 직접 원인

PostgREST 스키마 캐시에서 `public.document`를 찾지 못했다.

### 최소 수정 후보

Dashboard에서 실제 테이블명이 복수형 `documents`인지 확인한 뒤, 맞다면 다음처럼 수정한다.

```python
response = (
    supabase.table("documents")
    .select("id,title,content,users(id,email)")
    .execute()
)
```

사용자는 앞서 단수형 `document` 테이블을 만들었다고 설명했으므로, 다음 두 사실을 구분해 재확인해야 한다.

1. 현재 연결한 Supabase 프로젝트에 단수형 테이블을 실제로 생성했는가?
2. Notebook이 그 테이블을 만든 것과 같은 프로젝트·스키마에 연결되어 있는가?

오류의 힌트만 보고 무조건 이름을 바꾸기보다 실제 Dashboard의 Table Editor 또는 SQL Editor에서 확인한다.

### 재실행 체크

- [ ] 실제 Project URL이 의도한 프로젝트인지 확인
- [ ] `public.document`와 `public.documents` 중 실제 이름 확인
- [ ] 외래 키 관계가 있어 `users(id,email)` 참조 조회가 가능한지 확인
- [ ] 수정 코드 실행
- [ ] `response.data` 확인

## 실습 2. 존재하지 않는 Auth 메서드 호출

### 실행한 요청의 핵심

```python
response = supabase.auth.sign_in_with_email_and_password({
    "email": "<email>",
    "password": "<password>",
})
```

실제 자격 증명은 보존하지 않았다.

### 실제 오류

```text
AttributeError: 'SyncSupabaseAuthClient' object has no attribute
'sign_in_with_email_and_password'
```

### 최초로 잘못된 상태

현재 `SyncSupabaseAuthClient`에 존재하지 않는 메서드 이름을 호출했다.

### 직접 원인

현재 Supabase Python 공식 인터페이스의 이메일·비밀번호 로그인 메서드는 `sign_in_with_password`다.

### 최소 수정 후보

```python
response = supabase.auth.sign_in_with_password({
    "email": "<email>",
    "password": "<password>",
})

user = response.user
```

### 재실행 체크

- [ ] 공식 문서의 현재 메서드명 확인
- [ ] 현재 Notebook 커널과 패키지가 같은 가상환경을 사용하는지 확인
- [ ] 테스트 계정이 실제 Auth 사용자로 생성되어 있는지 확인
- [ ] 수정 코드 실행
- [ ] `response.user`만 필요한 범위에서 확인
- [ ] Auth 응답 전체의 토큰을 출력하거나 기록하지 않기

## 두 오류에서 배운 공통 디버깅 절차

```text
Traceback 마지막 줄 확인
→ 어떤 객체까지는 정상 생성되었는지 확인
→ 이름이 실제 스키마·SDK 인터페이스와 일치하는지 확인
→ 공식 문서와 Dashboard를 근거로 최소 수정
→ 같은 환경에서 재실행
→ 반환값으로 해결 여부 검증
```

두 오류 모두 연결 라이브러리를 전혀 찾지 못한 문제가 아니라, **요청 대상 이름 또는 메서드 이름이 현재 환경과 일치하지 않은 문제**였다.

## 공식 참고 자료

- [Supabase Python select](https://supabase.com/docs/reference/python/select)
- [Supabase Python sign in with password](https://supabase.com/docs/reference/python/auth-signinwithpassword)

[← Learning Notes](./02-learning-notes-03-supabase-api-sdk-auth.md)
