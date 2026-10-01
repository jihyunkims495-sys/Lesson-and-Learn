# Week 08 — Frontend JavaScript

> 2026-09-29 시작 · LV.2

객체와 배열로 데이터를 다루고, JavaScript 함수의 정의와 실행 흐름에서 브라우저 실행 환경과 DOM 제어로 확장하는 주차입니다. 필요한 함수와 메서드를 외우기보다 MDN 공식 문서에서 사용 조건을 확인하고 실제 웹 요소와 연결하는 방법을 함께 익힙니다.

## Learning goals

- 객체의 프로퍼티와 배열의 인덱스 구조 구분
- 배열 메서드의 입력·반환값·원본 변경 여부 확인
- MDN에서 필요한 함수와 메서드를 찾는 순서 익히기
- 함수 정의·호출, 매개변수·인수와 반환값 연결
- 콜백 함수와 함수 자체를 전달하는 방식 이해
- 호출 스택과 클로저를 함수 실행 흐름으로 추적
- 하나의 실행 환경에서 코드와 결과를 연결해 확인
- 브라우저의 HTML 파싱과 화면 렌더링 흐름 이해
- BOM과 DOM의 역할 및 `window`·`document` 계층 구분
- HTML 요소와 DOM 객체, 속성·프로퍼티·메서드 구분
- DOM 요소 선택·탐색·내용·속성·스타일 제어
- `data-*`와 `dataset`을 이용한 요소별 추가 데이터 연결
- 브라우저 이벤트·이벤트 객체·리스너의 연결 이해
- 캡처링·타깃·버블링과 이벤트 전파 제어 구분
- `target`·`currentTarget`·`this`의 역할 비교
- 동기·비동기 처리와 AJAX·`fetch()`의 관계 이해

## Daily learning log

| Date | Topic | Records |
|---|---|---|
| 2026-09-29 | 4장 3강·5장 1강: 객체·배열, MDN 활용법과 함수 실행 흐름 | [Preview](./2026-09-29/01-preview-notes-01-javascript-core-functions-objects.md) · [Learning Notes](./2026-09-29/02-learning-notes-01-objects-arrays-functions.md) · [TIL](./2026-09-29/04-til-01-objects-arrays-functions.md) |
| 2026-09-30 | 6장 전체: 브라우저 렌더링·BOM·DOM 객체 트리와 요소 제어 | [Preview](./2026-09-30/01-preview-notes-01-browser-bom-dom.md) · [Learning Notes](./2026-09-30/02-learning-notes-01-browser-bom-dom.md) · [Practice](./2026-09-30/03-practice-01-dom-elements-dataset.md) · [TIL](./2026-09-30/04-til-01-browser-bom-dom-and-networking.md) |
| 2026-10-01 | 7장: 브라우저 이벤트·전파와 비동기 통신 | [Preview](./2026-10-01/01-preview-notes-01-browser-events-async-fetch.md) · [Learning Notes](./2026-10-01/02-learning-notes-01-browser-events-async-ajax.md) · [TIL](./2026-10-01/04-til-01-browser-events-async-ajax.md) |

## 기록 범위

- 2026-09-29 실제 학습 범위는 프론트엔드 개발 4장 3강과 5장 1강입니다. 브라우저 콘솔과 VS Code를 사용했지만 구체적인 실행 결과와 오류 해결 기록은 남지 않아 Practice 문서를 만들지 않았습니다.
- 2026-09-30에는 6장 전체를 수강하고 수업 예제를 VS Code에 입력했으며, DOM 요소·객체·속성과 `dataset`의 관계를 질문하고 정리했습니다.
- 2026-09-30의 저장된 실습 원본, 브라우저 출력과 오류 해결 결과는 확인되지 않아 실행 성공으로 기록하지 않았습니다.
- 2026-10-01에는 7장의 이벤트 처리·전파와 비동기 통신을 학습하고, JavaScript·TypeScript·Node.js, 이벤트 객체, `this`, AJAX의 관계를 질문하며 정리했습니다.
- 2026-10-01 학습은 매우 어렵게 느꼈다는 회고를 그대로 반영했습니다. 직접 실행한 코드와 이해도 평가 근거가 없어 Practice 문서를 만들거나 숙달을 주장하지 않았습니다.

[← Level 2 curriculum](../README.md)
