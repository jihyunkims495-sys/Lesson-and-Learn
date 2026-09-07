# [SQL & 데이터베이스] 3장 예습정리 — 서브쿼리·인라인 뷰·스칼라 서브쿼리

> 범위: 3장 1강 서브쿼리 기초 / 3장 2강 FROM절과 SELECT절 서브쿼리
> 사용 DBMS: PostgreSQL

## 0. 이번 장 전체 구조

```text
기존 SQL
SELECT / FROM / WHERE / GROUP BY / HAVING / JOIN
          ↓
조건이나 계산이 복잡해지면?
          ↓
쿼리 안에 또 다른 SELECT를 넣는다
          ↓
        서브쿼리
          ↓
┌───────────────────────────────┐
│ WHERE절 → 조건값 계산          │
│ FROM절  → 임시 테이블 생성     │
│ SELECT절 → 행마다 단일 값 추가 │
└───────────────────────────────┘
          ↓
IN / NOT IN → 여러 값과 비교
EXISTS      → 존재 여부 확인
          ↓
JOIN과 비교해서 더 적합한 방식 선택
```

### 이번 장에서 가장 먼저 기억할 5문장

1. **서브쿼리 = SQL 안에 들어가는 또 다른 SELECT문이다.**
2. **WHERE절 서브쿼리 = 조건에 필요한 값을 먼저 계산한다.**
3. **FROM절 서브쿼리 = 조회 결과를 임시 테이블처럼 사용한다.**
4. **SELECT절 서브쿼리 = 각 행에 하나의 값을 새로운 열처럼 붙인다.**
5. **EXISTS = 값 자체가 아니라 데이터의 존재 여부를 확인한다.**

---

# 1강. 서브쿼리 기초

## 1. 서브쿼리(Subquery)란?

### 정의

서브쿼리는 **하나의 SQL 쿼리 안에 포함된 또 다른 SELECT 쿼리**다.

- 바깥쪽 쿼리: 외부 쿼리(Outer Query)
- 안쪽 쿼리: 서브쿼리(Inner Query)
- 서브쿼리는 `( )` 괄호로 감싼다.

```sql
SELECT product_id, product_name, list_price
FROM products
WHERE list_price > (
    SELECT AVG(list_price)
    FROM products
);
```

위 SQL에서:

```sql
SELECT AVG(list_price)
FROM products
```

이 부분이 서브쿼리다.

### 실행 흐름으로 이해하기

```text
1. 전체 상품의 평균 가격 계산
        ↓
2. 평균 가격 결과를 WHERE 조건에 전달
        ↓
3. 평균보다 비싼 상품 조회
```

즉, SQL 한 문장 안에서 **먼저 필요한 값을 구하고 → 그 결과를 다시 조건에 사용**하는 구조다.

### 비유

수학의 다음 구조와 비슷하다.

```text
f(g(x))
```

먼저 `g(x)`를 계산한 뒤 그 결과를 `f()`에 넣는다.

SQL에서는:

```text
외부 쿼리(서브쿼리 결과)
```

라고 생각할 수 있다.

### 한 줄 요약

**서브쿼리 = 바깥 SQL이 필요로 하는 값을 안쪽 SELECT가 먼저 만들어 주는 구조**

---

## 2. 서브쿼리는 왜 필요한가?

단순한 조건은 바로 WHERE에 적을 수 있다.

```sql
WHERE list_price > 500
```

하지만 조건값 자체를 데이터에서 계산해야 한다면 이야기가 달라진다.

예:

```text
500보다 비싼 상품
→ 500이라는 값을 이미 알고 있음

평균보다 비싼 상품
→ 평균값을 먼저 계산해야 함
```

따라서 다음 질문에서 서브쿼리가 유용하다.

```text
평균보다 비싼 상품은?
주문한 고객만 보고 싶다면?
주문하지 않은 고객만 보고 싶다면?
재고 기록이 존재하는 상품만 보고 싶다면?
```

핵심은 **조건에 사용할 값을 고정값으로 직접 쓰는 것이 아니라 데이터베이스에서 다시 구해야 한다는 것**이다.

---

# 3. 위치에 따른 서브쿼리 종류

서브쿼리는 어디에 들어가느냐에 따라 역할이 달라진다.

| 위치 | 이름 | 역할 |
|---|---|---|
| `WHERE` | WHERE절 서브쿼리 | 조건값 계산 |
| `FROM` | 인라인 뷰(Inline View) | 결과를 임시 테이블처럼 사용 |
| `SELECT` | 스칼라 서브쿼리(Scalar Subquery) | 단일 값을 열처럼 추가 |

