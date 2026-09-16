# Preview Notes — CSS 레이아웃과 반응형 웹

- 날짜: 2026-09-16
- Level / Week: LV.2 / Week 7
- 과정: 프론트엔드 개발
- 예습 범위: 2장 1~2강, 3장 1~2강
- 상태: 수업 전 예습

## 예습 목표

- CSS 선택자, 속성, 값의 역할을 설명한다.
- 캐스케이드·명시도·상속이 최종 스타일을 정하는 흐름을 이해한다.
- 콘텐츠·패딩·테두리·마진으로 구성된 박스의 실제 크기를 계산한다.
- `display`와 `position`이 요소의 공간과 배치에 미치는 영향을 구분한다.
- Flexbox와 Grid가 각각 어떤 레이아웃에 적합한지 비교한다.
- 미디어 쿼리와 Tailwind CSS가 화면 크기에 대응하는 방식을 살펴본다.

## 전체 학습 구조

```text
HTML 요소와 문서 구조
→ CSS 선택자로 대상 선택
→ 캐스케이드·명시도·상속으로 최종 스타일 결정
→ 박스 모델로 요소 크기와 간격 계산
→ display·position으로 배치 방식 제어
→ Flexbox 또는 Grid로 여러 요소 정렬
→ @media로 화면 조건에 따라 규칙 분기
→ Tailwind 유틸리티 클래스로 같은 규칙 표현
```

## 선행 개념

- HTML의 부모·자식·형제 관계
- `class`와 `id`의 역할
- 외부 CSS 파일을 연결하는 `link` 요소
- 블록 요소와 인라인 요소의 기본 성질
- 파일과 이미지의 상대 경로
- 모바일 화면을 위한 viewport 설정

## 1. CSS 규칙과 선택자

CSS는 선택자로 대상을 찾고, 속성과 값으로 표현 방식을 정한다.

```css
h1 {
  color: blue;
  font-size: 2rem;
}
```

| 구성 | 예 | 역할 |
|---|---|---|
| 선택자 | `h1` | 스타일을 적용할 요소를 찾음 |
| 속성 | `color` | 바꿀 표현 항목을 지정 |
| 값 | `blue` | 속성에 적용할 설정 |
| 선언 | `color: blue;` | 속성과 값의 한 쌍 |

### 기본·관계 선택자

```css
* { box-sizing: border-box; }
p { color: #444; }
.notice { background-color: #fff4cc; }
#main-title { color: navy; }

.parent p { color: blue; }
.parent > p { color: red; }
h1 + p { font-weight: bold; }
h1 ~ p { color: green; }
```

- `A B`: A 안의 모든 자손 B
- `A > B`: A의 바로 아래 자식 B
- `A + B`: A 바로 다음의 형제 B 하나
- `A ~ B`: A 뒤에 있는 같은 부모의 형제 B 모두

### 상태와 조건 선택자

- `:hover`, `:focus`, `:checked`: 사용자 동작이나 입력 상태
- `:first-child`, `:last-child`, `:nth-child(...)`: 형제 순서
- `:not(...)`: 지정한 조건 제외
- `:is(...)`: 여러 선택자 경로 묶기
- `::before`, `::after`: 요소 앞뒤에 표현 영역 만들기

`::before`와 `::after`를 표시하려면 `content`가 필요하다. 중요한 정보는 가상 요소에만 넣지 않고 HTML에도 의미가 드러나게 작성한다.

## 2. 캐스케이드와 명시도

같은 요소에 여러 규칙이 도달하면 다음 순서로 원인을 추적한다.

```text
선택자가 실제 요소와 일치하는가?
→ 요소에 직접 작성한 스타일이 있는가?
→ 더 구체적인 선택자가 있는가?
→ 구체성이 같다면 어떤 규칙이 나중에 선언됐는가?
→ 부모에서 상속된 값인가?
```

입문 단계의 단순 비교는 다음과 같다.

```text
인라인 스타일 > ID > 클래스·가상 클래스 > 태그·가상 요소 > 전체 선택자
```

실제 충돌은 브라우저 개발자 도구에서 취소된 선언과 최종 계산값을 확인한다.

## 3. 텍스트와 배경

- `font-family`: 사용할 글꼴과 대체 글꼴을 순서대로 지정
- `font-size`: 글자 크기
- `font-weight`: 글자 굵기
- `line-height`: 줄 높이와 줄 간격
- `text-align`: 블록 안의 텍스트·인라인 콘텐츠 정렬
- `color`: 글자색
- `background-color`: 배경색
- `background-image`: 이미지 또는 그라데이션 배경

`px`는 CSS 픽셀을 기준으로 하고, `em`은 현재 글자 크기 맥락, `rem`은 루트 요소의 글자 크기를 기준으로 계산한다.

배경 이미지 크기는 다음처럼 구분한다.

- `cover`: 영역을 가득 채우지만 이미지 일부가 잘릴 수 있음
- `contain`: 이미지 전체를 보이지만 빈 공간이 남을 수 있음

## 4. 박스 모델

모든 HTML 요소는 사각형 박스로 계산된다.

```text
margin
└─ border
   └─ padding
      └─ content
```

`width: 200px`, 좌우 `padding: 20px`, 좌우 `border: 5px`일 때:

- `content-box`: 전체 너비는 `200 + 40 + 10 = 250px`
- `border-box`: 지정한 `200px` 안에 패딩과 테두리를 포함

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

