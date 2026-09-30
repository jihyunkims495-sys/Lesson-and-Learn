# Preview Notes — 브라우저 실행 흐름과 BOM·DOM 제어

- 날짜: 2026-09-30
- Level / Week: LV.2 / Week 8
- 과정: 프론트엔드 개발
- 범위: 6장 1강 — 브라우저 렌더링 엔진과 브라우저 객체 모델(BOM) / 6장 2강 — DOM 객체 트리 탐색 및 문서 요소 동적 제어
- 상태: 비공개 교안 2개, 총 21쪽을 확인한 예습 정리

## 오늘의 학습 목표

- 브라우저가 HTML을 읽어 DOM을 만들고 화면을 그리는 흐름을 설명한다.
- `DOMContentLoaded`와 `load`, 일반 스크립트와 `async`·`defer`의 실행 시점을 구분한다.
- `window`를 최상위로 하는 BOM 객체의 역할을 구분한다.
- 동일 출처 정책(SOP)이 창 사이의 DOM 접근을 제한하는 기준을 설명한다.
- DOM 트리에서 요소를 선택하고 속성·내용·스타일을 바꾼다.
- 새 노드를 생성한 뒤 DOM에 삽입하거나 기존 노드를 삭제하는 순서를 추적한다.
- 모든 노드를 다루는 탐색과 요소 노드만 다루는 탐색을 구분한다.

## 전체 학습 구조

```text
HTML 수신
→ Window·Document 생성
→ HTML 파싱과 DOM 트리 구축
→ CSS 규칙과 DOM을 결합해 렌더 트리 생성
→ Layout과 Paint
→ DOMContentLoaded와 load
→ window 아래의 BOM 객체 제어
→ document 아래의 DOM 트리 탐색
→ 요소 선택
→ 속성·내용·스타일 변경
→ 노드 생성·삽입·삭제
```

핵심 연결은 다음과 같다.

```text
BOM: 브라우저 환경을 제어
window
├─ location
├─ history
├─ navigator
├─ screen
└─ document
   └─ DOM: HTML 문서 구조를 제어
```

## 이전 학습과의 연결

전날 학습한 함수는 오늘 브라우저 이벤트와 DOM 조작에서 실제 동작 단위가 된다.

```javascript
const button = document.querySelector("#changeBtn");

button.addEventListener("click", function () {
  document.querySelector("#title").textContent = "변경 완료";
});
```

- `function () { ... }`는 클릭이 일어났을 때 실행할 콜백 함수다.
- 함수를 정의하는 시점과 브라우저가 나중에 호출하는 시점을 구분해야 한다.
- 함수가 호출되면 요소를 찾고, 상태를 바꾸고, 화면에 반영한 뒤 호출 위치로 복귀한다.

## 1강. 브라우저 렌더링 엔진과 BOM

### 1. 브라우저가 화면을 만드는 흐름

교안은 브라우저 실행 흐름을 9단계로 나눈다.

| 순서 | 핵심 상태 |
|---|---|
| 1 | 탭의 최상위 전역 객체인 `window` 생성 |
| 2 | `document` 생성, `document.readyState`가 `loading` |
| 3 | HTML을 위에서 아래로 파싱하며 DOM 트리 구축 |
| 4 | 일반 `<script>`를 만나면 파싱을 멈추고 다운로드·실행 |
| 5 | HTML 파싱 완료, `readyState`가 `interactive` |
| 6 | `DOMContentLoaded` 발생 |
| 7 | 이미지 등 외부 리소스 완료 대기 |
| 8 | 모든 리소스 완료 후 `readyState`가 `complete` |
| 9 | `window`의 `load` 발생 후 사용자 이벤트 등을 대기 |

화면 렌더링은 다음 흐름으로 이해한다.

```text
HTML → DOM 트리
CSS → 스타일 규칙
DOM + 스타일 규칙 → Render Tree
Render Tree → Layout(크기·위치 계산) → Paint(그리기)
```

