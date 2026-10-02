# Preview Notes — TypeScript 1장~4장 2강

- 날짜: 2026-10-02
- Level / Week: LV.2 / Week 8
- 과정: 프론트엔드 심화 (TypeScript)
- 범위: 과정 순서 1~8강 — 1장 1강부터 4장 2강까지
- 상태: 비공개 교안 8개, 총 75쪽 전체를 확인한 예습 정리
- 저장 분류: `08-week-frontend-basic/2026-10-02`

## 오늘의 학습 목표

- JavaScript의 동적 타입이 편리한 이유와 대규모 협업에서 생길 수 있는 문제를 설명한다.
- 런타임 오류와 TypeScript가 코드 실행 전에 발견하는 타입 오류를 구분한다.
- TypeScript가 JavaScript 문법과 실행 방식을 바탕으로 타입 검사 계층을 더한 언어임을 이해한다.
- `.ts` 코드가 타입 검사를 거쳐 실행 가능한 JavaScript로 변환되는 흐름을 설명한다.
- JavaScript 코드와 TypeScript 코드에서 함수 매개변수의 차이를 비교한다.
- TypeScript 도입의 장점과 학습·빌드 비용을 함께 구분한다.
- `nvm`, Node.js, `tslab`, Jupyter 커널이 맡는 역할과 설치 순서를 파악한다.
- VS Code의 `.ipynb` 파일에서 TypeScript 커널을 선택하고 셀 단위로 실행하는 흐름을 이해한다.
- `string`, `number`, `boolean`, `null`, `undefined`의 역할을 구분한다.
- `Type[]`와 `Array<Type>` 두 배열 표기법을 읽는다.
- 배열과 튜플의 길이·순서·타입 제약 차이를 설명한다.
- 함수의 매개변수·반환 타입과 콜백 타입을 읽고 선택적·나머지 매개변수를 구분한다.
- 타입 별칭과 인터페이스, 읽기 전용·선택적 속성, 인덱스 시그니처를 구분한다.

## 전체 학습 구조

```text
JavaScript의 동적 타입
→ 실행 전에는 값의 타입 계약이 드러나지 않을 수 있음
→ 잘못된 값이 전달되면 런타임에 문제 발생 가능
→ 대규모 코드와 협업에서 변경 영향 추적이 어려워짐
→ TypeScript가 정적 타입 검사 계층을 추가
→ tsc가 타입을 검사하고 TypeScript 전용 문법을 제거·변환
→ JavaScript 결과물이 런타임에서 실행
→ nvm으로 Node.js 실행 버전 분리
→ tslab을 Jupyter의 TypeScript 커널로 등록
→ VS Code .ipynb에서 셀 단위 코드 확인
→ 원시 타입으로 단일 값의 규격 선언
→ 배열로 같은 타입의 여러 값 관리
→ 튜플로 길이·순서·인덱스별 타입 고정
→ 함수의 입력·출력·콜백 계약 작성
→ 객체 타입과 재사용 가능한 구조 정의
→ 타입 별칭·인터페이스로 객체 설계도 작성
→ 인덱스 시그니처로 동적인 키의 값 타입 제한
→ `extends`로 기존 인터페이스를 확장
```

핵심은 TypeScript가 별도의 브라우저 런타임을 만드는 것이 아니라, JavaScript가 실행되기 전에 타입 관련 문제를 더 일찍 발견하도록 돕는다는 점이다.

## 선행 개념

- JavaScript의 변수 선언과 값 할당
- 원시 타입 중 `string`, `number`, `boolean`
- 함수 정의, 매개변수, 인수와 함수 호출
- `.js` 파일과 브라우저·Node.js의 JavaScript 실행
- 개발 중 발견하는 오류와 실제 실행 중 발생하는 오류의 차이
- 객체의 속성과 값
- 배열 순회와 콜백 함수의 기초

## 오늘 진행 범위 지도

