# Preview Notes — JavaScript 실행 환경·기초 문법·프로토타입 기반 클래스

- 날짜: 2026-09-23
- Level / Week: LV.2 / Week 7
- 과정: 프론트엔드 개발
- 범위: 4장 1강, 4장 2강, 5장 2강
- 제외 범위: 4장 3강, 5장 1강
- 작성 상태: 수업 후 누락 보완본이며, 교안에 근거한 수업 전 확인 항목으로 구성

## 학습 목표

- 브라우저와 Node.js가 JavaScript를 실행하는 환경이라는 점을 구분한다.
- Node.js, NVM, NPM, NPX와 Jupyter JavaScript 커널의 역할을 설명한다.
- `var`의 호이스팅·함수 스코프 문제와 `let`, `const`의 차이를 이해한다.
- 원시 타입 값과 객체 타입 값의 대입 결과가 다른 이유를 설명한다.
- 연산자, 조건문, 반복문과 예외 처리로 실행 흐름을 구성한다.
- 생성자 함수, 프로토타입, 클래스 문법의 관계를 이해한다.
- `new`, `extends`, `super()`와 오버라이딩의 실행 흐름을 설명한다.
- 데이터·접근자 프로퍼티와 객체 잠금 메서드를 구분한다.
- JavaScript 객체를 JSON 문자열로 직렬화하고 다시 객체로 복원한다.

## 전체 학습 구조

```text
브라우저와 Node.js 실행 환경 비교
→ Node·NPM·NPX·NVM의 역할 확인
→ Jupyter에서 JavaScript를 실행하는 구성 이해
→ 변수 선언과 호이스팅·스코프 비교
→ 자료형·연산자·제어문·예외 처리 학습
→ 생성자 함수와 prototype 연결
→ class·extends·super로 상속 표현
→ 프로퍼티 속성과 객체 변경 제한
→ JSON 직렬화·역직렬화
```

## 선행 개념

- 프로그램을 실행하는 런타임과 코드를 해석하는 엔진
- 변수 선언, 값 대입과 함수 호출
- 조건문과 반복문의 기본 흐름
- 객체의 키와 값
- Python의 `print()`, 변수, 클래스와 비교할 수 있는 기초 문법

## 1. JavaScript 실행 환경

웹 브라우저에는 JavaScript 엔진이 내장되어 있어 개발자 도구 Console이나 HTML의 `<script>`를 통해 코드를 실행할 수 있다. Node.js는 브라우저 밖의 로컬·서버 환경에서도 JavaScript를 실행할 수 있게 하는 런타임이다.

```javascript
console.log("JavaScript 실행 확인");
```

`console.log()`는 값과 실행 상태를 확인하는 출력 도구다. 브라우저에서는 개발자 도구 Console에, Node.js에서는 터미널에 출력된다.

### 개발 도구의 역할

| 도구 | 역할 |
|---|---|
| Node.js | 브라우저 밖에서 JavaScript를 실행하는 런타임 |
| NVM | 여러 Node.js 버전을 설치하고 전환하는 버전 관리자 |
| NPM | 프로젝트의 패키지와 의존성을 설치·관리하는 도구 |
| NPX | 패키지의 실행 명령을 호출하는 도구 |
| `package.json` | 프로젝트 정보와 의존성 목록을 관리하는 설정 파일 |
| ijavascript | Jupyter에서 JavaScript를 실행할 수 있게 하는 커널 |

교안의 환경 구성 흐름은 Node.js 버전을 맞춘 뒤 프로젝트를 초기화하고, 프로젝트 내부에 ijavascript를 설치하여 Jupyter 커널로 등록하는 순서다.

```text
Node.js 버전 확인
→ 프로젝트 폴더 생성
→ npm init -y
→ ijavascript 개발 의존성 설치
→ Jupyter JavaScript 커널 등록
→ Notebook에서 커널 선택
```

## 2. 변수, 자료형과 실행 흐름

### 변수 선언과 스코프

