# TIL — CSS 박스 모델과 Flexbox 정렬

- 날짜: 2026-09-16
- Level / Week: LV.2 / Week 7
- 실제 진도: 프론트엔드 개발 3장 1강의 Flexbox 1차원 정렬까지
- 실습 범위: CSS 선택자·단위·박스 모델·display·Flexbox 정렬

## 오늘 배운 흐름

오늘 실습은 CSS로 요소를 선택하는 방법에서 시작해 크기와 배치 방식을 제어하고, 마지막에는 부모 요소에 Flexbox를 적용해 자식 요소를 정렬하는 흐름으로 이어졌다.

```text
CSS로 요소 선택
→ 글자와 박스의 크기·여백 설정
→ display로 요소의 배치 방식 변경
→ 부모에 display: flex 적용
→ justify-content와 align-items로 자식 요소 정렬
```

예습에는 Grid와 반응형 웹까지 포함되어 있었지만, 실제 수업은 Flexbox의 1차원 정렬까지만 진행했다. `flex-direction`, `flex-wrap`, `flex-grow`, `flex-shrink`, Grid 이후 내용은 오늘 학습 완료 범위에 포함하지 않는다.

## 선택자와 상태 표현

CSS 선택자는 태그 이름만 찾는 것이 아니라 속성값, 요소의 순서, 사용자 동작과 입력 상태를 조건으로 사용할 수 있다.

쉼표로 여러 선택자를 묶으면 같은 선언을 함께 적용할 수 있고, 태그와 클래스를 붙여 쓰면 두 조건을 모두 만족하는 요소로 범위를 좁힐 수 있다.

```css
a, p, .greeting {
  color: green;
}

span.greeting {
  color: orange;
}
```

첫 번째 규칙은 `a`, `p`, `.greeting`에 같은 색을 적용하는 그룹 선택자다. 두 번째 규칙은 `greeting` 클래스를 가진 요소 중 `span`만 다시 선택한다.

속성 선택자는 대괄호 안에 속성명과 필요한 값 조건을 작성한다.

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

- `[속성]`: 해당 속성이 있는 요소를 선택한다.
- `[속성="값"]`: 속성값이 정확히 일치하는 요소를 선택한다.
- `[속성^="값"]`: 속성값이 지정한 문자열로 시작하는 요소를 선택한다.
- `[속성$="값"]`: 속성값이 지정한 문자열로 끝나는 요소를 선택한다.
- `:first-child`, `:last-child`, `:nth-child(...)`: 형제 중 위치를 기준으로 선택한다.
- `:not(...)`: 지정한 조건을 제외한다.
- `:is(...)`: 여러 선택자 경로를 하나로 묶는다.
- `:hover`, `:focus`, `:checked`: 마우스·포커스·입력 선택 상태를 기준으로 한다.

라디오 버튼과 바로 다음 `label`을 연결한 다음 선택 상태에 따라 스타일을 바꾸는 구조도 작성했다.

```css
input[type="radio"]:checked + label {
  background-color: #000;
  color: #fff;
}
```

여기서 `+`는 선택된 `input` 바로 다음에 있는 형제 `label` 하나를 선택한다.

## HEX 색상 표기

CSS 색상은 `#RRGGBB` 형태의 HEX 코드로 나타낼 수 있다. 각 색상 채널의 두 자리가 같은 경우 세 자리로 줄일 수 있다.

```css
.text1 {
  color: #f00;
}
```

`#f00`은 `#ff0000`의 단축 표기로 빨간색을 뜻한다.

## `rem`과 `em`

`rem`과 `em`은 모두 상대 단위지만 기준이 다르다.

- `rem`: 루트 요소인 `html`의 글자 크기를 기준으로 계산한다.
- `em`: 현재 요소가 놓인 글자 크기 맥락을 기준으로 계산한다.

실습에서는 `html`에 `font-size: 13px`을 지정한 뒤 `1rem`, `2rem`, `3rem`을 비교했다. 별도의 부모에 `font-size: 20px`을 지정하고 그 안에서 `1em`, `2em`도 비교했다.

상대 단위는 숫자만 보는 것이 아니라 **어느 요소의 크기를 기준으로 계산하는지** 함께 추적해야 한다.

## 박스 모델과 `box-sizing`

HTML 요소의 박스는 안쪽부터 다음 네 영역으로 구성된다.

```text
content → padding → border → margin
```

기본 `content-box`에서는 지정한 `width`와 `height`가 콘텐츠 영역의 크기다. 패딩과 테두리를 추가하면 실제 박스 크기가 더 커진다.

```css
.box2 {
  box-sizing: border-box;
  width: 150px;
  height: 150px;
  padding: 30px;
  border: 5px solid red;
}
```

`border-box`를 사용하면 패딩과 테두리가 지정한 너비와 높이 안에 포함되어 전체 크기를 계산하기 쉽다.

