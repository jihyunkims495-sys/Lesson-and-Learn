# 서브쿼리 예습 — 결과의 형태와 사용 위치

> 2026-09-08 · AI AGENT BOOTCAMP LV.1 · Week 06 SQL
> 범위: SQL 3장 1~2강 예습 내용 정리. 아래 예제는 실행 결과가 아닌 개념 설명이다.

## 전체 구조

서브쿼리는 SQL 안에 포함된 SELECT 문이다. 안쪽 결과를 바깥 쿼리에서 비교 기준, 조회 대상, 출력값으로 사용한다. 결과의 의존 관계와 실제 DB 실행 순서는 구분한다.

| 사용 위치 | 결과의 역할 |
|---|---|
| WHERE | 비교 기준이나 존재 여부 조건 |
| FROM | 조회할 테이블 형태의 중간 결과 |
| SELECT | 결과 행에 추가할 값 |

선행 개념은 SELECT/FROM/WHERE, AVG/SUM/COUNT, GROUP BY/HAVING, 별칭과 NULL이다.

## 평균을 조건에 사용하기

```sql
SELECT order_id, amount
FROM orders
WHERE amount > (SELECT AVG(amount) FROM orders);
```

전체 평균이라는 값 하나를 만들고 각 주문 금액과 비교한다. 여러 값의 목록과 비교할 때는 IN, 행이 있는지가 중요할 때는 EXISTS를 사용할 수 있다. NOT IN의 목록에 NULL이 있으면 목록에 없는 값도 참으로 판정되지 않을 수 있으므로 주의한다.

## FROM에서 집계 결과 사용하기

```sql
SELECT customer_id, total_amount
FROM (
    SELECT customer_id, SUM(amount) AS total_amount
    FROM orders
    GROUP BY customer_id
) AS customer_totals
WHERE total_amount >= 1000000;
```

중간 결과의 한 행은 고객 한 명과 그 고객의 주문 합계다. 바깥 쿼리에서는 내부 SELECT가 내보낸 열을 사용한다. 별칭을 붙여 중간 결과의 역할을 명확히 한다. 실제 저장 테이블을 생성하는 구문은 아니다.

## 분류할 때 주의할 점

- 스칼라: 한 컬럼, 최대 한 행의 결과를 값 하나로 사용한다. 0행이면 NULL, 여러 행이면 오류다. WHERE에서도 사용할 수 있다.
- 인라인 뷰: FROM에 놓인 서브쿼리 결과를 테이블처럼 사용한다.
- 상관: 내부 쿼리가 바깥 행의 값을 참조한다. 스칼라이면서 상관 서브쿼리일 수 있다.
- JOIN은 다른 테이블의 열을 함께 보여줄 때, EXISTS는 관련 행의 존재를 확인할 때 의도를 드러내기 쉽다. 성능 우열은 문법만으로 단정하지 않는다.

## 예습 질문

1. 평균보다 비싼 상품을 고르는 경우와 평균을 상품 옆에 표시하는 경우는 무엇이 다른가?
2. 고객별 합계표의 한 행은 원본 주문표의 한 행과 어떻게 다른가?
3. EXISTS의 SELECT 1은 무엇을 확인하는 데 쓰이는가?

예습 질문은 학습 계획이며 모두 풀이를 마쳤다는 뜻은 아니다.

## 관련 기록

- [이전 서브쿼리 예습](../2026-09-07/01-preview-notes-02-서브쿼리-인라인뷰-스칼라서브쿼리.md)
- [오늘 학습 정리](./02-learning-notes-03-subquery.md)
- [Week 06](../README.md)
