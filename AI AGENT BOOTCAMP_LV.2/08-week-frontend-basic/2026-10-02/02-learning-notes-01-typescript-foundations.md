# Learning Notes — TypeScript 기초에서 인터페이스 확장까지

- 날짜: 2026-10-02
- Level / Week: LV.2 / Week 8
- 과정: 프론트엔드 심화 (TypeScript)
- 실제 수업 범위: 1장 1강~4장 2강
- 학습 형태: 개념 질문과 코치 설명 중심
- 실행 상태: 실제 코드 실행·출력·오류 해결은 확인되지 않음

## 오늘 수업의 전체 흐름

```text
TypeScript를 사용하는 이유
→ 값의 타입
→ 함수의 입력과 출력 타입
→ 객체의 타입 설계
→ 기존 객체 설계 확장
```

오늘은 TypeScript를 처음 시작해 1장부터 4장 2강까지 진행했다. 진도가 빠르게 이어져 모든 문법을 독립적으로 이해하기보다, 타입의 적용 범위가 변수에서 함수와 객체로 넓어지는 구조를 중심으로 다시 연결했다.

## 1. TypeScript와 JavaScript

TypeScript는 최신 버전 JavaScript 그 자체가 아니다. JavaScript의 문법과 실행 방식을 바탕으로 정적 타입 검사 기능을 추가한 언어다.

```text
.ts 파일 작성
→ TypeScript 도구가 타입 검사 및 변환
→ .js 파일 생성
→ JavaScript 실행 환경에서 실행
```

수업 중 “트레일러가 있어야 하는가”라는 질문을 통해 필요한 용어가 트랜스파일러 또는 컴파일러라는 점을 정리했다. 파일이 스스로 변환되는 것은 아니지만, 개발 도구를 설정하면 저장이나 실행 과정에서 자동으로 처리되는 것처럼 사용할 수 있다.

컴파일과 임베딩은 다른 과정이다.

- 컴파일: 코드를 다른 실행 가능한 형태나 언어로 변환
- 임베딩: 텍스트나 이미지 등의 의미를 숫자 벡터로 표현

## 2. `const`와 `let`

현대 JavaScript와 TypeScript에서는 재할당할 필요가 없다면 `const`를 기본으로 사용한다.

```typescript
const course = "TypeScript";

let progress = 1;
progress = 2;
```

- `const`: 변수에 다른 값을 다시 할당할 수 없음
- `let`: 이후 다른 값을 재할당할 수 있음
- `const` 객체나 배열의 내부 값은 별도의 불변 처리가 없다면 변경될 수 있음

```typescript
const stock = { M: 10 };
stock.M = 8; // 객체 내부 속성 변경
```

## 3. `any`와 `unknown`

`any`와 `unknown`은 Python의 `pass`처럼 아무 작업도 하지 않는 문장이 아니다. 두 항목은 TypeScript의 타입이다.

```typescript
let looseValue: any = "shirt";
looseValue.toUpperCase();

let safeValue: unknown = "shirt";
if (typeof safeValue === "string") {
  safeValue.toUpperCase();
}
```

- `any`: 타입 검사를 대부분 우회하므로 편하지만 안전장치가 약해짐
- `unknown`: 어떤 값이든 받을 수 있지만 타입을 확인하기 전에는 바로 사용할 수 없음

## 4. 함수의 타입

함수에는 입력인 매개변수와 출력인 반환값의 타입을 적을 수 있다.

```typescript
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

콜백은 다른 함수에 전달되어 필요한 시점에 호출되는 함수다. 함수 타입은 콜백이 어떤 값을 받고 무엇을 반환하는지 표현한다.

```typescript
type Discount = (price: number) => number;
```

오늘은 콜백 타입과 실행 구조를 교안 범위로 다뤘지만, 실제 실행 순서를 코드로 확인하지는 않았다.

## 5. 타입 별칭과 인터페이스

타입 별칭과 인터페이스는 복잡한 타입이나 객체 구조를 반복해서 적지 않도록 이름과 설계도를 제공한다.

```typescript
type ProductId = number;

interface Product {
  readonly id: ProductId;
  name: string;
  price?: number;
}
```

- `readonly`: 해당 속성의 재할당을 타입 검사 단계에서 제한
- `?`: 속성이 없어도 되지만 존재한다면 선언한 타입을 따라야 함
- `readonly`는 객체를 런타임에서 자동으로 동결하지 않음

## 6. 인덱스 시그니처

사이즈별 재고처럼 속성 이름이 동적으로 달라지는 객체의 값 타입을 제한할 수 있다.

```typescript
interface SizeStock {
  [size: string]: number;
}

const stock: SizeStock = {
  S: 10,
  M: 25,
  L: 8,
};
```

`[size: string]: number`는 속성 이름이 문자열이고 각 속성값은 숫자여야 한다는 뜻이다. `size`는 설명을 위한 매개변수 이름이지 실제로 고정된 속성명이 아니다.

## 7. 인터페이스 확장

상속이 반복해서 등장하는 이유는 공통 내용을 다시 쓰지 않고 기본 설계를 재사용하기 위해서다.

```typescript
interface Product {
  name: string;
  price: number;
}

interface FashionProduct extends Product {
  size: string;
  color: string;
}
```

여기서 `extends`는 `Product`의 객체 설계도를 가져와 `size`와 `color`를 추가한다. 인터페이스 확장은 타입 설계도를 합치는 것이며, 클래스 상속처럼 런타임 기능이 자동 실행되는 것으로 이해하지 않는다.

## 오늘 확인된 어려움

- 새 용어가 정리되기 전에 다음 장으로 넘어가 개념 연결이 끊겼다.
- 컴파일·트랜스파일·실행의 관계가 처음에는 하나의 과정처럼 느껴졌다.
- `any`·`unknown`, `const`, 인터페이스와 상속을 기존에 아는 개념과 비교하며 질문했다.
- 설명은 받았지만 직접 코드를 작성·실행하거나 결과를 예측한 근거가 없어 이해도를 확정하지 않는다.

## 다음 복습 순서

1. `.ts → 타입 검사·변환 → .js → 실행`
2. `const`·`let`과 기본 타입
3. `any`와 `unknown`
4. 함수의 입력·출력 타입과 콜백
5. 객체 타입·인터페이스·인덱스 시그니처·`extends`

각 단계에서 예제 하나만 직접 실행하고 결과를 기록하는 방식으로 다시 확인한다.
