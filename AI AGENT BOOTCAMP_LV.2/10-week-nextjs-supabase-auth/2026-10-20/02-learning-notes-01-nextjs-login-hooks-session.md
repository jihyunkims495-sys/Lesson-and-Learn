# Learning Notes — Next.js 로그인, Hook과 세션

## 실제 학습 범위

- `process.env`와 환경변수의 공개 범위
- `useActionState`의 반환값과 폼 처리 흐름
- `useEffect`와 의존성 배열
- `useRouter`의 `push`, `replace`, `refresh`
- 쿠키, 인증 토큰, 세션과 `getUser()`
- TypeScript union 타입과 Supabase `maybeSingle()`
- CSR과 Server Action의 역할 분리
- 로그인 폼과 개발 서버 오류 진단

## 1. 환경변수와 `process.env`

Next.js 서버 코드에서는 `process.env`로 환경변수를 읽을 수 있다.

```ts
const apiUrl = process.env.API_URL;
```

Client Component에서 접근해야 하는 값은 일반적으로 `NEXT_PUBLIC_` 접두사가 필요하다.

```text
NEXT_PUBLIC_* → 브라우저 번들에 포함될 수 있는 공개 값
접두사 없음   → 서버에서만 읽어야 하는 값
```

`NEXT_PUBLIC_`은 값을 암호화하지 않는다. 브라우저에 공개해도 되는 값이라는 표시이므로 비밀번호나 관리자 권한 키에는 사용하면 안 된다.

## 2. `useActionState`로 폼과 Server Action 연결하기

`useActionState`는 Server Action의 실행 결과와 폼 상태를 연결한다.

```tsx
const [state, formAction, isPending] = useActionState(
  signInAction,
  initialActionState,
);
```

각 반환값의 역할은 다음과 같다.

```text
state      → Server Action이 반환한 성공·오류 결과
formAction → form의 action 속성에 연결할 함수
isPending  → 제출 요청을 처리 중인지 나타내는 boolean 값
```

전체 흐름은 다음과 같다.

```text
사용자 입력
→ formAction 호출
→ FormData 전달
→ Server Action에서 검증·인증
→ ActionState 반환
→ 오류 메시지 또는 성공 후속 처리
```

## 3. `useEffect`의 실행 시점과 의존성 배열

`useEffect`는 렌더링 결과가 화면에 반영된 뒤 외부 시스템과 동기화할 때 사용한다. 원격 데이터 요청, 브라우저 API 연결, native 이벤트 등록 등이 대표적인 예다.

```tsx
useEffect(() => {
  if (state.success) {
    router.replace(redirectUrl);
    router.refresh();
  }
}, [state.success, redirectUrl, router]);
```

의존성 배열은 Effect를 다시 실행할 조건을 나타낸다.

- 배열 생략: 렌더링할 때마다 실행
- 빈 배열 `[]`: 컴포넌트가 mount될 때 실행
- `[value]`: `value`가 변경될 때 다시 실행

개발 모드의 Strict Mode에서는 잘못된 Effect를 찾기 위해 setup과 cleanup이 추가로 실행될 수 있다. 따라서 빈 배열이라고 해서 개발 중 로그가 반드시 한 번만 출력된다고 단정하면 안 된다.

이벤트를 직접 등록했다면 cleanup에서 해제한다.