| 장 | 강의 | 중심 개념 |
|---|---:|---|
| 1장 | 1~2강 | TypeScript 도입 배경, 컴파일 흐름, 실습 환경 |
| 2장 | 3~4강 | 기본 타입, 배열·튜플, `any`·`unknown`·`never`, 추론·단언 |
| 3장 | 5~6강 | 함수 매개변수·반환 타입, 함수 표현식과 콜백 |
| 4장 | 7~8강 | 타입 별칭, 인터페이스, 객체 확장과 인덱스 시그니처 |

## 1강. JavaScript의 한계와 TypeScript의 등장

### 1. JavaScript의 동적 타입

JavaScript에서는 변수 선언 시 타입을 고정해서 적지 않아도 된다. 같은 변수에 서로 다른 종류의 값을 넣을 수도 있다.

```javascript
let value = 10;
value = "ten";
```

이 유연성은 빠르게 코드를 작성할 때 편리하다. 반면 함수가 어떤 타입의 값을 받아야 하는지 코드만 보고 명확하지 않으면, 호출하는 쪽과 구현하는 쪽의 기대가 달라질 수 있다.

```javascript
function calculateTotal(price, quantity) {
  return price * quantity;
}

calculateTotal("39000원", 2);
```

위 코드는 예습용 예시이며 실제 실행 결과를 확인한 것은 아니다. 핵심은 함수의 입력 규격이 코드에 명시되지 않았다는 점이다.

### 2. 대규모 개발에서 드러나는 문제

교안은 JavaScript의 한계를 두 가지 흐름으로 설명한다.

#### 에러 검출의 지연

- 값의 종류가 기대와 달라도 실행 전에는 문제가 드러나지 않을 수 있다.
- 해당 코드 경로가 실제로 실행된 뒤에야 오류나 잘못된 결과를 확인할 수 있다.
- 운영 환경에서 처음 문제가 나타나면 원인을 찾고 수정하는 비용이 커질 수 있다.

#### 협업의 어려움

- 함수가 어떤 값을 받아야 하고 무엇을 반환하는지 명시적 규격이 부족할 수 있다.
- 여러 사람이 함수와 데이터를 함께 수정하면 호출부와 구현부의 기대가 어긋날 수 있다.
- 코드 규모가 커질수록 한 변경이 영향을 주는 위치를 추적하기 어려워진다.

코치 보충: 동적 타입 자체가 곧 오류라는 뜻은 아니다. JavaScript에서도 테스트, 문서화, 런타임 검증과 정적 분석 도구로 안정성을 높일 수 있다. TypeScript는 이 가운데 타입 관계를 개발 시점에 검사하는 도구를 언어 차원에서 제공한다.

### 3. TypeScript가 더하는 것

TypeScript는 JavaScript의 문법과 런타임 동작을 바탕으로 타입 시스템을 추가한다. 기존 JavaScript 코드에서 시작해 필요한 부분에 타입 정보를 점진적으로 더할 수 있다.

```typescript
function sayHello(firstName: string) {
  console.log("Hello " + firstName);
}

const firstName: string = "Hana";
sayHello(firstName);
```

| 구분 | JavaScript | TypeScript |
|---|---|---|
| 파일 확장자 | 주로 `.js` | 주로 `.ts` |
| 매개변수 타입 표기 | 직접 표기하지 않음 | `firstName: string`처럼 표기 가능 |
| 타입 검사 시점 | 주로 실행 중 값과 동작으로 확인 | 실행 전 타입 검사 가능 |
| 브라우저 실행 | JavaScript를 직접 실행 | JavaScript로 변환된 결과를 실행 |
| 런타임 | JavaScript 런타임 | 최종적으로 JavaScript 런타임 사용 |

### 4. Superset과 AltJS

#### Superset

교안은 TypeScript를 JavaScript의 상위 호환 언어로 설명한다. TypeScript는 JavaScript 기능을 포함하면서 타입 표기와 검사 기능을 추가한다.

```text
JavaScript 문법과 실행 방식
+ TypeScript의 타입 문법과 정적 검사
= TypeScript 개발 경험
```

