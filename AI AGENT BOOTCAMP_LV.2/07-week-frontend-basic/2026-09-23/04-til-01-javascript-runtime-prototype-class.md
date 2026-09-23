# TIL — JavaScript 실행 환경과 프로토타입 기반 클래스

- 날짜: 2026-09-23
- Level / Week: LV.2 / Week 7
- 학습 범위: 프론트엔드 개발 4장 1강, 4장 2강, 5장 2강
- 제외 범위: 4장 3강, 5장 1강

## 1. JavaScript가 실행되는 환경

JavaScript는 브라우저의 JavaScript 엔진에서 실행된다. 브라우저에서는 HTML 요소와 사용자 이벤트를 다룰 수 있고, Node.js를 사용하면 브라우저 밖의 로컬·서버 환경에서도 JavaScript를 실행할 수 있다.

`console.log()`는 코드의 값과 실행 상태를 확인하는 메서드다. Python의 `print()`와 비슷하지만, 브라우저에서는 웹페이지 본문이 아니라 개발자 도구의 Console에 출력된다. Node.js에서는 터미널에 출력된다.

```javascript
const price = 39000;

console.log("가격:", price);
```

## 2. 값과 변수의 유효 범위

JavaScript와 Python은 모두 변수 선언 시 타입을 미리 적지 않는 동적 타입 언어다. JavaScript는 `const`와 `let`으로 변수의 재할당 여부를 구분하고, 중괄호로 코드 블록을 표현한다.

원시 타입 값은 다른 변수에 대입할 때 값 자체가 복사된다.

```javascript
let original = 10;
let copied = original;

copied = 20;

console.log(original); // 10
```

객체 타입 값은 대입된 두 변수가 같은 객체를 가리킬 수 있다.

```javascript
const original = { stock: 10 };
const copied = original;

copied.stock = 20;

console.log(original.stock); // 20
```

호이스팅은 JavaScript 엔진이 코드를 실행하기 전에 선언을 먼저 확인하고 등록하는 동작이다. 코드가 실제로 위로 이동하는 것은 아니다.

- `var`: 선언이 등록되면서 `undefined`로 초기화된다.
- `let`, `const`: 선언은 등록되지만 초기화 전에는 TDZ에 있어 접근할 수 없다.

스코프는 변수를 사용할 수 있는 범위다. `var`는 함수 스코프를 따르고, `let`과 `const`는 중괄호를 기준으로 하는 블록 스코프를 따른다.

```javascript
if (true) {
  const message = "블록 내부";
  console.log(message);
}

// console.log(message); // ReferenceError
```

## 3. 프로토타입과 클래스 상속

프로토타입은 여러 객체가 공통 메서드를 하나만 만들어 공유할 수 있도록 연결하는 부모 객체다. 객체에서 프로퍼티나 메서드를 찾지 못하면 프로토타입 체인을 따라 상위 객체에서 계속 찾는다.

```text
인스턴스
→ 자식 클래스의 prototype
→ 부모 클래스의 prototype
→ Object.prototype
→ null
```

JavaScript의 `class`와 `extends`는 이 프로토타입 기반 상속을 읽기 쉽게 표현하는 문법이다. 상속은 부모의 메서드를 자식에 매번 복사하는 것이 아니라, 자식 인스턴스가 부모 프로토타입의 기능을 찾아 사용할 수 있게 연결한다.

```javascript
class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  showInfo() {
    console.log(`${this.name}: ${this.price}원`);
  }
}

class FashionProduct extends Product {
  constructor(name, price, size) {
    super(name, price);
    this.size = size;
  }
}
```

`new`는 새로운 객체를 만들고, 생성자의 프로토타입과 연결한 뒤 생성자를 실행해 객체를 초기화한다.

```text
빈 객체 생성
→ 생성자 prototype과 연결
→ 생성자 실행 및 this 연결
→ 완성된 객체 반환
```

자식 클래스가 부모에게 물려받은 메서드를 같은 이름으로 다시 정의하는 것을 오버라이딩이라고 한다. 부모 메서드가 필요하면 `super.메서드()`로 호출할 수 있다.

## 4. 캡슐화와 프로퍼티 제어

캡슐화는 데이터와 변경 규칙을 객체 안에 묶고, 정해진 메서드나 접근자를 통해서만 상태를 다루게 하는 방식이다. 값이 잘못된 상태가 되는 것을 막고 변경 규칙을 한곳에서 관리할 수 있다.

데이터 프로퍼티는 값을 직접 저장한다. 접근자 프로퍼티는 `get`과 `set`을 사용해 값을 읽고 쓰는 과정을 제어한다.

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

객체 변경 제한은 강도에 따라 구분한다.

| 메서드 | 프로퍼티 추가 | 프로퍼티 삭제 | 기존 값 수정 |
|---|---:|---:|---:|
| `Object.preventExtensions()` | 불가 | 가능 | 가능 |
| `Object.seal()` | 불가 | 불가 | 가능 |
| `Object.freeze()` | 불가 | 불가 | 불가 |

이 제한들은 기본적으로 바로 아래 프로퍼티에만 적용된다. 중첩된 객체까지 자동으로 동결되는 것은 아니다.

## 5. JSON 직렬화

JavaScript 객체는 실행 중인 프로그램의 메모리에 존재한다. 서버로 전송하거나 문자열 기반 저장소에 보관하려면 전달 가능한 문자열 형식으로 변환해야 한다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};

const jsonText = JSON.stringify(product);
const restoredProduct = JSON.parse(jsonText);
```

- `JSON.stringify()`: JavaScript 객체를 JSON 문자열로 직렬화한다.
- `JSON.parse()`: JSON 문자열을 JavaScript 객체로 역직렬화한다.

JSON 변환은 함수, `undefined`, 특수 객체와 순환 참조를 모두 보존하는 범용 복사 방식이 아니다. 또한 직렬화는 암호화가 아니므로 민감정보 보호 수단으로 사용할 수 없다.

## 오늘의 정리

JavaScript는 브라우저와 Node.js에서 실행할 수 있으며, 선언 방식에 따라 호이스팅과 스코프 동작이 달라진다. 클래스 문법은 내부적으로 프로토타입 연결을 사용하고, `new`는 인스턴스 생성과 프로토타입 연결을 함께 수행한다. 캡슐화와 프로퍼티 제어는 객체를 유효한 상태로 유지하고, JSON 직렬화는 객체를 저장·전송 가능한 문자열로 바꾸기 위해 사용한다.

이번 기록은 개념 질의응답을 근거로 작성했다. 브라우저·Node.js 코드 실행, 독립적인 코드 작성과 종료 복습은 진행하지 않았으므로 실행 결과나 이해도 완료로 기록하지 않는다.
