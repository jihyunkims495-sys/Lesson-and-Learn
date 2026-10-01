# Preview Notes — 브라우저 이벤트와 비동기 처리

- 학습 날짜: 2026-10-01
- Level / Week: LV.2 / Week 8
- 과정: 프론트엔드 개발
- 범위: 7장 전체(1강·2강)
- 상태: 교안 기반 예습 완료 / 실습 미실행

## 1. 사용한 교안과 확인 범위

1. `7장 1강. 브라우저 이벤트 처리 및 전파.pdf`
   - 전체 9쪽 확인
   - 이벤트 등록, 마우스·키보드 이벤트, 이벤트 객체, 이벤트 전파와 흐름 제어, 이벤트 리스너의 `this`와 추가 데이터 전달
2. `7장 2강. 비동기 프로그래밍 모델과 fetch API.pdf`
   - 전체 8쪽 확인
   - 동기·비동기 처리, 콜백, Promise, `async`·`await`, `fetch` GET·POST, 타이머 Web API

> 이 문서는 실제 교안을 바탕으로 작성한 예습 노트다. 아래 실습 항목은 수업 중 수행할 예정이며 아직 실행 결과가 확인되지 않았다.

## 2. 오늘의 학습 목표

### 7장 1강 — 브라우저 이벤트 처리 및 전파

- 이벤트가 무엇이며 이벤트 처리기 또는 이벤트 리스너가 어떤 역할을 하는지 설명한다.
- HTML 속성, DOM 프로퍼티, `addEventListener()` 방식의 차이를 구분한다.
- 마우스·키보드 이벤트가 발생하는 시점과 이벤트 객체의 주요 데이터를 확인한다.
- 캡처링, 타깃, 버블링으로 이어지는 이벤트 전파 과정을 이해한다.
- `stopPropagation()`과 `preventDefault()`의 목적을 구분한다.
- 이벤트 리스너 안에서 `this`가 가리키는 대상을 확인하고 필요한 데이터를 함수에 전달한다.

### 7장 2강 — 비동기 프로그래밍 모델과 fetch API

- 동기 처리와 비동기 처리의 실행 흐름 차이를 설명한다.
- 콜백 함수로 비동기 작업의 순서를 제어하는 원리를 이해한다.
- 콜백 지옥의 문제와 Promise가 필요한 이유를 연결한다.
- Promise의 `pending`, `fulfilled`, `rejected` 상태를 구분한다.
- `.then()`·`.catch()`와 `async`·`await`의 관계를 이해한다.
- `fetch()`로 GET·POST 요청을 보내고 응답을 JSON으로 처리하는 흐름을 읽는다.
- `setTimeout()`·`setInterval()`을 등록하고 타이머 ID로 취소하는 구조를 이해한다.

## 3. 전체 학습 구조

```text
사용자의 행동
→ 브라우저가 이벤트 감지
→ 이벤트 객체 생성
→ 등록된 이벤트 리스너 실행
→ DOM 요소의 내용·속성·스타일 변경

시간이 걸리는 작업 요청
→ 브라우저 Web API가 작업 처리
→ JavaScript는 다음 코드 계속 실행
→ 작업 완료 후 콜백 또는 Promise로 결과 전달
→ async/await로 결과를 순서대로 사용
→ fetch로 서버 데이터 조회·전송
```

오늘의 두 강의는 별개의 주제가 아니다. 1강에서는 사용자의 행동을 받아 화면을 바꾸는 방법을 배우고, 2강에서는 서버 통신처럼 시간이 걸리는 작업을 화면이 멈추지 않게 처리하는 방법을 배운다.

## 4. 선행 개념

### 전날 6장과의 연결

- HTML 요소는 브라우저에서 DOM 객체로 변환된다.
- `document.getElementById()` 등으로 DOM 요소 객체를 선택한다.
- 선택한 요소의 프로퍼티와 메서드를 이용해 내용·속성·스타일을 제어한다.
- `DOMContentLoaded`는 DOM 트리가 준비되어 요소를 안전하게 선택할 수 있는 시점이다.
- HTML 속성(attribute), DOM 프로퍼티(property), 메서드(method)는 역할이 다르다.

### 이전 JavaScript 학습과의 연결

