# Preview Notes — 반응형 웹·미디어 쿼리와 Tailwind CSS

- 날짜: 2026-09-18
- Level / Week: LV.2 / Week 7
- 과정: 프론트엔드 개발
- 범위: 3장 2강 — 반응형 웹, 미디어 쿼리 및 Tailwind CSS
- 상태: 수업 전 예습

## 학습 목표

- 미디어 쿼리의 미디어 타입과 미디어 특성을 구분한다.
- `min-width`, `max-width`, `orientation` 조건이 적용되는 범위를 설명한다.
- 모바일·태블릿·데스크톱 브레이크포인트에 따라 스타일을 전환한다.
- viewport 설정이 모바일 화면 크기 계산에 필요한 이유를 이해한다.
- Tailwind CSS 유틸리티 클래스와 반응형 접두사의 구조를 읽는다.
- Flexbox와 Grid의 일반 CSS를 Tailwind 클래스와 연결한다.

## 전체 학습 구조

```text
기본 HTML·CSS 작성
→ viewport로 모바일 화면 기준 설정
→ @media로 적용 조건 선언
→ 브레이크포인트별 레이아웃 전환
→ 모바일 우선으로 기본 스타일 설계
→ Tailwind CSS 연결 방식 확인
→ 유틸리티 클래스로 간격·색상·글자 스타일 지정
→ 상태·반응형 접두사 조합
→ Flexbox·Grid 레이아웃을 Tailwind로 표현
```

## 선행 개념

- CSS 선택자와 속성·값
- 박스 모델의 `margin`, `padding`, `width`, `height`
- Flexbox의 주축·교차축과 `justify-content`, `align-items`
- Grid의 `grid-template-columns`, `gap`, `span`
- HTML `<head>`와 `<script>` 태그
- 브라우저 뷰포트와 화면 너비

## 1. 반응형 웹과 미디어 쿼리

반응형 웹은 화면 크기와 기기 특성에 맞춰 레이아웃과 스타일이 유연하게 바뀌는 웹 설계 방식이다. 미디어 쿼리는 지정한 조건이 참일 때만 특정 CSS 규칙을 적용한다.

```css
@media screen and (min-width: 768px) {
  body {
    background-color: lightgreen;
  }
}
```

기본 문법은 다음과 같다.

```text
@media 미디어타입 and (미디어특성) {
  조건이 참일 때 적용할 CSS
}
```

## 2. 미디어 타입과 미디어 특성

| 구분 | 예시 | 역할 |
|---|---|---|
| 미디어 타입 | `all` | 모든 미디어 장치 |
| 미디어 타입 | `screen` | 모니터·태블릿·스마트폰 화면 |
| 미디어 타입 | `print` | 프린터와 인쇄 미리보기 |
| 미디어 타입 | `speech` | 음성 출력 환경 |
| 미디어 특성 | `min-width` | 지정한 너비 이상에서 적용 |
| 미디어 특성 | `max-width` | 지정한 너비 이하에서 적용 |
| 미디어 특성 | `orientation` | 화면의 가로·세로 방향 조건 |

`min-width`와 `max-width`를 함께 사용하면 특정 구간을 선택할 수 있다.

```css
@media screen and (min-width: 768px) and (max-width: 1023px) {
  /* 태블릿 범위 스타일 */
}
```

## 3. 이번 교안의 브레이크포인트

| 구분 | 조건 |
|---|---|
| 모바일 | `max-width: 767px` |
| 태블릿 | `min-width: 768px` and `max-width: 1023px` |
| 데스크톱 | `min-width: 1024px` |

브레이크포인트는 프로젝트 요구에 따라 달라질 수 있으며, 위 값은 이번 학습 범위의 기준이다.

## 4. viewport와 모바일 화면 기준

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- `width=device-width`: CSS 화면 너비를 기기 너비와 맞춘다.
- `initial-scale=1.0`: 처음 표시할 때 기본 배율로 시작한다.

