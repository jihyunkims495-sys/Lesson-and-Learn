# TIL | 2026-11-03 | 4계층 아키텍처와 도메인 중심 설계

> LV.2 · Week 12 · 백엔드 아키텍처 & API 설계

> **4계층은 폴더를 나누는 규칙이 아니라 비즈니스 규칙과 외부 기술 사이에 변경 경계를 만드는 구조다.**

> 구조를 나누는 이유는 이해했지만, 하나의 유스케이스를 실제 계층별 코드로 배치하고 연결하는 연습이 더 필요하다는 점을 확인했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- Presentation은 HTTP 입력·출력, Application은 유스케이스 순서, Domain은 비즈니스 규칙, Infrastructure는 DB와 외부 기술을 담당한다.
- Entity, Value Object, Aggregate Root가 규칙과 일관성의 경계를 만든다.
- Repository는 ORM 모델과 순수 Domain 객체 사이를 변환하며, Port와 Adapter를 Composition Root에서 연결한다.
- SQLAlchemy의 `__table_args__`에는 테이블 수준의 인덱스와 제약조건을 선언한다.

### 핵심 코드

```python
class Course:
    def apply_registration(self) -> None:
        if self.current_students >= self.capacity:
            raise ValueError("정원이 가득 찼습니다.")
        self.current_students += 1
```

이 코드는 핵심 규칙을 Controller 밖의 Domain 객체에 두는 학습용 축약 예시다.

### 오늘 수행한 학습

- 실제 프로젝트에서 `presentation → application → domain → infrastructure`의 역할을 파일별로 추적했다.
- Repository의 ORM–Domain 변환과 FastAPI 의존성 와이어링 흐름을 확인했다.
- 애플리케이션 startup 로그를 확인하고, 서버 기동과 API·DB 동작 검증의 차이를 구분했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드: 오늘 학습 개념을 축약한 Domain Method 예시와 계층별 구현 순서 정리
검증 방법: 실제 프로젝트 구조 확인, 서버 startup 로그 확인
확인한 결과: 애플리케이션 기동 완료와 계층별 의존성 연결 구조
미완료: 작은 유스케이스를 4계층으로 직접 구현하고 API·DB까지 실행하는 검증
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- HTTP 프레임워크나 DB가 바뀌어도 비즈니스 규칙을 유지하기 위해 필요하다.
- 핵심 검증 로직이 여러 Controller와 Service에 중복되는 것을 막는다.
- 계층별 책임이 분명하면 테스트 범위를 작게 나누고 변경 영향을 추적하기 쉽다.

### 내 생각

4계층의 핵심은 “어느 폴더에 넣을까?”보다 “이 코드는 어떤 이유로 변경되는가?”를 판단하는 데 있다고 이해했다. 다만 설명을 보고 구조를 구분하는 것과 빈 화면에서 클래스와 의존성을 직접 연결하는 것은 다른 단계였다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. Router가 요청 데이터를 받아 Application Service를 호출한다.
2. Application Service가 Repository Port로 Domain 객체를 조회한다.
3. Domain 객체가 자신의 규칙을 검사하고 상태를 변경한다.
4. Application Service가 Repository를 통해 변경 내용을 저장한다.
5. Infrastructure Adapter가 ORM 변환과 DB 작업을 수행하고 Router가 응답을 반환한다.

### 내 말로 설명하기

Domain은 “이 행동을 해도 되는가?”를 판단하고, Application은 “이 유스케이스를 어떤 순서로 진행할까?”를 조율한다. Infrastructure는 그 결과를 실제 DB에 저장하며, Presentation은 외부 요청과 응답 형식만 담당한다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 모르는 용어를 각각 묻는 데서 그치지 않고 실제 프로젝트의 파일 구조와 연결해 보았다.
- 계속 유지할 학습 방법: 실행 로그가 증명하는 범위와 아직 검증하지 않은 범위를 구분한다.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: 4계층을 분리해야 하는 이유와 구조는 어느 정도 이해했지만, 실제 기능을 어느 클래스와 파일에 배치해야 하는지 감이 잘 오지 않았다.
- 반복해서 실수한 부분: 별도 평가를 하지 않아 확인되지 않았다.
- 아직 설명하기 어려운 부분: Repository Port, Adapter, Application Service와 의존성 주입을 처음부터 연결하는 코드 작성 과정이다.

### Try — 다음에 시도할 것

- 다시 공부할 내용: Domain과 Application의 책임 경계, ORM–Domain 매핑 위치
- 예제를 보지 않고 작성해볼 코드: 정원 제한이 있는 수강 신청 유스케이스
- 다음 학습에서 바꿔볼 방법: DB부터 연결하지 않고 Domain → 메모리 Repository → Application Service 순서로 작은 흐름을 먼저 완성한다.

---

## 8. 이해도 점검

- [ ] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [ ] 코드가 실행되는 순서를 설명할 수 있다.
- [ ] 오늘 발생한 오류의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [ ] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

별도 이해도 평가를 진행하지 않아 체크하지 않았다.

---

## 9. 다음 학습에서 할 일

1. 수강 신청 유스케이스의 입력, 성공 결과와 실패 조건을 먼저 문장으로 적는다.
2. 순수 Python Domain 객체와 메모리 Repository로 정상·정원 초과 흐름을 실행한다.
3. SQLAlchemy Adapter, Application Service, FastAPI Router를 차례로 연결하고 요청 한 건을 추적한다.

---

## 관련 자료

- [수업 노트](./02-learning-notes-01-four-layered-architecture.md)
- [Week 12 학습 기록](../README.md)
