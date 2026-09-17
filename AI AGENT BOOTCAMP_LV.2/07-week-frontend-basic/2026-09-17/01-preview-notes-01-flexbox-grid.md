# Preview Notes — Flexbox와 Grid 레이아웃

- 날짜: 2026-09-17
- Level / Week: LV.2 / Week 7
- 과정: 프론트엔드 개발
- 교안 범위: 3장 1강 — 플렉스 박스와 그리드 레이아웃
- 확인 범위: PDF 9쪽 전체
- 문서 역할: 교안 기반 예습 정리. 실제 수업과 실습 결과는 Learning Notes와 TIL에 분리

## 예습 목표

- Flexbox의 주축과 교차축을 구분한다.
- `flex-direction`, `justify-content`, `align-items`가 배치에 미치는 영향을 예상한다.
- 항목이 넘치거나 공간이 남을 때 `flex-wrap`, `flex-grow`, `flex-shrink`, `flex-basis`가 어떻게 동작하는지 이해한다.
- Grid의 행·열 구조와 `fr`, `repeat()`, `auto`를 이용해 격자를 설계한다.
- Grid 항목의 간격, 칸 합치기와 칸 내부 정렬 방법을 구분한다.
- Flexbox와 Grid를 어떤 상황에서 사용할지 판단한다.

## 전체 학습 구조

```text
부모 요소를 레이아웃 컨테이너로 설정
→ Flexbox로 한 방향 배치
→ 주축·교차축 정렬
→ 줄바꿈과 항목 크기 조절
→ Grid로 행과 열 구성
→ 격자 간격 설정
→ 여러 칸을 하나의 영역으로 사용
→ 칸 내부의 항목 정렬
```

## 선행 개념

- HTML 부모·자식 요소 구조
- CSS 선택자와 클래스
- 박스 모델과 `display`
- `width`, `height`, `gap` 같은 CSS 크기·간격 값
- 브라우저 개발자 도구에서 스타일 값을 바꾸고 결과를 비교하는 방법

## 1. Flexbox의 방향과 축

부모 요소에 `display: flex`를 적용하면 바로 아래 자식 요소가 Flex 항목이 된다. Flexbox는 한 방향을 중심으로 항목을 배치하는 1차원 레이아웃이다.

| 속성·값 | 예습에서 확인할 내용 |
|---|---|
| `flex-direction: row` | 왼쪽에서 오른쪽으로 배치하는 기본 방향 |
| `row-reverse` | 가로 방향을 반대로 배치 |
| `column` | 위에서 아래로 세로 배치 |
| `column-reverse` | 세로 방향을 반대로 배치 |

`flex-direction`이 바뀌면 주축 방향도 함께 바뀐다. 따라서 `justify-content`를 항상 가로 정렬로 외우지 않고 현재 주축을 먼저 확인해야 한다.

## 2. 주축과 교차축 정렬

- `justify-content`: 주축에서 항목을 정렬하거나 남는 공간을 분배
- `align-items`: 교차축에서 항목을 정렬

`justify-content`의 주요 값은 `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly`다.

`align-items`의 주요 값은 `stretch`, `flex-start`, `flex-end`, `center`, `baseline`이다. `baseline`은 항목 안의 텍스트 기준선을 맞춘다.

## 3. 줄바꿈과 항목 크기

| 속성 | 역할 |
|---|---|
| `flex-wrap` | 한 줄에 공간이 부족할 때 줄바꿈 방법 설정 |
| `flex-basis` | 항목이 늘거나 줄기 전의 기본 크기 |
| `flex-grow` | 남는 공간을 나누어 갖는 비율 |
| `flex-shrink` | 공간이 부족할 때 줄어드는 비율 |

`flex-wrap`은 기본값 `nowrap` 외에 `wrap`, `wrap-reverse`를 사용할 수 있다. `flex-grow`의 값이 같더라도 콘텐츠와 기본 크기에 따라 최종 너비가 반드시 같아지는 것은 아니다.

## 4. Grid의 행과 열

Grid는 가로 열과 세로 행을 함께 설계하는 2차원 레이아웃이다.

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}
```

| 속성·단위 | 역할 |
|---|---|
| `grid-template-columns` | 열의 개수와 크기 설정 |
| `grid-template-rows` | 행의 개수와 크기 설정 |
| `fr` | 사용할 수 있는 공간을 비율로 분배 |
| `repeat()` | 같은 크기의 행이나 열을 반복 선언 |
| `auto` | 콘텐츠 크기를 기준으로 자동 조절 |
| `row-gap`, `column-gap`, `gap` | 행·열 사이의 간격 설정 |

## 5. Grid 칸 배치와 내부 정렬

- `grid-column: 1 / 3`: 시작선부터 끝선 전까지의 열 영역을 사용
- `grid-column: span 2`: 현재 위치에서 열 두 칸을 차지
- `grid-row: span 2`: 현재 위치에서 행 두 칸을 차지
- `place-items`: `align-items`와 `justify-items`를 함께 지정해 각 칸 안의 항목을 정렬

`place-items`에는 `stretch`, `start`, `end`, `center` 등을 사용할 수 있다.

## Flexbox와 Grid 선택 기준

| 기준 | Flexbox | Grid |
|---|---|---|
| 중심 구조 | 한 방향의 흐름 | 행과 열을 함께 사용 |
| 예시 | 메뉴, 버튼 묶음, 카드 내부 | 페이지 영역, 카드 목록, 대시보드 |
| 함께 사용 | Grid 칸 안의 요소 정렬 | 전체 화면 영역 설계 |

## 예상 난점

- `flex-direction`에 따라 주축과 교차축이 달라지는 점
- `space-around`와 `space-evenly`의 바깥쪽 간격 차이
- `flex-grow` 값과 실제 최종 너비를 같은 의미로 오해하는 것
- Grid 선 번호와 `span`으로 차지할 칸을 계산하는 방법
- `place-items`와 Flexbox의 정렬 속성을 혼동하는 것

## 예정 실습

- [ ] `flex-direction` 네 값을 바꾸며 순서와 방향 비교
- [ ] `justify-content`의 공간 분배 값 비교
- [ ] `align-items`로 교차축 위치 비교
- [ ] `nowrap`, `wrap`, `wrap-reverse` 결과 비교
- [ ] `flex-grow`, `flex-shrink`, `flex-basis` 값 변경
- [ ] Grid 열을 고정 크기, `fr`, `repeat()`로 구성
- [ ] `row-gap`, `column-gap`, `gap` 비교
- [ ] `grid-column`, `grid-row`, `span`으로 칸 합치기
- [ ] `place-items`로 칸 내부 정렬 비교

## 수업 전 확인 질문

1. `flex-direction: column`일 때 `justify-content`는 어느 방향을 제어하는가?
2. `space-around`와 `space-evenly`의 바깥쪽 간격은 어떻게 다른가?
3. `flex-grow: 1`인 항목들의 최종 너비가 항상 같은 것은 아닌 이유는 무엇인가?
4. `repeat(3, 1fr)`는 어떤 열 구조를 만드는가?
5. `grid-column: 1 / 3`과 `grid-column: span 2`는 어떤 방식으로 영역을 지정하는가?
6. Flexbox와 Grid를 한 화면에서 함께 사용할 수 있는 사례는 무엇인가?

[Learning Notes](./02-learning-notes-01-flexbox-grid.md) · [TIL](./04-til-01-flexbox-grid.md) · [← Week 7](../README.md)