### 2. `DOMContentLoaded`와 `load`

| 이벤트 | 의미 | 기다리지 않는 것 / 기다리는 것 |
|---|---|---|
| `DOMContentLoaded` | HTML 파싱과 DOM 구축 완료 | 일반적인 이미지 로딩은 기다리지 않음 |
| `load` | 문서와 이미지 등 종속 리소스 로딩 완료 | 외부 리소스 완료까지 기다림 |

```javascript
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 조작 가능", document.readyState);
});

window.addEventListener("load", () => {
  console.log("외부 리소스까지 완료", document.readyState);
});
```

코치 보충: `defer` 스크립트와 모듈 스크립트는 실행을 마친 뒤 `DOMContentLoaded`가 발생한다. 비동기로 늦게 실행되는 코드는 이벤트가 이미 지나갔을 가능성이 있으므로 필요하면 `document.readyState`도 함께 확인한다.

### 3. 일반 스크립트·`async`·`defer` 비교

| 방식 | 다운로드 | 실행 시점 | 파일 순서 | 주의점 |
|---|---|---|---|---|
| 일반 `<script src>` | 파싱을 막을 수 있음 | 다운로드 직후 | 문서 순서 | DOM이 아직 만들어지지 않았을 수 있음 |
| `async` | 파싱과 병렬 | 다운로드 완료 즉시 | 보장되지 않음 | 실행 순간 파싱이 멈출 수 있음 |
| `defer` | 파싱과 병렬 | HTML 파싱 완료 후 | 문서 순서 유지 | DOM 초기화 코드에 적합 |

`async`와 `defer`는 `src`가 있는 외부 스크립트에서 비교한다.

### 4. `window`와 BOM 계층

| 객체 | 담당 영역 |
|---|---|
| `window` | 현재 브라우징 컨텍스트의 최상위 전역 객체 |
| `document` | 현재 HTML 문서와 DOM |
| `location` | 현재 URL의 조회와 이동 |
| `history` | 현재 탭의 세션 방문 기록 |
| `navigator` | 브라우저·언어·연결 상태 정보 |
| `screen` | 모니터의 전체·가용 크기 정보 |

브라우저의 일반 클래식 스크립트에서는 `window.document`를 `document`처럼 줄여 쓸 수 있다.

주의할 조건:

- 최상위 클래식 스크립트의 `this`와 ES 모듈 최상위의 `this`는 같지 않다. 모듈의 최상위 `this`는 `undefined`다.
- `parent === window`는 현재 문서가 최상위 창일 때의 설명이다. `iframe` 내부에서는 `parent`가 부모 창을 가리킨다.
- `window.open()`의 팝업은 브라우저 설정과 사용자 동작 여부에 따라 차단될 수 있다.

### 5. 동일 출처 정책(SOP)

두 URL의 다음 세 요소가 같아야 같은 출처다.

```text
scheme(protocol) + host + port
```

부모 창과 자식 창이 서로의 DOM을 직접 읽거나 수정하려면 동일 출처 조건을 만족해야 한다. 서로 다른 출처 사이의 메시지 교환이 필요하면 직접 DOM 접근이 아니라 `window.postMessage()` 같은 명시적 통신 방식을 사용한다.

### 6. URL과 방문 기록

| API | 결과 |
|---|---|
| `location.assign(url)` | 새 주소로 이동하고 현재 페이지를 방문 기록에 남김 |
| `location.replace(url)` | 현재 기록을 새 주소로 대체 |
| `location.reload()` | 현재 페이지 새로고침 |
| `history.back()` | 한 단계 이전 기록으로 이동 |
| `history.forward()` | 한 단계 다음 기록으로 이동 |
| `history.go(n)` | 지정한 상대 단계로 이동 |
| `history.pushState(...)` | 새로고침 없이 상태와 URL 기록 추가 |

예습 단계에서는 실제 외부 페이지 이동을 실행하지 않는다. 수업 실습에서는 별도의 테스트 페이지와 뒤로 가기 가능 여부를 확인한다.

