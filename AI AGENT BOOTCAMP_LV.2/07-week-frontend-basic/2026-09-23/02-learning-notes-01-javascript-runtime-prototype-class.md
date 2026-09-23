# Learning Notes — 프로토타입 기반 상속과 클래스 모델링

- 날짜: 2026-09-23
- Level / Week: LV.2 / Week 7
- 중심 범위: 5장 2강 — 프로토타입 기반 상속 및 클래스 모델링
- 핵심 연결 개념: `let`, `const`, `this`
- 제외 범위: 4장 1강, 4장 2강의 일반 문법, 4장 3강, 5장 1강
- 정리 근거: 당일 수업 중 개념 질의응답과 5장 2강 교안
- 학습 형태: 개념 정리만 진행, 실습 없음
- 실행 여부: 코드 작성·브라우저·Node.js·Jupyter 실행 없음

## 오늘 실제로 확인한 범위

오늘 학습의 중심은 JavaScript의 객체가 프로토타입을 통해 기능을 공유하는 방식과, 그 구조를 클래스 문법으로 표현하는 방법이었다. 수업 중에는 `let`, `const`, `this`, 프로퍼티, 생성자, `new`, 프로토타입, 상속, 오버라이딩, 캡슐화, 객체 잠금과 JSON 직렬화를 질문하고 설명을 들었다.

| 영역 | 실제 확인한 내용 | 근거 상태 |
|---|---|---|
| 변수와 객체 | `let`, `const`, `const` 객체의 프로퍼티 변경 | 질의응답 |
| 객체 기준 | `this`가 메서드 호출 객체와 새 인스턴스를 가리키는 방식 | 질의응답 |
| 객체 생성 | 생성자 함수, `new`의 내부 과정 | 질의응답 |
| 기능 공유 | 프로토타입과 프로토타입 체인 | 질의응답 |
| 클래스 | `class`, `constructor`, `extends`, `super()`, 오버라이딩 | 질의응답 |
| 프로퍼티 제어 | 데이터·접근자 프로퍼티, 캡슐화, 디스크립터 | 질의응답·교안 보강 |
| 객체 잠금 | `preventExtensions`, `seal`, `freeze` | 질의응답·교안 보강 |
| 데이터 변환 | JSON 직렬화·역직렬화와 한계 | 질의응답·교안 보강 |

오늘은 실습이나 오류 해결 없이 개념 정리만 진행했다. 사용자가 직접 코드를 작성하거나 실행한 기록과 종료 복습 답안은 없다. 따라서 개념을 독립적으로 적용할 수 있는지와 이해 완료 여부는 평가하지 않는다.

## 1. `let`과 `const`

`let`과 `const`는 모두 블록 단위로 사용할 수 있는 변수 선언 키워드다. 오늘 수업에서는 클래스 인스턴스와 객체 상태를 다룰 때 어떤 선언을 선택하는지에 초점을 맞췄다.

- `let`: 같은 변수에 다른 값을 다시 대입해야 할 때 사용
- `const`: 변수가 가리키는 대상을 다시 바꾸지 않을 때 사용

```javascript
let discountRate = 0.1;
discountRate = 0.2;

const product = {
  name: "셔츠",
  price: 39000
};
```

`const`는 변수의 재할당을 막는다. 객체 내부까지 자동으로 변경 불가능하게 만드는 것은 아니다.

```javascript
product.price = 35000; // 가능

// product = { name: "바지" }; // TypeError
```

즉, `const`와 객체 동결은 다른 개념이다. 객체의 내부 변경까지 막으려면 `Object.freeze()` 같은 별도 제어가 필요하다.

## 2. `this` 키워드

`this`는 일반 변수처럼 값을 선언해 두는 이름이 아니라, 함수가 실행되는 방식에 따라 기준이 되는 객체를 가리키는 키워드다.

### 메서드에서의 `this`

```javascript
const product = {
  name: "셔츠",
  showName() {
    return this.name;
  }
};

product.showName();
```

`product.showName()`처럼 호출하면 메서드 안의 `this`는 보통 메서드 앞의 `product`를 가리킨다. 따라서 `this.name`은 `product.name`을 읽는다.

### 생성자에서의 `this`

```javascript
function Product(name, price) {
  this.name = name;
  this.price = price;
}

const shirt = new Product("셔츠", 39000);
```

`new Product()`로 호출하면 생성자 안의 `this`는 새로 만들어지는 인스턴스를 가리킨다. `this.name = name`은 그 새 인스턴스에 `name` 프로퍼티를 추가한다.

`this`는 언제나 같은 객체를 가리키는 고정 변수는 아니다. 오늘 학습에서는 메서드 호출과 `new` 생성자 호출의 맥락에 한정해 확인했다.