- 함수는 이벤트가 발생했을 때 실행할 동작을 묶는 데 사용된다.
- 콜백 함수는 다른 함수에 인수로 전달되어 필요한 시점에 호출된다.
- 객체와 `this`의 관계는 이벤트 리스너의 실행 주체를 이해하는 데 필요하다.
- 배열과 반복문은 여러 이벤트 데이터나 여러 Promise를 처리할 때 사용된다.
- `try`·`catch`는 실행 중 발생하는 오류를 처리한다.

## 5. 7장 1강 핵심 개념

### 5.1 이벤트와 이벤트 리스너

- **이벤트(Event)**: 클릭, 키 입력, 스크롤, 폼 제출처럼 웹 페이지에서 발생하는 행동이나 상태 변화다.
- **이벤트 처리기(Event Handler) / 이벤트 리스너(Event Listener)**: 이벤트가 발생했을 때 실행되는 함수다.

```text
버튼 클릭
→ click 이벤트 발생
→ 브라우저가 이벤트 객체 생성
→ 등록된 함수 실행
→ 화면 또는 데이터 변경
```

### 5.2 이벤트 등록 방식 3가지

#### HTML 속성 방식

```html
<button onclick="alertAction()">알림 버튼</button>
```

- 태그에 이벤트 속성을 직접 작성한다.
- HTML과 JavaScript가 섞여 커질수록 관리하기 어렵다.

#### DOM 프로퍼티 방식

```javascript
const button = document.getElementById("action-btn");
button.onclick = function () {
  console.log("처리 완료");
};
```

- JavaScript에서 DOM 객체의 이벤트 프로퍼티에 함수를 대입한다.
- 같은 프로퍼티에 새 함수를 대입하면 기존 함수가 교체된다.

#### `addEventListener()` 방식

```javascript
button.addEventListener("click", function (event) {
  console.log(event.currentTarget);
});
```

- 하나의 요소와 이벤트에 여러 리스너를 누적 등록할 수 있다.
- 이벤트 종류, 실행 함수, 전파 단계를 분리해서 지정할 수 있다.

```javascript
target.addEventListener(type, listener, useCapture);
```

- `target`: 이벤트를 감지할 DOM 객체
- `type`: `"click"`, `"keydown"` 같은 이벤트 이름
- `listener`: 이벤트가 발생하면 실행할 함수
- `useCapture`: `true`면 캡처링, 기본값 `false`면 버블링 단계에서 실행

### 5.3 이벤트 리스너 제거

```javascript
function processEvent() {
  console.log("한 번 실행");
  button.removeEventListener("click", processEvent);
}

button.addEventListener("click", processEvent);
```

- 제거할 때는 등록할 때 사용한 것과 같은 함수 참조가 필요하다.
- 나중에 제거해야 하는 리스너를 익명 함수로 바로 등록하면 같은 함수 참조를 다시 전달하기 어렵다.

### 5.4 마우스 이벤트

| 이벤트 | 발생 시점 |
|---|---|
| `mousedown` | 마우스 버튼을 누르는 순간 |
| `mouseup` | 눌렀던 버튼에서 손을 떼는 순간 |
| `click` | 같은 요소에서 누르기와 떼기가 완료된 뒤 |
| `dblclick` | 짧은 시간 안에 두 번 클릭했을 때 |
| `mousemove` | 요소 안에서 포인터가 움직이는 동안 |
| `mouseover` | 포인터가 요소 내부로 들어올 때 |
| `mouseout` | 포인터가 요소 밖으로 나갈 때 |
| `scroll` | 문서나 요소를 스크롤할 때 |

마우스 좌표는 기준점에 따라 값이 달라진다.

| 프로퍼티 | 기준 |
|---|---|
| `screenX`, `screenY` | 모니터 화면 |
| `clientX`, `clientY` | 현재 브라우저 뷰포트 |
| `pageX`, `pageY` | 스크롤 영역을 포함한 전체 문서 |
| `offsetX`, `offsetY` | 이벤트가 발생한 요소의 경계 |

### 5.5 키보드 이벤트

| 이벤트 | 발생 시점 |
|---|---|
| `keydown` | 키를 누르는 순간, 누르고 있으면 반복 발생 가능 |
| `keypress` | 문자 입력 중심의 과거 이벤트로 사용이 권장되지 않음 |
| `keyup` | 키에서 손을 떼는 순간 |

