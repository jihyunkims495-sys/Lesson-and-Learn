# Preview Notes — 프로토타입 기반 상속과 클래스 모델링

- 날짜: 2026-09-23
- Level / Week: LV.2 / Week 7
- 과정: 프론트엔드 개발
- 중심 범위: 5장 2강 — 프로토타입 기반 상속 및 클래스 모델링
- 핵심 연결 개념: `let`, `const`, `this`
- 제외 범위: 4장 1강, 4장 2강의 일반 문법, 4장 3강, 5장 1강
- 작성 상태: 수업 후 누락 보완본이며, 교안에 근거한 수업 전 확인 항목으로 구성

## 학습 목표

- `let`과 `const`를 재할당 가능 여부에 따라 구분한다.
- `const`로 선언한 객체의 프로퍼티는 변경될 수 있다는 점을 설명한다.
- 메서드와 생성자 안에서 `this`가 어떤 객체를 가리키는지 이해한다.
- 생성자 함수 내부에 메서드를 만들 때 생기는 메모리 중복 문제를 설명한다.
- 프로토타입과 프로토타입 체인의 탐색 방식을 이해한다.
- `new`가 인스턴스를 만드는 내부 과정을 설명한다.
- 생성자 함수와 ES6 `class` 문법의 대응 관계를 구분한다.
- `extends`, `super()`와 오버라이딩으로 상속 구조를 표현한다.
- 데이터 프로퍼티와 접근자 프로퍼티를 구분한다.
- 프로퍼티 디스크립터와 객체 잠금 메서드의 차이를 이해한다.
- 객체를 JSON 문자열로 직렬화하고 다시 객체로 복원한다.

## 전체 학습 구조

```text
let·const로 인스턴스와 상태 참조
→ this로 현재 객체의 프로퍼티 접근
→ 생성자 함수로 객체 생성
→ prototype에 공통 메서드 등록
→ 프로토타입 체인으로 상위 기능 탐색
→ class 문법으로 생성자와 메서드 표현
→ extends·super로 상속과 오버라이딩
→ 프로퍼티 디스크립터로 변경 규칙 제어
→ seal·freeze로 객체 잠금
→ JSON으로 객체 데이터 직렬화
```

## 선행 개념

- 변수 선언과 값 대입
- 객체의 키와 값
- 함수 호출과 반환값
- 메서드는 객체에 연결된 함수라는 점
- 원시 값과 객체 참조의 차이

## 1. `let`, `const`와 객체 상태

`let`은 다른 값을 다시 대입해야 하는 변수에 사용하고, `const`는 같은 바인딩을 유지해야 하는 변수에 사용한다.

```javascript
let currentPrice = 39000;
currentPrice = 35000;

const product = {
  name: "셔츠",
  price: 39000
};

product.price = 35000;
```

`const product`는 `product`가 다른 객체를 가리키도록 재할당하는 것을 막는다. 객체 내부의 `price` 프로퍼티까지 자동으로 동결하는 것은 아니다. 객체 자체의 변경을 제한하려면 프로퍼티 속성이나 `Object.seal()`, `Object.freeze()` 같은 별도 도구가 필요하다.

## 2. `this`와 인스턴스

`this`는 일반 변수 이름이 아니라 현재 실행 맥락에서 기준이 되는 객체를 가리키는 키워드다. 메서드 호출에서는 보통 메서드 앞의 객체를 가리키고, `new`로 생성자를 호출할 때는 새로 만들어지는 인스턴스를 가리킨다.

```javascript
const product = {
  name: "셔츠",
  showName() {
    return this.name;
  }
};

product.showName();
```

```javascript
function Product(name, price) {
  this.name = name;
  this.price = price;
}

const shirt = new Product("셔츠", 39000);
```

`this.name`은 모든 객체가 공유하는 전역 값이 아니라, 해당 메서드를 호출하거나 생성 중인 인스턴스의 `name` 프로퍼티를 의미한다.

## 3. 생성자 함수와 메서드 공유

생성자 함수는 비슷한 구조의 객체를 반복해서 만들 수 있게 한다. 하지만 생성자 내부에 메서드를 직접 넣으면 인스턴스를 만들 때마다 같은 기능의 함수가 새로 생길 수 있다.

```javascript
function Product(name) {
  this.name = name;
  this.showName = function () {
    return this.name;
  };
}
```

공통 메서드를 생성자의 `prototype`에 등록하면 여러 인스턴스가 하나의 함수를 공유한다.

```javascript
function Product(name) {
  this.name = name;
}

Product.prototype.showName = function () {
  return this.name;
};
```

## 4. 프로토타입과 프로토타입 체인

