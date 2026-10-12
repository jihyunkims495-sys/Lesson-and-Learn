# Learning Notes | React 기초와 Todo 코드 읽기

- 날짜: 2026-10-12
- Level / Week: LV.2 / Week 9
- 과정: 프론트엔드 응용 (React/Next.js)
- 학습 범위: React·TSX·컴포넌트·Fragment·상태·Hook·`useCallback`·`const`/`let`과 Todo 코드 구조

## 개념 연결 흐름

```text
React
→ 화면을 컴포넌트로 나누어 구성
→ TSX로 화면 구조와 TypeScript를 함께 작성
→ useState로 바뀌는 데이터를 기억
→ 이벤트 함수가 상태 변경을 요청
→ React가 화면을 다시 계산
```

## React와 앱 구성

- React는 상호작용하는 웹 화면을 컴포넌트로 구성하는 JavaScript 라이브러리다.
- 컴포넌트는 상품 카드, 장바구니 버튼처럼 재사용할 수 있는 화면 단위다.
- React는 웹 앱 화면을 만들 때 사용하고, 모바일 앱에는 React Native를 사용할 수 있다.
- Next.js는 React에 페이지 이동과 서버 관련 기능 등을 더한 프레임워크다.

## TSX와 Fragment

- `.tsx`는 TypeScript와 JSX 화면 문법을 함께 사용하는 파일 형식이다.
- Fragment `<>...</>`는 실제 HTML 태그를 추가하지 않고 여러 요소를 하나로 묶는다.
- 컴포넌트가 `<form>` 하나만 반환한다면 바깥 Fragment는 없어도 된다.

```tsx
export default function Example(): React.JSX.Element {
  return (
    <>
      <h1>할 일</h1>
      <form>...</form>
    </>
  );
}
```

## `const`와 `let`

`const`와 `let`은 개발자가 파일을 다시 편집할 수 있는지와 관계없다. 프로그램이 실행되는 동안 같은 변수 이름에 다른 값을 다시 할당하는지를 나타낸다.

```ts
const name = 'React';
let count = 0;

count = count + 1;
```

- `const`: 같은 이름에 다른 값을 다시 할당할 수 없다.
- `let`: 실행 중 다른 값을 다시 할당할 수 있다.
- 개발자가 변경 명령을 작성하고 JavaScript 엔진이 실행 중 그 명령을 수행한다.

React 상태는 변수를 직접 재할당하는 대신 Setter로 다음 상태를 전달한다.

```tsx
const [count, setCount] = useState(0);

setCount((prev) => prev + 1);
```

## Hook과 `useCallback`

Hook은 함수 컴포넌트에서 상태와 실행 시점 같은 React 기능을 사용하는 함수다. 이름은 보통 `use`로 시작한다.

- `useState`: 바뀌는 상태를 기억한다.
- `useEffect`: 렌더링 이후 외부 시스템과 동기화한다.
- `useCallback`: 의존 값이 바뀌기 전까지 같은 함수 참조를 재사용한다.

`useCallback`은 모든 함수에 붙이는 문법이 아니다. 메모된 자식 컴포넌트에 함수를 전달하거나 다른 Hook의 의존성을 안정화해야 할 때 검토한다.

```tsx
const handleDelete = useCallback((id: number) => {
  setItems((prev) => prev.filter((item) => item.id !== id));
}, []);
```

## Todo 코드 구조

살펴본 `TodoPage`는 Todo 입력과 등록 기능을 만드는 중간 단계였다.

```tsx
'use client';

import { useState } from 'react';

interface Todo {
  id?: number;
  title: string;
  checked: boolean;
}

export default function TodoPage(): React.JSX.Element {
  const [form, setForm] = useState<Todo>({
    title: '',
    checked: false,
  });
  const [items, setItems] = useState<Todo[]>([]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, title: event.target.value });
  };

  return (
    <form>
      <input
        type="text"
        name="title"
        onChange={onChange}
        value={form.title}
      />
      <button type="submit">할 일 등록</button>
    </form>
  );
}
```

### 데이터 흐름

```text
Todo 인터페이스로 데이터 모양 정의
→ form 상태에 입력 중인 값 저장
→ items 상태에 등록된 Todo 목록 저장
→ input 변경 시 onChange 실행
→ setForm으로 새 상태 전달
→ React가 입력창을 새 상태로 다시 표시
```

### 코드에서 확인한 보완점

- `Todo`의 `title`과 `checked`는 필수이므로 상태 초기값에도 두 필드가 필요하다.
- 등록 기능을 만들려면 `onSubmit`에서 새 Todo를 `items`에 추가해야 한다.
- `<form onSubmit={onSubmit}>`처럼 제출 함수를 폼과 연결해야 한다.
- `items.map(...)`으로 각 Todo를 `TodoItem`에 전달해야 목록이 화면에 나타난다.
- 사용하지 않는 import는 제거해야 한다.

## Todo 등록이 완성될 때의 흐름

```tsx
const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const title = form.title.trim();
  if (!title) return;

  setItems((prev) => [
    ...prev,
    { id: Date.now(), title, checked: false },
  ]);

  setForm({ title: '', checked: false });
};
```

1. 브라우저의 기본 폼 제출을 막는다.
2. 공백만 있는 입력은 등록하지 않는다.
3. 이전 목록을 복사하고 새 Todo를 뒤에 추가한다.
4. 입력 상태를 빈 문자열로 초기화한다.
5. React가 새 목록과 빈 입력창을 다시 렌더링한다.

이 코드는 학습 흐름을 설명하기 위한 확장 예시이며, 오늘 확인한 코드는 제출 함수와 목록 출력이 아직 연결되지 않은 상태였다.

## 핵심 정리

- React는 화면을 컴포넌트로 나누고 상태에 따라 다시 그린다.
- TSX는 TypeScript와 JSX를 같은 파일에서 사용하게 해준다.
- 이벤트 함수는 사용자의 동작을 받아 Setter로 상태 변경을 요청한다.
- 상태가 바뀌면 React가 컴포넌트를 다시 실행해 화면을 갱신한다.
- `useCallback`은 필요할 때 함수 참조를 재사용하는 최적화 도구다.
- Todo 코드는 `입력 → 이벤트 함수 → 상태 변경 → 다시 렌더링` 흐름으로 읽을 수 있다.

## 다음 학습 연결

1. 일반 함수의 정의, 호출, 인수와 반환을 짧은 예제로 복습한다.
2. 상품 정보를 Props로 받는 상품 카드 한 개를 만든다.
3. 상품 배열을 `map()`으로 여러 카드에 연결한다.
4. 버튼 이벤트와 `useState`로 장바구니 수량 하나를 변경한다.

[← Week 9 학습 기록](../README.md)
