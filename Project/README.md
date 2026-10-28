# Project Index

프로젝트의 최신 버전, 상태와 진입점을 관리합니다. 구현 범위와 미연동 영역은 각 프로젝트의 README와 CHANGELOG를 기준으로 확인합니다.

## Projects

| 프로젝트 | 버전 | 상태 | 설명 | 링크 |
|---|---:|---|---|---|
| ORDO AI | v1.2.0 | Public demo · Research v27 | 패션 MD를 위한 매출·재고·리오더 의사결정 OS. 시나리오 비교와 최종 발주 검토에 시장·고객 데일리 트렌드 리포트를 추가했습니다. | [README](./Ordo-AI/README.md) · [CHANGELOG](./Ordo-AI/CHANGELOG.md) · [Research 명세](./Ordo-AI/docs/RESEARCH.md) · [Demo](https://ordo-ai-decision-os-jihyu.jihyunkims495.chatgpt.site/#entry) · [Research](https://ordo-ai-decision-os-jihyu.jihyunkims495.chatgpt.site/#research) |
| ONEPIECE | Project 1 | Team project · `main` snapshot | Next.js와 Supabase 기반 패션 쇼핑몰 팀 프로젝트입니다. | [A안](./project1/version_test_A/README.md) · [B안](./project1/version_test_B/README.md) · [C안](./project1/version_test_C/README.md) |
| AsyncTicket | Project 2 · HELD v4 | ERD · API design draft | HELD ERD, JSON API 19개와 Jinja2 화면·폼 17개 계약을 정리한 설계안입니다. | [README](./project2/README.md) · [API 명세](./project2/02-api-spec.md) · [Jinja2 계약](./project2/03-jinja-http-contract.md) |

## ORDO AI · Current Scope

- 주문·판매·재고·원가·환율·시즌 샘플 데이터를 기반으로 REORDER·WATCH·HOLD 후보와 물량 시나리오를 비교합니다.
- Today → Overview → Decisions → Simulator → Reports → Final Order 흐름에서 MD가 근거와 리스크를 검토하고 최종 판단합니다.
- Research 탭은 브랜드 기준, 출처 우선순위, 시장 검색 신호, 자사 고객 행동, 브랜드·시즌 관측과 MD 검토 항목을 정리합니다.
- Research 그래프는 7일·4주·12개월 범위와 포인트별 hover·focus·touch 값 확인을 지원합니다.
- Naver DataLab·GA4 형식 수치는 시연용 합성 데이터입니다. 라이브 플랫폼 API, 매일 08:00 자동 수집·발행, 외부 AI 추론과 실제 발주 전송은 연결되지 않았습니다.

## Versioning

- `v1.0.0`: 평가와 시연이 가능한 첫 기준본
- `v1.1.0`: Daytona 독립 실행과 서버 계산 시연 기록
- `v1.2.0`: Research 탭, 출처·한계 명세와 그래프 상호작용 추가
- 기능이나 데이터 계약이 달라지면 CHANGELOG에 범위와 검증 결과를 먼저 기록합니다.
- 데모 fixture, 로컬 검증, 실제 외부 연동을 구분해 기록합니다.
- 외부 서비스 연동은 직접 검증되기 전까지 계획 또는 미연동으로 표시합니다.

## Directory Structure

```text
Project/
├─ README.md
├─ project1/
│  ├─ version_test_A/  # ONEPIECE A안
│  ├─ version_test_B/  # ONEPIECE B안
│  └─ version_test_C/  # ONEPIECE C안
├─ project2/
│  ├─ README.md
│  ├─ 01-erd-jinja-design.md
│  ├─ 02-api-spec.md
│  ├─ 03-jinja-http-contract.md
│  ├─ 04-implementation-and-validation.md
│  ├─ guide.html
│  ├─ openapi.json
│  └─ held-api-spec.md        # v3 검토 기록
└─ Ordo-AI/
   ├─ .gitignore
   ├─ README.md
   ├─ CHANGELOG.md
   ├─ app/        # 공개 정적 웹 애플리케이션
   ├─ daytona/    # Daytona 실행·시연 구성
   ├─ docs/       # 릴리스·Research 명세 및 공개 증거
   └─ tools/      # 로컬 실행·검증 도구
```
