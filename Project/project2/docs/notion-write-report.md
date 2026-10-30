# 공연·공연 회차 API 명세 구성 요약

기준일: 2026-10-29. `shows`와 `performances` 도메인의 API 10개를 정리한 검토용 초안이다. 실제 구현·DB 적용·HTTP 테스트를 완료한 결과가 아니다.

요청·응답 예시와 필드별 상세 설명은 [공연·공연 회차 API 명세 초안](shows-performances-notion-template.md)에서 확인할 수 있다.

## 기능 목록

공연 5개와 공연 회차 5개로 구성한다. 삭제 2개 기능은 구현 범위에 포함할지 검토가 필요하다.

| ID | 기능명 | Method | API Path |
| --- | --- | --- | --- |
| SHOW-01 | 공연 목록 조회 | GET | `/v1/shows` |
| SHOW-02 | 공연 상세 조회 | GET | `/v1/shows/{show_id}` |
| SHOW-03 | 공연 등록 | POST | `/v1/shows` |
| SHOW-04 | 공연 수정 | PATCH | `/v1/shows/{show_id}` |
| SHOW-05 | 공연 삭제 (범위 검토) | DELETE | `/v1/shows/{show_id}` |
| PERF-01 | 공연별 회차 목록 조회 | GET | `/v1/shows/{show_id}/performances` |
| PERF-02 | 회차 상세 조회 | GET | `/v1/performances/{perf_id}` |
| PERF-03 | 회차 등록 | POST | `/v1/shows/{show_id}/performances` |
| PERF-04 | 회차 수정 | PATCH | `/v1/performances/{perf_id}` |
| PERF-05 | 회차 삭제 (범위 검토) | DELETE | `/v1/performances/{perf_id}` |

## 명세 표에 기록할 내용

| 항목 | 기록하는 내용 |
| --- | --- |
| 기능 분류·기능명 | 공연 또는 공연 회차 도메인과 개별 동작 |
| API Path·Method | 호출할 경로와 GET·POST·PATCH·DELETE 동작 |
| 요청 상세 | 요청 header, Path·Query 매개변수, body 또는 본문 없음 |
| 응답 상세 | 성공 HTTP 상태, 응답 header와 body, 주요 실패 조건 |
| 명세 작성 현황·테스트 여부 | 검토 중인 계약과 실제 실행·검증 여부를 구분 |

## 기능 페이지의 여섯 항목

| 항목 | 설명 |
| --- | --- |
| Description | 기능 목적, 인증·권한, 관련 테이블, 처리 규칙과 확인할 정책 |
| Header | 요청·응답 헤더의 이름, 값과 사용 이유 |
| Request Body | Path·Query·Body의 구분, 요청 예시와 필드별 타입·필수 여부·검증 |
| Response Field | 성공 응답 예시와 반환 필드의 의미 |
| Response Code | 성공 및 실패 HTTP 상태와 반환 조건 |
| ERROR | 실패 응답 JSON 예시, 오류 발생 조건, 공통 오류 형식 합의 사항 |

## 공통 계약을 읽는 기준

- 공통 경로 접두사는 `/v1`이다. 같은 경로라도 HTTP Method에 따라 조회·등록·수정·삭제 동작이 달라진다.
- 조회는 Path·Query로 대상을 정하며 요청 body를 사용하지 않는 안이다. JSON body를 보내는 등록·수정 요청은 `Content-Type: application/json`을 기록한다.
- `Accept`는 받고 싶은 응답 형식, `Content-Type`은 보내는 본문의 형식을 나타낸다. HTTP 헤더는 JSON 객체가 아니라 `이름: 값`으로 전달한다.
- 정상 조회·수정은 200, 등록은 201과 생성 자원의 `Location`, 삭제는 204와 본문 없음으로 제안한다.
- 변경 요청은 로그인 사용자와 역할·소유권을 검사하는 안이다. `shows.user_id`는 클라이언트 입력 대신 인증 사용자로부터 서버가 결정한다.
- 오류 본문과 코드명은 공통 정책 제안이다. FastAPI의 기본 422 `detail` 배열을 유지할지, 공통 오류 객체로 통일할지 합의해야 한다.

## DB 구조와 합의할 정책 구분

DB 컬럼·nullable·기본값과 API 정책은 서로 다른 계약이다. 컬럼이 있다고 해서 권한, 상태 전이, 삭제 조건까지 확정된 것은 아니다.

| 구분 | 확인할 내용 |
| --- | --- |
| 공연 | 등록자·소유자의 의미, 역할별 변경 권한, 공연 분류 코드, runtime 단위·범위, 목록 정렬·공개 필드 |
| 공연 회차 | 상태 허용값·초기값, 공연 내 회차 번호 유일성, 판매기간 경계, 매수 한도 적용 범위 |
| 시간 검증 제안 | `booking_opens_at < booking_closes_at <= starts_at < ends_at`의 채택 여부 |
| 좌석 구성 경계 | `seats_info` 생성 담당·시점, 회차 등록과의 처리 경계, 구성 전 공개·판매 가능 여부 |
| 수정·삭제 | 연결 회차·좌석·예매가 있는 경우 허용 범위와 충돌 응답, 이력 보존 방식 |

회차 등록·상태 변경·삭제가 좌석 생성, 주문 취소 또는 환불을 자동 수행한다고 전제하지 않는다. 허용 범위를 합의한 뒤 요청·응답 스키마와 구현을 맞춘다.