코치 보충: 기존 JavaScript 문법을 TypeScript가 받아들인다는 것과 모든 JavaScript 코드가 타입 오류 없이 통과한다는 것은 같은 말이 아니다. TypeScript 설정과 코드 형태에 따라 타입 오류가 표시될 수 있으며, 타입 오류와 실제 JavaScript 런타임 동작도 구분해야 한다.

#### AltJS

교안에서 AltJS는 JavaScript를 대체하거나 확장하려고 등장한 언어군을 뜻한다. 브라우저가 직접 실행하는 결과물은 JavaScript이므로 실행 전 변환 단계가 필요하다.

### 5. 타입 검사와 JavaScript 변환 흐름

```text
index.ts 작성
→ tsc가 소스와 타입 관계 검사
→ TypeScript 전용 타입 문법 제거·필요한 문법 변환
→ index.js 생성
→ 브라우저 또는 JavaScript 런타임에서 실행
```

교안은 이 과정을 비슷한 추상화 수준의 언어 사이에서 소스 코드를 바꾸는 트랜스파일로 설명한다. 공식 TypeScript 문서는 `tsc`를 컴파일러라고 부르며, 타입 검사 후 타입 표기를 지우고 JavaScript를 출력한다고 설명한다. 수업에서는 용어보다 다음 두 단계를 구분하는 것이 중요하다.

1. 개발·빌드 시점: 타입 검사와 JavaScript 출력
2. 실행 시점: 출력된 JavaScript가 JavaScript 런타임에서 동작

TypeScript 타입은 기본적으로 출력된 JavaScript에 남아 런타임 검증을 수행하지 않는다. 외부 API 응답이나 사용자 입력은 필요하면 별도의 런타임 검증이 필요하다.

### 6. 정적 분석과 런타임 오류

| 구분 | 확인 시점 | 예시 |
|---|---|---|
| 정적 타입 오류 | 코드를 실행하기 전 검사할 때 | 문자열이 필요한 함수에 숫자를 전달 |
| 런타임 오류 | 프로그램이 실제 실행되는 동안 | 존재하지 않는 값에서 메서드 호출 |
| 논리 오류 | 실행은 되지만 결과가 의도와 다름 | 할인율 계산식을 잘못 작성 |

TypeScript는 많은 타입 불일치를 미리 찾을 수 있지만 모든 런타임 오류와 논리 오류를 자동으로 막는 것은 아니다.

### 7. TypeScript의 주요 확장 기능

교안은 이후 과정에서 이어질 기능을 다음과 같이 소개한다.

- 타입 표기와 타입 추론
- `null`, `undefined`와 관련된 타입 안전성
- 객체의 구조적 규격을 표현하는 인터페이스
- 여러 타입에 재사용할 수 있는 제네릭
- 편집기 자동 완성, 탐색과 리팩터링 지원
- TS Playground를 이용한 브라우저 기반 확인
- Next.js 같은 개발 환경의 자동 빌드·변환

이 기능들은 이번 1강에서 모두 구현하는 범위가 아니라 과정 전체의 방향을 미리 보여주는 항목이다.

### 8. 도입의 장점과 비용

| 장점 | 비용·주의점 |
|---|---|
| 타입 불일치를 개발 중 더 일찍 발견 | 타입 문법과 도구 사용법을 학습해야 함 |
| 함수와 데이터 구조의 계약을 코드로 표현 | 빌드·검사 단계가 추가됨 |
| 자동 완성, 코드 탐색, 리팩터링 지원 | 설정과 타입 설계가 지나치게 복잡해질 수 있음 |
| 규모가 큰 코드에서 변경 영향 파악에 도움 | TypeScript만으로 런타임 데이터의 안전이 보장되지는 않음 |
| JavaScript 코드에서 점진적으로 전환 가능 | 라이브러리 타입 정보와 프로젝트 설정을 관리해야 함 |