전체 흐름:

```text
WHERE절
→ 무엇을 남길지 결정

FROM절
→ 어떤 데이터 집합을 테이블처럼 사용할지 결정

SELECT절
→ 최종 결과에 어떤 값을 보여줄지 결정
```

---

# 4. WHERE절 서브쿼리

## 기본 구조

```sql
SELECT ...
FROM ...
WHERE 열 연산자 (
    SELECT ...
    FROM ...
);
```

예:

```sql
SELECT product_id, product_name, list_price
FROM products
WHERE list_price > (
    SELECT AVG(list_price)
    FROM products
);
```

### 해석 순서

```text
SELECT AVG(list_price)
FROM products
```

먼저 전체 상품 평균 가격을 구한다.

그 다음:

```sql
WHERE list_price > 평균가격
```

조건으로 바뀐다.

### 사고 순서

문제:

```text
평균 가격보다 비싼 상품을 조회하시오.
```

바로 SQL을 쓰기 전에:

```text
1. 무엇을 조회? → 상품
2. 조건은? → 평균보다 비싼 것
3. 평균값을 알고 있나? → 아니오
4. 평균을 별도로 계산해야 하나? → 예
5. 그 계산 결과를 WHERE에 넣는다 → 서브쿼리
```

---

# 5. 단일 값 서브쿼리와 비교 연산자

서브쿼리가 하나의 값만 반환한다면 일반 비교 연산자를 사용할 수 있다.

```sql
>
<
>=
<=
=
!=
```

예:

```sql
WHERE list_price > (
    SELECT AVG(list_price)
    FROM products
)
```

`AVG()`는 하나의 평균값을 반환하므로 `>`로 비교할 수 있다.

하지만 서브쿼리가 여러 값을 반환한다면 `=`를 바로 사용할 수 없다.

이때 `IN`을 사용한다.

---

# 6. IN + 서브쿼리

## 정의

`IN`은 **서브쿼리가 반환한 여러 값 중 하나와 일치하는지** 확인한다.

```sql
SELECT customer_id, first_name, last_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders
);
```

### 실행 흐름

서브쿼리 결과가 다음과 같다고 하자.

```text
1
3
5
```

외부 쿼리에서는 사실상 다음처럼 비교한다.

```sql
WHERE customer_id IN (1, 3, 5)
```

따라서 주문 이력이 있는 고객만 남는다.

### 기존에 배운 IN과 연결

기존:

```sql
WHERE state IN ('NY', 'CA')
```

서브쿼리 사용:

```sql
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
)
```

차이는 값 목록을 **직접 작성하느냐 / SELECT 결과로 만들 것이냐**다.

### 한 줄 요약

**IN + 서브쿼리 = 안쪽 SELECT가 만들어 준 값 목록 안에 있는가?**

---

# 7. NOT IN + 서브쿼리

`NOT IN`은 서브쿼리 결과에 포함되지 않은 행을 찾는다.

```sql
SELECT customer_id, first_name, last_name
FROM customers
WHERE customer_id NOT IN (
    SELECT DISTINCT customer_id
    FROM orders
);
```

의미:

```text
orders에 customer_id가 있다
→ 제외

orders에 customer_id가 없다
→ 결과에 포함
```

즉, **한 번도 주문하지 않은 고객**을 찾을 수 있다.

---

# 8. NOT IN의 중요한 NULL 문제

`NOT IN`은 반드시 NULL을 주의해야 한다.

예를 들어 서브쿼리 결과가:

```text
1
2
NULL
```

이라면:

```sql
WHERE customer_id NOT IN (1, 2, NULL)
```

처럼 비교하게 된다.

SQL에서 NULL은 "값이 없음/알 수 없음"을 의미하기 때문에 비교 결과가 명확한 TRUE/FALSE가 아니라 `UNKNOWN`이 될 수 있다.

그 결과 예상과 다르게 **아무 행도 나오지 않는 상황**이 발생할 수 있다.

### 따라서 기억할 것

```text
NOT IN
→ 서브쿼리 결과에 NULL이 있는지 주의

NOT EXISTS
→ 존재 여부를 판단하므로 일반적으로 NULL 문제에서 더 안전
```

---

# 9. EXISTS — 값이 아니라 존재 여부 확인

## 정의

`EXISTS`는 서브쿼리가 **한 행이라도 반환하면 TRUE**다.