```tsx
useEffect(() => {
  const handleResize = () => console.log(window.innerWidth);
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Effect 계열 Hook 구분

- `useEffect`: 화면 반영 이후 실행하며 일반적인 외부 시스템 동기화에 사용한다.
- `useLayoutEffect`: 브라우저가 화면을 그리기 전에 실행하며 레이아웃 측정에 사용한다. 오래 걸리면 화면 표시를 막는다.
- `useInsertionEffect`: CSS-in-JS 라이브러리가 스타일을 삽입하기 위한 특수 Hook이다. 일반 컴포넌트 로직에는 거의 사용하지 않는다.

## 4. 동기·비동기와 Promise

동기는 현재 작업이 끝날 때까지 다음 흐름이 기다리는 방식이다. 비동기는 네트워크 요청처럼 오래 걸리는 작업의 완료를 나중에 전달받고 그동안 다른 작업을 진행할 수 있게 한다.

Promise는 미래에 완료될 비동기 작업을 나타내는 객체다.

```text
pending   → 처리 중
fulfilled → 성공
rejected  → 실패
```

`await`는 Promise가 결정될 때까지 현재 `async` 함수의 나머지 실행을 일시 중단한다. JavaScript 프로그램 전체를 멈추는 것은 아니다.

```ts
const { data, error } = await supabase.auth.getUser();
```

`useEffect` 콜백 자체는 Promise를 반환하는 `async` 함수로 만들지 않고, Effect 안에서 별도의 비동기 함수를 실행한다.

## 5. `useRouter`와 클라이언트 내비게이션

`useRouter`는 Client Component에서 Next.js 내부 화면 이동과 갱신을 담당한다.

```tsx
const router = useRouter();
```

### `push`

새 주소로 이동하면서 방문 기록을 남긴다.

```tsx
router.push('/todos');
```

### `replace`

현재 방문 기록을 새 주소로 교체한다. 로그인 성공 후 뒤로가기로 로그인 페이지에 돌아가지 않게 하려는 경우 적합하다.

```tsx
router.replace('/todos');
```

### `refresh`

현재 주소의 Server Component 데이터를 다시 요청한다. 이동 경로를 인자로 받지 않는다.

```tsx
router.refresh();
```

## 6. `redirectUrl`의 역할

`redirectUrl`은 로그인 전에 사용자가 가려고 했던 목적지로 되돌려 보내기 위한 값이다.

```text
/sign_in?redirectUrl=/todos
```

```tsx
const redirectUrl = searchParams.get('redirectUrl') || '/';
router.replace(redirectUrl);
```

따옴표를 사용한 `'redirectUrl'`은 변수값이 아니라 문자 그대로의 경로다.

```tsx
router.push('redirectUrl'); // 잘못된 문자열 경로
router.push(redirectUrl);   // 변수에 저장된 실제 목적지
```

외부 URL을 그대로 허용하면 의도하지 않은 사이트로 이동시킬 수 있으므로 실제 서비스에서는 내부 경로만 허용하는 검증도 필요하다.

## 7. 쿠키와 세션

쿠키는 브라우저가 보관하고 조건에 맞는 HTTP 요청에 함께 보내는 작은 데이터다. 인증에서는 사용자를 식별할 수 있는 세션 정보나 토큰 전달에 사용한다.

```text
로그인 요청
→ 인증 서버가 사용자 확인
→ 인증 토큰과 세션 정보 발급
→ 브라우저가 인증 정보 보관
→ 이후 요청에 인증 정보 포함
→ 서버가 현재 사용자 확인
```

Server Action을 사용하는 구조에서는 다음 흐름도 포함된다.

```text
브라우저 → Next.js 서버 → Supabase
```

`getUser()`는 현재 인증 토큰을 바탕으로 사용자가 유효한지 확인한다. “세션이 만료되었습니다”는 물리적인 네트워크 연결이 끊겼다는 뜻이 아니라 토큰이 만료·무효화되었거나 갱신에 실패해 인증 상태를 더 이상 증명하지 못한다는 의미다.

## 8. 현재 사용자 조회 코드에서 만난 문법

### Union 타입

```ts
type UserType = UserProfile | null;
```

값이 `UserProfile` 객체이거나 사용자가 없음을 뜻하는 `null`일 수 있다는 의미다.

### `maybeSingle()`

Supabase 조회 결과를 배열 대신 하나의 객체 또는 `null`로 받는다.

- 0행: `null`
- 1행: 하나의 객체
- 여러 행: 오류

### 논리 부정 연산자

```ts
if (!profile) {
  return null;
}
```

`profile`이 `null`이나 `undefined`처럼 falsy인 값이면 `!profile`은 `true`가 된다. 프로필이 없을 때 이후 처리를 중단하는 guard clause다.

### `interface`

TypeScript에서 객체가 가져야 할 속성과 타입을 정의하는 설계도다. 타입 검사에는 사용되지만 JavaScript 실행 시점에는 제거된다.

## 9. React `cache`의 역할

React의 `cache`는 같은 서버 렌더링 작업에서 같은 함수가 반복 호출될 때 결과를 재사용해 중복 조회를 줄인다.

```tsx
export const getCurrentUser = cache(async () => {
  // 인증 사용자와 프로필 조회
});
```

Header와 다른 Server Component가 같은 사용자 조회 함수를 호출하더라도 매번 동일한 요청을 반복하지 않도록 도울 수 있다. 이는 모든 사용자에게 영구적으로 같은 값을 주는 브라우저 캐시와는 다르다.

캐시는 무조건 좋거나 나쁜 기능이 아니다. 중복 작업을 줄이는 장점이 있지만 데이터가 변경됐을 때 적절한 재검증이 필요하다.

## 10. 자주 혼동한 용어

| 용어 | 의미 |
|---|---|
| 화살표 함수 | 함수를 작성하는 JavaScript 문법 |
| Hook | React의 상태·렌더링 생명주기 기능을 사용하는 함수 |
| 서버 | 요청을 받아 코드를 실행하고 데이터를 처리하는 시스템 |
| API | 클라이언트가 서버 기능을 호출하기 위한 요청·응답 규칙 |
| modal | 현재 화면 위에 겹쳐 열리는 대화상자 UI |
| params | 동적 경로에서 변수처럼 전달되는 값 |
| search params | URL의 `?key=value` 형식으로 전달되는 값 |
| CSR | 브라우저가 JavaScript를 실행해 화면을 만들거나 변경하는 방식 |

화살표 함수로 Hook을 작성할 수는 있지만 화살표 함수 자체가 Hook인 것은 아니다.

```text
화살표 함수 → 함수 작성 문법
Hook         → React 기능과 사용 규칙
```

동적 경로와 search params도 구분한다.

```text
/products/123               → 123은 route params
/sign_in?redirectUrl=/todos → redirectUrl은 search params
```

## 11. CSR과 Server Action의 역할 분리

로그인 화면에서는 브라우저 상호작용과 신뢰가 필요한 서버 처리를 나눈다.

```text
Client Component
- 입력 상태 관리
- 입력·제출 이벤트
- 성공 결과에 따른 화면 이동