교안의 “런타임 성능 영향 없음”은 TypeScript의 타입 자체가 런타임에 남지 않는다는 취지로 이해한다. 실제 애플리케이션 성능은 출력된 JavaScript, 사용한 기능, 번들링과 실행 환경의 영향을 받으므로 수업에서는 타입 검사 비용과 런타임 성능을 분리해서 본다.

## 2강. tslab과 VS Code Jupyter 환경 구축

### 1. 환경을 분리하는 이유

교안은 기존 Node.js 20 기반 JavaScript Jupyter 커널을 보존하면서, TypeScript 실습용 Node.js 24 환경을 별도로 준비하는 흐름을 제시한다.

```text
기존 Node.js 20 + JavaScript 커널 보존
→ nvm으로 Node.js 24 설치
→ 현재 터미널의 Node.js 버전을 24로 전환
→ tslab 전역 설치
→ Jupyter에 TypeScript 커널 등록
→ VS Code에서 TypeScript(tslab) 커널 선택
```

| 구성 요소 | 역할 |
|---|---|
| `nvm` | 여러 Node.js 버전을 설치하고 필요한 버전으로 전환 |
| Node.js | JavaScript·TypeScript 실습 도구가 동작하는 실행 환경 |
| `tslab` | Jupyter에서 TypeScript·JavaScript 셀을 실행하는 커널 |
| Jupyter Notebook | 코드 셀과 실행 결과를 함께 관리하는 대화형 문서 환경 |
| VS Code Jupyter 확장 | `.ipynb` 파일과 커널 선택·실행 UI 제공 |

코치 보충: `nvm use 24`는 현재 셸에서 어떤 Node.js 실행 파일을 사용할지 전환하는 단계다. 설치·전환 후에는 `node --version`, `npm --version`처럼 실제 활성 버전을 확인해야 하지만, 이번 예습에서는 명령을 실행하지 않았다.

### 2. 교안의 설치 순서

```powershell
nvm install 24
nvm use 24
npm install -g tslab
uv run --with jupyter tslab install
```

위 명령은 교안에 제시된 절차를 옮긴 것이며 아직 실행하지 않았다. 실제 수업에서는 각 명령이 성공했는지, 새 터미널에서도 같은 버전이 선택되는지, VS Code가 등록된 커널을 찾는지 단계별로 확인한다.

### 3. VS Code에서 첫 Notebook 실행

교안의 흐름은 다음과 같다.

```text
chapter01 폴더 생성
→ 01.ipynb 파일 생성
→ Select Kernel 선택
→ TypeScript (tslab) 지정
→ 첫 번째 코드 셀 작성
→ 셀 실행
→ 출력 또는 타입 오류 확인
```

```typescript
let studentName: string = "홍길동";
let attendanceScore: number = 95;

console.log(`학생 이름: ${studentName}`);
console.log(`출석 점수: ${attendanceScore}점`);

// attendanceScore = "결석 처리";
```

마지막 줄의 주석을 해제하면 `number` 변수에 문자열을 넣으려는 타입 불일치가 생긴다. 이 오류 표시와 셀 실행 결과는 수업 중 실제 환경에서 확인한다.

### 4. 환경 오류를 확인하는 순서

Notebook 셀이 실행되지 않을 때는 무작정 재설치하기보다 연결 단계를 앞에서부터 확인한다.

```text
VS Code에서 선택된 커널 이름
→ Node.js 활성 버전
→ tslab 명령 인식 여부
→ Jupyter 커널 등록 여부
→ 현재 Notebook이 연결한 실제 커널
→ 셀의 오류 메시지와 출력
```

교안의 첫 확인점은 VS Code 오른쪽 위에서 `TypeScript (tslab)` 커널이 선택되어 있는지다.

## 3강. 원시 타입과 배열·튜플 구조

### 1. 다섯 가지 기본 원시 타입

교안은 이번 범위에서 `string`, `number`, `boolean`, `null`, `undefined`를 다룬다.

