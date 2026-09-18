# Learning Notes — CSS Grid 반응형 레이아웃과 미디어 쿼리

- 날짜: 2026-09-18
- Level / Week: LV.2 / Week 7
- 범위: 3장 2강 — 반응형 웹, 미디어 쿼리 및 Tailwind CSS
- 정리 기준: `chapter03/02` 수업 실습 파일 정적 검토
- 실행 여부: 브라우저 실행 및 화면 너비별 렌더링은 확인하지 않음

## 오늘 실제로 확인한 범위

오늘 실습 파일은 `1.html`, `2.html` 두 개다. 두 파일 모두 viewport 메타 태그를 포함한다. 실제 코드는 기본 CSS와 CSS Grid, 미디어 쿼리를 다뤘고 Tailwind CSS 코드나 CDN 연결은 포함하지 않았다.

| 파일 | 실제 코드에서 확인한 내용 | 확인 방식 |
|---|---|---|
| `chapter03/02/1.html` | 150×150px 주황색 `.box`, 기본 HTML·CSS 구조 | 소스 정적 검토 |
| `chapter03/02/2.html` | 모바일 기본 1열 Grid, 태블릿 2열 의도, 데스크톱 3열 의도, `print` 미디어 쿼리 | 소스 정적 검토 |

## 1. viewport가 반응형 기준을 만든다

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

`width=device-width`는 CSS가 사용할 viewport 너비를 기기 너비에 맞춘다. `initial-scale=1.0`은 처음 표시할 때 기본 배율로 시작한다.

## 2. 모바일 우선 Grid 구조

`2.html`의 기본 레이아웃은 미디어 쿼리 밖에서 1열로 선언되어 있다.

```css
.box-group {
  display: grid;
  grid-template-columns: 1fr;
  padding: 20px;
  row-gap: 15px;
}
```

화면이 좁을 때는 기본 규칙을 적용하고, 화면이 넓어지면 미디어 쿼리로 열 수를 늘리려는 모바일 우선 흐름이다.

```text
기본 화면: 1열
→ 태블릿 구간: 2열로 덮어쓰기 의도
→ 데스크톱 구간: 3열로 덮어쓰기 의도
```

`1fr`은 Grid 컨테이너의 사용 가능한 공간을 한 몫으로 나눈다는 뜻이다. `repeat(2, 1fr)`은 같은 크기의 열 2개, `repeat(3, 1fr)`은 열 3개를 만든다.

## 3. 간격과 박스 표현

```css
.box-group .box {
  background: skyblue;
  height: 250px;
  border-radius: 15px;
}
```

- `padding: 20px`: 컨테이너 안쪽 가장자리와 카드 사이 간격
- `row-gap: 15px`: 행 사이 간격
- `column-gap: 15px`: 여러 열이 생겼을 때 열 사이 간격
- `box-sizing: border-box`: 지정 크기에 padding과 border를 포함해 계산
- `border-radius: 15px`: 박스 모서리를 둥글게 표현

## 4. 미디어 쿼리 문법 점검

실습 파일은 다음 구간을 의도한다.

| 구간 | 작성된 조건 | 의도한 열 수 |
|---|---|---|
| 기본 | 미디어 쿼리 없음 | 1열 |
| 태블릿 | 750px 이상 1023px 이하 | 2열 |
| 데스크톱 | 1024px 이상 | 3열 |

하지만 파일에는 `and`와 괄호 사이 공백이 빠져 있다.

```css
@media screen and(min-width:750px)and(max-width:1023px) { ... }
@media screen and(min-width:1024px) { ... }
```

안전한 표준 문법은 다음과 같다.

```css
@media screen and (min-width: 750px) and (max-width: 1023px) {
  .box-group {
    grid-template-columns: repeat(2, 1fr);
    column-gap: 15px;
  }
}

@media screen and (min-width: 1024px) {
  .box-group {
    grid-template-columns: repeat(3, 1fr);
    column-gap: 15px;
  }
}
```

현재 코드의 화면용 미디어 쿼리는 브라우저에서 유효하게 해석되지 않을 가능성이 높다. 2열·3열이 실제 표시되는지는 브라우저에서 확인하지 않았으므로 실행 결과로 단정하지 않는다.

## 5. 예습 기준과 수업 코드의 차이

[예습 노트](./01-preview-notes-01-responsive-tailwind.md)는 교안 기준 태블릿 시작점을 768px로 정리했다. 수업 코드의 태블릿 시작점은 750px이다.

브레이크포인트는 프로젝트 요구에 따라 달라질 수 있으므로 750px 자체가 무조건 오류는 아니다. 이번 실습에서 교안 기준을 재현하려는 목적이었다면 768px로 맞출지 확인해야 한다.

## 6. print 미디어 쿼리

```css
@media print {
  body {
    background: black;
  }
}
```

`print`는 인쇄 또는 인쇄 미리보기 환경에서만 적용되는 미디어 타입이다. 브라우저의 배경 그래픽 인쇄 설정에 따라 배경색이 실제 출력되지 않을 수 있으므로 인쇄 미리보기 확인이 필요하다.

## 7. 이번 실습에서 확인되지 않은 내용

- Tailwind CSS CDN 연결
- Tailwind 유틸리티 클래스
- `sm:`, `md:`, `lg:` 같은 Tailwind 반응형 접두사
- 브라우저 750px·1023px·1024px 경계 렌더링
- 인쇄 미리보기 결과

오늘 학습 완료 범위는 HTML/CSS 기반 반응형 Grid와 미디어 쿼리 정적 검토까지다. Tailwind와 실제 렌더링 성공은 완료로 기록하지 않는다.

## 핵심 정리

1. 좁은 화면의 기본 CSS를 먼저 두고 `min-width`로 넓은 화면 레이아웃을 확장하면 모바일 우선 구조가 된다.
2. Grid의 `1fr`, `repeat()`로 화면 구간별 열 수를 바꿀 수 있다.
3. 미디어 쿼리는 조건의 의미뿐 아니라 공백과 괄호를 포함한 문법도 정확해야 한다.
4. 교안과 실습 코드의 브레이크포인트가 다르면 의도된 차이인지 확인해야 한다.
5. 소스에 규칙이 있다는 사실과 브라우저에서 정상 동작했다는 사실은 구분해야 한다.

## 다음 확인 항목

- `and (` 형태로 문법을 수정한 뒤 749px·750px·1023px·1024px에서 열 수 확인
- 교안 기준을 따를 경우 767px·768px 경계도 비교
- 인쇄 미리보기에서 `@media print` 적용 확인
- Tailwind 실습 파일이 추가되면 일반 CSS와 유틸리티 클래스 대응 정리