Server Action
- FormData 읽기
- 서버 입력 검증
- Supabase 로그인 요청
- 프로필 조회
- 성공·오류 결과 반환
```

`useState`, `useEffect`, 이벤트 처리, `useRouter`는 브라우저 상호작용이므로 Client Component에서 사용한다. 비밀번호 확인과 데이터 권한처럼 신뢰가 필요한 작업은 Server Action과 데이터베이스 보안 정책에서 처리한다.

## 12. 실습 중 오류에서 배운 점

| 증상 | 원인 | 확인 원칙 |
|---|---|---|
| 입력값이 입력 직후 사라짐 | 제어 입력의 상태 키에 `name` 대신 입력값 사용 | `value`, `name`, 상태 객체의 키가 일치하는지 확인 |
| JSX 파일 끝에서 구문 오류 | 바깥 요소의 닫는 태그 누락 | 들여쓰기보다 실제 여는 태그와 닫는 태그의 짝 확인 |
| 로그인 성공 뒤 404 | 목적지 변수를 문자열로 전달 | 따옴표를 제거하고 실제 변수값 전달 |
| 프로필 생성 실패 | 코드가 요구한 컬럼과 원격 테이블 구조 불일치 | Auth 성공과 프로필 저장 성공을 별도 단계로 확인 |
| 사이트 연결 실패 | 개발 서버가 실행 중이지 않음 | `Ready` 로그와 실제 Local URL 확인 |
| localhost 포트 변경 | 기본 포트를 다른 프로세스가 사용 중 | 실행 로그에 표시된 포트 사용 |

개발 서버와 라우트 파일은 별개의 문제다. 화면에 연결되지 않을 때는 먼저 프로세스와 포트를 확인하고, HTTP 응답이 돌아온 뒤 컴포넌트·리다이렉트 코드를 점검한다.

## 13. 확인한 결과와 남은 검증

확인한 결과:

- 로그인 라우트의 HTTP 200 응답
- 제어 입력 상태 갱신 코드의 `name` 기반 키 사용
- 회원가입 Auth 사용자 생성과 테이블 컬럼 오류의 발생 단계 구분
- JSX 닫는 태그 오류의 직접 원인 확인

남은 검증:

- 로그인 성공 후 목적지 이동 전체 흐름
- 기존 인증 사용자와 프로필 행의 연결 상태
- 프로필의 탈퇴 일시 컬럼명과 코드 속성명의 일치
- 세션 유지와 로그아웃 후 쿠키 처리
- RLS 활성화 후 사용자별 데이터 격리

## 핵심 정리

- `useActionState`는 폼 제출과 Server Action 결과 상태를 연결한다.
- `useEffect`는 렌더링 이후 외부 시스템과 동기화하며 의존성 배열이 재실행 조건을 결정한다.
- 로그인 완료 뒤에는 방문 기록 의도에 따라 `push`와 `replace`를 선택한다.
- 세션 만료는 연결 단절이 아니라 인증을 증명할 토큰이 더 이상 유효하지 않은 상태다.
- CSR은 브라우저 상호작용을 담당하고 Server Action은 검증·인증·데이터 처리를 담당한다.
- 오류는 브라우저 입력 상태, 라우팅, 서버 프로세스, 인증, 프로필 저장 단계로 나누어 추적한다.