```sql
SELECT c.customer_id,
       c.first_name,
       c.last_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

### 핵심 질문

`IN`:

```text
이 값이 목록 안에 있는가?
```

`EXISTS`:

```text
조건을 만족하는 행이 하나라도 존재하는가?
```

### 왜 SELECT 1을 쓰나?

```sql
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
```

EXISTS는 실제 SELECT 결과값이 필요한 것이 아니다.

오직:

```text
행이 존재한다 / 존재하지 않는다
```

만 확인한다.

따라서 관례적으로 `SELECT 1`을 많이 사용한다.

---

# 10. NOT EXISTS

`NOT EXISTS`는 조건을 만족하는 행이 하나도 없을 때 TRUE다.

```sql
SELECT p.product_id,
       p.product_name
FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.product_id = p.product_id
);
```

해석:

```text
products의 상품 하나 확인
        ↓
order_items에서 같은 product_id 검색
        ↓
있다 → 제외
없다 → 결과에 포함
```

따라서 **한 번도 주문되지 않은 상품**을 찾을 수 있다.

---

# 11. IN vs EXISTS

| 구분 | IN | EXISTS |
|---|---|---|
| 핵심 질문 | 값이 목록에 있는가? | 조건을 만족하는 행이 존재하는가? |
| 비교 방식 | 값 목록 비교 | 존재 여부 확인 |
| NULL | `NOT IN`에서 특히 주의 | 상대적으로 안전 |
| 활용 | 값 목록과 비교 | 관련 데이터 존재 여부 확인 |

### 예: 주문 이력이 있는 고객

IN 방식:

```sql
SELECT customer_id, first_name, last_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders
);
```

EXISTS 방식:

```sql
SELECT c.customer_id, c.first_name, c.last_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
);
```

두 쿼리가 같은 결과를 낼 수 있지만 사고 방식은 다르다.

```text
IN
→ 주문 고객 ID 목록을 만들고 비교

EXISTS
→ 이 고객의 주문이 하나라도 존재하는지 확인
```

> 성능은 데이터량만으로 단순히 `IN` 또는 `EXISTS`가 항상 빠르다고 판단할 수 없다. PostgreSQL 옵티마이저가 쿼리를 변환할 수 있으므로 실제 상황에서는 실행 계획을 확인해야 한다.

---

# 2강. FROM절과 SELECT절 서브쿼리

# 12. FROM절 서브쿼리 — 인라인 뷰

## 정의

FROM절 안에 들어가는 서브쿼리를 **인라인 뷰(Inline View)**라고 한다.

서브쿼리가 만든 결과를 외부 쿼리가 하나의 테이블처럼 사용한다.

```sql
SELECT customer_id, total_amount
FROM (
    SELECT customer_id,
           SUM(amount) AS total_amount
    FROM orders
    GROUP BY customer_id
) AS customer_totals
WHERE total_amount >= 1000000;
```

### 실행 흐름

```text
orders
  ↓
customer_id별 GROUP BY
  ↓
SUM(amount)
  ↓
고객별 총 주문금액 결과 생성
  ↓
이 결과를 customer_totals라는 임시 테이블처럼 사용
  ↓
total_amount >= 1000000 필터링
```

### 핵심 구조

```sql
FROM (
    SELECT ...
) AS 별칭
```

### 한 줄 요약

**인라인 뷰 = SELECT 결과를 새로운 임시 테이블처럼 FROM에 넣는 것**

---

# 13. 인라인 뷰를 왜 사용하는가?

다음처럼 여러 단계의 분석이 필요할 때 유용하다.

```text
원본 데이터
   ↓
1차 집계
   ↓
집계 결과에 다시 필터링
   ↓
추가 계산 또는 JOIN
```

예:

```text
매장별 재고 합계를 먼저 계산
        ↓
그 결과 중 평균 이상인 매장만 선택
```

즉, **한 번 계산한 결과를 다시 하나의 데이터 집합으로 다루고 싶을 때** 사용한다.

---

# 14. HAVING vs 인라인 뷰

단순히 집계 결과를 필터링하는 것이라면 `HAVING`으로 해결할 수 있는 경우가 많다.

```sql
SELECT customer_id,
       SUM(amount) AS total_amount
FROM orders
GROUP BY customer_id
HAVING SUM(amount) >= 1000000;
```

하지만 인라인 뷰는 중간 결과를 다시 활용할 수 있다는 장점이 있다.

```text
HAVING
→ 집계한 그룹을 바로 필터링

