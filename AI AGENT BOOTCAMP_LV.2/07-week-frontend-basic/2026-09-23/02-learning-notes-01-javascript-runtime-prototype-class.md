# Learning Notes — JavaScript 실행 원리와 프로토타입 기반 클래스

- 날짜: 2026-09-23
- Level / Week: LV.2 / Week 7
- 과정: 프론트엔드 개발
- 학습 범위: 4장 1강, 4장 2강, 5장 2강
- 제외 범위: 4장 3강, 5장 1강
- 정리 근거: 당일 수업 중 개념 질의응답과 지정 교안
- 실행 여부: 브라우저·Node.js·Jupyter 코드 실행 없음

## 오늘 실제로 확인한 내용

수업 중에는 JavaScript가 실행되는 환경, `console.log()`, 변수와 값의 종류, 호이스팅과 스코프, 프로토타입과 클래스 상속, 프로퍼티 제어, 객체 잠금과 JSON 직렬화를 질문하고 설명을 들었다.

| 영역 | 실제 확인한 질문·개념 | 근거 상태 |
|---|---|---|
| 실행 환경 | 브라우저에서 JavaScript가 구동되는 방식, Python과의 차이 | 질의응답 |
| 출력 | `console.log()`의 목적과 Python `print()`와의 비교 | 질의응답 |
| 값과 변수 | 원시 타입 값, 객체 타입 값, 호이스팅, 스코프 | 질의응답 |
| 객체 모델 | 프로토타입, 클래스 상속, `new`, 오버라이딩 | 질의응답 |
| 프로퍼티 | 일반 프로퍼티, 데이터·접근자 프로퍼티 | 질의응답 |
| 객체 제어 | 캡슐화, `Object.seal()`, `Object.freeze()` | 질의응답 |
| 데이터 교환 | JSON과 직렬화의 목적 | 질의응답 |

사용자가 직접 코드를 작성하거나 실행한 기록과 종료 복습 답안은 없으므로, 독립 적용 능력이나 이해 완료 여부는 평가하지 않는다.

## 1. JavaScript는 어디에서 실행되는가

JavaScript 코드는 실행 환경에 포함된 JavaScript 엔진이 해석하고 실행한다.

- 브라우저: HTML 요소, 사용자 입력과 브라우저 기능을 다루는 JavaScript 실행 환경
- Node.js: 브라우저 밖의 로컬 컴퓨터나 서버에서 JavaScript를 실행하는 런타임
- Jupyter + ijavascript: 코드와 실행 결과를 Notebook 셀 단위로 기록하는 학습 환경

브라우저에서는 `<script>`에 작성한 코드나 개발자 도구 Console의 코드를 실행할 수 있다. Node.js에서는 `.js` 파일이나 대화형 환경을 터미널에서 실행한다.

### JavaScript와 Python 비교

두 언어 모두 변수 선언 시 타입을 미리 적지 않는 동적 타입 언어다. 다만 주로 사용되는 실행 환경과 문법 표현에 차이가 있다.

| 구분 | JavaScript | Python |
|---|---|---|
| 대표 실행 환경 | 브라우저, Node.js | Python 인터프리터, 서버·데이터 환경 |
| 코드 블록 | 중괄호 `{}` | 들여쓰기 |
| 출력 | `console.log()` | `print()` |
| 웹페이지 제어 | 브라우저에서 DOM과 이벤트를 직접 다룸 | 일반적으로 웹 백엔드나 데이터 처리에 사용 |

### `console.log()`를 쓰는 이유

`console.log()`는 변수 값, 연산 결과와 코드가 특정 지점까지 실행됐는지를 확인하는 가장 기본적인 디버깅 도구다.

```javascript
const price = 39000;
console.log("가격:", price);
```

Python의 `print()`와 출력 목적은 비슷하다. 브라우저에서 `console.log()`의 결과는 웹페이지 본문이 아니라 개발자 도구 Console에 나타난다.

## 2. 프로퍼티와 값의 종류

프로퍼티는 객체 안에서 데이터를 구분하는 이름과 그 값의 한 쌍이다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};
```

위 객체에서 `name`과 `price`는 프로퍼티 키이고, `"셔츠"`와 `39000`은 각 프로퍼티의 값이다. 값이 함수이면 보통 메서드라고 부른다.

### 원시 타입 값

Number, String, Boolean, `null`, `undefined`, BigInt, Symbol 같은 값은 원시 타입이다. 다른 변수에 대입하면 값 자체가 복사된다.

```javascript
let original = 10;
let copied = original;
copied = 20;

