# Learning Notes — Next.js 회원가입과 Server Action

## 실제 학습 범위

- Node.js와 npm 기반 Next.js 개발 서버 실행
- 환경변수의 브라우저·서버 공개 범위
- Server Component와 Client Component의 실행 경계
- `useState`, `useActionState`, Server Action의 연결
- Supabase 브라우저·서버 클라이언트 생성
- 회원가입 입력 검증, Auth 요청, 프로필 저장
- 개발 서버와 스타일 빌드 문제 진단

## 1. CSR을 실행 위치의 관점에서 보기

CSR(Client-Side Rendering)의 핵심은 브라우저가 JavaScript를 실행해 상태 변화와 사용자 이벤트에 반응한다는 것이다. Next.js App Router에서는 모든 화면을 브라우저 코드로 만들 필요가 없다.

```text
page.tsx의 Server Component
→ SignUpForm의 Client Component
→ 사용자의 입력과 제출 이벤트
→ Server Action 네트워크 호출
→ 서버의 검증·인증·DB 처리
→ 결과 상태를 Client Component에 반영
```

`'use client'`는 파일 확장자와 무관하게 브라우저 코드의 시작점을 표시한다. `useState`, `onChange`, `useActionState`처럼 브라우저 상호작용이 필요한 컴포넌트에 사용한다.

`'use server'`는 UI를 서버에서 다시 렌더링한다는 표시가 아니다. 클라이언트가 호출할 수 있지만 실제 본문은 서버에서 실행되는 함수 경계다.

## 2. 제어 입력과 폼 상태

회원가입 폼은 이메일, 회원명, 비밀번호, 비밀번호 확인을 하나의 상태 객체로 관리했다.

```tsx
const initialForm = {
  email: '',
  name: '',
  password: '',
  passwordConfirm: '',
};
```

각 입력의 `name`과 상태 객체의 키를 같게 만들면 하나의 변경 함수로 여러 필드를 갱신할 수 있다.

```tsx
const onChange = (event: ChangeEvent<HTMLInputElement>) => {
  setForm((previous) => ({
    ...previous,
    [event.target.name]: event.target.value,
  }));
};
```

이 구조에서 입력값의 Source of Truth는 DOM 자체가 아니라 React 상태다. 입력 필드의 `value`와 `onChange`가 쌍으로 연결되어야 한다.

## 3. `useActionState`와 Server Action

`useActionState`는 다음 세 값을 연결한다.

```text
state      → 서버 함수가 반환한 성공·오류 결과
formAction → form의 action에 전달할 함수
isPending  → 서버 요청이 처리 중인지 나타내는 상태
```

폼 제출 흐름은 다음과 같다.

```text
사용자 입력
→ formAction 호출
→ FormData 생성
→ Server Action 실행
→ 서버 입력 검증
→ Supabase 요청
→ ActionState 반환
→ 필드 오류 또는 전체 메시지 렌더링
```

브라우저 검증만 신뢰하면 요청을 직접 조작했을 때 잘못된 값이 서버로 들어올 수 있다. 따라서 Server Action 내부에서 다시 검증한다.

## 4. Supabase 회원가입 흐름

서버용 Supabase 클라이언트는 Next.js 쿠키 저장소를 연결해 인증 세션을 읽고 갱신한다.

```text
환경변수에서 URL·Publishable Key 읽기
→ 요청 쿠키 전체 읽기
→ Supabase Auth 요청
→ 갱신할 쿠키를 응답에 설정
```

회원가입 액션은 다음 순서로 구성했다.

1. `FormData`에서 네 입력값을 읽는다.
2. 빈 값, 이메일 형식, 이름·비밀번호 길이, 비밀번호 일치를 검사한다.
3. 오류가 있으면 필드별 오류 객체를 반환한다.
4. Supabase Auth에 이메일과 비밀번호를 전달한다.
5. 반환된 사용자 ID를 프로필의 기본 키로 저장한다.
6. Auth 또는 프로필 저장 실패 시 전체 오류 메시지를 반환한다.