인라인 뷰
→ 집계 결과 자체를 하나의 테이블로 만든 뒤
   다시 WHERE / JOIN / 계산 등에 사용
```

### 구분 기준

```text
집계 결과를 그냥 거르기만 한다
→ HAVING 고려

집계 결과를 다시 가공하거나 다른 테이블과 연결한다
→ 인라인 뷰 고려
```

---

# 15. 인라인 뷰의 별칭(alias)

인라인 뷰에는 외부 쿼리에서 사용할 이름을 붙인다.

```sql
FROM (
    SELECT ...
) AS customer_totals
```

외부 쿼리 입장에서는 `customer_totals`가 하나의 테이블처럼 보인다.

예:

```sql
SELECT customer_totals.customer_id,
       customer_totals.total_amount
FROM (
    SELECT customer_id,
           SUM(amount) AS total_amount
    FROM orders
    GROUP BY customer_id
) AS customer_totals;
```

---

# 16. SELECT절 서브쿼리 — 스칼라 서브쿼리

## 정의

SELECT절 안에 위치하는 서브쿼리를 **스칼라 서브쿼리(Scalar Subquery)**라고 한다.

스칼라는 하나의 값을 의미한다.

따라서 스칼라 서브쿼리는 **하나의 행 × 하나의 열**, 즉 단 하나의 값을 반환해야 한다.

```sql
SELECT product_id,
       product_name,
       list_price,
       (
           SELECT AVG(list_price)
           FROM products
       ) AS avg_price
FROM products;
```

결과 개념:

```text
product_id | product_name | list_price | avg_price
---------------------------------------------------
1          | 상품A         | 500        | 650
2          | 상품B         | 800        | 650
3          | 상품C         | 650        | 650
```

전체 평균값 `650`이 각 상품 행 옆에 새로운 열처럼 추가된다.

### 한 줄 요약

**스칼라 서브쿼리 = SELECT 결과에 하나의 계산값을 열처럼 붙이는 것**

---

# 17. 스칼라 서브쿼리의 가장 중요한 규칙

반드시 단 하나의 값을 반환해야 한다.

가능:

```sql
SELECT AVG(list_price)
FROM products
```

결과:

```text
650
```

불가능한 예:

```sql
SELECT list_price
FROM products
```

결과가 여러 행이라면 SELECT절의 한 칸에 넣을 수 없다.

PostgreSQL에서는 다음과 같은 오류가 발생할 수 있다.

```text
more than one row returned by a subquery used as an expression
```

### 따라서 자주 사용하는 방법

```text
AVG()
COUNT()
SUM()
MIN()
MAX()
```

같은 집계 함수를 사용해 결과를 하나로 만들거나, `WHERE` 조건으로 한 행만 나오도록 제한한다.

---

# 18. 상관 서브쿼리(Correlated Subquery)

## 정의

서브쿼리가 **외부 쿼리의 현재 행 값을 참조하는 구조**다.

```sql
SELECT c.customer_id,
       c.first_name,
       c.last_name,
       (
           SELECT COUNT(*)
           FROM orders o
           WHERE o.customer_id = c.customer_id
       ) AS order_count
FROM customers c;
```

여기서:

```sql
c.customer_id
```

는 외부 쿼리의 고객 ID다.

서브쿼리가 이 값을 가져다가:

```sql
WHERE o.customer_id = c.customer_id
```

로 사용한다.

### 사고 흐름

```text
customers에서 고객 1명 선택
       ↓
그 고객의 customer_id를 서브쿼리에 전달
       ↓
orders에서 해당 고객의 주문 수 COUNT
       ↓
order_count 열에 추가
       ↓
다음 고객으로 이동
```

### 일반 서브쿼리와 차이

일반 서브쿼리:

```text
외부 행과 관계없이 독립적으로 계산 가능
```

상관 서브쿼리:

```text
외부 쿼리의 현재 행 값을 참조
```

---

# 19. WHERE / FROM / SELECT 서브쿼리 비교

| 위치 | 이름 | 핵심 목적 | 반환 형태 |
|---|---|---|---|
| WHERE | 조건 서브쿼리 | 조건값 계산·목록·존재 확인 | 단일값 또는 여러 행 가능 |
| FROM | 인라인 뷰 | 중간 결과를 테이블처럼 사용 | 여러 행·여러 열 가능 |
| SELECT | 스칼라 서브쿼리 | 계산값을 열로 추가 | 반드시 1행 1열 |

### 기억법

```text
WHERE
→ 거르기 위해 사용