| 타입 | 의미 | 예시 |
|---|---|---|
| `string` | 텍스트 | `"아이스 아메리카노"` |
| `number` | 정수와 실수를 포함한 숫자 | `4500` |
| `boolean` | 참 또는 거짓 | `true`, `false` |
| `null` | 값이 없음을 의도적으로 표시 | `null` |
| `undefined` | 값이 아직 할당되지 않은 상태 | `undefined` |

```typescript
let menuName: string = "아이스 아메리카노";
let menuPrice: number = 4500;
let isIceDrink: boolean = true;
```

JavaScript에도 이런 값의 종류가 있지만, TypeScript에서는 변수에 허용할 타입을 코드로 명시하고 검사할 수 있다.

### 2. `null`과 `undefined`

```typescript
let discountCoupon: string | null = null;
let serverResponse: undefined = undefined;
```

- `null`: 개발자가 “현재 값이 없음”을 의도적으로 표현할 때 사용한다.
- `undefined`: 선언 후 값이 정해지지 않았거나 속성·결과가 존재하지 않을 때 나타날 수 있다.
- `string | null`: 문자열 또는 `null` 가운데 하나를 허용한다는 뜻이다.

코치 보충: `serverResponse: undefined`는 해당 변수에 사실상 `undefined`만 허용하는 매우 좁은 선언이다. 실제 프로그램에서는 값이 채워질 예정이라면 이후 수업에서 배우는 유니온이나 선택적 구조 등 상황에 맞는 모델을 검토한다. 이번 단계에서는 교안 예시의 의미만 확인한다.

### 3. 배열 타입

배열은 여러 값을 순서대로 관리한다. 이번 교안은 같은 타입의 요소로 구성된 배열을 두 가지 표기법으로 선언한다.

```typescript
let orderPrices: number[] = [4500, 5000, 5500];
let drinkMenus: Array<string> = ["라떼", "모카", "민트초코"];

orderPrices.push(6000);
```

| 표기 | 읽는 방법 |
|---|---|
| `number[]` | 숫자 요소로 구성된 배열 |
| `Array<string>` | 문자열 요소로 구성된 배열 |

두 표기는 이번 예시에서 같은 목적을 표현한다. `orderPrices`에는 숫자를 추가할 수 있지만 문자열을 추가하면 타입 오류가 발생한다.

### 4. 튜플 타입

튜플은 배열과 비슷한 형태지만 각 위치의 타입과 전체 길이를 미리 정한다.

```typescript
let userProfile: [number, string] = [1004, "김회원"];

console.log(userProfile[0]);
console.log(userProfile[1]);
```

```text
인덱스 0 → number → 회원번호
인덱스 1 → string → 회원이름
전체 길이 → 2
```

`["김회원", 1004]`처럼 순서를 바꾸면 인덱스별 타입 규칙에 맞지 않는다. 교안은 튜플의 고정된 반환 순서를 React 상태 구조와 연결하지만, React 구현 자체는 이번 범위가 아니다.

### 5. 배열과 튜플 비교

| 구분 | 배열 | 튜플 |
|---|---|---|
| 길이 | 일반적으로 가변 | 선언한 길이와 위치 규칙을 가짐 |
| 요소 타입 | 보통 하나의 공통 타입 | 인덱스마다 다른 타입 지정 가능 |
| 의미 파악 | 요소 전체의 공통 의미 | 각 위치의 의미를 순서로 해석 |
| 예시 | 상품 가격 목록 | `[회원번호, 회원이름]` |

## 4강. 특수 타입과 타입 추론

### `any`, `unknown`, `never`

| 타입 | 의미 | 사용할 때의 태도 |
|---|---|---|
| `any` | 타입 검사를 사실상 우회 | 기존 JavaScript 이관 등 불가피한 경계에서 최소화 |
| `unknown` | 어떤 값이든 받을 수 있으나 바로 사용할 수 없음 | 외부 입력을 받은 뒤 타입 가드로 좁혀 사용 |
| `never` | 발생할 수 있는 값이 없음 | 끝나지 않는 함수나 모든 분기를 소진했는지 확인 |

