# [SQL & 데이터베이스] 2장 예습정리 — 데이터 조회·집계·테이블 결합

> 범위: 2장 1강 데이터 조회하기 / 2장 2강 데이터 집계와 분석 / 2장 3강 테이블 결합
> 사용 DBMS: PostgreSQL

## 0. 이번 장 전체 구조

```text
데이터베이스
   ↓
[1강] 필요한 데이터 꺼내기
SELECT / FROM
   ↓
DISTINCT → 중복 제거
WHERE → 행 필터링
CASE WHEN → 조건에 따라 새 값 만들기
ORDER BY → 결과 정렬
   ↓
[2강] 꺼낸 데이터 요약하기
COUNT / SUM / AVG / MIN / MAX
   ↓
GROUP BY → 기준별 묶기
HAVING → 집계 결과 필터링
   ↓
[3강] 여러 테이블 연결하기
UNION → 세로로 쌓기
JOIN → 가로로 연결하기
INNER / LEFT / RIGHT / FULL OUTER
```

### 이번 장에서 가장 먼저 기억할 4문장

1. **WHERE = 그룹화하기 전 개별 행을 거른다.**
2. **HAVING = GROUP BY로 집계한 뒤 그룹을 거른다.**
3. **UNION = 같은 구조의 데이터를 세로(행)로 쌓는다.**
4. **JOIN = 공통 키를 기준으로 데이터를 가로(열)로 붙인다.**

---

# 1강. 데이터 조회하기

## 1. SELECT / FROM

### 정의

- `SELECT`: 어떤 열(Column)을 볼지 선택
- `FROM`: 어느 테이블에서 가져올지 지정

```sql
SELECT first_name, last_name, email
FROM customers;
```

### 비유

엑셀에서 **customers 시트를 열고(FROM), 그중 이름과 이메일 열만 선택(SELECT)**하는 것과 같다.

### SELECT *

```sql
SELECT *
FROM products;
```

`*`는 모든 열을 의미한다. 학습할 때는 편하지만 실무에서는 필요한 열을 명시하는 편이 좋다.

---

## 2. DISTINCT — 중복 제거

### 정의

같은 값이 여러 번 존재할 때 고유한 값만 남긴다.

```sql
SELECT DISTINCT state
FROM customers;
```

### 예시

```text
NY
NY
CA
CA
TX
```

`DISTINCT` 적용 후:

```text
NY
CA
TX
```

### 한 줄 요약

**DISTINCT = 중복 제거 후 종류만 보기**

---

## 3. WHERE — 원하는 행만 필터링

### 정의

조건이 `TRUE`인 행만 조회한다.

```sql
SELECT *
FROM staffs
WHERE store_id = 1;
```

### 자주 쓰는 조건

| 목적 | SQL |
|---|---|
| 같다 | `=` |
| 다르다 | `!=` |
| 이상/이하 | `>=`, `<=` |
| 여러 값 중 하나 | `IN (...)` |
| 범위 | `BETWEEN A AND B` |
| 문자열 포함 | `LIKE '%문자%'` |
| 비어 있음 | `IS NULL` |
| 비어 있지 않음 | `IS NOT NULL` |
| 조건 모두 만족 | `AND` |
| 조건 하나 이상 만족 | `OR` |

### 예시

```sql
SELECT *
FROM products
WHERE list_price BETWEEN 500 AND 1000;
```

`BETWEEN 500 AND 1000`은 **500 이상 1000 이하**다.

### NULL 주의

```sql
WHERE shipped_date IS NULL
```

NULL은 일반 값이 아니므로 `= NULL`이 아니라 `IS NULL`을 사용한다.

---

## 4. IN과 LIKE 차이

### IN = 정확히 일치하는 값

```sql
WHERE state IN ('NY', 'CA')
```

### LIKE = 문자열 패턴 검색

```sql
WHERE product_name LIKE '%Trek%'
```

`%`는 앞뒤에 어떤 문자열이 와도 된다는 의미다.

```text
IN ('전소현')
→ 정확히 '전소현'만

LIKE '%전소현%'
→ '전소현안녕', '바이전소현'도 포함
```

---

## 5. CASE WHEN — 조건에 따라 값 만들기

### 정의

파이썬의 `if / elif / else`처럼 조건에 따라 다른 값을 반환한다.

```sql
SELECT list_price,
       CASE
           WHEN list_price < 100 THEN '저가'
           WHEN list_price < 500 THEN '중가'
           ELSE '고가'
       END AS price_grade
FROM order_items;
```

### 중요한 원리

CASE WHEN은 **위에서부터 조건을 검사하고 처음 TRUE가 된 결과를 반환한다.**

따라서 조건 순서가 중요하다.

### 비유

상품 MD가 가격표를 보면서:

```text
100원 미만? → 저가
아니면 500원 미만? → 중가
그것도 아니면 → 고가
```

라고 상품을 등급화하는 것과 같다.

---

## 6. ORDER BY — 정렬

```sql
SELECT *
FROM products
ORDER BY list_price DESC;
```

- `ASC`: 오름차순, 기본값
- `DESC`: 내림차순