FROM
→ 테이블처럼 사용

SELECT
→ 보여줄 값으로 사용
```

---

# 20. 서브쿼리 vs JOIN

서브쿼리와 JOIN은 같은 결과를 만들 수 있는 경우가 많다.

예: 주문 이력이 있는 고객

### 서브쿼리 방식

```sql
SELECT customer_id,
       first_name,
       last_name
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id
    FROM orders
);
```

### JOIN 방식

```sql
SELECT DISTINCT c.customer_id,
                c.first_name,
                c.last_name
FROM customers c
JOIN orders o
  ON c.customer_id = o.customer_id;
```

### 차이

| 구분 | 서브쿼리 | JOIN |
|---|---|---|
| 사고 방식 | 먼저 계산하고 바깥 쿼리에 전달 | 두 테이블 관계를 직접 연결 |
| 조건/집계 분리 | 직관적인 경우가 많음 | 관계 구조가 잘 보임 |
| 여러 테이블 열 조회 | 상대적으로 불편할 수 있음 | 적합 |
| 존재 여부 | `EXISTS`가 자연스러움 | JOIN 후 필터링 가능 |
| 집계 결과 재사용 | 인라인 뷰 활용 | JOIN과 함께 조합 가능 |

### 선택 기준

```text
"이 값/데이터가 존재하는가?"
→ EXISTS 고려

"계산 결과를 조건으로 사용하고 싶다"
→ 서브쿼리 고려

"두 테이블의 열을 함께 보고 싶다"
→ JOIN 고려

"집계한 결과를 다시 테이블처럼 사용하고 싶다"
→ FROM절 인라인 뷰 고려
```

> JOIN과 서브쿼리 중 어느 쪽이 항상 더 빠르다고 단정하면 안 된다. PostgreSQL 옵티마이저가 실행 방식을 최적화하므로 실제 성능 비교가 필요하면 `EXPLAIN ANALYZE`로 확인한다.

---

# 21. 이번 장에서 헷갈리기 쉬운 부분

## ① 서브쿼리는 무조건 먼저 한 번 실행된다?

단순한 비상관 서브쿼리는 개념적으로 서브쿼리 결과를 먼저 구한 뒤 외부 쿼리에 적용한다고 이해하면 쉽다.

하지만 **상관 서브쿼리**는 외부 행을 참조하며, 실제 PostgreSQL 실행 순서는 옵티마이저가 변경할 수도 있다.

따라서 학습 단계에서는:

```text
비상관 서브쿼리
→ 안쪽 결과를 구해 바깥 조건에 사용

상관 서브쿼리
→ 외부 현재 행을 기준으로 안쪽 조건이 연결됨
```

으로 구분해서 이해하는 것이 좋다.

---

## ② `=`와 `IN`은 언제 구분하나?

```text
서브쿼리 결과가 한 값
→ =, >, < 같은 일반 비교 연산자

서브쿼리 결과가 여러 값
→ IN
```

예:

```sql
WHERE list_price > (
    SELECT AVG(list_price)
    FROM products
)
```

평균값은 하나이므로 `>`.

```sql
WHERE customer_id IN (
    SELECT customer_id
    FROM orders
)
```

고객 ID는 여러 개이므로 `IN`.

---

## ③ IN과 EXISTS의 차이

```text
IN
→ 값 목록과 비교

EXISTS
→ 조건에 맞는 행이 존재하는지만 확인
```

문장을 SQL로 바꿀 때 질문 형태를 보면 구분하기 쉽다.

```text
"orders에 있는 customer_id 중 하나인가?"
→ IN

"이 고객의 주문이 존재하는가?"
→ EXISTS
```

---

## ④ FROM절과 SELECT절 서브쿼리 차이

```text
FROM절
→ 서브쿼리 결과 전체가 테이블 역할

SELECT절
→ 서브쿼리 결과 하나가 열의 값 역할
```

---

# 22. 문제를 보면 이렇게 판단하기

## 유형 A. 평균보다 높은 데이터를 찾는다

```text
평균 계산 필요
→ 단일 값 서브쿼리
→ WHERE에서 비교
```

```sql
WHERE list_price > (
    SELECT AVG(list_price)
    FROM products
)
```

---

## 유형 B. 다른 테이블에 존재하는 ID만 찾는다

```text
ID 목록과 비교
→ IN
```

또는:

```text
존재 여부 확인
→ EXISTS
```

---

## 유형 C. 다른 테이블에 존재하지 않는 데이터를 찾는다

```text
NOT IN 가능
→ NULL 주의

