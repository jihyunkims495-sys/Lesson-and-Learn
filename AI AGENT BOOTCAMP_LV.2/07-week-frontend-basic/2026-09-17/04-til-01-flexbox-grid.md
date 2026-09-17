# TIL — Flexbox와 Grid 레이아웃

- 날짜: 2026-09-17
- Level / Week: LV.2 / Week 7
- 실제 진도: 프론트엔드 개발 3장 1강
- 학습 범위: Flexbox 방향·정렬·크기 조절, CSS Grid

## 오늘 배운 흐름

오늘은 부모 요소를 레이아웃 컨테이너로 만들고 자식 요소를 배치하는 두 가지 방법을 학습했다.

```text
display: flex로 1차원 배치
→ 주축 방향과 정렬 방법 설정
→ 남는 공간과 부족한 공간에서 항목 크기 조절
→ flex-wrap으로 줄바꿈
→ display: grid로 2차원 격자 구성
→ 열 비율과 간격 설정
→ 여러 칸을 하나의 영역으로 사용
```

실제 수업은 3장 1강까지 진행했다. 3장 2강의 반응형 웹·미디어 쿼리·Tailwind CSS와 4장 JavaScript는 이번 학습 완료 범위에 포함하지 않는다.

## Flexbox의 방향과 축

부모 요소에 `display: flex`를 적용하면 바로 아래 자식 요소가 Flex 항목이 된다. `flex-direction`은 항목이 놓이는 주축의 방향과 순서를 정한다.

| 값 | 배치 방향 |
|---|---|
| `row` | 왼쪽에서 오른쪽 |
| `row-reverse` | 오른쪽에서 왼쪽 |
| `column` | 위에서 아래 |
| `column-reverse` | 아래에서 위 |

정렬 속성을 읽을 때는 가로·세로만 외우지 않고 현재 주축과 교차축을 먼저 확인해야 한다.

## 주축과 교차축 정렬

`justify-content`는 주축에서 항목을 정렬하거나 남는 공간을 분배한다.

```css
.container {
  display: flex;
  justify-content: space-evenly;
}
```

- `flex-start`, `flex-end`: 주축의 시작 또는 끝에 항목을 모은다.
- `center`: 항목을 한 묶음으로 주축 중앙에 모은다.
- `space-between`: 양 끝 항목을 컨테이너 끝에 두고 항목 사이에 공간을 분배한다.
- `space-around`: 각 항목 양쪽에 공간을 주므로 바깥쪽 간격이 항목 사이보다 작다.
- `space-evenly`: 바깥쪽과 항목 사이의 모든 간격을 같게 만든다.

`align-items`는 교차축에서 항목을 정렬한다. 실습 코드에서는 `stretch`, `flex-start`, `flex-end`, `center`를 비교했다. 교안의 `baseline`은 항목 안의 텍스트 기준선을 맞춰 정렬하는 값이다.

## Flex 항목의 크기와 줄바꿈

Flex 항목은 컨테이너의 남는 공간과 부족한 공간에 따라 크기가 달라질 수 있다.

- `flex-grow`: 남는 공간을 항목이 늘어나며 나누어 갖는 비율. 기본값은 `0`
- `flex-shrink`: 공간이 부족할 때 항목이 줄어드는 비율. 기본값은 `1`이며 `0`이면 줄어들지 않음
- `flex-basis`: 늘어나거나 줄어들기 전 항목의 기본 크기. 기본값은 `auto`
- `gap`: Flex 항목 사이의 간격
- `flex-wrap: nowrap`: 항목이 넘치더라도 기본적으로 한 줄에 배치
- `flex-wrap: wrap`: 한 줄에 공간이 부족할 때 다음 줄로 배치
- `flex-wrap: wrap-reverse`: 줄바꿈하되 교차축의 반대 방향으로 줄을 쌓음

```css
.container {
  display: flex;
  flex-wrap: wrap;
}

.item {
  flex-basis: 200px;
  flex-shrink: 0;
}
```

