# TIL | 2026-09-04 | PostgreSQL DDL·DML과 정규화

> **테이블을 만드는 것에서 끝나는 게 아니라, 구조를 바꾸고 제약조건으로 관계를 지키는 흐름까지 처음 연결했다.**

> DDL은 테이블 구조를 다루고, DML은 그 안의 데이터를 다루며, PK/FK와 정규화는 데이터가 꼬이지 않도록 설계하는 장치라는 점을 이해했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- PostgreSQL에서 `' '`는 **문자열 리터럴**, `" "`는 **테이블명·컬럼명 같은 식별자**를 감쌀 때 사용한다.
- **DDL(Data Definition Language)**은 데이터베이스 구조를 생성·수정·삭제하는 명령어다.
  - `CREATE`: 생성
  - `ALTER`: 기존 구조 수정
  - `DROP`: 구조 삭제
  - `TRUNCATE`: 테이블 구조는 남기고 데이터를 전체 삭제
- **DML(Data Manipulation Language)**은 테이블 안의 데이터를 조작하는 명령어다.
  - `INSERT`: 추가
  - `SELECT`: 조회
  - `UPDATE`: 수정
  - `DELETE`: 삭제
- CRUD는 DML과 연결해서 볼 수 있다.
  - Create → `INSERT`
  - Read → `SELECT`
  - Update → `UPDATE`
  - Delete → `DELETE`
- `ALTER TABLE`을 이용해 이미 존재하는 테이블의 컬럼을 추가·삭제·이름 변경·자료형 변경할 수 있다.
- 주요 제약조건
  - `PRIMARY KEY`: 행을 고유하게 식별
  - `FOREIGN KEY`: 다른 테이블의 키를 참조
  - `UNIQUE`: 중복 방지
  - `CHECK`: 조건에 맞는 값만 허용
  - `NOT NULL`: NULL 금지
  - `DEFAULT`: 값을 생략했을 때 사용할 기본값
- **참조 무결성**: FK가 참조하는 값은 참조 대상 테이블의 PK 또는 UNIQUE 값에 실제로 존재해야 한다.
- **정규화**는 중복과 데이터 이상을 줄이기 위해 테이블 구조를 정리하는 과정이다.
  - 1NF: 한 셀에 하나의 값
  - 2NF: 복합키 일부에만 의존하는 컬럼 분리
  - 3NF: 일반 컬럼끼리의 종속 관계 분리
- 주문 데이터처럼 과거 시점의 값 보존이 중요한 경우에는 일부 값을 의도적으로 중복 저장하는 비정규화를 사용할 수 있다.

### 핵심 코드

```sql
CREATE TABLE members (
    seq SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(65) NOT NULL,
    cellphone VARCHAR(15),
    age VARCHAR(2),
    created_at TIMESTAMPTZ
);

ALTER TABLE members
ADD COLUMN user_name VARCHAR(45) NOT NULL;

ALTER TABLE members
ALTER COLUMN age TYPE INT
USING age::INT;

ALTER TABLE members
ALTER COLUMN created_at
SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE club_members
ADD CONSTRAINT fk_club_members
FOREIGN KEY (user_seq)
REFERENCES members(seq);
```

### 오늘 수행한 실습

- Docker에서 PostgreSQL 컨테이너 실행 상태 확인
- DBeaver에서 PostgreSQL 접속 및 SQL 실행
- `CREATE TABLE`로 `members` 테이블 생성 실습
- `ALTER TABLE`로 컬럼 추가 및 자료형 변경
- `DEFAULT` 설정
- PK/FK 제약조건 설정
- PostgreSQL 오류 메시지를 확인하면서 SQL 문법 수정
- 정규화 1NF·2NF·3NF 개념 학습
- DDL과 DML/CRUD 역할 구분

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- 테이블을 만들기 전에 어떤 컬럼과 자료형, 제약조건이 필요한지 설계해야 데이터가 안정적으로 저장된다.
- `ALTER TABLE`을 알아야 이미 운영 중인 테이블의 구조를 변경할 수 있다.
- PK와 FK를 사용하면 서로 다른 테이블의 데이터를 관계로 연결할 수 있다.
- 참조 무결성을 통해 존재하지 않는 데이터를 가리키는 잘못된 관계를 막을 수 있다.
- 정규화를 하면 같은 정보가 여러 곳에 반복되어 수정할 때 값이 서로 달라지는 문제를 줄일 수 있다.
- DDL과 DML을 구분하면 현재 SQL이 구조를 변경하는지, 실제 데이터를 변경하는지 판단할 수 있다.