### 7. 화면·스크롤·스타일 정보

- `window.scrollY`와 `pageYOffset`: 문서가 세로로 스크롤된 거리
- `screen.width`, `screen.height`: 전체 화면 크기
- `screen.availWidth`, `screen.availHeight`: 운영체제 UI를 제외한 가용 크기
- `element.style`: 인라인 스타일의 조회·수정
- `getComputedStyle(element)`: 최종 계산된 스타일을 읽는 객체
- `classList`: 클래스의 `add`, `remove`, `toggle`, `contains`

## 2강. DOM 트리 탐색과 문서 요소 제어

### 1. DOM 트리와 노드

DOM은 HTML 문서를 자바스크립트가 다룰 수 있는 객체 트리로 바꾼 구조다.

| 노드 | 의미 |
|---|---|
| Document Node | 트리 최상단의 `document` |
| Element Node | HTML 태그를 객체화한 노드 |
| Text Node | 요소 내부의 실제 문자 데이터 |

HTML의 줄바꿈과 들여쓰기도 텍스트 노드가 될 수 있다. 이 때문에 `firstChild`가 기대한 태그가 아니라 공백 텍스트를 가리킬 수 있다.

### 2. 모든 노드 탐색과 요소만 탐색

| 모든 노드 포함 | 요소 노드만 선택 |
|---|---|
| `parentNode` | `parentElement` |
| `childNodes` | `children` |
| `firstChild` / `lastChild` | `firstElementChild` / `lastElementChild` |
| `nextSibling` / `previousSibling` | `nextElementSibling` / `previousElementSibling` |

태그만 찾고 싶다면 `Element`가 붙은 탐색 프로퍼티가 공백 노드의 영향을 피하기 쉽다.

### 3. 요소 선택과 live/static 차이

| 선택 API | 반환값 | 갱신 특성 |
|---|---|---|
| `getElementById()` | 요소 하나 또는 `null` | 단일 참조 |
| `getElementsByTagName()` | `HTMLCollection` | live |
| `getElementsByClassName()` | `HTMLCollection` | live |
| `getElementsByName()` | 목록 | 문서 상태와 함께 변할 수 있음 |
| `querySelector()` | 첫 번째 요소 또는 `null` | 단일 참조 |
| `querySelectorAll()` | `NodeList` | static 스냅샷 |

live 컬렉션을 순회하면서 요소를 추가·삭제하면 길이와 인덱스가 동시에 바뀔 수 있다. 변경할 대상이 고정되어야 한다면 `querySelectorAll()` 또는 `Array.from()`으로 스냅샷을 만든다.

### 4. 속성과 내용 변경

```javascript
const title = document.querySelector("#mainTitle");
const link = document.querySelector("#targetLink");

title.textContent = "변경된 제목";
link.setAttribute("href", "https://example.com");
```

| API | 역할 |
|---|---|
| `getAttribute(name)` | 속성값 읽기 |
| `setAttribute(name, value)` | 속성 추가·변경 |
| `hasAttribute(name)` | 속성 존재 여부 확인 |
| `removeAttribute(name)` | 속성 제거 |
| `textContent` | 입력을 텍스트로 처리 |
| `innerHTML` | 입력을 HTML로 파싱해 DOM으로 교체 |

보안 주의: 사용자 입력이나 외부 데이터처럼 신뢰할 수 없는 문자열을 `innerHTML`에 바로 넣으면 XSS 위험이 있다. 단순 텍스트는 `textContent`를 우선한다.

### 5. 노드 생성·삽입·삭제

```javascript
const list = document.querySelector("#productList");
const item = document.createElement("li");

item.textContent = "셔츠";
list.append(item);
```

실행 흐름:

```text
부모 요소 선택
→ createElement()로 메모리에 새 노드 생성
→ 새 노드의 속성·내용 설정
→ append()/prepend()/appendChild()로 DOM에 연결
→ 브라우저가 변경된 화면을 반영
```