`flex-grow`의 숫자만 보고 최종 너비가 항상 같은 비율이 된다고 단정하면 안 된다. 기본 크기와 콘텐츠 크기를 반영한 뒤 남는 공간을 나누기 때문이다.

## Grid로 2차원 레이아웃 만들기

Flexbox가 한 방향의 흐름을 중심으로 배치한다면 Grid는 행과 열을 함께 사용하는 2차원 레이아웃에 적합하다.

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  place-items: center;
}
```

- `grid-template-columns`: 열의 개수와 크기를 지정한다.
- `grid-template-rows`: 행의 개수와 크기를 지정한다.
- `fr`: 사용 가능한 공간을 비율로 나누는 단위다.
- `repeat(3, 1fr)`: 같은 비율의 열 세 개를 만든다.
- `auto`: 항목의 콘텐츠 크기에 맞춰 행이나 열의 크기를 자동 조절한다.
- `row-gap`, `column-gap`: 행 사이와 열 사이의 간격을 각각 지정한다.
- `gap`: 행과 열의 간격을 한 번에 지정한다.
- `place-items`: `align-items`와 `justify-items`를 함께 지정해 각 Grid 칸 안에서 항목을 정렬한다.

`place-items`에는 칸을 채우는 `stretch`, 시작점에 붙이는 `start`, 끝점에 붙이는 `end`, 가운데에 놓는 `center` 등을 사용할 수 있다.

특정 항목이 여러 칸을 차지하게 할 수도 있다.

```css
.wide {
  grid-column: span 2;
}

.tall {
  grid-row: span 2;
}
```

`span 2`는 현재 위치를 기준으로 열이나 행 두 칸을 차지한다는 의미다. `grid-column: 1 / 3`처럼 시작선과 끝선 번호를 지정하면 1번 선부터 3번 선 전까지의 영역을 사용할 수 있다.

## Flexbox와 Grid 구분

| 기준 | Flexbox | Grid |
|---|---|---|
| 기본 구조 | 한 방향 중심 | 행과 열을 함께 사용 |
| 주요 용도 | 메뉴, 버튼 묶음, 카드 내부 정렬 | 페이지 영역, 카드 목록, 대시보드 |
| 함께 사용 | Grid 항목 내부를 Flexbox로 정렬 가능 | 큰 화면 구조를 Grid로 설계 가능 |

두 방식은 서로 하나만 선택해야 하는 기술이 아니다. 전체 화면은 Grid로 나누고 각 영역 안의 항목은 Flexbox로 정렬할 수 있다.

## 코드에서 다시 확인할 것

3장 1강 실습 폴더의 `1.html`부터 `7.html`까지를 정적으로 확인했다. 이번 정리에서는 브라우저에서 화면 결과를 다시 실행하지 않았다.

- `justify-content`의 시작 정렬 값은 `flex-start`로 작성되었는지 확인한다.
- `flex-grow`를 같은 값으로 지정했을 때 콘텐츠 길이와 기본 크기가 결과에 미치는 영향을 브라우저에서 비교한다.
- `flex-shrink: 0`과 `flex-wrap: wrap`을 각각 바꾸며 항목이 줄어드는 경우와 다음 줄로 넘어가는 경우를 비교한다.
- Grid에서 `grid-column: span 2`, `grid-row: span 2`를 제거하기 전후의 칸 배치를 확인한다.

## 다음 학습

1. Flexbox와 Grid 예제를 브라우저에서 실행해 정적 코드 예상과 실제 화면이 일치하는지 확인한다.
2. `flex-grow`, `flex-shrink`, `flex-basis`가 함께 적용될 때 항목 크기를 비교한다.
3. 다음 진도에서는 3장 2강의 반응형 웹과 미디어 쿼리부터 이어간다.

[Preview](./01-preview-notes-01-flexbox-grid.md) · [Learning Notes](./02-learning-notes-01-flexbox-grid.md) · [← Week 7](../README.md)
