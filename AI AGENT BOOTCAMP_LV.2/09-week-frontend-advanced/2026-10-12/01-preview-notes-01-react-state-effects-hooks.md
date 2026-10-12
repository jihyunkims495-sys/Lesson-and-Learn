# Preview Notes | React 상태, Effect와 Hook

- 날짜: 2026-10-12
- Level / Week: LV.2 / Week 9
- 과정: 프론트엔드 응용 (React/Next.js)
- 범위: 3장 1강~6강

## 학습 목표

- 배열 데이터를 `map()`으로 JSX 요소 배열로 바꾸고 안정적인 `key`를 지정한다.
- CSS Modules, SCSS Modules와 Tailwind CSS의 역할을 구분한다.
- `useState`의 상태 스냅샷과 배칭을 이해하고 함수형 업데이트를 사용한다.
- 배열 상태를 직접 변경하지 않고 전개 연산자, `map()`, `filter()`로 새 배열을 만든다.
- `useEffect`의 실행 시점과 Cleanup의 관계를 설명한다.
- 반복되는 상태·Effect 로직을 Custom Hook으로 분리한다.
- Suspense와 `use()`가 대기 중인 데이터를 다루는 흐름을 파악한다.

## 전체 구조

```text
배열 데이터
→ map()으로 JSX 목록 생성
→ key로 각 항목 식별
→ CSS Modules와 Tailwind로 화면 표현
→ useState로 상호작용 상태 관리
→ 배칭과 함수형 업데이트로 연속 변경 처리
→ 불변성을 지키며 목록 추가·수정·삭제
→ useEffect로 외부 시스템과 동기화
→ Cleanup으로 타이머와 이벤트 정리
→ Custom Hook으로 반복 로직 분리
→ Suspense와 use()로 비동기 값 처리
```

## 선행 개념

- JavaScript 배열과 `map()`, `filter()`, 전개 연산자
- 함수, 콜백 함수와 화살표 함수
- 객체와 배열의 참조
- JSX/TSX, 컴포넌트와 Props
- 이벤트 핸들러와 `'use client'`
- TypeScript 인터페이스
- Promise와 비동기 처리
- DOM과 브라우저 이벤트

## 1. 리스트 렌더링과 `key`

`map()`은 배열의 각 항목을 다른 값으로 바꾼 새 배열을 반환한다. React에서는 데이터를 JSX 요소로 바꿀 때 자주 사용한다.

```tsx
const fruits: string[] = ['사과', '바나나', '포도'];

const fruitItems = fruits.map((fruit) => (
  <li key={fruit}>{fruit}</li>
));
```

```text
fruits 배열
→ map()이 항목을 콜백 함수에 전달
→ 콜백 함수가 <li>를 반환
→ JSX 요소 배열 생성
→ React가 목록을 화면에 표시
```

`key`는 같은 목록의 형제 항목을 구별하는 식별 정보다.

- 항목이 추가·삭제·정렬되어도 같은 항목을 찾을 수 있도록 돕는다.
- 렌더링할 때마다 달라지는 값은 적합하지 않다.
- 목록 순서가 달라질 수 있다면 배열의 `index`보다 데이터의 고유 ID가 안전하다.
- `key`는 일반 Props로 전달되지 않는다. 컴포넌트 안에서도 ID가 필요하면 별도 Props로 전달한다.

## 2. Next.js 스타일링

| 방법 | 역할 | 예시 |
|---|---|---|
| Global CSS | 앱 전체에 공통 스타일 적용 | `globals.css` |
| CSS Modules | 컴포넌트 단위로 클래스 이름 격리 | `Card.module.css` |
| SCSS Modules | 격리된 스타일에 변수와 중첩 문법 추가 | `Card.module.scss` |
| Tailwind CSS | 작은 유틸리티 클래스를 조합 | `flex`, `p-4`, `hover:` |

조건에 따라 Tailwind 클래스를 만들고 충돌을 정리할 때는 `clsx`와 `tailwind-merge`를 함께 사용할 수 있다.

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- `clsx`: 조건에 맞는 클래스 문자열을 만든다.
- `tailwind-merge`: `px-4`와 `px-10`처럼 충돌하는 클래스를 정리한다.

## 3. `useState`, 배칭과 불변성

```tsx
const [count, setCount] = useState<number>(0);
```

상태를 설정해도 현재 줄의 `count`가 바로 바뀌는 것은 아니다. React는 다음 렌더링을 요청하고, 현재 이벤트 함수는 현재 렌더링의 상태 스냅샷을 본다.

```tsx
setNumber((prev) => prev + 1);
setNumber((prev) => prev + 1);
setNumber((prev) => prev + 1);
```

함수형 업데이트는 앞선 계산 결과를 다음 함수의 `prev`로 전달하므로 같은 상태를 연속해서 계산할 때 유용하다.

배열 상태는 기존 배열을 직접 고치지 않고 새 배열을 만든다.

