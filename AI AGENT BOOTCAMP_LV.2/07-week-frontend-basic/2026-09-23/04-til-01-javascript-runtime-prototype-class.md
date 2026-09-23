# TIL — 프로토타입 기반 상속과 클래스 모델링

- 날짜: 2026-09-23
- Level / Week: LV.2 / Week 7
- 중심 범위: 5장 2강 — 프로토타입 기반 상속 및 클래스 모델링
- 핵심 연결 개념: `let`, `const`, `this`
- 제외 범위: 4장 1강, 4장 2강의 일반 문법, 4장 3강, 5장 1강
- 학습 형태: 실습 없이 개념 정리만 진행

## 1. `let`, `const`와 객체

`let`은 값의 재할당이 필요할 때 사용하고, `const`는 변수가 다른 값을 다시 가리키지 않게 할 때 사용한다.

```javascript
let price = 39000;
price = 35000;

const product = {
  name: "셔츠",
  price: 39000
};

product.price = 35000;
```

`const`로 객체를 선언해도 객체 내부의 프로퍼티는 변경할 수 있다. `const`는 변수의 재할당을 막는 것이지 객체 자체를 동결하는 기능이 아니다. 객체 내부 변경까지 막으려면 `Object.freeze()` 같은 별도 제어가 필요하다.

## 2. `this`는 현재 기준 객체를 가리키는 키워드

`this`는 일반 변수라기보다 함수가 호출된 방식에 따라 기준 객체를 가리키는 키워드다.

```javascript
const product = {
  name: "셔츠",
  showName() {
    return this.name;
  }
};

product.showName();
```

`product.showName()`에서 `this`는 `product`를 가리킨다. 생성자를 `new`로 호출하면 생성자 안의 `this`는 새로 만들어지는 인스턴스를 가리킨다.

```javascript
function Product(name, price) {
  this.name = name;
  this.price = price;
}

const shirt = new Product("셔츠", 39000);
```

## 3. 프로토타입은 공통 기능을 공유하는 구조

생성자 내부에 메서드를 직접 정의하면 인스턴스를 만들 때마다 같은 함수가 중복 생성될 수 있다. 공통 메서드를 생성자의 `prototype`에 두면 여러 인스턴스가 하나의 메서드를 공유한다.

```javascript
Product.prototype.showInfo = function () {
  return `${this.name}: ${this.price}원`;
};

const shirt = new Product("셔츠", 39000);
const pants = new Product("바지", 59000);

shirt.showInfo === pants.showInfo; // true
```

객체 자체에 요청한 프로퍼티나 메서드가 없으면 JavaScript 엔진은 상위 프로토타입을 따라 계속 찾는다.

```text
인스턴스
→ 생성자의 prototype
→ Object.prototype
→ null
```

이 검색 경로가 프로토타입 체인이다.

## 4. `new`가 인스턴스를 만드는 과정

`new`는 다음 작업을 묶어서 수행한다.

```text
빈 객체 생성
→ 생성자의 prototype과 연결
→ 생성자 안의 this를 새 객체에 연결
→ 생성자를 실행해 프로퍼티 초기화
→ 완성된 인스턴스 반환
```

따라서 인스턴스는 생성자에서 만든 고유 데이터와 프로토타입의 공통 기능을 함께 사용할 수 있다.

## 5. 클래스는 프로토타입 구조를 읽기 쉽게 표현한다

JavaScript의 `class`는 프로토타입 기반 객체 생성과 상속을 더 읽기 쉽게 만든 문법이다.

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

- `constructor()`: 인스턴스의 고유 프로퍼티 초기화
- 클래스의 일반 메서드: 클래스의 `prototype`을 통해 공유
- `new Product()`: 인스턴스 생성과 프로토타입 연결
- 클래스는 `new` 없이 호출할 수 없음

## 6. 상속, `super()`와 오버라이딩

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

`extends`는 부모와 자식 클래스의 프로토타입 체인을 연결한다. 자식 생성자에서는 `this`를 사용하기 전에 `super()`로 부모 생성자를 먼저 실행해야 한다.