`any`와 `unknown`은 Python의 `pass`처럼 “아무 작업도 하지 않는다”는 문장이 아니다. 둘 다 TypeScript의 타입이며, 특히 `unknown`은 값을 쓰기 전에 검사하도록 요구한다.

```typescript
function printValue(value: unknown): void {
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  }
}
```

### 타입 추론과 타입 단언

TypeScript는 초기값과 코드 흐름을 보고 타입을 추론한다. 타입 단언 `as`는 개발자가 컴파일러에 타입 정보를 더 강하게 알려 주는 문법이지만 값을 실제로 변환하거나 검증하지 않는다.

```typescript
const raw: unknown = JSON.parse('{"name":"Hana"}');
const user = raw as { name: string }; // 런타임 검증은 아님
```

## 5강. 함수의 매개변수와 반환 타입

함수는 입력과 출력의 계약을 함께 표현한다.

```typescript
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

function greet(name?: string): string {
  return `Hello, ${name ?? "guest"}`;
}

function average(...scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
```

- `name?: string`은 값이 없을 가능성을 포함한다.
- 선택적 매개변수 뒤에는 필수 매개변수를 둘 수 없다.
- 나머지 매개변수는 배열 타입으로 선언한다.
- 반환 타입을 적으면 함수 구현이 계약에 맞는지도 검사할 수 있다.

## 6강. 함수 표현식과 콜백 타입

함수를 값으로 전달할 때도 매개변수와 반환값의 타입을 표현한다.

```typescript
type Discount = (price: number) => number;

function applyDiscount(price: number, discount: Discount): number {
  return discount(price);
}

const tenPercent: Discount = (price) => price * 0.9;
```

호출 시그니처는 속성을 가진 함수 객체의 호출 규칙까지 표현할 때 사용할 수 있다. 고차 함수에서는 “콜백이 무엇을 받고 무엇을 돌려주는지”가 핵심 계약이다.

## 7강. 타입 별칭·인터페이스·읽기 전용 속성

```typescript
type ProductId = string;

interface Product {
  readonly id: ProductId;
  name: string;
  description?: string;
}
```

- 타입 별칭은 원시 타입·유니온·함수 타입 등 다양한 타입에 이름을 붙일 수 있다.
- 인터페이스는 주로 객체 구조의 계약을 선언하고 `extends`로 확장할 수 있다.
- 같은 이름의 인터페이스 선언은 합쳐질 수 있지만 타입 별칭은 그렇지 않다.
- `readonly`는 TypeScript 검사 단계에서 재할당을 막으며 객체를 런타임에 자동 동결하지 않는다.

## 8강. 인덱스 시그니처와 인터페이스 확장

키가 동적으로 늘어나는 객체는 인덱스 시그니처로 값의 타입을 제한할 수 있다.

```typescript
interface Scores {
  [subject: string]: number;
}

interface User {
  id: number;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}
```

인덱스 시그니처의 키에는 `string`, `number`, `symbol`과 템플릿 리터럴 패턴 등을 사용할 수 있다. 제한된 키 집합을 표현하려면 `Record`나 매핑 타입이 더 알맞을 수 있다.

## 핵심 용어

