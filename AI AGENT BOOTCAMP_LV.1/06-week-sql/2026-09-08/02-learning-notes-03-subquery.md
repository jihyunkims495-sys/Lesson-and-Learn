# SQL 학습 정리 — 행 선택에서 상관 서브쿼리까지

> 2026-09-08 · AI AGENT BOOTCAMP LV.1 · Week 06 SQL
> 수업 중 질문과 설명을 정리했다. SQL 예제는 실제 DB 실행을 확인한 결과가 아니다.

## WHERE와 SELECT, 레코드

레코드는 테이블에서 데이터 한 건, 즉 행 하나를 뜻한다. 컬럼은 상품명·가격 같은 항목이다.

```sql
SELECT name
FROM products
WHERE price >= 20000;
```

products에서 가격이 20,000 이상인 행을 남기고 이름만 보여준다. WHERE에 price를 사용했다고 결과에 가격이 자동으로 표시되지는 않는다. 출력에 가격도 필요하면 SELECT name, price로 바꾼다.

## 평균값을 만드는 안쪽 쿼리

```sql
SELECT name, price
FROM products
WHERE price > (
    SELECT AVG(price)
    FROM products
);
```

안쪽은 전체 평균값, 바깥 WHERE는 평균보다 비싼 행, 바깥 SELECT는 이름과 가격을 담당한다. 이는 쿼리를 이해하는 흐름이며 물리적 실행 순서를 단정하는 설명은 아니다.

## 스칼라·인라인 뷰·상관의 차이

| 종류 | 분류 기준 | 의미 |
|---|---|---|
| 스칼라 | 결과 형태 | 한 컬럼·최대 한 행을 값으로 사용 |
| 인라인 뷰 | 위치와 용도 | FROM에서 중간 결과를 테이블처럼 조회 |
| 상관 | 외부 참조 | 바깥 행의 값에 따라 내부 조건이 달라짐 |

스칼라 결과가 0행이면 NULL, 여러 행이면 오류다. 스칼라를 SELECT절 전용으로 외우지 않는다. 고객마다 주문 횟수 하나를 구하는 쿼리는 스칼라와 상관에 동시에 해당할 수 있다.

## 별칭과 점 표기

```sql
SELECT p.product_id, p.product_name
FROM products AS p;
```

p는 products에 붙인 별칭이다. p.product_id는 'p 테이블의 product_id 컬럼'이다. 메서드를 호출하는 표기가 아니다.

## SELECT 1과 EXISTS

수업 중 질문한 내부 구문:

```sql
SELECT 1
FROM stocks s
WHERE s.product_id = p.product_id
```

p가 바깥 상품 테이블의 별칭일 때, 현재 상품과 ID가 같은 재고 행을 찾는다. 이 조각은 p의 외부 정의 없이 독립 실행하는 예제가 아니다.

- s.product_id: 안쪽 재고 행의 상품 ID.
- p.product_id: 바깥 상품 행의 상품 ID.
- SELECT 1: 일치하는 행마다 상수 1을 반환. 첫 컬럼이나 한 행 제한이 아니다.
- EXISTS 안에 사용하면 일치하는 행이 하나라도 있는지를 확인한다.

설명용 재고 데이터에 상품 ID 2인 행이 두 개 있고 바깥 상품 ID도 2라면, 내부 결과는 1이 두 행 나오는 것으로 예상한다. EXISTS는 그 값보다 행의 존재를 판단한다. 재고 기록이 있는 것과 수량이 0보다 큰 것은 별도 조건이다.

## 관련 기록

- [예습](./01-preview-notes-03-subquery.md)
- [문제 풀이와 시행착오](./03-practice-03-subquery.md)
- [TIL](./04-til-03-subquery.md)
- [Week 06](../README.md)