주요 이벤트 객체 프로퍼티:

- `key`: 사용자가 입력한 의미상의 키 값 (`"a"`, `"Enter"`)
- `code`: 키보드의 물리적 위치 (`"KeyA"`, `"Enter"`)
- `altKey`, `ctrlKey`, `shiftKey`: 보조키가 함께 눌렸는지 나타내는 논리값

### 5.6 기타 주요 이벤트

- `DOMContentLoaded`: DOM 트리 구축이 완료됐을 때
- `focus`: 요소가 포커스를 얻었을 때
- `blur`: 요소가 포커스를 잃었을 때
- `change`: 입력값 변경이 확정됐을 때
- `submit`: 폼 데이터가 전송되기 직전

### 5.7 이벤트 전파

```text
Window
↓ 캡처링
상위 요소
↓
이벤트가 발생한 타깃
↑ 버블링
상위 요소
↑
Window
```

1. **캡처링 단계**: 최상위 객체에서 타깃으로 내려간다.
2. **타깃 단계**: 실제 이벤트가 발생한 요소에 도달한다.
3. **버블링 단계**: 타깃에서 조상 요소 방향으로 올라간다.

### 5.8 이벤트 흐름 제어

- `event.stopPropagation()`: 현재 요소 이후 다른 요소로 이벤트가 전파되는 것을 막는다.
- `event.preventDefault()`: 링크 이동이나 폼 제출처럼 브라우저에 정의된 기본 동작을 막는다.

두 메서드는 목적이 다르다. 전파를 중지한다고 링크의 기본 이동이 자동으로 취소되는 것은 아니며, 기본 동작을 취소한다고 버블링이 자동으로 멈추는 것도 아니다.

### 5.9 이벤트 리스너의 `this`와 데이터 전달

- 일반 함수로 등록한 이벤트 리스너 안의 `this`는 기본적으로 리스너가 실행되는 DOM 요소와 연결된다.
- 객체 메서드를 리스너로 직접 전달하면 원래 객체가 아닌 DOM 요소가 `this`가 될 수 있다.
- `bind()`로 `this`를 고정하거나, 래퍼 함수 안에서 객체 메서드를 호출할 수 있다.
- 이벤트 객체 외의 값을 전달하려면 래퍼 함수를 사용해 필요한 인수를 함께 넘긴다.

## 6. 7장 2강 핵심 개념

### 6.1 동기와 비동기

- **동기 처리**: 앞 작업이 끝난 뒤 다음 작업을 시작한다.
- **비동기 처리**: 시간이 걸리는 작업을 요청한 뒤, 그 작업이 끝날 때까지 전체 JavaScript 실행을 멈추지 않고 다음 코드를 계속 처리한다.

```text
코드 작성 순서: A 요청 → B 요청 → C 요청
실제 종료 순서: 각 작업에 걸린 시간에 따라 달라질 수 있음
```

JavaScript 엔진은 한 번에 하나의 실행 흐름을 처리하지만, 타이머나 네트워크 요청 같은 작업은 브라우저의 Web API와 연결되어 비동기적으로 완료된다.

### 6.2 콜백 함수와 콜백 지옥

- 비동기 작업이 끝난 뒤 실행할 함수를 인수로 전달하면 작업 순서를 제어할 수 있다.
- 순차 작업이 많아져 콜백이 계속 중첩되면 코드 구조가 깊어지고 읽기·오류 추적·유지보수가 어려워진다.
- 이 구조적 문제를 **콜백 지옥(Callback Hell)**이라고 한다.

### 6.3 Promise

Promise는 비동기 작업의 성공 또는 실패 상태와 결과를 나타내는 객체다.

| 상태 | 의미 | 다음 처리 |
|---|---|---|
| `pending` | 작업이 아직 끝나지 않음 | 대기 |
| `fulfilled` | 작업이 성공적으로 완료됨 | `.then()` |
| `rejected` | 작업이 실패함 | `.catch()` |

```javascript
function work(title, time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (time < 0) {
        reject(`${title} 시간 설정 오류`);
      } else {
        resolve(`${title} 완료`);
      }
    }, time);
  });
}
```