더 안전하게 존재 여부 판단
→ NOT EXISTS 고려
```

---

## 유형 D. 집계 결과를 다시 가공한다

```text
GROUP BY / SUM 등으로 먼저 집계
        ↓
결과를 다시 하나의 테이블처럼 사용
        ↓
FROM절 인라인 뷰
```

---

## 유형 E. 각 행 옆에 계산값 하나를 붙인다

```text
SELECT 결과에 새 계산 열 필요
        ↓
단일 값 반환
        ↓
스칼라 서브쿼리
```

---

# 23. 실무 관점으로 한 번에 연결하기

커머스 데이터라고 생각하면 다음처럼 연결된다.

```text
[상품 목록]
products

        ↓

[전체 평균 가격 계산]
SELECT AVG(list_price)

        ↓

[평균보다 비싼 상품]
WHERE + 서브쿼리

        ↓

[실제 주문된 상품인가?]
EXISTS order_items

        ↓

[상품별 주문 횟수를 같이 표시]
SELECT절 스칼라 서브쿼리

        ↓

[브랜드별 주문 합계를 먼저 계산]
FROM절 인라인 뷰

        ↓

[브랜드 정보까지 필요]
JOIN brands
```

즉, 이번 장부터는 SQL이 단순히 **한 테이블에서 데이터를 꺼내는 문법**을 넘어, 여러 단계의 질문을 한 쿼리 안에서 구조화하는 방식으로 확장된다.

---

# 24. 2장에서 배운 내용과 연결

```text
2장
WHERE
→ 이미 알고 있는 조건으로 행을 거름

GROUP BY
→ 데이터를 기준별로 묶음

HAVING
→ 집계 결과를 거름

JOIN
→ 다른 테이블의 정보를 연결

            ↓

3장
서브쿼리
→ 조건이나 중간 결과 자체를 SQL로 다시 계산
```

예:

```sql
SELECT product_name, list_price
FROM products
WHERE list_price > 500;
```

여기서는 `500`을 이미 알고 있다.

하지만:

```sql
SELECT product_name, list_price
FROM products
WHERE list_price > (
    SELECT AVG(list_price)
    FROM products
);
```

여기서는 조건값 자체를 SQL이 계산한다.

**이 차이가 서브쿼리를 이해하는 핵심이다.**

---

# 25. 수업 전 최소 체크

다음 질문에 답할 수 있으면 이번 강의의 큰 구조는 잡힌 상태다.

1. 서브쿼리는 왜 `( )` 안에 SELECT문을 넣는가?
2. 평균보다 비싼 상품을 찾을 때 왜 숫자를 WHERE에 바로 쓰지 않는가?
3. 서브쿼리 결과가 여러 행이면 왜 `=` 대신 `IN`을 사용하는가?
4. `NOT IN`에서 NULL을 주의해야 하는 이유는 무엇인가?
5. `EXISTS`의 `SELECT 1`에서 실제 숫자 1이 중요한가?
6. FROM절 서브쿼리가 왜 임시 테이블처럼 동작하는가?
7. 스칼라 서브쿼리는 왜 반드시 하나의 값만 반환해야 하는가?
8. 상관 서브쿼리는 외부 쿼리의 어떤 값을 참조하는가?
9. 서브쿼리와 JOIN 중 두 테이블의 여러 열을 함께 보고 싶다면 어느 쪽이 자연스러운가?

---

# 이번 장 핵심 정리

```text
서브쿼리
= SQL 안의 SELECT

WHERE절 서브쿼리
= 조건값을 계산

IN
= 여러 값 중 하나인가?

NOT IN
= 목록에 없는가?
단, NULL 주의

EXISTS
= 조건에 맞는 행이 존재하는가?

NOT EXISTS
= 조건에 맞는 행이 하나도 없는가?

FROM절 서브쿼리
= 인라인 뷰
= 결과를 임시 테이블처럼 사용

SELECT절 서브쿼리
= 스칼라 서브쿼리
= 단일 값을 열처럼 추가

상관 서브쿼리
= 외부 쿼리의 현재 행을 내부 쿼리에서 참조

JOIN
= 여러 테이블의 관계와 열을 직접 연결
```

### 마지막 한 문장

**서브쿼리는 “조건에 필요한 값이나 중간 결과도 SQL로 먼저 구해서 다시 사용한다”는 개념이며, WHERE에서는 조건, FROM에서는 테이블, SELECT에서는 하나의 값 역할을 한다.**