프로토타입은 여러 객체가 공통 프로퍼티와 메서드를 공유할 수 있게 하는 상위 연결 객체다. 객체 자체에서 요청한 프로퍼티를 찾지 못하면 JavaScript 엔진은 내부 `[[Prototype]]` 링크를 따라 상위 객체를 검색한다.

```text
인스턴스
→ 생성자 또는 자식 클래스의 prototype
→ 부모 클래스의 prototype
→ Object.prototype
→ null
```

- `prototype`: 생성자 함수가 인스턴스들과 공유할 메서드를 두는 객체
- `[[Prototype]]`: 각 객체가 상위 프로토타입을 가리키는 내부 연결
- `Object.getPrototypeOf(object)`: 객체의 상위 프로토타입을 조회하는 표준 메서드
- `__proto__`: 내부 프로토타입에 접근하는 오래된 접근자이며 직접 조작은 권장하지 않음

## 5. `new`의 내부 과정

```text
1. 빈 객체 생성
2. 새 객체의 [[Prototype]]을 생성자의 prototype과 연결
3. 생성자 내부의 this를 새 객체에 바인딩
4. 생성자 실행으로 인스턴스 프로퍼티 초기화
5. 완성된 인스턴스 반환
```

```javascript
const shirt = new Product("셔츠");
```

이 과정 때문에 `shirt`는 생성자에서 설정한 고유 데이터와 `Product.prototype`의 공통 메서드를 함께 사용할 수 있다.

## 6. 클래스 문법과 상속

`class`는 생성자 함수와 프로토타입 등록을 읽기 쉽게 표현하는 문법이다.

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

| 클래스 문법 | 내부 역할 |
|---|---|
| `class Product` | 생성자 역할을 하는 클래스 선언 |
| `constructor()` | 인스턴스 고유 프로퍼티 초기화 |
| `showInfo()` | `Product.prototype`에 공유되는 메서드 |
| `new Product()` | 인스턴스 생성과 프로토타입 연결 |

클래스는 `new` 없이 호출할 수 없고, 선언 전에 접근하면 초기화 오류가 발생한다.

### 상속과 오버라이딩

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

- `extends`: 부모 클래스와 자식 클래스의 프로토타입 체인을 연결
- `super()`: 부모 생성자를 호출하며 자식 생성자에서 `this`보다 먼저 실행
- 오버라이딩: 부모에게 상속받은 메서드를 자식에서 같은 이름으로 재정의
- `super.showInfo()`: 부모 메서드의 기존 기능 재사용

## 7. 데이터 프로퍼티와 접근자 프로퍼티

데이터 프로퍼티는 실제 값을 직접 저장한다. 접근자 프로퍼티는 자체 값을 저장하는 대신 `get`과 `set`으로 조회와 변경 과정을 제어한다.

```javascript
const product = {
  _price: 39000,

  get price() {
    return this._price;
  },

  set price(value) {
    if (value < 0) return;
    this._price = value;
  }
};
```

접근자는 객체의 상태가 잘못된 값으로 바뀌지 않도록 변경 규칙을 한곳에서 관리하는 데 사용할 수 있다.

## 8. 프로퍼티 디스크립터

JavaScript의 데이터 프로퍼티는 값 외에도 변경 규칙을 나타내는 내부 속성을 가진다.

| 속성 | 의미 |
|---|---|
| `value` | 프로퍼티에 저장된 값 |
| `writable` | 값을 수정할 수 있는가 |
| `enumerable` | 반복과 키 목록에 나타나는가 |
| `configurable` | 삭제하거나 설정을 다시 바꿀 수 있는가 |

```javascript
const descriptor = Object.getOwnPropertyDescriptor(product, "_price");
```

- `Object.getOwnPropertyDescriptor()`: 프로퍼티 설정 조회
- `Object.defineProperty()`: 프로퍼티 추가 또는 속성 세부 설정

## 9. 객체 잠금

| 메서드 | 프로퍼티 추가 | 프로퍼티 삭제 | 기존 값 수정 |
|---|---:|---:|---:|
| `Object.preventExtensions()` | 불가 | 가능 | 가능 |
| `Object.seal()` | 불가 | 불가 | 가능 |
| `Object.freeze()` | 불가 | 불가 | 불가 |

이 메서드들은 기본적으로 객체의 바로 아래 단계에만 적용된다. 프로퍼티 값이 또 다른 객체라면 중첩 객체까지 자동으로 잠기지는 않는다.

## 10. JSON 직렬화와 복원

직렬화는 메모리의 객체 데이터를 파일 저장이나 네트워크 전송이 가능한 문자열 형식으로 바꾸는 과정이다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};