Promise 체이닝에서 다음 비동기 작업의 Promise를 `return`해야 뒤의 `.then()`이 그 작업의 완료를 기다릴 수 있다.

### 6.4 여러 Promise 처리

- `Promise.all([...])`: 모든 Promise가 성공할 때까지 기다린다. 하나라도 실패하면 전체가 실패한다.
- `Promise.race([...])`: 가장 먼저 완료되거나 실패한 Promise의 결과를 사용한다.
- `Promise.resolve(value)`: 성공 상태의 Promise를 즉시 만든다.
- `Promise.reject(error)`: 실패 상태의 Promise를 즉시 만든다.

### 6.5 `async`와 `await`

- `async` 함수는 Promise 기반으로 동작한다.
- `await`는 해당 Promise의 처리가 끝날 때까지 그 `async` 함수 내부의 다음 진행을 기다리게 한다.
- Promise의 실패는 `try`·`catch`로 처리할 수 있다.

```javascript
async function startProcess() {
  try {
    const resultA = await work("A 작업", 2000);
    const resultB = await work("B 작업", 1000);
    console.log(resultA, resultB);
  } catch (error) {
    console.log("오류:", error);
  }
}
```

`await`가 JavaScript 전체를 멈추는 것은 아니다. 해당 `async` 함수의 이어지는 실행을 기다리게 하며, 브라우저는 다른 이벤트와 작업을 처리할 수 있다.

### 6.6 `fetch()` GET 요청

```javascript
async function loadPostData() {
  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    const post = await response.json();
    console.log(post.title);
  } catch (error) {
    console.log("조회 오류:", error);
  }
}
```

실행 흐름:

```text
URL 준비
→ fetch로 HTTP 요청
→ Response 객체 수신
→ response.json()으로 응답 본문 변환
→ JavaScript 객체의 프로퍼티 사용
```

### 6.7 `fetch()` POST 요청

```javascript
const newPost = {
  title: "신입생 공지사항",
  body: "행사 안내",
  userId: 101
};

const response = await fetch(postUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=UTF-8"
  },
  body: JSON.stringify(newPost)
});
```

핵심 흐름:

```text
JavaScript 객체 준비
→ JSON.stringify()로 JSON 문자열 직렬화
→ method·headers·body 설정
→ fetch로 전송
→ 서버 응답 수신
→ response.json()으로 결과 변환
```

### 6.8 타이머 Web API

- `setTimeout(callback, delay)`: 지정된 시간이 지난 뒤 한 번 실행한다.
- `setInterval(callback, delay)`: 지정된 간격마다 반복 실행한다.
- 두 함수는 타이머 ID를 반환한다.
- `clearTimeout(id)`와 `clearInterval(id)`로 필요 없어진 타이머를 취소한다.

## 7. 핵심 용어

| 용어 | 의미 |
|---|---|
| Event | 사용자 행동이나 페이지 상태 변화 |
| Event Listener | 이벤트 발생 시 실행할 함수 |
| Event Object | 이벤트 종류·대상·좌표·키 등의 정보를 담은 객체 |
| Capturing | 상위 객체에서 타깃으로 내려가는 전파 단계 |
| Bubbling | 타깃에서 상위 요소로 올라가는 전파 단계 |
| Callback | 다른 함수에 전달되어 나중에 호출되는 함수 |
| Promise | 비동기 작업의 상태와 결과를 표현하는 객체 |
| Serialization | 객체를 통신 가능한 문자열 형태로 바꾸는 과정 |
| fetch API | 브라우저에서 HTTP 요청과 응답을 처리하는 Web API |
| Timer ID | 등록된 타이머를 식별하고 취소할 때 사용하는 값 |

## 8. 예상 난점