`profiles.id`는 인증 사용자 테이블의 ID와 연결한다. 존재하지 않는 `auth.uuid()`를 기본값으로 호출하는 방식이 아니라, 회원가입 결과의 사용자 ID를 명시적으로 저장하는 흐름을 사용했다.

## 5. 환경변수 규칙

```text
NEXT_PUBLIC_*  → 브라우저 번들에 포함될 수 있음
접두사 없음    → 서버 전용 코드에서만 사용
```

`NEXT_PUBLIC_`은 값을 암호화하는 기능이 아니다. 브라우저 공개를 허용하는 표시다. Publishable Key는 브라우저 사용을 전제로 하지만, 관리자 권한 키와 서버 비밀값은 공개 변수로 두면 안 된다.

## 6. 개발 환경 오류에서 배운 점

| 증상 | 원인 | 해결 원칙 |
|---|---|---|
| `Missing script: dev` | 앱이 아닌 상위 폴더에서 명령 실행 | 현재 폴더의 `package.json`과 scripts 확인 |
| `next` 명령을 찾지 못함 | 앱 의존성 미설치 | 앱 루트에서 패키지 설치 |
| 기본 포트 대신 다음 포트 사용 | 기존 프로세스가 기본 포트 점유 | 실행 로그의 실제 Local URL 확인 |
| Turbopack 실행 중단 | 네이티브 컴파일러 바인딩 사용 불가 | 개발 환경에서 Webpack 경로로 우회 |
| Tailwind 스타일 미적용 | 번들러별 CSS 처리 설정 또는 생성 자산 문제 | PostCSS 설정과 CSS 요청 상태 확인 |
| 액션 함수 미정의 | import·export·호출 이름 불일치 | 경계 양쪽의 식별자 통일 |
| 초기 폼 상태 미정의 | `useState`에 전달할 객체 누락 | 입력 필드와 같은 키의 초기값 선언 |
| Supabase URL 변수 미정의 | 선언부와 사용부 오타 | 환경변수·지역 변수 이름 일괄 확인 |
| 비밀번호 DOM 경고 | 자동완성 목적 미지정 | 회원가입 비밀번호에 `new-password` 지정 |

Webpack으로 전환한 뒤 생성된 CSS 요청이 계속 실패했을 때는 소스 변환 결과와 브라우저의 실제 자산 요청을 분리해서 확인했다. 설정이 정상이어도 개발 생성 캐시가 이전 번들러 상태를 유지할 수 있으므로, 생성 캐시와 서버 재시작을 마지막 단계에서 점검했다.

## 7. 확인한 결과와 남은 검증

확인한 결과:

- 정적 코드 검사와 TypeScript 검사 통과
- 회원가입 화면의 입력창·버튼·오류 영역 렌더링 확인
- 환경변수 파일의 Git 제외 확인
- 복습용 초기 프로젝트 복원 후 lint 통과

남은 검증:

- 실제 회원가입 완료와 프로필 행 생성
- 로그인 후 쿠키 기반 세션 유지
- RLS 활성화 후 사용자별 데이터 격리
- 다른 사용자 데이터의 읽기·수정·삭제 차단
- 프로덕션 빌드와 배포 환경 인증 흐름

## 핵심 정리

- CSR은 브라우저 상호작용의 실행 위치를 설명한다.
- `'use client'`는 필요한 컴포넌트부터 브라우저 경계를 만든다.
- Server Action은 브라우저 폼과 서버의 신뢰 작업을 연결한다.
- 인증은 사용자를 확인하고, RLS는 확인된 사용자의 데이터 권한을 제한한다.
- 실행 오류는 현재 폴더, 패키지 설치, 실제 포트, 번들러, 생성 자산 순서로 분리해 확인한다.
