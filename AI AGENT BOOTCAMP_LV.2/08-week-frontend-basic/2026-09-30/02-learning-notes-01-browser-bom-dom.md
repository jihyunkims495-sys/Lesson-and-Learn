# 프론트엔드 개발 6장 학습 정리 — 브라우저·BOM·DOM

- 학습 날짜: 2026-09-30
- Level / Week: LV.2 / Week 8
- 실제 범위: 프론트엔드 개발 6장 전체(1강·2강)
- 학습 형태: 강의 수강, VS Code 예제 입력, 수업 중 개념 질의
- 실행 근거: 구체적인 브라우저 출력이나 오류 해결 결과는 확인되지 않음

## 오늘 배운 전체 구조

```text
브라우저가 HTML을 읽음
→ window와 document 객체 생성
→ HTML 요소를 DOM 객체로 변환
→ DOM 트리 구성
→ CSS와 결합해 화면을 그림
→ JavaScript가 객체의 프로퍼티와 메서드로 화면을 제어
```

6장 1강에서는 브라우저가 문서를 불러오고 화면을 만드는 흐름과 BOM을, 2강에서는 DOM 트리를 탐색하고 요소를 선택·변경·추가·삭제하는 방법을 다뤘다.

## HTML 요소와 DOM 객체

HTML의 `body`, `div`, `span`은 태그로 만든 요소다. 브라우저가 HTML을 해석하면 각 요소에 대응하는 DOM 객체가 생긴다.

```text
document 객체
└── body 요소 객체
    └── div 요소 객체
        └── span 요소 객체
            └── 텍스트 노드
```

같은 `span` 태그가 여러 개 있어도 각각은 서로 다른 DOM 객체다. JavaScript는 선택 API로 원하는 객체를 찾고 그 객체의 프로퍼티와 메서드를 사용한다.

## 요소·속성·프로퍼티·메서드

```html
<input type="text" id="input" data-price="10000">
```

| 구분 | 예시 | 의미 |
|---|---|---|
| 요소 | `<input ...>` | 화면을 구성하는 HTML 부품 |
| HTML 속성 | `type`, `id`, `data-price` | 태그에 작성한 설정과 추가 정보 |
| DOM 프로퍼티 | `input.value`, `input.id` | DOM 객체가 가진 현재 정보 |
| DOM 메서드 | `input.remove()` | DOM 객체가 수행하는 기능 |

```javascript
const input = document.querySelector("#input");

console.log(input.value);         // 사용자가 입력한 값
console.log(input.dataset.price); // "10000"
```

`data-price`는 입력창에 보이는 값이 아니라 요소에 붙인 사용자 정의 데이터다. 현재 코드에 이를 읽는 JavaScript가 없다면 화면이나 입력창 기능에는 영향을 주지 않는다. `price`는 고정된 이름이 아니므로 `data-name`, `data-product-id`, `data-stock`처럼 목적에 맞게 정할 수 있다.

## 브라우저 실행 흐름과 BOM

- `window`는 현재 브라우저 탭의 최상위 객체다.
- `document`는 현재 HTML 문서를 표현하는 객체다.
- `DOMContentLoaded`는 DOM 구축 완료, `load`는 이미지 등 외부 리소스까지 완료된 시점과 연결된다.
- `async`는 다운로드 완료 즉시 실행하며 파일 순서가 보장되지 않는다.
- `defer`는 HTML 파싱 완료 뒤 문서 순서대로 실행된다.

```text
window
├── location
├── history
├── navigator
├── screen
└── document
    └── DOM 트리
```

BOM은 URL·방문 기록·브라우저와 화면 정보를, DOM은 HTML 문서 구조와 내용을 제어한다.

## DOM 탐색과 제어

- `getElementById()`·`querySelector()`: 요소 하나 선택
- `querySelectorAll()`: 정적인 `NodeList` 선택
- `getElementsByClassName()`: 실시간으로 바뀌는 `HTMLCollection` 선택
- `childNodes`: 공백과 텍스트 노드까지 포함
- `children`: 요소 노드만 포함
- `textContent`: 글자를 텍스트로 처리
- `innerHTML`: 문자열을 HTML로 해석
- `setAttribute()`·`classList`: 속성과 CSS 클래스 제어

```javascript
const list = document.querySelector("ul");
const item = document.createElement("li");

item.textContent = "메뉴4";
list.append(item);
```

`createElement()`는 메모리에 요소 객체를 만들 뿐이다. `append()`나 `prepend()`로 DOM 트리에 연결해야 화면에 나타난다.

## 어려웠던 부분과 다음 학습

요소·객체·속성·프로퍼티·메서드가 함께 등장하고 관련 API가 많아 한 번에 관계를 잡기 어려웠다. 다음 복습에서는 하나의 HTML 파일에서 다음 흐름을 차례로 실행한다.

```text
요소 선택
→ value·textContent·dataset 읽기
→ 내용과 속성 변경
→ 새 요소 생성과 삽입
→ 요소 삭제
```

수업 예제를 VS Code에 직접 입력했다는 사용자 보고는 있지만 저장된 코드, 브라우저 출력과 오류 해결 결과는 확인되지 않았다. 따라서 실행 성공이나 독립 적용 능력은 평가하지 않는다.