`var`는 함수 스코프를 따르며 선언 전에 접근하면 `undefined`가 나타날 수 있다. `let`과 `const`는 블록 스코프를 따르고, 선언이 초기화되기 전의 TDZ에서는 접근할 수 없다.

```javascript
if (true) {
  const message = "블록 내부";
  console.log(message);
}

// console.log(message); // ReferenceError
```

기본적으로 재할당이 필요하지 않으면 `const`, 값이 바뀌어야 하면 `let`을 사용한다.

### 원시 타입 값과 객체 타입 값

원시 타입 값은 대입할 때 값이 복사된다. 객체 타입 값은 객체가 있는 위치를 가리키는 참조가 복사되므로 여러 변수가 같은 객체를 공유할 수 있다.

```javascript
let countA = 10;
let countB = countA;
countB = 20;

const productA = { stock: 10 };
const productB = productA;
productB.stock = 20;
```

### 주요 문법 범위

| 구분 | 확인할 내용 |
|---|---|
| 주석 | `//`, `/* ... */` |
| 자료형 | Number, String, Boolean, `null`, `undefined` |
| 타입 확인 | `typeof`의 반환값과 `typeof null`의 예외적 결과 |
| 연산자 | 산술·대입·비교·논리 연산자 |
| 조건문 | `if`, `else if`, `else`, `switch` |
| 반복문 | `for`, `while`, `break`, `continue` |
| 예외 처리 | `try`, `catch`, `finally`, `throw` |

## 3. 프로토타입과 클래스

생성자 함수 안에 공통 메서드를 직접 만들면 인스턴스마다 같은 함수가 중복 생성될 수 있다. 공통 메서드를 생성자의 `prototype`에 두면 여러 인스턴스가 하나의 메서드를 공유할 수 있다.

```text
인스턴스
→ 생성자 또는 자식 클래스의 prototype
→ 부모 클래스의 prototype
→ Object.prototype
→ null
```

객체에 필요한 프로퍼티나 메서드가 없으면 JavaScript 엔진은 이 프로토타입 체인을 따라 상위 객체를 탐색한다. `class`는 프로토타입 기반 생성과 상속을 더 읽기 쉽게 표현하는 문법이다.

### `new`의 내부 흐름

```text
빈 객체 생성
→ 생성자의 prototype과 연결
→ 생성자 내부의 this를 새 객체에 연결
→ 생성자 실행
→ 완성된 인스턴스 반환
```