### 내 생각

> 처음에는 DBeaver에서 오류가 계속 나서 Docker 설정 문제라고 생각했는데, 실제로는 PostgreSQL 서버와 DBeaver 연결은 정상이고 SQL 문법이나 이미 존재하는 테이블을 다시 생성한 것이 원인이었다. 오류 메시지의 위치와 문구를 먼저 읽는 것이 중요하다는 점을 알게 됐다. 정규화도 단순히 테이블을 쪼개는 규칙이 아니라 데이터가 중복되고 꼬이는 것을 방지하기 위한 설계 방식이라는 점이 조금씩 이해됐다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. Docker에서 PostgreSQL 서버를 실행한다.
2. DBeaver가 `localhost:5432` 등을 통해 PostgreSQL에 접속한다.
3. `CREATE TABLE`로 테이블 구조를 만든다.
4. 이미 생성된 테이블 구조를 수정할 때는 `ALTER TABLE`을 사용한다.
5. PK로 각 행을 고유하게 구분한다.
6. 다른 테이블의 FK가 PK 또는 UNIQUE 값을 참조하면서 테이블 관계가 만들어진다.
7. FK 값이 부모 테이블에 존재하는지 PostgreSQL이 참조 무결성 규칙으로 검사한다.
8. 이후 `INSERT`, `SELECT`, `UPDATE`, `DELETE`로 실제 데이터를 조작한다.

### 내 말로 설명하기

> DDL은 데이터가 들어갈 그릇의 구조를 만드는 명령이고, DML은 그 그릇 안의 데이터를 넣고 보고 수정하고 삭제하는 명령이다. 테이블을 처음 만들 때는 CREATE를 사용하고, 만들어진 테이블의 구조를 바꿀 때는 ALTER를 사용한다. PK는 한 행을 구분하고, FK는 다른 테이블의 키를 참조해서 관계를 만든다. 이때 없는 부모 값을 FK에 넣지 못하게 막는 규칙이 참조 무결성이다. 정규화는 이런 테이블을 설계할 때 중복과 의존 관계를 줄여 데이터가 꼬이지 않게 만드는 과정이다.

---

## 4. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: DBeaver에서 PostgreSQL 테이블을 생성하고 컬럼 및 제약조건을 수정하려고 했다.
- 발생한 문제: SQL 실행 과정에서 여러 문법 오류와 기존 테이블 재생성 오류가 발생했다.
- 오류 메시지:

```text
ERROR: relation "members" already exists
ERROR: syntax error at or near "cellphone"
ERROR: type "timestamptz" does not exist
ERROR: syntax error at or near "REFERENCE"
```

### 문제가 발생한 코드

```sql
password VARCHAR(65) NOT NULL
cellphone VARCHAR(15)

ALTER TABLE members
ALTER COLOMN age TYPE INT USING (age::INT);

FOREIGN KEY (user_seq)
REFERENCE members(seq);
```

### 문제의 원인

- 컬럼 정의 사이의 쉼표를 빠뜨렸다.
- `TIMESTAMPTZ`, `COLUMN`, `REFERENCES` 철자를 잘못 입력했다.
- 이미 존재하는 `members` 테이블에 다시 `CREATE TABLE members`를 실행했다.
- Docker/DBeaver 연결 오류와 SQL 문법 오류를 처음에는 구분하지 못했다.

### 해결한 코드

```sql
password VARCHAR(65) NOT NULL,
cellphone VARCHAR(15)

ALTER TABLE members
ALTER COLUMN age TYPE INT
USING age::INT;

ALTER TABLE club_members
ADD CONSTRAINT fk_club_members
FOREIGN KEY (user_seq)
REFERENCES members(seq);
```

### 해결 원리

> PostgreSQL의 오류 메시지는 문제가 발생한 SQL 위치와 원인을 알려준다. `relation already exists`가 발생했다는 것은 서버 접속이 실패한 것이 아니라 SQL이 PostgreSQL까지 정상적으로 전달된 뒤 기존 테이블과 충돌했다는 의미였다. 따라서 Docker를 다시 설정하기보다 오류 문구를 읽고 현재 테이블 구조와 SQL 문법을 확인해야 했다.

---