| 용어 | 의미 |
|---|---|
| 동적 타입 | 실행 중 값에 따라 타입이 결정되고 변수에 다른 종류의 값을 담을 수 있는 특성 |
| 정적 타입 검사 | 코드를 실행하기 전에 타입 관계를 분석하는 과정 |
| `tsc` | TypeScript를 검사하고 JavaScript 출력을 만들 수 있는 컴파일러 |
| 트랜스파일 | 한 소스 언어를 비슷한 수준의 다른 소스 언어로 변환하는 과정 |
| 타입 추론 | 코드의 초기값과 흐름을 보고 TypeScript가 타입을 알아내는 기능 |
| `any` | 타입 검사를 대부분 우회하는 타입 |
| `unknown` | 모든 값을 받을 수 있지만 검사 전에는 바로 사용할 수 없는 타입 |
| `never` | 발생할 수 있는 값이 없음을 나타내는 타입 |
| 타입 단언 | 개발자가 컴파일러에 타입 정보를 지정하는 문법으로 런타임 변환·검증은 아님 |
| 선택적 매개변수 | 호출할 때 생략할 수 있도록 `?`를 붙인 매개변수 |
| 나머지 매개변수 | 여러 인수를 배열로 받는 `...` 매개변수 |
| 콜백 | 다른 함수에 전달되어 필요한 시점에 호출되는 함수 |
| 타입 별칭 | 타입 표현에 재사용할 이름을 붙이는 `type` 선언 |
| 인터페이스 | 객체나 클래스가 지켜야 할 구조적 계약 |
| `readonly` | 해당 속성의 재할당을 타입 검사 단계에서 제한하는 표시 |
| 인덱스 시그니처 | 이름이 미리 정해지지 않은 객체 속성의 키·값 타입 규칙 |
| 인터페이스 확장 | `extends`로 기존 객체 설계도를 물려받아 항목을 추가하는 것 |

## 예상 난점

- “JavaScript는 타입이 없다”라고 이해하는 것: 값에는 타입이 있지만 변수·매개변수에 정적 계약을 적지 않는다.
- `.ts` 파일이 스스로 실행 가능한 JavaScript로 바뀐다고 생각하는 것
- 컴파일러·트랜스파일러가 하는 변환과 JavaScript 런타임의 실행을 섞는 것
- `const`를 객체나 배열 내부까지 절대 바꿀 수 없다는 뜻으로 이해하는 것
- `any`와 `unknown`을 Python의 `pass`처럼 아무 작업도 하지 않는 문법으로 보는 것
- 타입 단언 `as`가 실제 값을 변환하거나 외부 데이터를 검증한다고 생각하는 것
- `number[]`와 `[number]`를 같은 타입으로 읽는 것
- 선택적 매개변수와 필수 매개변수의 순서를 혼동하는 것
- 콜백 함수의 “전달 시점”과 “호출 시점”을 같은 것으로 보는 것
- 타입 별칭과 인터페이스를 언제나 완전히 같은 문법으로 보는 것
- `readonly`가 런타임 객체를 자동으로 동결한다고 생각하는 것
- 인터페이스의 `extends`를 클래스의 기능 상속과 완전히 같은 것으로 보는 것
- `[key: string]: number`에서 `key`가 고정된 속성명이라고 생각하는 것

## 예정 확인·실습

아래 항목은 교안의 실습 방향을 정리한 것이며, 오늘 대화에서 실제 실행 완료는 확인되지 않았다.

1. 같은 함수를 JavaScript와 TypeScript로 비교한다.
2. TypeScript 타입 표기가 JavaScript 출력에서 제거되는지 확인한다.
3. Node.js·`tslab`·Jupyter 커널의 설치 및 연결 단계를 확인한다.
4. 원시 타입과 배열·튜플 예제를 셀 단위로 실행한다.
5. `any`와 `unknown`에 같은 값을 넣고 사용 가능 범위를 비교한다.
6. 선택적·나머지 매개변수가 있는 함수를 작성한다.
7. 콜백 함수의 전달과 실제 호출 순서를 추적한다.
8. 타입 별칭과 인터페이스로 같은 상품 객체를 표현한다.
9. `readonly` 속성과 `const` 변수의 제한 범위를 비교한다.
10. 사이즈별 재고를 `[size: string]: number`로 표현한다.
11. `extends`로 공통 상품 인터페이스를 패션 상품 인터페이스로 확장한다.

## 수업 전 확인 질문