| 과거 표준 | 현대적 메서드 | 핵심 차이 |
|---|---|---|
| `appendChild(node)` | `append(node, text, ...)` | `append`는 여러 값과 문자열을 받을 수 있음 |
| `insertBefore(new, ref)` | `prepend(node, text, ...)` | `prepend`는 맨 앞에 추가 |
| `parent.removeChild(child)` | `element.remove()` | `remove`는 대상 요소에서 직접 호출 |
| `replaceChild(new, old)` | 상황에 맞는 교체 API | 기존·새 노드의 위치를 추적해야 함 |

### 6. 좌표와 폼·CSS 제어

- `getBoundingClientRect()`는 현재 뷰포트를 기준으로 요소의 `top`, `left`, `width`, `height` 등을 반환한다.
- 문서 전체 기준 좌표가 필요하면 뷰포트 좌표에 현재 스크롤 값을 함께 고려한다.
- 폼 값은 `document.forms`나 명시적인 선택 API로 접근할 수 있다.
- 교안의 `폼이름.입력항목이름.value` 단축 방식도 확인하되, 실제 코드에서는 출처가 분명한 `document.forms.namedItem()`이나 `querySelector()`가 읽기 쉽고 충돌을 줄이는지 비교한다.
- 스타일을 여러 번 바꿀 때는 인라인 속성 변경보다 CSS 클래스를 만들고 `classList`로 상태를 전환하는 방식이 유지보수에 유리하다.

## 핵심 비교표

| 헷갈리기 쉬운 쌍 | 구분 기준 |
|---|---|
| BOM / DOM | 브라우저 환경 / HTML 문서 구조 |
| `DOMContentLoaded` / `load` | DOM 구축 완료 / 외부 리소스까지 완료 |
| `async` / `defer` | 다운로드 즉시·순서 미보장 / 파싱 후·순서 유지 |
| `childNodes` / `children` | 텍스트·공백 포함 / 요소만 포함 |
| `querySelectorAll()` / `getElementsByClassName()` | static `NodeList` / live `HTMLCollection` |
| `textContent` / `innerHTML` | 텍스트 처리 / HTML 파싱과 교체 |
| `appendChild()` / `append()` | 노드 하나 / 여러 노드와 문자열 |
| `removeChild()` / `remove()` | 부모에서 자식 제거 / 요소가 자기 자신 제거 |
| `element.style` / `getComputedStyle()` | 인라인 스타일 수정 / 최종 계산 스타일 읽기 |
| 뷰포트 좌표 / 문서 좌표 | 현재 화면 기준 / 문서 전체 기준 |

## 예상 난점

- HTML 파싱, DOM 생성, 렌더 트리, Layout, Paint를 한 과정으로 섞어 이해하는 것
- `DOMContentLoaded`와 `load`의 대기 대상을 혼동하는 것
- `async`와 `defer`의 다운로드 방식만 보고 실행 순서 차이를 놓치는 것
- `window`, `document`, HTML 요소 객체의 계층을 혼동하는 것
- 공백 텍스트 노드 때문에 `firstChild`의 결과가 예상과 달라지는 것
- `HTMLCollection`과 `NodeList`를 실제 배열로 생각하는 것
- 노드를 생성한 순간 화면에도 이미 추가되었다고 생각하는 것
- `innerHTML`에 외부 입력을 그대로 넣는 것
- 요소 좌표가 뷰포트 기준인지 문서 기준인지 놓치는 것
- `window.open()`과 창 크기 제어가 모든 브라우저에서 항상 허용된다고 생각하는 것

## 예정 실습

아래 항목은 교안에 제시된 예정 실습이며 아직 실행 완료로 기록하지 않는다.

