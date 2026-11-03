# Preview Notes | 2026-11-03 | 인증·4계층 아키텍처·캐싱·배포

> LV.2 · Week 12 · 백엔드 아키텍처 & API 설계

## 1. 전체 흐름

이번 학습 범위는 인증된 요청이 비즈니스 규칙을 거쳐 저장소에 반영되고, 반복 조회는 캐시로 줄이며, 완성된 애플리케이션을 외부에 안전하게 제공하는 과정이다.

```text
클라이언트
  → HTTPS / Reverse Proxy
  → CORS Middleware
  → Presentation: HTTP 요청·응답
  → Application: 유스케이스와 트랜잭션 조율
  → Domain: 핵심 비즈니스 규칙
  → Infrastructure: DB·캐시·외부 시스템
```

## 2. 학습 목표

1. 인증과 인가를 요청 흐름에서 구분한다.
2. 비밀번호 해시와 JWT 서명의 목적을 구분한다.
3. Access Token과 Refresh Token의 역할과 수명 차이를 설명한다.
4. Presentation, Application, Domain, Infrastructure의 책임을 구분한다.
5. ORM 모델과 Domain 객체를 분리하는 이유를 이해한다.
6. Cache Hit, Miss, TTL과 Invalidation의 관계를 설명한다.
7. CORS와 인증이 서로 다른 문제인 이유를 이해한다.
8. 애플리케이션 서버, Reverse Proxy와 HTTPS의 역할을 연결한다.

## 3. 선행 개념

| 선행 개념 | 이번 학습과의 연결 |
|---|---|
| Pydantic Schema | 회원가입·로그인 입력과 응답 형식을 검증한다. |
| FastAPI Dependency | 현재 사용자, DB Session과 Service를 주입한다. |
| APIRouter | 기능별 HTTP 진입점을 구성한다. |
| Middleware | CORS처럼 전체 요청에 적용할 정책을 처리한다. |
| ORM Model | Infrastructure에서 데이터베이스 테이블과 매핑한다. |
| Transaction | 한 유스케이스의 DB 변경을 하나의 작업 단위로 관리한다. |
| 환경 변수 | DB 주소와 보안 설정을 코드에서 분리한다. |

## 4. 인증과 인가

### 인증과 인가의 차이

| 구분 | 확인하는 질문 | 예시 |
|---|---|---|
| 인증 | 누구인가? | 로그인, 토큰 검증, 현재 사용자 확인 |
| 인가 | 무엇을 할 수 있는가? | 관리자만 삭제, 본인 데이터만 수정 |

인증에 성공했다고 모든 기능을 사용할 수 있는 것은 아니다. 보호된 API는 토큰뿐 아니라 사용자 상태, 데이터 소유권과 역할도 확인해야 한다.

### 비밀번호 저장

비밀번호는 나중에 복호화할 데이터가 아니므로 단방향 해시로 저장한다.

```text
평문 비밀번호
  → Password Hashing Algorithm + Salt + Cost
  → 복원할 수 없는 Hash 저장
```

- Salt는 같은 비밀번호라도 서로 다른 결과를 만든다.
- Cost는 무차별 대입 공격 비용을 높인다.
- 로그인에서는 입력값을 같은 검증 함수에 전달해 저장된 해시와 비교한다.

### JWT

```text
Header.Payload.Signature
```

- Header: 토큰 종류와 서명 알고리즘
- Payload: 사용자 식별자, 만료 시각, 토큰 용도 등의 Claim
- Signature: 발급자와 내용의 무결성 검증

Payload는 암호화된 비밀 공간이 아니다. 비밀번호나 개인정보를 넣지 않아야 한다.

### Access Token과 Refresh Token

| 토큰 | 목적 | 수명 |
|---|---|---|
| Access Token | 보호된 API 호출 | 짧게 설정 |
| Refresh Token | 새 Access Token 발급 | 상대적으로 길게 설정 |

로그아웃과 강제 만료를 구현하려면 짧은 만료 시간, 토큰 회전, 차단 목록과 재사용 탐지 정책을 함께 검토해야 한다. 여러 서버가 동작하는 환경에서는 프로세스 메모리보다 공유 저장소가 필요하다.

## 5. 4계층 아키텍처

| 계층 | 책임 | 대표 구성요소 |
|---|---|---|
| Presentation | HTTP 입력·출력과 오류 변환 | Router, Request·Response Schema |
| Application | 유스케이스 실행 순서와 트랜잭션 조율 | Application Service |
| Domain | 핵심 규칙과 상태 변경 | Entity, Value Object, Domain Service |
| Infrastructure | DB·캐시·외부 기술 구현 | ORM Model, Repository Adapter |