console.log(original); // 10
```

### 객체 타입 값

객체, 배열과 함수는 객체 타입으로 다뤄진다. 객체를 다른 변수에 대입하면 두 변수가 같은 객체를 가리킬 수 있다.

```javascript
const original = { stock: 10 };
const copied = original;
copied.stock = 20;

console.log(original.stock); // 20
```

`const`는 변수에 다른 값을 다시 대입하는 것을 막지만, 그 변수가 가리키는 객체 내부의 프로퍼티 변경까지 자동으로 막지는 않는다.

## 3. 호이스팅과 스코프

호이스팅은 JavaScript 엔진이 코드를 실행하기 전에 선언을 먼저 확인하고 등록하는 과정 때문에 선언이 위로 올라간 것처럼 보이는 동작이다. 코드가 실제로 이동하는 것은 아니다.

- `var`: 선언 단계에서 `undefined`로 초기화되어 선언문 전에 읽으면 `undefined`가 나타날 수 있다.
- `let`, `const`: 선언은 인식되지만 초기화 전에 접근하면 TDZ 때문에 `ReferenceError`가 발생한다.

```javascript
console.log(oldValue); // undefined
var oldValue = 10;

// console.log(newValue); // ReferenceError
let newValue = 10;
```

스코프는 변수에 접근할 수 있는 유효 범위다.

- 전역 스코프: 프로그램의 넓은 범위에서 접근 가능
- 함수 스코프: 함수 내부에서 접근 가능
- 블록 스코프: `{}` 블록 내부에서 접근 가능

`var`는 함수 스코프를 따르고, `let`과 `const`는 블록 스코프를 따른다.

```javascript
if (true) {
  const message = "블록 내부";
  console.log(message);
}

// console.log(message); // ReferenceError
```

호이스팅은 JavaScript만의 독립적인 기능이라기보다, JavaScript 엔진의 선언 처리 방식에서 드러나는 대표적인 언어 특성이다. 특히 `var`, 함수 선언문과 클래스가 서로 다르게 동작하므로 실행 순서를 읽을 때 중요하다.

## 4. 프로토타입과 클래스 상속

프로토타입은 여러 인스턴스가 공통 메서드를 하나만 만들어 공유할 수 있게 하는 연결 객체다. 객체 자체에 요청한 프로퍼티가 없으면 엔진은 내부 프로토타입 링크를 따라 상위 객체를 검색한다.

```text
인스턴스
→ 자식 클래스의 prototype
→ 부모 클래스의 prototype
→ Object.prototype
→ null
```

생성자 안에 메서드를 직접 정의하면 인스턴스를 만들 때마다 함수가 새로 만들어질 수 있다. 공통 메서드를 `prototype`에 두면 여러 인스턴스가 같은 함수를 공유한다.

JavaScript의 `class`와 `extends`는 이 프로토타입 기반 객체 생성과 상속을 더 읽기 쉽게 표현하는 문법이다. 클래스 기반 언어처럼 보이지만 내부 연결의 핵심은 프로토타입이다.

### `new` 연산자

`new`는 생성자나 클래스로 인스턴스를 만들 때 다음 작업을 수행한다.

```text
새 빈 객체 생성
→ 생성자의 prototype과 연결
→ this를 새 객체에 연결
→ 생성자 실행
→ 생성된 객체 반환
```

여기서 `this`는 고정된 일반 변수가 아니라, 현재 실행 맥락에서 메서드를 호출한 객체나 `new`로 만들어지고 있는 객체를 가리키는 키워드다. 이번 학습 기록에서는 클래스 생성과 `new`의 흐름 안에서만 확인했다.

### 상속과 오버라이딩

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

- `extends`: 부모와 자식 클래스의 상속 관계 구성
- `super()`: 자식 생성자에서 부모 생성자 실행
- 오버라이딩: 부모에게 상속받은 메서드를 자식에서 같은 이름으로 재정의
- `super.showInfo()`: 오버라이딩한 메서드 안에서 부모의 기존 기능 호출

메서드 이름을 모두 외우는 것보다 객체·배열·문자열 등 어떤 대상의 기능인지, 입력과 반환값이 무엇인지, 원본을 변경하는지를 확인하는 습관이 중요하다. 필요한 메서드는 문서와 자동 완성을 찾아 사용하고 반복해서 쓰는 것부터 익힌다.

## 5. 데이터 프로퍼티와 접근자 프로퍼티

데이터 프로퍼티는 실제 값을 직접 저장한다. 접근자 프로퍼티는 자체 값을 저장하는 대신 `get`과 `set` 함수를 통해 읽기와 쓰기를 제어한다.

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

캡슐화는 데이터와 그 데이터를 변경하는 규칙을 한곳에 묶어 객체가 잘못된 상태가 되지 않도록 관리하는 방식이다. 위 접근자 프로퍼티는 음수 가격이 저장되는 것을 막는 규칙을 객체 안에 둔다.

프로퍼티는 값 외에도 다음과 같은 내부 속성을 가진다.

| 속성 | 역할 |
|---|---|
| `writable` | 값 수정 허용 여부 |
| `enumerable` | `Object.keys()`나 반복에서 노출될지 여부 |
| `configurable` | 삭제와 속성 재설정 허용 여부 |

`Object.getOwnPropertyDescriptor()`는 프로퍼티 속성을 확인하고, `Object.defineProperty()`는 프로퍼티의 값과 속성을 세부적으로 설정한다.

## 6. 객체 밀봉과 동결

| 메서드 | 프로퍼티 추가 | 프로퍼티 삭제 | 기존 값 수정 |
|---|---:|---:|---:|
| `Object.preventExtensions()` | 불가 | 가능 | 가능 |
| `Object.seal()` | 불가 | 불가 | 가능 |
| `Object.freeze()` | 불가 | 불가 | 불가 |

`Object.seal()`은 객체의 구조를 밀봉하고, `Object.freeze()`는 기존 값의 수정까지 막는다. 다만 두 메서드는 기본적으로 바로 아래 프로퍼티에만 적용된다. 프로퍼티 값이 또 다른 객체라면 그 중첩 객체는 별도로 잠그지 않는 한 변경될 수 있다.

## 7. JSON과 데이터 직렬화

JSON은 서로 다른 프로그램이 데이터를 주고받을 때 사용할 수 있는 문자열 기반 데이터 형식이다. JavaScript 객체는 실행 중인 메모리에 존재하므로, 파일 저장이나 네트워크 전송을 위해 문자열로 바꾸는 직렬화 과정이 필요하다.

```javascript
const product = {
  name: "셔츠",
  price: 39000
};