## 5. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점:
  - 오류가 나올 때 화면을 확인하며 한 문장씩 실행하고 수정했다.
  - DDL, DML, 정규화처럼 처음 보는 용어를 예시와 연결해서 이해하려고 했다.
  - 1정규형과 DDL 명령어 구분은 복습 문제에서 스스로 답할 수 있었다.
- 계속 유지할 학습 방법:
  - SQL을 한 줄씩 실행하며 어느 명령에서 오류가 발생했는지 확인하기
  - 새로운 용어는 테이블 예시와 함께 연결해서 이해하기

### Problem — 개선할 것

- 이해하기 어려웠던 부분:
  - 2정규형과 3정규형의 차이
  - FK와 참조 무결성의 연결
  - `UPDATE`와 `DELETE`에서 `WHERE`가 하는 역할
- 반복해서 실수한 부분:
  - SQL 키워드 철자와 쉼표 누락
  - 이미 생성된 테이블에 `CREATE TABLE`을 다시 실행함
- 아직 설명하기 어려운 부분:
  - `CREATE`, `ALTER`, `INSERT`의 역할을 예제 없이 즉시 구분하기
  - FK 위반 상황을 보고 바로 '참조 무결성 위반'이라고 말하기

### Try — 다음에 시도할 것

- 다시 공부할 내용:
  - `UPDATE / DELETE + WHERE`
  - PK / FK / 참조 무결성
  - 1NF → 2NF → 3NF 흐름
- 예제를 보지 않고 작성해볼 코드:
  - `CREATE TABLE`
  - `ALTER TABLE ... ADD COLUMN`
  - `FOREIGN KEY ... REFERENCES`
- 다음 학습에서 바꿔볼 방법:
  - SQL을 실행하기 전에 `구조 변경인가? 데이터 변경인가?`를 먼저 판단하고 DDL/DML을 구분하기

---

## 6. 이해도 점검

- [ ] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [x] 코드가 실행되는 순서를 설명할 수 있다.
- [x] 오늘 발생한 오류의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [x] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

---

## 7. 다음 학습에서 할 일

1. `UPDATE`와 `DELETE`에서 `WHERE`가 없을 때 어떤 범위가 변경되는지 다시 확인하기
2. PK → FK → 참조 무결성 흐름을 예시 테이블로 다시 설명해보기
3. 정규화 1NF·2NF·3NF를 하나의 테이블이 변하는 과정으로 복습하기

---

## 관련 자료

- 수업 노트: SQL 1장
- 예습 정리: `[SQL]_데이터베이스-기초구조-관계-테이블생성_예습정리.md`
- 실습 도구: DBeaver, Docker Desktop
- DBMS: PostgreSQL

---

## STAR 문제 해결 기록

### Situation — 상황

> PostgreSQL 실습 중 DBeaver에서 테이블 생성과 구조 변경 SQL을 실행할 때 여러 오류가 연속으로 발생했다.

### Task — 해결 과제

> Docker/PostgreSQL 연결 문제인지 SQL 문법 문제인지 구분하고, `members` 테이블 생성 및 `ALTER TABLE`, FK 설정을 정상적으로 실행해야 했다.

### Action — 실행한 행동

1. Docker Desktop에서 PostgreSQL 컨테이너가 실행 중인지 확인했다.
2. DBeaver의 연결 정보와 PostgreSQL 포트를 확인했다.
3. 오류 메시지에 표시된 SQL 위치를 보고 쉼표와 키워드 철자를 수정했다.
4. 이미 생성된 테이블에는 `CREATE TABLE` 대신 `ALTER TABLE`을 사용했다.
5. 긴 SQL을 한 번에 실행하지 않고 문장 단위로 `Ctrl + Enter`로 실행했다.

### Result — 결과

- 해결 결과: Docker/DBeaver 연결은 정상임을 확인했고, SQL 문법 오류를 하나씩 수정하며 테이블 구조 변경과 FK 설정 흐름을 이해했다.
- 새롭게 이해한 점: DB 도구 오류처럼 보여도 실제 원인은 SQL 문법일 수 있으므로 오류 메시지를 먼저 읽어야 한다.
- 다음에 같은 문제가 생겼을 때 확인할 것: 컨테이너 실행 상태 → DB 연결 → 현재 테이블 존재 여부 → 오류 위치 → SQL 키워드와 쉼표 순서로 확인한다.
