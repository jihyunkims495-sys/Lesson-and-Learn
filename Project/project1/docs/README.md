# ONEPIECE 프로젝트 명세

문서는 카테고리별로 보관하고, 작성일은 파일명과 본문에 남긴다. 각 문서의 계획·제안·검증 상태는 작성일 기준으로 읽는다.

혼합 문서는 주된 목적에 따라 한 곳에 두고 문서 간 상대 링크로 연결한다. 고객 조사·가상 프로필, 서비스 설계, 측정·결과, 개발 실행의 책임을 구분한다.

| 순서 | 카테고리 | 확인할 내용 | 문서 수 |
| --- | --- | --- | ---: |
| 1 | [고객 분석](./01-customer-analysis/README.md) | 고객 인터뷰·탐색 행동과 가상 고객의 성향·과업·예산을 정의한다. | 2 |
| 2 | [서비스 기획](./02-service-planning/README.md) | 고객 문제를 구매 여정·화면 동작·검증 가설·데이터 구조로 연결한다. | 7 |
| 3 | [지표 검증](./03-metrics-validation/README.md) | 측정 지표·집계 기준·GA4 설정·실험 절차와 실제 검증 결과를 확인한다. | 5 |
| 4 | [Task 명세](./04-task-specs/README.md) | 개발 작업의 담당·파일 범위·구현 순서·의존성·완료 기준을 확인한다. | 4 |

## 1. 고객 분석

| 작성일 | 문서 | 내용 |
| --- | --- | --- |
| 2026-10-20 | [User FGI 정리 명세](./01-customer-analysis/2026-10-20-01-user-fgi-spec.md) | v1.1, 두 인터뷰·가설 변화·설계 방향·검증 계획 |
| 2026-10-21 | [가상 회원 180명 정의](./01-customer-analysis/2026-10-21-04-virtual-members-180-spec.md) | 행동 유형·과업·예산·프로필 스키마 |

## 2. 서비스 기획

| 작성일 | 문서 | 내용 |
| --- | --- | --- |
| 2026-10-14 | [산산기어 Cart 레퍼런스 분해 명세](./02-service-planning/2026-10-14-01-sansangear-cart-reference-spec.md) | Cart Drawer·전체 Cart·빈 Cart 분석 |
| 2026-10-14 | [ERD 수정 명세](./02-service-planning/2026-10-14-03-erd-revision-spec.md) | 당시 데이터 구조 수정안 |
| 2026-10-19 | [프로젝트 흐름·Task·퍼널 명세](./02-service-planning/2026-10-19-01-project-flow-task-funnel-spec.md) | v0.2, 당시 팀 공유용 초안 |
| 2026-10-20 | [구매 여정 UI·추천·혜택 개선 명세](./02-service-planning/2026-10-20-03-ui-recommendation-benefits-spec.md) | v1.0, 전역 Cart·정렬·두 추천 기능·테스트 혜택·완료 기준 |
| 2026-10-20 | [팀원 ERD 변경 분석](./02-service-planning/2026-10-20-04-erd-change-analysis.md) | 기존 ERD와 팀원 신규 ERD의 차이 분석 |
| 2026-10-21 | [A·B·C 웹→앱 가설](./02-service-planning/2026-10-21-01-abc-web-to-app-hypothesis.md) | 레퍼런스 분석과 동일 서비스 앱 Cart 이어가기의 초기 가설 |
| 2026-10-21 | [B·C PC 웹→모바일 웹 가설](./02-service-planning/2026-10-21-02-bc-web-mobile-hypothesis-spec.md) | 모바일 웹으로 확정한 비교 범위와 검증 조건 |

## 3. 지표 검증

| 작성일 | 문서 | 내용 |
| --- | --- | --- |
| 2026-10-21 | [가상 회원 생성·행동 실행·측정 절차](./03-metrics-validation/2026-10-21-01-member-injection-and-measurement-spec.md) | 계정 준비·브라우저 행동·GA4 수신을 구분한 실행 절차 |
| 2026-10-21 | [A·B·C GA4 측정 지표](./03-metrics-validation/2026-10-21-03-abc-ga4-metrics-spec.md) | 퍼널·UI·기기 전환 지표와 집계 기준 |
| 2026-10-21 | [GA4 설정·검증 프로세스](./03-metrics-validation/2026-10-21-05-abc-ga4-setup-process-spec.md) | 안별 계측 설정과 작성 당시 수신 검증 상태 |
| 2026-10-21 | [B·C Vercel 화면·흐름 검증](./03-metrics-validation/2026-10-21-06-bc-vercel-validation.md) | 배포 화면에서 확인한 오류·미완료 항목 |
| 2026-10-21 | [10/21 실험 문서 안내](./03-metrics-validation/2026-10-21-experiment-guide.md) | 초기 가설·후속 범위, 클릭 종료점과 구매·집계 해석 기준 |

## 4. Task 명세

| 작성일 | 문서 | 내용 |
| --- | --- | --- |
| 2026-10-14 | [Cart·ERD 2일 작업 명세](./04-task-specs/2026-10-14-02-two-day-task-plan.md) | 10/14~15의 작업 범위와 완료 기준 |
| 2026-10-16 | [Cart Mock 테스트·화면 보완 명세](./04-task-specs/2026-10-16-01-cart-mock-test-development-spec.md) | 회의 전 계획 보존본 |
| 2026-10-16 | [Cart Drawer·Mock·GA4 테스트 환경 명세](./04-task-specs/2026-10-16-02-cart-drawer-mock-analytics-spec.md) | 회의 반영 작업 범위와 데이터·테스트 계획 |
| 2026-10-20 | [이번 주·오늘 작업 및 비교 검증 명세](./04-task-specs/2026-10-20-02-sprint-task-and-validation-spec.md) | v1.1, 오늘 Task·내일부터의 흐름·R&R·dev 통합·측정 |

## 문서 읽는 기준

- 10/16 Cart 범위가 충돌하면 회의 반영본을 우선한다.
- 10/20 작업 방향은 스프린트 명세와 기능 개선 명세를 함께 확인한다.
- 초기 동일 서비스 앱 가설과 후속 모바일 웹 범위는 구분한다. [10/21 실험 안내](./03-metrics-validation/2026-10-21-experiment-guide.md)에서 클릭 종료점·후속 구매 설계·집계 단위의 해석을 확인한다.

## Cart 화면

| 화면 | 이미지 |
| --- | --- |
| 데스크톱 Cart | [cart-desktop.png](./cart-desktop.png) |
| 모바일 Cart | [cart-mobile.png](./cart-mobile.png) |
| 빈 Cart | [cart-empty.png](./cart-empty.png) |
