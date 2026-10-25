# B·C Vercel 실제 화면·앱 흐름 검증

- 검증일: 2026-10-21, Asia/Seoul
- B: https://onepiece-b-test.vercel.app
- B 앱 프리뷰: https://onepiece-b-test.vercel.app/app-preview
- C: https://onepiece-c-test.vercel.app
- 고객 정의: A/B/C는 동일한 설계 회원을 사용한다. 이번 UI QA는 인증 단계가 막혀 회원별 파일럿 완료로 취급하지 않는다.

현재 실험의 종료점은 `payment_button_click`이며 Toss API는 연결하지 않는다. 아래 승인 주문 관련 조치는 후속 설계다. 버튼 클릭과 결제 승인·구매 완료를 구분한다.

## 실제 확인 결과

| 항목 | B | C |
| --- | --- | --- |
| 태그 | 분석 동의 후 G-JWBDB2MZHF 로딩 확인 | 분석 동의 후 같은 태그 확인 |
| 회원 로그인 | Kakao 버튼 disabled, 이메일 테스트 회원 폼 없음 | 팀 파일럿 043 계정으로 시도했으나 Supabase 환경변수 미설정 메시지 |
| 목록·상세 | 앱 프리뷰의 실제 iframe에서 목록·상품 상세 이동 | 목록·상세 이동 정상 |
| 담기 | DEMO STUDIO JACKET Ink / M 1개, 128,000원, Cart 반영 | 아이보리 싱글 코트 사이즈2 담기 문구만 표시, 실제 Cart는 샘플 3개·327,000원 유지 |
| Checkout | 프레임 밖 /checkout 이동, 같은 상품·옵션·수량·합계 | 샘플 Cart의 Checkout 진입만 가능 |
| Toss | 클릭 전용 안내 확인 후 버튼 동작·완료 문구 확인 | 클릭 전용 버튼·완료 문구 확인 |
| 승인 주문 | 없음 | 없음 |

B/C 상품 구성이 다르다. B는 합성 36개 목록, C는 19개 목록이 관찰됐다. 동일 과업으로 비교하기 전에 공통 상품·옵션·가격·재고 조건을 고정해야 한다.

## GA4 실제 수신

B 앱 프리뷰 UI 클릭을 DebugView에서 개별로 열어 다음 값을 대조했다.

- event: ui_click
- execution_surface: app_preview
- flow_id: onepiece_app_flow_v1
- ui_target: checkout_open
- screen_path: /cart/

B 브라우저 전송 로그에도 앱 프리뷰의 page_view / view_item_list / select_item / view_item / add_to_cart / begin_checkout가 기록됐고 Checkout에도 app_preview 문맥이 있었다. 브라우저 전송 로그 전체와 GA 개별 수신 표본은 다른 근거다. 모든 단계·회원·실행 ID의 정합성을 검증한 것은 아니다. C의 이번 새 실행에 대한 GA 개별 실행 ID 수신 대조는 아직 완료하지 않았다.

이번 앱 프리뷰는 데스크톱 브라우저 안의 모바일 프레임이다. 실제 휴대폰 접속 또는 User-ID 기반 기기 간 Cart 복원을 검증하지 않았다. ?preview=B는 분석 제외용이므로 사용하지 않았다.

## GA 설정 반영

기존 비교 보고서에는 Vercel B/C 호스트가 이미 포함돼 있어 해당 조건을 유지했다. 보고서에 기기 카테고리·국가·시/군/구·세션 소스/매체·페이지 경로 및 화면 클래스·페이지 경로 + 쿼리 문자열을 추가하고 저장·재로딩 후 목록을 확인했다.

맞춤 정의에 이벤트 범위 4개를 등록하고 재로딩 후 보존을 확인했다.

| 표시 이름 | 이벤트 매개변수 |
| --- | --- |
| 실행 화면 | execution_surface |
| 앱 흐름 | flow_id |
| 클릭 대상 | ui_target |
| 행동 화면 경로 | screen_path |

/app-preview 경로만으로 내부 실제 화면과 프레임 밖 Checkout을 전부 묶을 수 없다. execution_surface로 실행 UI를 구분하고, 실제 기기는 device category로 별도 분석한다. 모든 자동 page_view에 같은 문맥이 붙는지는 별도 검증한다. 앱 프리뷰 debug_mode=true의 일반 보고서 제외 여부도 아직 점검해야 한다.

## 최초 문제·직접 원인·최소 조치·재검증

| 문제 | 직접 원인 | 최소 조치 | 재검증 |
| --- | --- | --- | --- |
| B 팀 회원 로그인 불가 | 현재 배포가 비활성 Kakao 로그인 시연 | 팀 Supabase 테스트 회원 인증 경로 구현·배포 | 미실행 |
| C 로그인 설정 오류 | 배포된 클라이언트에 공개 Supabase 설정 없음 | Vercel 빌드 환경변수 설정 후 재빌드·재배포 | 미실행 |
| C 담기 미반영 | 상세에서 실제 shared Cart 삽입 미연결 | 제품·옵션을 Cart 모델로 매핑하여 상태에 삽입 | 미실행 |
| 승인 구매 측정 불가 | 두 안 모두 click_only | Toss 테스트 서버 승인·주문 저장·구매 계측 구현 | 미실행 |

이 검증은 화면·계측 QA이며, 실제 결제·주문 생성 완료를 검증한 결과가 아니다.

## 팀 Auth 검증 범위

당시 팀 파일럿 6명은 API 로그인과 본인 프로필 조회를 통과했다. 계정 준비와 180명 브라우저 행동 실행은 별도의 검증 단계다.

B/C 인증·Cart·결제 연결 문제를 해결하고 동일 회원의 B/C 파일럿이 통과하기 전에는 전체 구매 여정 실험 완료로 보고하지 않는다.