### 다중 정렬

```sql
SELECT *
FROM orders
ORDER BY store_id ASC, order_date DESC;
```

먼저 `store_id`로 정렬하고, 같은 매장 안에서 `order_date`를 최신순으로 정렬한다.

---

# 2강. 데이터 집계와 분석

## 1. 집계함수

여러 행을 하나의 통계값으로 요약한다.

| 함수 | 의미 |
|---|---|
| `COUNT` | 개수 |
| `SUM` | 합계 |
| `AVG` | 평균 |
| `MIN` | 최솟값 |
| `MAX` | 최댓값 |

```sql
SELECT COUNT(*) AS order_count
FROM orders;
```

```sql
SELECT AVG(list_price),
       MAX(list_price),
       MIN(list_price)
FROM products;
```

### COUNT(*) vs COUNT(열)

```text
COUNT(*)
→ NULL 여부와 관계없이 전체 행 수

COUNT(column)
→ 해당 열이 NULL이 아닌 행만 계산
```

---

## 2. GROUP BY — 기준별로 묶어서 집계

### 정의

전체를 한 번에 집계하지 않고 특정 기준별로 묶어 계산한다.

```sql
SELECT store_id,
       COUNT(*) AS order_count
FROM orders
GROUP BY store_id;
```

의미:

```text
전체 주문 수 X

1번 매장 주문 수
2번 매장 주문 수
3번 매장 주문 수
...
```

### 가장 중요한 규칙

SELECT에 **집계함수가 아닌 열**을 함께 사용한다면 그 열은 원칙적으로 `GROUP BY`에 들어가야 한다.

```sql
SELECT brand_id, AVG(list_price)
FROM products
GROUP BY brand_id;
```

---

## 3. WHERE vs HAVING

이 장에서 가장 중요한 구분이다.

| 구분 | WHERE | HAVING |
|---|---|---|
| 실행 시점 | GROUP BY 전 | GROUP BY 후 |
| 대상 | 개별 행 | 그룹/집계 결과 |
| 예시 | `price >= 500` | `AVG(price) >= 500` |

### WHERE

```sql
WHERE quantity > 0
```

재고가 없는 **개별 행을 먼저 제거**한다.

### HAVING

```sql
HAVING SUM(quantity) > 100
```

매장별 재고를 모두 합산한 다음 **합계가 100을 넘는 그룹만 선택**한다.

### 전체 흐름

```sql
SELECT store_id, SUM(quantity)
FROM stocks
WHERE quantity > 0
GROUP BY store_id
HAVING SUM(quantity) > 100;
```

사고 순서:

```text
stocks에서 가져온다
→ 재고가 있는 행만 남긴다
→ store_id별로 묶는다
→ 각 매장의 재고를 합한다
→ 합계 100 초과 매장만 남긴다
```

---

# SQL 실행 순서

작성 순서와 실제 논리적 처리 순서는 다르다.

```text
FROM
 ↓
WHERE
 ↓
GROUP BY
 ↓
HAVING
 ↓
SELECT
 ↓
ORDER BY
```

### 기억법

**가져오고 → 거르고 → 묶고 → 묶은 걸 거르고 → 보여주고 → 정렬한다.**

---

# 3강. 테이블 결합

## 1. UNION — 세로로 쌓기

### 정의

두 SELECT 결과를 **행 방향으로 이어 붙인다.**

```text
테이블 A
──────
A
B

+

테이블 B
──────
C
D

=

A
B
C
D
```

```sql
SELECT store_id
FROM staffs
UNION
SELECT store_id
FROM orders;
```

### UNION vs UNION ALL

| 구분 | 중복 |
|---|---|
| `UNION` | 제거 |
| `UNION ALL` | 유지 |

`UNION ALL`은 중복 제거 작업이 없어 일반적으로 더 단순하고 빠르다.

### 조건

두 SELECT의 **열 개수와 대응되는 데이터 타입이 호환되어야 한다.**

---

## 2. JOIN — 가로로 연결하기

### 정의

공통 키를 이용해 서로 다른 테이블의 열을 연결한다.

예:

```text
orders
customer_id | order_id

customers
customer_id | name

JOIN

customer_id | order_id | name
```

```sql
SELECT o.order_id,
       c.first_name,
       c.last_name
FROM orders o
JOIN customers c
  ON o.customer_id = c.customer_id;
```

### 비유

주문표에는 고객번호만 있고 고객명부에는 고객번호와 이름이 있다면, **고객번호를 기준으로 VLOOKUP/XLOOKUP처럼 이름을 붙이는 작업**이라고 생각하면 된다.

---

## 3. JOIN 종류

```text
A 테이블          B 테이블

INNER JOIN
→ 양쪽에 모두 존재하는 것

LEFT JOIN
→ A는 전부 + B에서 맞는 것

RIGHT JOIN
→ B는 전부 + A에서 맞는 것

FULL OUTER JOIN
→ A와 B 모두 전부
```

