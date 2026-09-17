# Learning Notes — Flexbox와 Grid 레이아웃

- 날짜: 2026-09-17
- Level / Week: LV.2 / Week 7
- 실제 수업 범위: 프론트엔드 개발 3장 1강
- 실습 확인 범위: `chapter03/01`의 `1.html`~`7.html`
- 실행 상태: 코드 정적 확인. 브라우저 화면과 계산된 스타일은 재실행하지 않음

## 실제 학습 범위

이번 수업에서는 Flexbox의 방향·정렬·크기 조절과 CSS Grid의 행·열 구성, 간격, 칸 합치기를 학습했다.

```text
Flex 컨테이너 생성
→ 주축 방향 설정
→ 주축·교차축 정렬
→ 줄바꿈과 항목 크기 조절
→ Grid 컨테이너 생성
→ 열 비율과 간격 설정
→ 여러 칸을 하나의 영역으로 배치
```

3장 2강의 반응형 웹·미디어 쿼리·Tailwind CSS와 4장 JavaScript는 실제 학습 완료 범위에 포함하지 않는다.

## 실습 파일별 학습 내용

| 파일 | 정적으로 확인한 내용 |
|---|---|
| `1.html` | `row`, `row-reverse`, `column`, `column-reverse` 방향 비교 |
| `2.html` | `justify-content`의 시작·끝·중앙 정렬과 공간 분배 |
| `3.html` | `align-items`의 `stretch`, `flex-start`, `flex-end`, `center` 비교 |
| `4.html` | 자식 요소의 `flex-grow` 비율 적용 |
| `5.html` | `flex-wrap`, `flex-basis`, `flex-shrink` 조합 |
| `6.html` | `repeat(3, 1fr)` Grid와 `place-items` |
| `7.html` | `gap`, `grid-column: span 2`, `grid-row: span 2` |

## Flexbox 실행 흐름

Flexbox는 부모와 자식의 역할을 구분해서 읽어야 한다.

```text
부모에 display: flex 적용
→ flex-direction으로 주축 결정
→ justify-content로 주축 정렬
→ align-items로 교차축 정렬
→ 자식의 basis·grow·shrink로 크기 조절
```

### `flex-direction`

```css
.container {
  display: flex;
  flex-direction: column;
}
```

`row`와 `row-reverse`는 가로 방향에서 순서를 바꾸고, `column`과 `column-reverse`는 세로 방향에서 순서를 바꾼다. 방향이 바뀌면 `justify-content`가 작동하는 주축도 함께 바뀐다.

### `justify-content`와 `align-items`

`justify-content`는 주축, `align-items`는 교차축을 제어한다. `space-between`, `space-around`, `space-evenly`는 모두 공간을 분배하지만 바깥쪽 간격 처리 방식이 다르다.

`align-items: stretch`는 자식 요소의 교차축 크기가 별도로 정해지지 않았을 때 컨테이너 크기에 맞춰 늘리는 기본 동작이다.

### 항목 크기와 줄바꿈

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

- `flex-basis`: 크기 계산의 시작점
- `flex-grow`: 남는 공간을 확장하며 나누는 비율
- `flex-shrink`: 부족한 공간에서 줄어드는 비율
- `flex-wrap`: 항목을 한 줄에 유지할지 다음 줄로 보낼지 결정

`flex-grow`는 전체 너비를 직접 정하는 속성이 아니라 기본 크기를 반영한 뒤 남는 공간을 분배한다.

## Grid 실행 흐름

Grid는 먼저 격자를 설계하고 자식 요소를 그 칸에 배치한다.

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  place-items: center;
}
```

`repeat(3, 1fr)`는 사용할 수 있는 가로 공간을 같은 비율의 열 세 개로 나눈다. `fr`은 Grid 안의 남은 공간을 비율로 나누는 단위다.

`row-gap`과 `column-gap`은 행과 열 간격을 각각 지정하며, `gap`은 두 방향의 간격을 함께 지정한다.

### 여러 칸 사용하기

```css
.wide {
  grid-column: span 2;
}

.tall {
  grid-row: span 2;
}
```

`span 2`는 현재 배치 위치에서 두 칸을 차지한다. 시작선과 끝선을 알고 있다면 `grid-column: 1 / 3`처럼 선 번호로도 영역을 지정할 수 있다.

### 칸 내부 정렬

`place-items`는 `align-items`와 `justify-items`를 함께 지정하는 단축 속성이다. 각 Grid 칸 안에서 항목을 위아래와 좌우 방향으로 정렬한다.

## Flexbox와 Grid의 관계

Flexbox는 한 방향의 배치에, Grid는 행과 열을 함께 설계하는 화면에 적합하다. 두 방식은 경쟁 관계가 아니라 조합할 수 있다.

```text
페이지 전체 영역: Grid
→ 각 카드 내부의 아이콘·텍스트·버튼 정렬: Flexbox
```

## 정적 코드에서 다시 확인할 항목

- `2.html`의 시작 정렬 값 `justify-content: flex`가 `flex-start`를 의도한 것인지 확인한다.
- `flex-grow` 값이 같은 항목에서 콘텐츠 길이에 따라 너비가 달라지는지 브라우저에서 비교한다.
- `flex-shrink: 0`을 제거했을 때 항목이 줄어드는지 확인한다.
- `grid-column`과 `grid-row`의 `span` 적용 전후 배치를 비교한다.

이번 문서에서는 위 항목을 수정 완료나 실행 성공으로 기록하지 않는다. 실제 브라우저 확인 후 Practice 문서에 결과를 남긴다.

## 다음 학습 연결

다음 진도는 3장 2강의 반응형 웹과 미디어 쿼리다. 고정된 Flexbox·Grid 배치가 화면 너비 조건에 따라 어떻게 바뀌는지 연결해서 학습한다.

[Preview](./01-preview-notes-01-flexbox-grid.md) · [TIL](./04-til-01-flexbox-grid.md) · [← Week 7](../README.md)