부모에게 물려받은 메서드를 자식이 같은 이름으로 다시 정의하는 것이 오버라이딩이다. `super.showInfo()`처럼 부모 메서드를 호출하면 기존 기능을 재사용하면서 자식의 기능을 덧붙일 수 있다.

## 7. 프로퍼티와 캡슐화

프로퍼티는 객체 안의 키와 값의 쌍이다. 데이터 프로퍼티는 값을 직접 저장하고, 접근자 프로퍼티는 `get`과 `set`으로 읽기와 쓰기를 제어한다.

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

캡슐화는 데이터와 변경 규칙을 객체 안에 묶어 잘못된 상태가 되는 것을 막는 방식이다.

데이터 프로퍼티는 다음과 같은 내부 속성을 가진다.

| 속성 | 역할 |
|---|---|
| `writable` | 값 수정 허용 여부 |
| `enumerable` | 반복과 키 목록에 노출할지 여부 |
| `configurable` | 삭제와 속성 재설정 허용 여부 |

- `Object.getOwnPropertyDescriptor()`: 프로퍼티 속성 조회
- `Object.defineProperty()`: 프로퍼티와 세부 속성 정의

## 8. 객체 밀봉과 동결

| 메서드 | 프로퍼티 추가 | 프로퍼티 삭제 | 기존 값 수정 |
|---|---:|---:|---:|
| `Object.preventExtensions()` | 불가 | 가능 | 가능 |
| `Object.seal()` | 불가 | 불가 | 가능 |
| `Object.freeze()` | 불가 | 불가 | 불가 |

`Object.seal()`은 객체의 구조를 밀봉하고, `Object.freeze()`는 기존 값의 수정까지 막는다. 다만 중첩 객체까지 자동으로 잠그는 것은 아니다.

## 9. JSON 직렬화

직렬화는 메모리의 객체 데이터를 파일 저장이나 네트워크 전송이 가능한 문자열로 바꾸는 과정이다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};

const jsonText = JSON.stringify(product);
const restoredProduct = JSON.parse(jsonText);
```

- `JSON.stringify()`: 객체 데이터를 JSON 문자열로 변환
- `JSON.parse()`: JSON 문자열을 JavaScript 객체로 복원

JSON 왕복을 이용하면 단순한 중첩 객체에서 독립된 복사본을 만들 수 있다. 하지만 함수, `undefined`, Symbol, 특수 객체 타입, 프로토타입과 순환 참조는 온전히 보존되지 않는다. 따라서 JSON 변환은 모든 객체를 위한 범용 깊은 복사나 암호화 방법이 아니다.

## 오늘의 핵심 정리

1. `let`은 재할당이 필요할 때, `const`는 같은 대상을 계속 가리킬 때 사용한다.
2. `const` 객체의 프로퍼티는 바꿀 수 있으며 객체 동결과는 다르다.
3. 메서드에서 `this`는 보통 호출 객체를, 생성자에서는 새 인스턴스를 가리킨다.
4. 프로토타입은 여러 인스턴스가 공통 메서드를 공유하게 한다.
5. 프로토타입 체인은 객체에 없는 기능을 상위 객체에서 찾는 경로다.
6. 클래스 문법은 프로토타입 기반 생성과 상속을 읽기 쉽게 표현한다.
7. `extends`, `super()`와 오버라이딩으로 부모 기능을 재사용하고 확장한다.
8. 프로퍼티 디스크립터와 객체 잠금은 객체의 변경 규칙을 제어한다.
9. JSON 직렬화는 객체 데이터를 저장·전송 가능한 문자열로 바꾼다.

이번 기록은 5장 2강 중심의 개념 질의응답을 근거로 작성했다. `let`, `const`, `this`는 클래스와 객체 모델링을 이해하는 핵심 연결 개념으로 포함했다. 오늘은 실습 없이 개념 정리만 진행했으며, 코드 실행·오류 해결·독립적인 코드 작성과 종료 복습은 하지 않았다. 따라서 실행 결과나 이해 완료로 기록하지 않는다.