viewport 설정이 없으면 모바일에서도 넓은 데스크톱 화면처럼 계산되어 의도한 브레이크포인트와 다르게 보일 수 있다.

## 5. 모바일 우선 설계

모바일 우선은 가장 작은 화면의 기본 스타일을 먼저 작성하고, 화면이 넓어질수록 `min-width` 조건으로 레이아웃을 확장하는 방식이다.

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

## 6. Tailwind CSS 기본 구조

간단한 HTML 실습에서는 CDN 스크립트를 이용해 Tailwind CSS를 연결할 수 있다.

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Tailwind는 작은 역할 하나를 담당하는 유틸리티 클래스를 HTML의 `class` 속성에 조합한다.

| 예시 | 의미 |
|---|---|
| `p-4` | 안쪽 여백 지정 |
| `w-80` | 너비 지정 |
| `hover:bg-blue-600` | 마우스를 올렸을 때 배경색 변경 |
| `md:grid-cols-2` | `md` 브레이크포인트 이상에서 Grid 2열 |
| `h-[200px]` | 임의 값을 사용해 높이 지정 |

클래스는 다음처럼 나눠 읽을 수 있다.

```text
[상태 또는 해상도 접두사]:[속성]-[크기 또는 값]
```

## 7. Tailwind의 Flexbox와 Grid

| 목적 | Tailwind 클래스 | 일반 CSS |
|---|---|---|
| Flex 컨테이너 | `flex` | `display: flex` |
| 가로 방향 | `flex-row` | `flex-direction: row` |
| 세로 방향 | `flex-col` | `flex-direction: column` |
| 교차축 중앙 | `items-center` | `align-items: center` |
| 주축 공간 분배 | `justify-between` | `justify-content: space-between` |
| Grid 컨테이너 | `grid` | `display: grid` |
| 3열 Grid | `grid-cols-3` | `grid-template-columns: repeat(3, ...)` |
| 항목 간격 | `gap-*` | `gap` |

## 예상 난점

- `min-width`와 `max-width`가 포함하는 경계값 구분
- 여러 미디어 쿼리 조건을 `and`로 묶는 문법
- viewport와 브레이크포인트의 역할 구분
- 교안 브레이크포인트와 Tailwind 접두사 기준을 동일하다고 단정하는 것
- Tailwind 클래스의 접두사·속성·값을 나눠 읽는 것
- 일반 CSS의 Flexbox·Grid 속성을 Tailwind 클래스로 변환하는 것

## 예정 실습

- [ ] 767px·768px·1023px·1024px 경계 확인
- [ ] viewport 설정 유무에 따른 모바일 표시 차이 확인
- [ ] `print` 미디어 타입을 인쇄 미리보기에서 확인
- [ ] Tailwind CDN 연결 후 클래스 적용 여부 확인
- [ ] 간격·크기·글자·색상 유틸리티 비교
- [ ] Flexbox와 Grid 레이아웃을 Tailwind로 구성
- [ ] `grid-cols-1 md:grid-cols-2`로 반응형 열 전환

## 수업 전 확인 질문

1. `min-width: 768px`은 768px에서 적용되는가?
2. 768px 이상 1023px 이하를 선택하려면 조건을 어떻게 결합하는가?
3. viewport의 `width=device-width`가 필요한 이유는 무엇인가?
4. 모바일 우선 설계에서 기본 스타일과 `min-width` 규칙은 어떤 순서로 적용되는가?
5. `grid-cols-1 md:grid-cols-2`는 화면 크기에 따라 어떻게 바뀌는가?
6. `h-[200px]`처럼 대괄호를 사용하는 이유는 무엇인가?

## 학습 시 확인할 점

- 브레이크포인트는 프로젝트 요구에 따라 정하는 값이다.
- Tailwind 접두사의 실제 기준값은 사용하는 Tailwind 설정에서 확인해야 한다.
- CDN, 자동 완성, HTML 예제는 실행 전이므로 성공한 결과로 기록하지 않는다.
