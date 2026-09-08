# 서브쿼리 문제 풀이 — 빈칸 구성과 결과 예측

> 2026-09-08 · AI AGENT BOOTCAMP LV.1 · Week 06 SQL
> 수행 방식: 대화에서 빈칸 채우기와 표를 보고 결과 예측하기. 실제 DB 실행 및 런타임 오류 재현은 하지 않았다.

## 1. 비교 기준 찾기

문제: 전체 평균 가격보다 비싼 상품의 이름을 찾으려면 어떤 기준값이 필요한가?

답: 전체 상품 가격의 평균값.

```sql
SELECT AVG(____)
FROM ____;
```

채운 내용: price, products.

## 2. 계산 표현식에서 서브쿼리로 구성하기

바깥 WHERE의 괄호 안에 서브쿼리를 넣는 단계에서 처음 작성한 내용은 다음과 같다.

```sql
AVG(price)
```

이것은 집계 표현식이다. 해당 문제에서 요구한 내부 쿼리를 구성하려면 무엇을 계산하는지 지정하는 SELECT와 데이터 출처인 FROM이 함께 필요했다.

```sql
SELECT AVG(price)
FROM products
```

SELECT와 FROM이 포함된 틀에 컬럼과 테이블을 채워 연결했다. 위 수정은 작성 단계의 보완이며, DB 오류 메시지를 받아 해결한 사례는 아니다.

## 3. 상품 표로 결과 예측하기

학습용 가상 데이터:

| name | price |
|---|---:|
| 티셔츠 | 20000 |
| 재킷 | 80000 |
| 모자 | 20000 |

평균은 (20000 + 80000 + 20000) / 3 = 40000이다.

```sql
SELECT name
FROM products
WHERE price > (
    SELECT AVG(price)
    FROM products
);
```

제시한 예상 답: 재킷.

| name |
|---|
| 재킷 |

바깥 SELECT만 name, price로 바꾼 변형 문제의 예상 답은 재킷, 80000이었다.

| name | price |
|---|---:|
| 재킷 | 80000 |

WHERE가 같으므로 남는 상품은 같고 SELECT에 따라 출력 컬럼이 달라진다. 두 표는 실행 로그가 아닌 손으로 예측한 결과다.

## 다음 실습

다른 상품 데이터에서 안쪽 SELECT를 직접 작성하고, 실제 PostgreSQL에서 예상 결과와 비교한다. 이 후속 실습은 아직 수행하지 않았다.

- [학습 정리](./02-learning-notes-03-subquery.md)
- [TIL](./04-til-03-subquery.md)
- [Week 06](../README.md)
