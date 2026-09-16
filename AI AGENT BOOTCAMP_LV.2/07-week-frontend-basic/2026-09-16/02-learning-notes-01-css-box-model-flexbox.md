# Learning Notes — CSS 선택자부터 Flexbox 정렬까지

- 날짜: 2026-09-16
- Level / Week: LV.2 / Week 7
- 실제 진도: 프론트엔드 개발 3장 1강의 Flexbox 1차원 정렬까지
- 확인 방식: 수업 실습 HTML 코드 정적 검토

## 실제 수업 범위

오늘 코드에서는 CSS 선택자, 상대 단위, 박스 모델, `display`, Flexbox 정렬을 순서대로 실습했다.

| 파일 | 확인된 학습 내용 |
|---|---|
| `5.html` | 그룹·결합·속성 선택자 |
| `6.html` | `:first-child`, `:last-child`, `:nth-child(...)` |
| `7.html` | `:not(...)`, `:is(...)` |
| `8.html` | `:hover`, `:focus`, `:checked + label` |
| `9.html` | HEX 색상 |
| `11.html` | `rem`, `em` |
| `12.html` | 박스 모델과 `box-sizing` |
| `13.html` | 마진 단축 표기와 `margin: auto` |
| `14.html` | `inline-block`, `display: none`, `visibility: hidden` |
| `15.html` | `display: flex`, `justify-content`, `align-items` |

`10.html`은 확인되지 않았다. `flex-direction`, `flex-wrap`, `flex-grow`, `flex-shrink`, Grid 이후 내용은 오늘 실제 학습 완료 범위로 기록하지 않는다.

## 1. 선택자를 조합하는 방법

### 여러 선택자에 같은 선언 적용

쉼표는 여러 선택자에 같은 스타일을 적용할 때 사용한다.

```css
a, p, .greeting {
  color: green;
}
```

### 태그와 클래스 조건 결합

```css
span.greeting {
  color: orange;
}
```

`span.greeting`은 모든 `.greeting`이 아니라, `greeting` 클래스를 가진 `span`만 선택한다.

### 속성 선택자

```css
input[type] {
  border: 3px solid red;
}

input[type="number"] {
  background-color: blue;
}

a[href^="tel"] {
  background-color: gray;
}

a[href$=".com"] {
  background-color: olive;
}
```

| 문법 | 선택 대상 |
|---|---|
| `[attr]` | 해당 속성이 있는 요소 |
| `[attr="value"]` | 속성값이 정확히 같은 요소 |
| `[attr^="value"]` | 속성값이 지정 문자열로 시작하는 요소 |
| `[attr$="value"]` | 속성값이 지정 문자열로 끝나는 요소 |

## 2. 구조와 조건을 이용한 선택

```css
li:first-child { color: red; }
li:last-child { color: blue; }
li:nth-child(2n + 1) { background-color: gray; }
```

- `:first-child`: 부모의 첫 번째 자식이 조건에 맞을 때 선택
- `:last-child`: 부모의 마지막 자식이 조건에 맞을 때 선택
- `:nth-child(...)`: 부모의 모든 자식 순서를 기준으로 선택

```css
li:not(.menu5) {
  background-color: orange;
}

:is(ul, ol) a {
  color: green;
}
```

- `:not(.menu5)`: `.menu5`가 아닌 `li` 선택
- `:is(ul, ol) a`: `ul` 또는 `ol` 안의 링크 선택

## 3. 사용자 상태에 반응하는 CSS

```css
.box:hover {
  width: 300px;
  height: 300px;
}

.text:focus {
  background-color: yellow;
}
```

라디오 버튼은 같은 `name`으로 그룹을 만들고, `id`와 `label`의 `for`를 연결할 수 있다.

```html
<input type="radio" name="tab" value="menu1" id="tab-1">
<label for="tab-1">메뉴 1</label>
```

```css
input[type="radio"]:checked + label {
  background-color: #000;
  color: #fff;
}
```

`+`는 선택된 입력 요소 바로 다음의 형제 `label` 하나를 가리킨다.

## 4. HEX 색상과 상대 단위

```css
.text1 {
  color: #f00;
}
```

`#f00`은 `#ff0000`을 줄인 표현이다.

```css
html { font-size: 13px; }
.text1 { font-size: 1rem; }
.text2 { font-size: 2rem; }

.text-group { font-size: 20px; }
.text4 { font-size: 1em; }
.text5 { font-size: 2em; }
```

- `rem`: 루트 요소의 글자 크기를 기준으로 계산
- `em`: 현재 요소가 놓인 글자 크기 맥락을 기준으로 계산

## 5. 박스 모델과 `box-sizing`