### 클래스 상속

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
}
```

`extends`는 부모와 자식 클래스의 상속 관계를 만들고, 자식 생성자의 `super()`는 부모 생성자를 먼저 실행한다. 자식이 부모의 메서드를 같은 이름으로 다시 정의하면 오버라이딩이다.

## 4. 프로퍼티 제어와 객체 잠금

데이터 프로퍼티는 값을 직접 저장하고, 접근자 프로퍼티는 `get`과 `set`으로 읽기·쓰기 과정을 제어한다.

| 속성 | 의미 |
|---|---|
| `writable` | 값을 수정할 수 있는가 |
| `enumerable` | 반복·키 목록에 나타나는가 |
| `configurable` | 삭제하거나 속성 설정을 바꿀 수 있는가 |

`Object.getOwnPropertyDescriptor()`로 프로퍼티 설정을 조회하고, `Object.defineProperty()`로 세부 속성을 지정할 수 있다.

| 메서드 | 추가 | 삭제 | 기존 값 수정 |
|---|---:|---:|---:|
| `Object.preventExtensions()` | 불가 | 가능 | 가능 |
| `Object.seal()` | 불가 | 불가 | 가능 |
| `Object.freeze()` | 불가 | 불가 | 불가 |

## 5. JSON 직렬화

JavaScript 객체를 파일에 저장하거나 네트워크로 전송하려면 전달 가능한 문자열 형식으로 바꾸는 과정이 필요하다.

```javascript
const product = { name: "셔츠", price: 39000 };
const jsonText = JSON.stringify(product);
const restoredProduct = JSON.parse(jsonText);
```

- `JSON.stringify()`: 객체를 JSON 문자열로 직렬화
- `JSON.parse()`: JSON 문자열을 JavaScript 객체로 역직렬화
- 함수와 `undefined` 등은 JSON에서 그대로 보존되지 않음
- JSON 변환은 암호화가 아니며 모든 객체를 완전하게 복제하는 방법도 아님

## 핵심 용어

| 용어 | 의미 |
|---|---|
| 런타임 | 작성된 코드가 실제로 실행되는 환경 |
| 호이스팅 | 실행 전에 선언이 먼저 등록되어 있는 것처럼 동작하는 현상 |
| 스코프 | 변수에 접근할 수 있는 유효 범위 |
| 프로토타입 | 여러 객체가 공통 기능을 공유할 수 있게 하는 상위 연결 객체 |
| 인스턴스 | 생성자 또는 클래스를 이용해 만들어진 개별 객체 |
| 오버라이딩 | 상속받은 메서드를 자식 클래스에서 같은 이름으로 재정의하는 것 |
| 직렬화 | 메모리의 객체를 저장·전송 가능한 문자열 형식으로 바꾸는 것 |

## 예상 난점

- 브라우저, JavaScript 엔진과 Node.js의 역할 구분
- NPM과 NPX, 전역 설치와 프로젝트 로컬 설치의 차이
- 호이스팅을 코드가 실제로 위로 이동하는 현상으로 오해하는 것
- `var`의 함수 스코프와 `let`, `const`의 블록 스코프 구분
- 원시 값 복사와 객체 참조 공유의 차이
- 클래스 문법과 내부 프로토타입 연결의 관계
- 인스턴스의 `[[Prototype]]`과 생성자 함수의 `prototype` 구분
- `seal()`과 `freeze()`가 중첩 객체까지 자동으로 잠그지는 않는다는 점
- JSON 직렬화와 암호화·범용 깊은 복사를 혼동하는 것

## 예정 실습

- [ ] 브라우저 Console에서 `console.log()` 실행
- [ ] Node.js와 NPM 버전 확인
- [ ] Jupyter에서 JavaScript 커널 선택 및 코드 실행
- [ ] `var`, `let`, `const`의 선언 전 접근과 블록 밖 접근 비교
- [ ] 원시 타입 값과 객체 타입 값의 대입 결과 비교
- [ ] 조건문·반복문·예외 처리 코드 실행
- [ ] 두 인스턴스가 프로토타입 메서드를 공유하는지 비교
- [ ] `new`, `extends`, `super()`를 사용한 클래스 생성
- [ ] `seal()`과 `freeze()`의 추가·삭제·수정 결과 비교
- [ ] `JSON.stringify()`와 `JSON.parse()` 결과 확인

## 수업 전 확인 질문

1. 브라우저와 Node.js는 JavaScript를 실행한다는 점에서 같지만 무엇이 다른가?
2. NPM과 NPX는 각각 어떤 일을 하는가?
3. `var`와 `let`, `const`의 호이스팅 결과가 다른 이유는 무엇인가?
4. 원시 타입 값을 복사한 경우와 객체를 대입한 경우 원본 변경 여부가 왜 다른가?
5. 객체에 없는 메서드를 호출했을 때 프로토타입 체인은 어떤 순서로 탐색되는가?
6. `new`는 객체를 만드는 동안 어떤 일을 수행하는가?
7. `Object.seal()`과 `Object.freeze()`는 무엇을 허용하고 무엇을 막는가?
8. JavaScript 객체를 서버에 보낼 때 JSON 문자열로 바꾸는 이유는 무엇인가?

## 예습 범위의 한계

- 이 파일은 교안 내용을 바탕으로 누락된 예습 기록을 보완한 문서다.
- 작성 시점에 환경 설치, 브라우저·Node.js·Jupyter 실행과 코드 실습은 확인하지 않았다.
- 4장 3강의 객체·배열·내장 객체와 5장 1강의 함수·콜백·클로저 내용은 포함하지 않는다.