## 3. 생성자 함수에서 프로토타입이 필요한 이유

생성자 함수는 같은 구조의 객체를 여러 개 만들 수 있게 한다.

```javascript
function Product(name, price) {
  this.name = name;
  this.price = price;
}
```

공통 메서드를 생성자 내부에 정의하면 인스턴스를 만들 때마다 같은 동작의 함수가 각각 생성될 수 있다.

```javascript
function Product(name) {
  this.name = name;
  this.showName = function () {
    return this.name;
  };
}
```

공통 메서드를 `Product.prototype`에 한 번만 등록하면 모든 인스턴스가 그 메서드를 공유한다.

```javascript
Product.prototype.showName = function () {
  return this.name;
};

const shirt = new Product("셔츠");
const pants = new Product("바지");

shirt.showName === pants.showName; // true
```

프로토타입을 사용하는 핵심 이유는 공통 기능을 매번 복사하지 않고 공유하기 위해서다.

## 4. 프로토타입과 프로토타입 체인

JavaScript 객체는 상위 객체를 가리키는 내부 `[[Prototype]]` 연결을 가진다. 객체 자체에 요청한 프로퍼티나 메서드가 없으면 JavaScript 엔진은 이 연결을 따라 상위 객체를 차례로 검색한다.

```text
shirt 인스턴스
→ Product.prototype
→ Object.prototype
→ null
```

| 구분 | 의미 |
|---|---|
| `Product.prototype` | 생성자가 만든 인스턴스들이 공유할 메서드를 두는 객체 |
| 인스턴스의 `[[Prototype]]` | 상위 프로토타입 객체를 가리키는 내부 연결 |
| `Object.getPrototypeOf(shirt)` | `shirt`의 상위 프로토타입을 조회하는 표준 방법 |
| `__proto__` | 내부 프로토타입에 접근하는 오래된 접근자이며 직접 조작은 권장되지 않음 |

```javascript
Object.getPrototypeOf(shirt) === Product.prototype; // true
```

프로토타입 체인은 상속받은 기능을 찾는 검색 경로다. 객체에 동일한 이름의 자체 메서드가 있으면 그 메서드를 먼저 사용하고, 없을 때 상위 프로토타입을 탐색한다.

## 5. `new` 연산자의 내부 과정

`new`는 단순히 생성자 함수를 호출하는 것 이상으로 다음 과정을 수행한다.

```text
1. 새로운 빈 객체 생성
2. 새 객체의 [[Prototype]]을 생성자의 prototype과 연결
3. 생성자 안의 this를 새 객체에 바인딩
4. 생성자 함수를 실행하여 프로퍼티 초기화
5. 완성된 인스턴스 반환
```

```javascript
const shirt = new Product("셔츠", 39000);
```

이 결과 `shirt`는 자신만의 `name`, `price`를 가지면서 `Product.prototype`에 있는 공통 메서드를 사용할 수 있다.

## 6. 클래스 문법의 실제 구조

ES6의 `class`는 JavaScript의 프로토타입 기반 객체 생성을 더 읽기 쉽게 표현하는 문법이다. 클래스 문법을 쓴다고 해서 내부 동작이 프로토타입과 완전히 분리되는 것은 아니다.

```javascript
class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  showInfo() {
    return `${this.name}: ${this.price}원`;
  }
}
```

| 클래스 구성 | 프로토타입 기반 역할 |
|---|---|
| `class Product` | 생성자 역할의 클래스 선언 |
| `constructor()` | 인스턴스 고유 프로퍼티 초기화 |
| `showInfo()` | `Product.prototype`에 등록되는 공유 메서드 |
| `new Product()` | 인스턴스 생성과 프로토타입 연결 |

클래스의 주요 제약도 함께 확인했다.

- 클래스는 반드시 `new`와 함께 호출한다.
- `new` 없이 호출하면 `TypeError`가 발생한다.
- 클래스 선언 전에 인스턴스를 만들려고 하면 초기화 전 접근 오류가 발생한다.
- 클래스의 일반 메서드는 인스턴스마다 복사되지 않고 프로토타입을 통해 공유된다.

## 7. 클래스 상속과 오버라이딩

`extends`는 부모 클래스의 기능을 자식 클래스가 사용할 수 있도록 프로토타입 체인을 연결한다.

```javascript
class FashionProduct extends Product {
  constructor(name, price, size) {
    super(name, price);
    this.size = size;
  }

  showInfo() {
    return `${super.showInfo()}, 사이즈: ${this.size}`;
  }
}
```