1. TypeScript는 JavaScript에 무엇을 추가하는가?
2. `.ts → 검사·변환 → .js → 실행` 흐름에서 각 단계는 무엇을 담당하는가?
3. `const`와 `let`은 재할당 가능 여부에서 어떻게 다른가?
4. `any`와 `unknown`은 값을 사용하는 단계에서 어떻게 다른가?
5. 배열과 튜플은 길이·순서·타입 규칙에서 어떻게 다른가?
6. 함수의 매개변수 타입과 반환 타입은 각각 어떤 계약인가?
7. 콜백 함수는 언제 전달되고 언제 실행되는가?
8. 타입 별칭과 인터페이스는 무엇을 재사용하기 위한 문법인가?
9. `readonly`와 `const`는 각각 무엇의 재할당을 제한하는가?
10. 인덱스 시그니처는 어떤 객체에 필요한가?
11. 인터페이스의 `extends`는 기존 설계도를 어떻게 확장하는가?

## 추후 확인 항목

- [ ] TypeScript와 JavaScript의 관계를 자기 말로 설명한다.
- [ ] `.ts` 파일이 JavaScript로 변환되어 실행되는 흐름을 그린다.
- [ ] `const`와 `let`의 사용 기준을 코드에서 구분한다.
- [ ] `any`, `unknown`, `never`의 목적을 구분한다.
- [ ] 함수 입력·출력·콜백 타입을 읽는다.
- [ ] 타입 별칭·인터페이스·인덱스 시그니처의 적용 상황을 비교한다.
- [ ] 인터페이스 확장과 클래스 상속의 차이를 설명한다.
- [ ] 실제 코드·출력·오류를 근거로 오늘 실습 범위를 확정한다.

## 교안 출처와 확인 범위

- `1장 1강 ： JavaScript의 한계와 TypeScript의 등장.pdf`, 1~10쪽 전체
  - JavaScript의 동적 타입과 TypeScript의 도입 배경
- `1장 2강 ： tslab과 VS Code Jupyter 환경 구축.pdf`, 1~8쪽 전체
  - Node.js 24 환경, `tslab`, Jupyter·VS Code 연결
- `2장 1강 ： 원시 타입과 배열, 튜플 구조.pdf`, 1~9쪽 전체
  - 원시 타입, 배열 표기와 튜플 규칙
- `2장 2강 ： 특수 타입과 타입 추론 메커니즘.pdf`, 1~14쪽 전체
  - `any`, `unknown`, `never`, 좁히기, 추론과 단언
- `3장 1강 ： 매개변수와 반환 타입 명세.pdf`, 1~6쪽 전체
  - 함수 입력·출력, 선택적·나머지 매개변수
- `3장 2강 ： 함수 표현식과 콜백 타입 정의.pdf`, 1~9쪽 전체
  - 함수 타입, 호출 시그니처, 고차 함수와 콜백
- `4장 1강 ： 타입 별칭과 인터페이스 및 readonly.pdf`, 1~9쪽 전체
  - 타입 별칭, 인터페이스, 선택적·읽기 전용 속성
- `4장 2강 ： 인덱스 시그니처와 인터페이스 확장.pdf`, 1~10쪽 전체
  - 동적 객체 키, 키 제약과 인터페이스 확장

### 공식 보충 자료

- [TypeScript Handbook — TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch)
- [TypeScript Handbook — The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)
- [TypeScript Handbook — Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

## 예습 범위의 한계

- 이 문서는 2026-10-02에 사용자가 확인한 실제 진도인 1장 1강부터 4장 2강까지 다룬다.
- 이후 5장~10장은 오늘 실제 진도에서 제외했으며 이 파일의 예습 범위로 기록하지 않는다.
- Week는 비공개 학습 기준 문서의 현재값인 LV.2 / Week 8을 적용한다.
- 코드와 실습은 교안 구조 파악을 위한 예시이며 실제 실행 결과가 아니다.
- 오늘 대화에서 실제 코드 실행·오류 해결·복습 평가는 확인되지 않았다.
- 비공개 교안 PDF와 내부 운영 정보는 공개 저장소에 복사하지 않는다.