| 작업 | 새 배열을 만드는 방식 |
|---|---|
| 추가 | `[...prev, newItem]` |
| 수정 | `prev.map(...)` |
| 삭제 | `prev.filter(...)` |

## 4. `useEffect`와 Cleanup

Effect는 컴포넌트를 타이머, 이벤트 리스너, 네트워크와 같은 외부 시스템에 연결할 때 사용한다.

| 작성 형태 | 기본 실행 흐름 |
|---|---|
| `useEffect(fn)` | 렌더링 뒤마다 실행 |
| `useEffect(fn, [])` | 마운트 뒤 실행 |
| `useEffect(fn, [dep])` | 마운트 뒤와 `dep` 변경 뒤 실행 |

```tsx
useEffect(() => {
  const id = setInterval(tick, 1000);

  return () => {
    clearInterval(id);
  };
}, []);
```

Cleanup은 컴포넌트가 사라질 때뿐 아니라 의존성이 바뀌어 다음 Effect가 실행되기 전에도 이전 작업을 정리한다.

## 5. Custom Hook

Custom Hook은 상태와 Effect 로직을 재사용 가능한 함수로 분리한 것이다.

- 이름은 `use`로 시작한다.
- 컴포넌트 또는 다른 Hook 안에서 호출한다.
- 화면 자체보다 상태 값과 처리 함수를 반환한다.
- 로직은 재사용하지만 각 호출의 상태는 독립적이다.

예를 들어 `useInput`은 입력값, 변경 함수와 초기화 함수를 하나로 묶을 수 있다.

```text
초기값 받기
→ useState로 value 저장
→ onChange로 입력 반영
→ reset으로 초기값 복원
→ { value, onChange, reset } 반환
```

## 6. Suspense와 `use()`

`<Suspense fallback={...}>`는 하위 UI가 준비되지 않았을 때 대체 화면을 표시한다.

```text
하위 작업이 아직 준비되지 않음
→ 가장 가까운 Suspense가 fallback 표시
→ 코드나 데이터 준비 완료
→ 실제 UI로 교체
```

`use(Promise)`는 Promise의 결과를 읽는다. Promise가 대기 중이면 가까운 Suspense가 fallback을 보여주고, 완료되면 결과 UI를 이어서 표시한다. 렌더링할 때마다 새로운 Promise를 만드는 대신 안정적인 Promise를 전달해야 한다.

## 핵심 용어

| 용어 | 의미 |
|---|---|
| List Rendering | 배열 데이터를 반복되는 JSX 요소로 표현하는 것 |
| `key` | 목록 안에서 항목을 구별하는 식별 정보 |
| State Snapshot | 한 번의 렌더링이 바라보는 고정된 상태 값 |
| Batching | 여러 상태 업데이트를 모아 처리하는 방식 |
| Immutability | 기존 객체·배열을 직접 바꾸지 않고 새 값을 만드는 원칙 |
| Side Effect | 렌더링 외부 시스템과 상호작용하는 작업 |
| Cleanup | 이전 Effect가 만든 외부 작업을 정리하는 함수 |
| Custom Hook | 상태·Effect 로직을 재사용하는 `use`로 시작하는 함수 |
| Suspense | 하위 작업이 준비되는 동안 대체 UI를 보여주는 경계 |

## 수업 전 확인 질문

1. `map()`의 입력과 반환값은 무엇인가?
2. 목록이 추가·삭제·정렬될 때 안정적인 `key`가 필요한 이유는 무엇인가?
3. `setNumber(number + 1)`과 함수형 업데이트는 어떤 차이가 있는가?
4. React 상태 배열을 `push()`로 직접 변경하지 않는 이유는 무엇인가?
5. Effect의 Setup과 Cleanup은 어떤 순서로 실행되는가?
6. Custom Hook은 무엇을 재사용하며 각 호출의 상태는 어떻게 관리되는가?
7. Suspense의 `fallback`은 언제 나타나고 사라지는가?

## 학습 예정 활동

- `map()`으로 목록을 만들고 고유 ID와 배열 `index`를 `key`로 사용했을 때를 비교한다.
- 일반 상태 업데이트와 함수형 업데이트를 연속 호출해 결과를 비교한다.
- 전개 연산자, `map()`, `filter()`로 Todo 추가·수정·삭제 흐름을 구성한다.
- 타이머와 이벤트 리스너를 등록하고 Cleanup으로 정리한다.
- 입력 상태 로직을 Custom Hook으로 분리한다.
- Suspense의 대기 화면에서 결과 화면으로 바뀌는 흐름을 확인한다.

## 참고 자료

- [React — Rendering Lists](https://react.dev/learn/rendering-lists)
- [React — Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [React — Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
- [React — useEffect](https://react.dev/reference/react/useEffect)
- [React — Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React — use](https://react.dev/reference/react/use)
- [React — Suspense](https://react.dev/reference/react/Suspense)
- [Next.js — CSS](https://nextjs.org/docs/app/getting-started/css)

[← Week 9 학습 기록](../README.md)