const jsonText = JSON.stringify(product);
const restoredProduct = JSON.parse(jsonText);
```

- `JSON.stringify()`: JavaScript 객체를 JSON 문자열로 변환
- `JSON.parse()`: JSON 문자열을 JavaScript 객체로 변환

JavaScript 자체를 JSON으로 바꾸는 것이 아니라, JavaScript 프로그램이 메모리에서 다루는 객체 데이터를 JSON 문자열로 변환하는 것이다.

JSON은 함수, `undefined`, Symbol, 순환 참조와 객체의 프로토타입 정보를 모두 보존하지 않는다. 따라서 모든 객체를 완전하게 복제하는 범용 방법으로 사용할 수 없고, 직렬화 자체가 암호화나 보안 처리를 의미하지도 않는다.

## 8. 이번 기록에서 제외한 내용

사용자가 지정한 범위에 따라 다음 내용은 이 Learning Notes에 포함하지 않았다.

- 4장 3강: 객체 리터럴·배열·내장 객체 일반 학습
- 5장 1강: 함수 정의·콜백·화살표 함수·호출 스택·클로저·즉시 실행 함수·명시적 바인딩

당일 대화에 관련 질문이 있었더라도 지정된 산출물 범위에는 반영하지 않았다.

## 핵심 정리

1. JavaScript는 브라우저의 엔진이나 Node.js 런타임에서 실행된다.
2. `console.log()`는 Python의 `print()`처럼 값과 실행 상태를 확인하지만 브라우저에서는 Console에 출력된다.
3. 원시 타입 값은 값이 복사되고, 객체 타입 값은 같은 객체를 가리키는 참조를 공유할 수 있다.
4. 호이스팅은 실행 전 선언 처리 과정에서 나타나며, `var`와 `let`, `const`의 초기화 방식이 다르다.
5. 클래스 문법은 프로토타입 기반 객체 생성과 상속을 읽기 쉽게 표현한다.
6. 데이터·접근자 프로퍼티와 객체 잠금은 객체의 상태 변경 규칙을 제어한다.
7. JSON 직렬화는 객체 데이터를 저장·전송 가능한 문자열로 바꾸는 과정이다.

## 미실행 및 다음 확인 항목

- Node.js·NPM·NVM과 Jupyter JavaScript 커널 설치 상태 확인
- 브라우저 Console과 Node.js에서 동일한 `console.log()` 코드 실행 비교
- `var`, `let`, `const`의 선언 전 접근 결과 실행
- 원시 값과 객체 참조 대입 코드 실행
- 인스턴스 두 개가 프로토타입 메서드를 공유하는지 확인
- `seal()`과 `freeze()`의 추가·삭제·수정 결과 실행
- JSON 직렬화에서 함수와 `undefined`가 제외되는 결과 확인

위 항목은 아직 실행하지 않았으므로 성공 결과로 기록하지 않는다.
