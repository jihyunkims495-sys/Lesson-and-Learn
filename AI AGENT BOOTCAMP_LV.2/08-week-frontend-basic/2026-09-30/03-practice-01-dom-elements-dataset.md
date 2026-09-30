# Practice — DOM 요소와 `dataset` 예제 확인

- 날짜: 2026-09-30
- Level / Week: LV.2 / Week 8
- 범위: 프론트엔드 개발 6장
- 수행 형태: 수업 예제를 VS Code에 직접 입력하고 요소·속성·DOM 객체 관계를 질문함
- 실행 상태: 브라우저 출력과 오류 해결 결과는 확인되지 않음

## 수업 중 다룬 코드

```html
<form name="frmOrder">
  <input type="cart" name="mode">
</form>
<ul>
  <li class="menu">메뉴1</li>
  <li class="menu">메뉴2</li>
  <li class="menu">메뉴3</li>
</ul>
<input type="text" id="input" data-price="10000">
```

브라우저가 HTML을 해석하면 `form`, `input`, `ul`, `li` 각각에 대응하는 DOM 객체를 만든다.

```javascript
const input = document.querySelector("#input");
const menus = document.querySelectorAll(".menu");

console.log(input.dataset.price);
console.log(menus.length);
```

## 질문을 통해 정리한 내용

```text
input.value          → 사용자가 입력창에 입력한 값
input.dataset.price  → data-price에 저장된 문자열 "10000"
```

`type="text"`는 입력창 종류를 정한다. `data-price`는 입력창을 만드는 데 필요한 값이 아니라 JavaScript가 읽을 추가 데이터다. 이를 사용하는 JavaScript가 없다면 화면이나 기능에는 변화가 없다.

```html
<div data-product-id="A001" data-stock="20"></div>
```

```javascript
element.dataset.productId;
element.dataset.stock;
```

`data-` 뒤의 이름은 목적에 맞게 정할 수 있고, 하이픈으로 연결한 이름은 JavaScript에서 camelCase 프로퍼티로 읽는다.

## 수행 근거와 한계

- 확인됨: 수업 코드를 VS Code에 직접 입력함.
- 확인됨: 위 HTML 코드를 공유하고 `data-price`와 `dataset`의 역할을 질문함.
- 미확인: 실제 파일 경로, 브라우저 화면, 콘솔 출력, 오류 발생과 해결 과정.

이 기록은 코드 입력과 개념 추적 활동을 보존하지만 실행 성공이나 오류 해결 완료를 주장하지 않는다.