- `extends Product`: `FashionProduct`가 `Product`의 기능을 상속
- `super(name, price)`: 부모 생성자를 실행해 부모 쪽 프로퍼티 초기화
- `this.size = size`: 자식 인스턴스만의 추가 프로퍼티 설정
- 오버라이딩: 부모의 `showInfo()`를 자식이 같은 이름으로 재정의
- `super.showInfo()`: 부모의 원래 메서드를 호출해 기존 기능 재사용

자식 클래스의 생성자에서는 `this`를 사용하기 전에 `super()`를 호출해야 한다. 부모 쪽 초기화가 먼저 끝나야 자식 인스턴스의 `this`를 사용할 수 있기 때문이다.

### 생성자 함수 방식의 상속

교안에서는 클래스 이전 방식도 함께 다룬다.

```javascript
function FashionProduct(name, price, size) {
  Product.call(this, name, price);
  this.size = size;
}

FashionProduct.prototype = Object.create(Product.prototype);
FashionProduct.prototype.constructor = FashionProduct;
```

- `Product.call(this, ...)`: 부모 생성자의 프로퍼티 초기화 로직을 자식 인스턴스에 적용
- `Object.create(Product.prototype)`: 자식 프로토타입을 부모 프로토타입과 연결
- `constructor` 복원: 교체된 자식 프로토타입의 생성자 참조를 다시 설정

클래스의 `extends`와 `super()`는 이 과정을 더 간결하고 안전하게 표현한다.

## 8. 프로퍼티와 캡슐화

프로퍼티는 객체 안에서 데이터를 구분하는 키와 값의 쌍이다. 값이 함수이면 메서드라고 부른다.

### 데이터 프로퍼티

데이터 프로퍼티는 실제 값을 직접 저장한다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};
```

### 접근자 프로퍼티

접근자 프로퍼티는 자체 값을 직접 저장하지 않고 `get`과 `set`으로 읽기와 쓰기 과정을 제어한다.

```javascript
const product = {
  _price: 39000,

  get price() {
    return this._price;
  },

  set price(value) {
    if (value < 0) {
      throw new Error("가격은 0 이상이어야 합니다.");
    }
    this._price = value;
  }
};
```

이 구조에서는 외부 코드가 `product.price`를 사용하는 동안 실제 저장 위치와 검증 규칙을 객체 내부에서 관리한다. 데이터와 변경 규칙을 함께 묶어 객체가 유효한 상태를 유지하게 하는 것이 캡슐화의 목적이다.

## 9. 프로퍼티 디스크립터

데이터 프로퍼티는 값뿐 아니라 수정·열거·재설정 가능 여부를 나타내는 내부 속성을 가진다.

| 속성 | 의미 |
|---|---|
| `value` | 저장된 실제 값 |
| `writable` | 값을 수정할 수 있는가 |
| `enumerable` | `Object.keys()`나 반복에서 나타나는가 |
| `configurable` | 삭제하거나 속성 설정을 바꿀 수 있는가 |

```javascript
const account = {};

Object.defineProperty(account, "balance", {
  value: 70000,
  writable: false,
  enumerable: true,
  configurable: false
});

Object.getOwnPropertyDescriptor(account, "balance");
```

- `Object.defineProperty()`: 프로퍼티와 세부 속성을 정의
- `Object.getOwnPropertyDescriptor()`: 한 프로퍼티의 속성 설정 조회

## 10. 객체 변경 제한

객체의 구조와 값을 얼마나 제한할지에 따라 세 메서드를 구분한다.

| 메서드 | 프로퍼티 추가 | 프로퍼티 삭제 | 기존 값 수정 |
|---|---:|---:|---:|
| `Object.preventExtensions()` | 불가 | 가능 | 가능 |
| `Object.seal()` | 불가 | 불가 | 가능 |
| `Object.freeze()` | 불가 | 불가 | 불가 |

`Object.seal()`은 객체의 구조를 밀봉하고, `Object.freeze()`는 기존 데이터 프로퍼티의 값 수정까지 막는다.

```javascript
const sealedProduct = { price: 39000 };
Object.seal(sealedProduct);
sealedProduct.price = 35000; // 기존 값 수정 가능

const frozenProduct = { price: 39000 };
Object.freeze(frozenProduct);
// frozenProduct.price = 35000; // 변경되지 않음 또는 strict mode에서 오류
```

두 메서드는 기본적으로 얕게 적용된다. 중첩 객체까지 변경 불가능하게 만들려면 각 중첩 객체에도 동결 처리가 필요하다.

## 11. JSON 직렬화와 깊은 복사 한계

직렬화는 메모리의 객체 데이터를 파일 저장이나 네트워크 전송에 사용할 수 있는 문자열 형식으로 바꾸는 과정이다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};

const jsonText = JSON.stringify(product);
const restoredProduct = JSON.parse(jsonText);
```