## 5. `display`와 숨김

| 유형 | 줄 배치 | 너비·높이 |
|---|---|---|
| `block` | 새 줄에서 시작 | 적용 가능 |
| `inline` | 글자처럼 한 줄에 배치 | 일반적으로 직접 적용되지 않음 |
| `inline-block` | 한 줄에 배치 | 적용 가능 |

숨김 방식도 공간 처리 결과가 다르다.

| 선언 | 화면 표시 | 레이아웃 공간 |
|---|---|---|
| `display: none` | 숨김 | 사라짐 |
| `visibility: hidden` | 숨김 | 유지됨 |

## 6. `position`

| 값 | 배치 기준 |
|---|---|
| `static` | 기본 문서 흐름 |
| `relative` | 자신이 원래 있던 위치 |
| `absolute` | `static`이 아닌 가장 가까운 조상 |
| `fixed` | 브라우저 화면 |

상품 카드의 배지는 부모에 `position: relative`, 자식 배지에 `position: absolute`를 적용해 기준점을 만든다.

## 7. Flexbox

Flexbox는 한 방향을 중심으로 요소를 배치하는 레이아웃 방식이다.

```css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
```

- `justify-content`: 주된 배치 방향의 정렬과 남는 공간 분배
- `align-items`: 반대 방향의 항목 정렬
- `flex-wrap`: 공간이 부족할 때 줄바꿈 여부
- `flex-basis`: 공간 분배 전 기본 크기
- `flex-grow`: 남는 공간을 확장하는 비율
- `flex-shrink`: 공간이 부족할 때 줄어드는 비율

## 8. Grid

Grid는 행과 열을 함께 설계하는 2차원 레이아웃 방식이다.

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.hero {
  grid-column: span 2;
}
```

- `grid-template-columns`: 열의 개수와 크기
- `grid-template-rows`: 행의 크기
- `fr`: 사용 가능한 공간의 비율
- `gap`: 행과 열 사이 간격
- `grid-column`, `grid-row`: 항목이 차지할 범위

Flexbox와 Grid는 하나만 고르는 기술이 아니다. Grid로 큰 영역을 나누고 각 영역 안에서 Flexbox로 요소를 정렬할 수 있다.

## 9. 반응형 웹과 미디어 쿼리

작은 화면의 기본 스타일을 먼저 만들고 화면이 넓어질 때 열 개수를 늘리는 구조를 예습한다.

```css
.cards {
  display: grid;
  grid-template-columns: 1fr;
}

@media screen and (min-width: 768px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

브레이크포인트는 기기 이름을 외우는 값이 아니라, 실제 레이아웃이 바뀌어야 하는 화면 너비로 이해한다.

## 10. Tailwind CSS 예습

Tailwind CSS는 작은 역할을 담당하는 유틸리티 클래스를 HTML에 조합하는 방식이다.

| 목적 | 일반 CSS | Tailwind 예 |
|---|---|---|
| 안쪽 여백 | `padding: 1rem` | `p-4` |
| Flex 컨테이너 | `display: flex` | `flex` |
| Grid 컨테이너 | `display: grid` | `grid` |
| 3열 Grid | `grid-template-columns` | `grid-cols-3` |
| 항목 간격 | `gap: 1rem` | `gap-4` |
| 중간 화면부터 2열 | 미디어 쿼리 | `md:grid-cols-2` |

클래스 이름을 외우는 데 그치지 않고 어떤 CSS 속성으로 연결되는지 확인한다.

## 예상 난점

- `nth-child()`와 `nth-of-type()`의 순서 계산 대상
- `content-box`와 `border-box`의 실제 전체 크기
- `display: none`과 `visibility: hidden`의 공간 유지 여부
- `relative`, `absolute`, `fixed`의 기준점
- Flexbox 정렬 속성과 Grid 행·열 속성의 역할
- `min-width`와 `max-width` 조건이 적용되는 범위
- Tailwind 반응형 접두사의 적용 시점

## 예정 실습

- [ ] 개발자 도구에서 박스 모델 확인
- [ ] `content-box`와 `border-box` 전체 크기 비교
- [ ] `display: none`과 `visibility: hidden` 뒤 요소의 이동 비교
- [ ] 카드 배지와 고정 버튼으로 `position` 기준 확인
- [ ] Flexbox 정렬 값에 따른 화면 변화 확인
- [ ] Grid 열 비율과 `span` 확인
- [ ] 화면 너비에 따른 미디어 쿼리 전환 확인
- [ ] 일반 CSS와 Tailwind 클래스 결과 비교

## 수업 전 질문

1. 자손 선택자와 자식 선택자는 어떤 요소를 다르게 선택하는가?
2. `content-box`와 `border-box`의 실제 전체 너비는 어떻게 계산하는가?
3. `display: none`과 `visibility: hidden`은 뒤 요소의 위치에 어떤 차이를 만드는가?
4. Flexbox와 Grid는 각각 어떤 화면 구조에 적합한가?
5. 작은 화면 1열을 넓은 화면에서 2열로 바꾸려면 어떤 조건이 필요한가?

[Learning Notes](./02-learning-notes-01-css-box-model-flexbox.md) · [TIL](./04-til-01-css-box-model-flexbox.md) · [← Week 7](../README.md)