`margin: 100px auto`처럼 좌우 마진을 `auto`로 두면, 너비가 정해진 블록 요소의 남는 가로 공간을 양쪽에 나누어 가운데에 배치할 수 있다.

## `display`와 숨김 방식

`display: inline-block`은 요소를 한 줄에 나란히 놓을 수 있으면서도 너비와 높이를 적용할 수 있는 방식이다.

요소를 숨기는 두 선언은 공간 처리 방식이 다르다.

| 선언 | 요소 표시 | 기존 공간 |
|---|---|---|
| `display: none` | 보이지 않음 | 사라짐 |
| `visibility: hidden` | 보이지 않음 | 유지됨 |

코드만 읽는 것에서 끝내지 않고 다음 실습에서는 두 요소에 같은 박스 크기를 적용한 뒤, 뒤에 있는 요소가 이동하는지 브라우저에서 비교해야 한다.

## Flexbox로 자식 요소 정렬하기

부모 요소에 `display: flex`를 적용하면 바로 아래 자식 요소를 Flex 항목으로 배치할 수 있다.

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

오늘 코드에서는 `justify-content` 값을 바꾸면서 A, B, C의 가로 배치를 비교했다.

| 값 | 화면 배치 |
|---|---|
| `flex-start` | 항목을 시작 부분에 모음 |
| `flex-end` | 항목을 끝부분에 모음 |
| `center` | 항목 사이를 벌리지 않고 묶음으로 가운데에 모음 |
| `space-between` | 첫 항목과 마지막 항목을 양 끝에 두고 항목 사이에 공간을 분배 |
| `space-around` | 각 항목 양쪽에 공간을 주어 바깥쪽 간격이 항목 사이보다 작게 보임 |
| `space-evenly` | 양쪽 바깥과 모든 항목 사이의 간격을 동일하게 분배 |

`align-items`는 오늘 실습 코드에서 `flex-start`, `flex-end`, `center` 값을 비교했다. 다만 이번 복습에서는 화면 결과를 직접 확인하지 않았으므로, 다음 실습에서 컨테이너 높이 안에서 항목 위치가 어떻게 바뀌는지 확인한다.

## 복습에서 확인한 내용

선택형 화면 예측 문제 세 개를 통해 다음 결과를 구분했다.

1. `space-between`: A와 C를 양쪽 끝에 두고 A-B, B-C 사이에 공간을 분배한다.
2. `space-evenly`: 왼쪽 바깥, 항목 사이, 오른쪽 바깥의 모든 간격이 같다.
3. `center`: A, B, C를 서로 붙인 하나의 묶음으로 가운데에 모은다.

처음에는 문제의 `ul`과 `li` 구조가 명확하지 않아 질문 의도를 다시 확인했다. 학습하지 않은 속성을 전제로 한 문제는 복습 범위에서 제외하고, 실제 수업 코드에 있는 값만 다시 확인했다.

## 코드에서 다시 확인할 것

아래 내용은 해결 완료가 아니라 정적 코드 검토에서 발견한 다음 확인 항목이다.

- `10.html`이 현재 실습 폴더에 없어 작성·이동·삭제 여부 확인
- 전화 링크의 `href` 따옴표가 올바르게 닫혔는지 확인
- `:nth-child(...)`에 필요한 순서 또는 수식이 들어갔는지 확인
- CSS의 `.tap-group`과 HTML의 `.tab-group` 이름 통일
- 라디오 버튼마다 중복되지 않는 `id`와 목적에 맞는 `value` 지정
- `:blur`가 의도한 상태 선택자인지 확인하고 실제 동작 방식 검토
- `display: none`과 `visibility: hidden` 비교 요소에 같은 박스 크기를 적용한 뒤 공간 차이 확인

이번 정리에서는 수업 HTML 파일을 정적으로 읽었으며, 모든 파일을 브라우저에서 다시 실행하거나 개발자 도구의 계산된 스타일을 확인하지 않았다. 해당 실습 파일들은 기록 작성 시점에 아직 Git 미추적 상태다.

## 다음 학습

1. `15.html`을 브라우저에서 실행하고 `space-between`, `space-around`, `space-evenly`의 바깥쪽 간격을 비교한다.
2. `align-items` 값을 바꾸며 컨테이너 안에서 항목의 세로 위치를 확인한다.
3. 코드 점검 항목을 하나씩 수정하고 수정 전후 화면 차이를 기록한다.
4. `flex-direction`은 실제 수업에서 배운 뒤 정렬 방향 변화와 함께 복습한다.
5. Flexbox의 남은 속성과 Grid 이후 내용은 다음 진도에서 이어간다.

[Preview](./01-preview-notes-01-css-layout-responsive.md) · [Learning Notes](./02-learning-notes-01-css-box-model-flexbox.md) · [← Week 7](../README.md)