```text
content → padding → border → margin
```

```css
.box {
  width: 150px;
  height: 150px;
  padding: 30px;
  border: 5px solid blue;
}

.box2 {
  box-sizing: border-box;
  width: 150px;
  height: 150px;
  padding: 30px;
  border: 5px solid red;
}
```

기본 `content-box`에서는 패딩과 테두리가 지정한 너비 밖에 더해진다. `border-box`에서는 패딩과 테두리를 지정한 너비 안에 포함한다.

마진 단축 표기는 값의 개수에 따라 적용 방향이 달라진다.

| 선언 | 적용 방식 |
|---|---|
| `margin: 10px` | 네 방향 모두 |
| `margin: 10px 20px` | 상하 / 좌우 |
| `margin: 10px 20px 30px` | 위 / 좌우 / 아래 |
| `margin: 10px 20px 30px 40px` | 위부터 시계 방향 |

너비가 정해진 블록 요소에 `margin: 100px auto`를 적용하면 남는 가로 공간을 양쪽에 나누어 가운데에 놓을 수 있다.

## 6. `display`와 숨김

`inline-block`은 인라인처럼 한 줄에 배치되면서 블록처럼 너비와 높이를 적용할 수 있다.

```css
div.box,
span.box {
  display: inline-block;
}
```

```css
.box2 { display: none; }
.box3 { visibility: hidden; }
```

| 선언 | 화면 표시 | 공간 |
|---|---|---|
| `display: none` | 숨김 | 제거됨 |
| `visibility: hidden` | 숨김 | 유지됨 |

실제 차이를 보려면 숨기는 요소에 같은 크기와 배경을 준 다음, 뒤 요소가 이동하는지 확인해야 한다.

## 7. Flexbox 정렬

부모 요소에 `display: flex`를 적용하면 자식 `li`들이 Flex 항목이 된다.

```html
<ul class="flex-list">
  <li>A</li>
  <li>B</li>
  <li>C</li>
</ul>
```

```css
.flex-list {
  display: flex;
  justify-content: space-between;
}
```

오늘 실습에서는 다음 `justify-content` 값을 각각 비교했다.

| 값 | 결과 |
|---|---|
| `flex-start` | 항목을 시작 부분에 모음 |
| `flex-end` | 항목을 끝부분에 모음 |
| `center` | 항목을 한 묶음으로 가운데에 모음 |
| `space-between` | 양 끝에 항목을 두고 항목 사이에 공간 분배 |
| `space-around` | 각 항목 양쪽에 공간 분배 |
| `space-evenly` | 바깥쪽과 항목 사이의 모든 간격을 동일하게 분배 |

`align-items`는 `flex-start`, `flex-end`, `center` 값을 적용해 컨테이너 안에서 항목 위치를 비교하는 코드로 작성했다. 브라우저 화면은 이번 정리에서 다시 실행하지 않았으므로 최종 결과를 실행 확인으로 기록하지 않는다.

## 8. 복습으로 확인한 구분

- `space-between`: 첫 항목과 마지막 항목은 양쪽 끝, 남는 공간은 항목 사이
- `space-evenly`: 바깥쪽과 항목 사이의 모든 간격이 동일
- `center`: 항목 사이에 공간을 분배하지 않고 한 묶음으로 가운데 정렬

`space-around`는 각 항목 양쪽에 공간을 주므로 바깥쪽 간격이 항목 사이 간격보다 작게 보이는지 다음 실습에서 다시 확인한다.

## 9. 코드에서 확인이 더 필요한 부분

- `10.html`의 작성·이동·삭제 여부
- 전화 링크의 `href` 따옴표
- `:nth-child(...)`에 필요한 인자
- `.tap-group`과 `.tab-group` 이름 불일치
- 라디오 버튼의 중복 `id`와 반복된 `value`
- `:blur`가 의도한 동작과 맞는 선택자인지 여부
- 숨김 비교 요소의 공통 크기·배경 스타일

이 항목들은 정적 검토에서 발견한 점이며 수정 완료로 기록하지 않는다. 실습 파일들은 기록 작성 시점에 Git 미추적 상태다.

## 실제 학습과 다음 진도의 경계

- 오늘 완료 범위: CSS 선택자·단위·박스 모델·display, Flexbox 정렬 값 비교
- 실행 미확인: 각 HTML의 브라우저 결과와 개발자 도구 계산값
- 다음 진도: `flex-direction`, `flex-wrap`, 크기 조절 속성, Grid와 반응형 웹

[Preview](./01-preview-notes-01-css-layout-responsive.md) · [TIL](./04-til-01-css-box-model-flexbox.md) · [← Week 7](../README.md)
