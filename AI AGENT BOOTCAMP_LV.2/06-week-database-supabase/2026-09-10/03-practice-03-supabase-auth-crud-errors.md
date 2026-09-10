# Supabase Auth·CRUD 실습 및 오류 정리

- 학습 날짜: 2026-09-10
- Level / Week: LV.2 / Week 6
- 상태: 사용자 실행 결과와 로컬 코드 검증을 구분하여 기록

## 1. Python Auth 메서드 오류

처음 사용한 코드:

```python
supabase.auth.sign_in_with_email_and_password({...})
```

발생 오류:

```text
AttributeError: 'SyncSupabaseAuthClient' object has no attribute
'sign_in_with_email_and_password'
```

원인은 현재 Supabase Python SDK에 해당 이름의 메서드가 없기 때문이다. 이메일·비밀번호 로그인은 다음 메서드를 사용한다.

```python
response = supabase.auth.sign_in_with_password(
    {
        "email": email,
        "password": password,
    }
)
```

수정 메서드는 공식 문서로 확인했지만, 같은 계정의 최종 로그인 성공은 이메일 인증 문제로 이어져 완료되지 않았다.

## 2. 이메일 미인증 오류

사용자가 보고한 최종 오류:

```text
AuthApiError: Email not confirmed
```

의미:

- 회원 계정은 만들어졌다.
- 프로젝트에서 이메일 확인이 필요하도록 설정돼 있다.
- 해당 계정의 이메일 확인이 끝나지 않아 비밀번호 로그인이 거부됐다.

해결 방향:

- 실제 이메일이면 확인 메일의 링크를 클릭한다.
- 수업용 프로젝트라면 Email provider의 Confirm Email 설정을 검토한다.
- 확인 메일을 받을 수 없는 예시 주소와 실제 개인 비밀번호를 학습 기록에 저장하지 않는다.

오늘은 오류 원인을 확인했으며 로그인 재시도 성공 결과는 미확인이다.

## 3. Table Editor 설정에서 확인한 점

- `Default Value`에는 `not null`, `nullable`, `foreign` 같은 설명 문구를 입력하지 않는다.
- Null 허용 여부는 컬럼 제약조건 설정에서 지정한다.
- 외래키는 별도의 Foreign key relationship에서 연결한다.
- `products.seller_id`는 `public.user_details.id`를 참조한다.
- UUID를 참조하는 외래키 컬럼도 UUID 자료형이어야 한다.

## 4. 작성한 CRUD 프로젝트

로컬 프로젝트:

[Supabase 쇼핑몰 CRUD README](./supabase-shop-crud/README.md)

구현 범위:

- `user_details`: 본인 회원 상세정보 생성·조회·수정·소프트 삭제
- `products`: 상품 생성·전체/본인 조회·수정·소프트 삭제
- `orders`: 주문 생성·본인 주문 조회·수정·소프트 삭제
- Supabase Auth 회원가입·로그인·로그아웃
- `.env` 기반 Client 초기화
- PK·FK를 수정 대상에서 제외하는 입력 필터

검증 결과:

- Python 문법 검사 통과
- 입력값 검증 단위 테스트 4개 통과
- 자격 증명 형태의 실제 값 미포함
- 실제 Supabase 네트워크 연결과 쓰기 작업은 실행하지 않음

## 5. 다음 실습 순서

복잡도를 줄이기 위해 다음에는 한 번에 한 단계만 실행한다.

```text
로그인 성공 확인
→ 현재 user.id 출력
→ user_details 한 행 생성·조회
→ products 한 행 생성·조회
→ orders 한 행 생성·조회
→ 각 테이블 update 확인
→ deleted_at 소프트 삭제 확인
→ 다른 계정으로 RLS 차단 확인
```

[← Week 6](../README.md)