1. `DOMContentLoaded`와 `load`의 발생 순서 및 `readyState` 확인
2. 일반 스크립트·`async`·`defer` 실행 순서 비교
3. 현재 스크롤 위치 출력
4. 팝업 창 생성·상태 확인·닫기와 SOP 조건 확인
5. `assign()`과 `replace()`의 방문 기록 차이 비교
6. DOM에서 `childNodes`와 `children` 결과 비교
7. 요소의 텍스트와 링크 속성 변경
8. `appendChild()`·`append()`·`prepend()`·`remove()` 비교
9. 폼 입력값 출력과 `classList.toggle()` 적용

## 수업 전 확인 질문

1. HTML 파싱 중 일반 `<script>`를 만나면 브라우저에는 어떤 일이 일어나는가?
2. `DOMContentLoaded`와 `load`는 각각 무엇을 기다리는가?
3. 여러 외부 스크립트의 실행 순서가 중요하다면 `async`와 `defer` 중 무엇을 먼저 검토해야 하는가?
4. `location`, `history`, `navigator`, `document`는 어떤 객체 아래에 있는가?
5. 동일 출처를 판단하는 세 가지 URL 요소는 무엇인가?
6. `childNodes`와 `children`의 결과가 달라지는 이유는 무엇인가?
7. `querySelectorAll()`과 `getElementsByClassName()`의 목록은 DOM 변경 후 어떻게 다른가?
8. `createElement()`로 만든 노드가 화면에 보이려면 어떤 단계가 더 필요한가?
9. 사용자 입력은 왜 `innerHTML`보다 `textContent`로 넣는 편이 안전한가?
10. `appendChild()`·`append()`·`prepend()`·`remove()`는 각각 누구에게 호출하고 어디를 바꾸는가?

## 추후 확인 항목

- [ ] 브라우저 실행 흐름을 DOM 구축과 화면 그리기로 나누어 설명한다.
- [ ] `async`와 `defer`의 실행 시점을 예측한다.
- [ ] BOM과 DOM의 계층을 직접 그린다.
- [ ] 콜백 함수가 브라우저 이벤트에서 언제 호출되는지 추적한다.
- [ ] 공백 노드가 있는 HTML에서 `firstChild`와 `firstElementChild`를 비교한다.
- [ ] live 컬렉션을 순회하면서 DOM을 변경할 때 생길 수 있는 문제를 설명한다.
- [ ] 요소 선택 → 내용 설정 → DOM 삽입 흐름을 코드 한 줄씩 추적한다.
- [ ] 외부 입력을 DOM에 반영할 때 안전한 API를 선택한다.

## 교안 출처와 확인 범위

- `6장 1강. 브라우저 렌더링 엔진과 브라우저 객체 모델(BOM).pdf`, 1~12쪽 전체
  - 브라우저 실행 순서, `async`·`defer`, 렌더 트리, `window` 계층, 팝업과 SOP, Location·History, Navigator·Screen, 스타일 제어, 개념 확인
- `6장 2강. DOM 객체 트리 탐색 및 문서 요소 동적 제어.pdf`, 1~9쪽 전체
  - Document와 DOM 노드, 계층 탐색, 선택 API, 속성·내용 변경, 노드 생성·삽입·삭제, 좌표, 폼과 `classList`, 개념 확인

### 공식 보충 자료

- [MDN — DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event)
- [MDN — script 요소의 async·defer](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)
- [MDN — 동일 출처 정책](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)
- [MDN — DOM 선택과 탐색](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Selection_and_traversal_on_the_DOM_tree)
- [MDN — innerHTML 보안 주의](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)

## 예습 범위의 한계

- 이 문서는 2026-09-30의 프론트엔드 개발 6장 1강·2강만 다룬다.
- 교안 코드와 위 실습은 예습 대상으로 정리했으며 실제 실행 결과가 아니다.
- 교안의 브라우저 전역 참조와 팝업 제어 설명에는 실행 문맥·브라우저 정책에 따른 조건이 있으므로 수업 실습에서 확인한다.
- 실제 수업 질문, 코드, 오류와 해결 결과는 오늘 학습 중 별도로 누적한다.
- 비공개 교안 PDF는 공개 저장소에 복사하지 않는다.