| JOIN | 기억법 |
|---|---|
| INNER | 교집합 |
| LEFT | 왼쪽은 무조건 살린다 |
| RIGHT | 오른쪽은 무조건 살린다 |
| FULL OUTER | 양쪽 모두 살린다 |

### LEFT JOIN

```sql
SELECT c.customer_id,
       c.first_name,
       o.order_id
FROM customers c
LEFT JOIN orders o
  ON c.customer_id = o.customer_id;
```

주문하지 않은 고객도 `customers`가 왼쪽이므로 결과에 남는다. 주문 정보가 없으면 오른쪽 열은 `NULL`이 된다.

---

## 4. ON — 무엇을 기준으로 붙일 것인가

```sql
FROM orders o
JOIN customers c
  ON o.customer_id = c.customer_id
```

`ON`은 두 테이블을 연결하는 조건이다.

복수 조건도 가능하다.

```sql
FROM orders o
JOIN staffs s
  ON o.staff_id = s.staff_id
 AND o.store_id = s.store_id;
```

---

# UNION vs JOIN

```text
UNION
↓
세로로 쌓기
같은 종류의 데이터 합치기

JOIN
→
가로로 붙이기
서로 다른 정보 연결하기
```

| 구분 | UNION | JOIN |
|---|---|---|
| 방향 | 세로(행) | 가로(열) |
| 목적 | 같은 구조의 결과 통합 | 다른 정보 연결 |
| 기준 | 열 수·타입 호환 | 공통 연결 조건(ON) |
| 예 | 연도별 주문 통합 | 주문 + 고객정보 |

---

# 실무 관점으로 한 번에 연결하기

상품/커머스 데이터를 분석한다고 생각하면 다음처럼 연결된다.

```text
[상품 데이터 조회]
SELECT product_name, list_price
FROM products

        ↓

[500 이상 상품만]
WHERE list_price >= 500

        ↓

[브랜드별 평균가격]
GROUP BY brand_id
AVG(list_price)

        ↓

[평균 500 이상 브랜드만]
HAVING AVG(list_price) >= 500

        ↓

[비싼 브랜드부터]
ORDER BY AVG(list_price) DESC

        ↓

[브랜드 이름이 필요하다]
JOIN brands
```

SQL은 문법을 따로 외우는 것보다 **분석 질문을 데이터 처리 단계로 번역하는 언어**라고 이해하면 된다.

---

# 오늘 반드시 설명할 수 있어야 하는 것

### 1. WHERE와 HAVING의 차이는?

> WHERE는 GROUP BY 전에 개별 행을 필터링하고, HAVING은 GROUP BY 후 집계된 그룹을 필터링한다.

### 2. UNION과 JOIN의 차이는?

> UNION은 데이터를 세로 방향으로 쌓고, JOIN은 공통 키를 기준으로 가로 방향으로 연결한다.

### 3. GROUP BY는 왜 필요한가?

> 전체 데이터를 하나로 집계하는 것이 아니라 매장별·브랜드별·카테고리별처럼 특정 기준으로 묶어 각각 집계하기 위해 사용한다.

### 4. LEFT JOIN은 언제 쓰는가?

> 기준 테이블의 데이터는 모두 유지하면서 다른 테이블의 정보를 추가하고 싶을 때 사용한다.

### 5. CASE WHEN은 무엇인가?

> 조건에 따라 서로 다른 값을 반환해 새로운 분류 열을 만드는 조건 표현식이다.

---

# 헷갈리기 쉬운 것 리뷰

```text
SELECT = 열 선택
WHERE = 행 선택
DISTINCT = 중복 제거
CASE WHEN = 조건별 값 생성
ORDER BY = 정렬

COUNT/SUM/AVG/MIN/MAX = 요약
GROUP BY = 기준별 묶기
HAVING = 묶은 결과 필터

UNION = 세로
JOIN = 가로
ON = JOIN 연결 조건
```

### SQL 논리적 실행 순서

```text
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
```

---

# 수업 중 체크할 포인트

- [ ] `NULL` 비교에서 왜 `= NULL`이 아니라 `IS NULL`인지 설명할 수 있는가?
- [ ] `IN`과 `LIKE` 차이를 설명할 수 있는가?
- [ ] CASE WHEN의 조건 순서가 결과에 영향을 주는 이유를 이해했는가?
- [ ] `COUNT(*)`와 `COUNT(column)` 차이를 설명할 수 있는가?
- [ ] GROUP BY에 어떤 열을 넣어야 하는지 판단할 수 있는가?
- [ ] WHERE와 HAVING을 문제 문장에서 구분할 수 있는가?
- [ ] UNION과 UNION ALL의 차이를 설명할 수 있는가?
- [ ] INNER/LEFT/RIGHT/FULL OUTER JOIN 결과 차이를 설명할 수 있는가?
- [ ] ON 절에서 PK/FK 또는 공통 키를 찾아 연결할 수 있는가?

---

## 한 줄 최종 정리

> **SQL 2장의 핵심은 `조회 → 필터 → 그룹화·집계 → 집계 필터 → 정렬 → 테이블 결합`이라는 데이터 분석 흐름을 SQL 문법으로 표현하는 것이다.**