```text
Router
  → Application Service
  → Repository로 Domain 객체 조회
  → Domain Method 실행
  → Repository로 변경 저장
  → 응답 형식으로 변환
```

계층 분리의 목적은 폴더를 늘리는 것이 아니라 변경 이유가 다른 코드를 분리하는 것이다. Domain이 FastAPI와 SQLAlchemy를 직접 알지 않으면 핵심 규칙을 작은 단위로 테스트하고 기술 변경의 영향을 줄일 수 있다.

### 동시성 주의점

Domain 객체가 한 요청 안에서 정원 초과를 막아도 두 트랜잭션이 동시에 같은 이전 값을 읽으면 경쟁 상태가 생길 수 있다. 실제 서비스에서는 행 잠금, 조건부 갱신, DB 제약조건과 최종 상태 검증을 함께 고려해야 한다.

## 6. CORS와 캐시

### CORS

Origin은 프로토콜, 호스트와 포트의 조합이다. CORS는 브라우저가 다른 Origin의 응답을 JavaScript에서 읽을 수 있도록 서버가 허용 범위를 알리는 규칙이다.

- 허용 Origin은 필요한 주소만 명시한다.
- 자격 증명을 허용할 때 와일드카드 설정을 피한다.
- CORS 허용은 사용자의 인증·인가 성공을 의미하지 않는다.
- 복잡한 요청은 실제 요청 전에 Preflight 요청이 발생할 수 있다.

### 캐시

```text
요청
  → Cache 조회
  → Hit: 캐시 값 반환
  → Miss: DB 조회 → Cache 저장 → 반환
```

- TTL은 오래된 값이 무한히 남는 것을 막는다.
- 데이터가 변경되면 관련 캐시를 삭제하거나 갱신해야 한다.
- 캐시 키에는 데이터 종류와 식별자, 필요한 버전 정보를 포함한다.
- 비동기 함수 안에서 동기 캐시 호출을 사용하면 이벤트 루프를 막을 수 있다.

## 7. 배포 구성

```text
Internet
  → HTTPS
  → Reverse Proxy
  → Application Server
  → Database / Cache
```

- 방화벽 규칙은 외부에 필요한 포트만 연다.
- 애플리케이션 프로세스는 서비스 관리 도구로 재시작과 로그를 관리한다.
- Reverse Proxy는 HTTPS 종료, 요청 전달과 정적 파일 처리를 담당할 수 있다.
- 비밀값과 환경별 설정은 소스코드와 분리한다.
- 배포 성공은 프로세스 실행뿐 아니라 Health Check와 실제 요청으로 확인한다.

## 8. 예상 난점

1. 인증과 인가를 같은 단계로 생각하기
2. JWT Payload가 암호화되어 있다고 오해하기
3. 로그아웃 시 클라이언트 토큰 삭제만으로 서버 차단까지 완료됐다고 생각하기
4. Application Service와 Domain의 책임을 구분하지 못하기
5. 캐시 TTL만 설정하고 데이터 변경 시 무효화를 빠뜨리기
6. CORS 오류를 서버 내부 인증 오류와 혼동하기
7. 서버 프로세스 실행을 전체 배포 성공으로 판단하기

## 9. 예정 실습

- 정상·만료·잘못된 용도의 토큰을 구분해 검증한다.
- 작은 유스케이스 하나를 4계층으로 분리해 호출 순서를 추적한다.
- 캐시 Hit·Miss와 데이터 변경 후 무효화를 로그로 확인한다.
- 허용·비허용 Origin과 Preflight 응답을 비교한다.
- 배포 후 Health Check와 보호된 API 요청을 각각 검증한다.

## 10. 수업 전 확인 질문

1. 인증과 인가는 요청 흐름에서 어느 시점에 각각 수행되는가?
2. Access Token과 Refresh Token을 구분하지 않으면 어떤 위험이 생기는가?
3. Domain 객체가 HTTP 상태 코드를 몰라야 하는 이유는 무엇인가?
4. Repository가 ORM 모델을 Domain 객체로 변환하는 이유는 무엇인가?
5. CORS를 허용해도 인증되지 않은 요청이 거절되는 이유는 무엇인가?
6. 캐시 데이터는 언제 삭제하거나 갱신해야 하는가?
7. 프로세스 실행 외에 배포 성공을 확인하려면 무엇을 검증해야 하는가?

## 관련 자료

- [오늘의 Learning Notes](./02-learning-notes-01-four-layered-architecture.md)
- [오늘의 TIL](./04-til-01-four-layered-architecture.md)
- [Week 12 학습 기록](../README.md)