const jsonText = JSON.stringify(product);
const restoredProduct = JSON.parse(jsonText);
```

- `JSON.stringify()`: JavaScript 객체 데이터를 JSON 문자열로 변환
- `JSON.parse()`: JSON 문자열을 JavaScript 객체로 변환
- 함수, `undefined`, Symbol과 프로토타입 정보는 그대로 보존되지 않음
- 순환 참조가 있는 객체는 일반적인 `JSON.stringify()`로 직렬화할 수 없음
- JSON 변환은 암호화가 아니며 모든 객체를 위한 범용 깊은 복사 방법도 아님

## 핵심 용어

| 용어 | 의미 |
|---|---|
| 바인딩 | 식별자나 `this`가 특정 값 또는 객체와 연결되는 것 |
| 인스턴스 | 생성자나 클래스를 통해 만들어진 개별 객체 |
| 프로토타입 | 여러 객체가 공통 기능을 공유하도록 연결되는 상위 객체 |
| 프로토타입 체인 | 객체에 없는 기능을 상위 프로토타입에서 차례로 찾는 경로 |
| 생성자 | `new`와 함께 인스턴스를 만들고 초기화하는 함수 |
| 오버라이딩 | 상속받은 메서드를 자식 클래스에서 다시 정의하는 것 |
| 데이터 프로퍼티 | 실제 값을 저장하는 프로퍼티 |
| 접근자 프로퍼티 | `get`과 `set`으로 접근을 제어하는 프로퍼티 |
| 직렬화 | 객체 데이터를 저장·전송 가능한 문자열로 변환하는 것 |

## 예상 난점

- `const`를 객체 불변과 동일한 의미로 오해하는 것
- `this`를 선언해서 사용하는 일반 변수로 오해하는 것
- 생성자의 `prototype`과 인스턴스의 `[[Prototype]]`을 혼동하는 것
- 클래스가 프로토타입과 무관한 별도 상속 체계라고 생각하는 것
- 자식 생성자에서 `super()`보다 먼저 `this`를 사용하는 것
- 데이터 프로퍼티와 접근자 프로퍼티의 저장 방식을 혼동하는 것
- `seal()`과 `freeze()`가 중첩 객체까지 자동으로 잠근다고 생각하는 것
- JSON 직렬화와 암호화 또는 완전한 객체 복사를 혼동하는 것

## 추후 확인 항목 — 오늘 미실시

- [ ] `let` 재할당과 `const` 재할당 오류 비교
- [ ] `const` 객체의 프로퍼티 변경 가능 여부 확인
- [ ] 메서드 호출과 생성자 호출에서 `this`가 가리키는 객체 확인
- [ ] 두 인스턴스가 프로토타입 메서드를 공유하는지 비교
- [ ] `Object.getPrototypeOf()`로 프로토타입 체인 확인
- [ ] `new`로 여러 인스턴스 생성
- [ ] `extends`, `super()`와 오버라이딩을 사용한 상속 구현
- [ ] 데이터·접근자 프로퍼티와 디스크립터 조회
- [ ] `seal()`과 `freeze()`의 추가·삭제·수정 결과 비교
- [ ] JSON 직렬화·역직렬화와 중첩 객체 복사 결과 비교

## 수업 전 확인 질문

1. `const`로 선언한 객체의 프로퍼티는 왜 변경할 수 있는가?
2. 메서드와 생성자 안에서 `this`는 각각 무엇을 가리키는가?
3. 생성자 안에 공통 메서드를 직접 만들면 어떤 문제가 생기는가?
4. 생성자의 `prototype`과 인스턴스의 `[[Prototype]]`은 어떻게 연결되는가?
5. `new`는 인스턴스를 반환하기 전 어떤 작업을 하는가?
6. 클래스의 메서드는 각 인스턴스에 복사되는가, 프로토타입을 통해 공유되는가?
7. 자식 클래스의 생성자에서 `super()`가 먼저 필요한 이유는 무엇인가?
8. 데이터 프로퍼티와 접근자 프로퍼티는 값을 어떻게 다루는가?
9. `Object.seal()`과 `Object.freeze()`는 무엇이 다른가?
10. JSON 직렬화 과정에서 보존되지 않는 값은 무엇인가?

## 예습 범위의 한계

- 이 파일은 5장 2강 중심으로 누락된 예습 기록을 보완한 문서다.
- `let`, `const`, `this`는 클래스와 객체 상태를 이해하기 위한 핵심 연결 개념으로 포함했다.
- 오늘은 개념 정리만 진행했으며 별도의 코드 실습은 하지 않았다.
- 위 확인 항목은 추후 복습 후보이며, 객체 잠금 결과·프로토타입 비교·JSON 변환 결과를 실제로 확인한 것으로 기록하지 않는다.
- 4장 1강과 4장 2강의 일반 학습 내용은 오늘 기록의 중심 범위에서 제외했다.
- 4장 3강과 5장 1강 내용도 포함하지 않는다.