1. 이벤트 등록 방식 3가지의 문법과 등록 가능한 리스너 수를 섞기 쉽다.
2. `event.target`과 `event.currentTarget`은 중첩 요소에서 서로 달라질 수 있다.
3. 캡처링과 버블링의 이동 방향을 반대로 기억하기 쉽다.
4. `stopPropagation()`과 `preventDefault()`의 목적을 혼동하기 쉽다.
5. 코드가 작성된 순서, 작업이 접수된 순서, 실제 완료 순서는 같지 않을 수 있다.
6. Promise를 생성하는 것과 Promise의 결과를 사용하는 것을 구분해야 한다.
7. `.then()` 안에서 다음 Promise를 반환하지 않으면 의도한 순차 흐름이 끊길 수 있다.
8. `response` 객체와 `response.json()`으로 변환한 실제 데이터 객체를 구분해야 한다.
9. POST 요청에서는 JavaScript 객체를 `JSON.stringify()`로 직렬화해야 한다.
10. 타이머 등록 후 필요할 때 해제하지 않으면 불필요한 반복 작업이 계속될 수 있다.

## 9. 예정 실습

### 실습 1 — 이벤트 등록과 제거

- 버튼에 두 개의 `click` 리스너 등록
- 클릭 시 두 함수가 모두 실행되는지 확인
- 기명 함수로 등록한 리스너 하나를 제거
- 제거 전후 콘솔 출력 비교

### 실습 2 — 이벤트 전파

- 부모 `div`와 자식 `button`에 각각 리스너 등록
- 캡처링·타깃·버블링 순서를 콘솔에서 확인
- `stopPropagation()` 적용 전후 비교
- 링크에 `preventDefault()`를 적용해 기본 이동 취소 확인

### 실습 3 — 이벤트 객체

- 마우스 이동 시 `clientX/Y`와 `offsetX/Y` 출력
- 키 입력 시 `key`, `code`, 보조키 상태 출력
- `target`과 `currentTarget` 비교

### 실습 4 — 비동기 실행 순서

- 시간이 다른 `setTimeout()` 세 개 등록
- 코드 작성 순서와 실제 출력 순서 비교
- 콜백 중첩과 Promise 체이닝 구조 비교

### 실습 5 — Promise와 `async`·`await`

- 같은 작업을 `.then()` 체이닝과 `async`·`await` 두 방식으로 작성
- 성공과 실패 흐름을 각각 확인
- `try`·`catch`에서 오류가 처리되는 위치 확인

### 실습 6 — `fetch()`

- JSONPlaceholder에서 게시글 하나를 GET으로 조회
- 제목과 본문을 콘솔에 출력
- JavaScript 객체를 JSON 문자열로 바꿔 POST 요청
- 서버가 반환한 응답 객체 확인

> 실습 상태: 모두 예정. 브라우저 실행, 콘솔 출력, 네트워크 응답 및 오류 해결 결과는 아직 확인하지 않았다.

## 10. 수업 전 확인할 질문

1. HTML 속성·DOM 프로퍼티·`addEventListener()` 방식은 각각 어떤 상황에서 코드 관리가 달라지는가?
2. 자식 버튼을 클릭했는데 부모 요소의 `click` 함수도 실행되는 이유는 무엇인가?
3. 이벤트 전파를 막는 것과 링크·폼의 기본 동작을 막는 것은 왜 별도 제어인가?
4. `setTimeout()`이 2초로 설정되어 있어도 정확히 2초에 실행된다고 단정할 수 있는가?
5. Promise는 비동기 작업 자체인가, 아니면 그 작업의 상태와 결과를 다루는 객체인가?
6. `await fetch()`와 `await response.json()`을 두 번 나누어 기다리는 이유는 무엇인가?
7. GET 응답을 읽을 때와 POST 데이터를 보낼 때 JSON 변환 방향은 어떻게 다른가?

## 11. 오늘 수업에서 관찰할 실행 흐름

```text
[이벤트]
DOM 요소 선택
→ 리스너 등록
→ 사용자 행동
→ 이벤트 객체 전달
→ 콜백 실행
→ DOM 변경

[비동기 통신]
요청 데이터 준비
→ fetch 호출
→ Promise 대기
→ Response 수신
→ JSON 변환
→ 결과 사용 또는 오류 처리
```

## 12. 예습 완료 경계

- 완료: 두 교안의 전체 범위 검토, 학습 목표·구조·선행 개념·핵심 용어·예상 난점·예정 실습 정리
- 미실행: 교안 예제 코드, 브라우저 이벤트, 콘솔 출력, Promise 실행, 네트워크 요청
- 미평가: 사용자의 개념 이해도와 독립 적용 능력
- 기록 원칙: 예제와 실습은 실제 실행 근거가 생기면 별도 Practice에 기록
