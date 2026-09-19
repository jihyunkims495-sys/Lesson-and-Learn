# ORDO AI Changelog

모든 주요 변경은 현재 구현 범위, 검증 결과와 미연동 영역을 함께 기록합니다.

## v1.0.0 — 2026-09-19

첫 제출 가능 기준본입니다.

### Included

- Entry를 기본 진입점으로 제공
- Today의 주문 수집 상태, 검토 우선순위, 확인·보류와 다음 주 일정 요약
- Overview의 일별 판매 흐름, 전주 비교, KPI, 재평가 상품과 환율 위젯
- Decisions의 REORDER·WATCH·HOLD 목록, 상품별 근거·리스크와 결정 제어
- Simulator의 보수·균형·확대 시나리오, 수량 조정, KPI와 아소트 변화
- Reports의 상품별·종합 분석, 관측·예측값, 판단과 리스크
- Calendar와 Quick Guide
- 그래프 좌→우 reveal, hover·focus·touch interaction과 reduced-motion 대응

### Data and Decision Model

- 니트·데님을 중심으로 한 가상 패션 PB 브랜드 fixture
- 일별 주문·판매, 재고, 리드타임, MOQ, 원가, 환율과 시즌 역할 반영
- 관측과 예측, 예측 매출과 무발주 기준 분리
- 수량·KPI 계산과 AI 설명 역할 분리
- 최종 승인 권한을 MD에게 유지

### Verified

- 배포 기준 소스와 패키지 해시 일치
- JavaScript 12개 문법 검사 통과
- JSON snapshot 파싱 통과
- README 로컬 링크와 HTML 자산 참조 누락 0건
- 메인 및 주요 탭 5개 스크린샷 3840×2160 확인
- 자격 증명·민감정보 패턴 검색 결과 0건
- Node 정적 서버에서 HTML·JS·JSON·폰트 HTTP 200 확인

### Not Yet Integrated

- 라이브 Supabase와 운영 주문·재고 API
- 외부 AI 추론 서비스
- 예측 백테스트와 정확도 모니터링
- 실제 PO 전송
- Daytona Sandbox 실행 및 산출물 회수

### Next

- 실데이터 연결과 예측 정확도 개선
- Daytona 격리 환경에서 버전 고정 계산 엔진 실행
- 브랜드 컨셉 명세 Import 후 브랜드·시장·유저 분석
- 시즌 P&L과 카테고리·SKU 물량 계획 제안