- `JSON.stringify()`: JavaScript 객체 데이터를 JSON 문자열로 변환
- `JSON.parse()`: JSON 문자열을 JavaScript 객체로 복원

JavaScript 언어 자체를 JSON으로 바꾸는 것이 아니라, JavaScript 프로그램이 다루는 객체 데이터를 JSON 문자열로 변환하는 것이다.

### JSON 왕복을 이용한 복사

JSON으로 바꾼 뒤 다시 파싱하면 단순한 중첩 객체에서 원본과 참조를 공유하지 않는 복사본을 만들 수 있다.

```javascript
const original = {
  stock: {
    online: 10
  }
};

const copied = JSON.parse(JSON.stringify(original));
copied.stock.online = 20;

console.log(original.stock.online); // 10
```

하지만 다음 정보는 손실되거나 처리할 수 없다.

- 함수와 `undefined`
- Symbol
- `Date`, `Map`, `Set` 등 특수 객체의 원래 타입
- 프로토타입과 클래스 인스턴스 정보
- 순환 참조

따라서 JSON 왕복은 JSON으로 안전하게 표현되는 단순 데이터에만 제한적으로 사용해야 한다. 직렬화는 암호화가 아니므로 민감정보 보호 수단도 아니다.

## 12. 메서드를 모두 외워야 하는가

JavaScript의 모든 메서드를 외울 필요는 없다. 다음 기준으로 메서드를 읽고 필요한 때 찾아 쓰는 것이 중요하다.

1. 어떤 객체의 메서드인가?
2. 어떤 값을 입력받는가?
3. 무엇을 반환하는가?
4. 원본 객체를 변경하는가?
5. 실패하거나 처리할 수 없는 값은 무엇인가?

반복해서 사용하는 `Object.getPrototypeOf()`, `Object.defineProperty()`, `JSON.stringify()` 같은 메서드는 자연스럽게 익히고, 나머지는 공식 문서와 자동 완성을 활용한다.

## 이번 기록에서 제외한 내용

- 4장 1강: JavaScript 개발 환경 구성
- 4장 2강: 호이스팅·스코프·연산자·조건문·반복문·예외 처리 등 일반 기초 문법
- 4장 3강: 객체 리터럴·배열·내장 객체 일반 학습
- 5장 1강: 함수 정의·콜백·화살표 함수·호출 스택·클로저·즉시 실행 함수·명시적 바인딩

`let`, `const`, `this`는 오늘 5장 2강의 객체·클래스 모델링을 이해하는 핵심 연결 개념으로 포함했다.

## 핵심 정리

1. `let`은 재할당이 필요한 변수, `const`는 같은 바인딩을 유지할 변수에 사용한다.
2. `const` 객체의 프로퍼티는 변경할 수 있으며, 객체 불변성과는 별개다.
3. 메서드 호출에서 `this`는 보통 메서드 앞의 객체를, `new` 호출에서는 새 인스턴스를 가리킨다.
4. 프로토타입은 여러 인스턴스가 공통 메서드를 공유하게 한다.
5. 프로토타입 체인은 객체에 없는 기능을 상위 객체에서 찾는 경로다.
6. 클래스 문법은 생성자 함수와 프로토타입 기반 구조를 더 읽기 쉽게 표현한다.
7. `extends`, `super()`와 오버라이딩으로 부모 기능을 재사용하고 확장한다.
8. 데이터·접근자 프로퍼티와 디스크립터는 객체 상태의 조회와 변경 규칙을 제어한다.
9. `seal()`과 `freeze()`는 객체의 구조와 값 변경을 서로 다른 강도로 제한한다.
10. JSON 직렬화는 객체 데이터를 저장·전송 가능한 문자열로 바꾸지만 모든 JavaScript 값을 보존하지는 않는다.

## 미실행 및 다음 확인 항목

- `let` 재할당과 `const` 객체 프로퍼티 변경 결과 실행
- 메서드와 `new` 호출에서 `this` 비교
- 인스턴스 두 개가 프로토타입 메서드를 공유하는지 확인
- `Object.getPrototypeOf()`로 프로토타입 체인 조회
- 생성자 함수 상속과 클래스 상속 결과 비교
- `Object.getOwnPropertyDescriptor()` 반환값 확인
- `seal()`과 `freeze()`의 추가·삭제·수정 결과 비교
- JSON 직렬화에서 함수·`undefined`·특수 객체가 어떻게 처리되는지 확인

위 항목은 실제로 실행하지 않았으므로 성공 결과로 기록하지 않는다.
