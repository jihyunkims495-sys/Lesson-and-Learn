# Python 8일차 - 객체지향 프로그래밍 기초

<!-- TOP_SUMMARY_START -->

## 1. 오늘 배운 전체 구조

```text
객체지향 프로그래밍(OOP)
│
├── 클래스(Class)
│   ├── 객체(Object)
│   ├── 인스턴스(Instance)
│   ├── 변수와 객체의 관계
│   ├── __init__ 생성자
│   ├── self
│   ├── 속성(Attribute)
│   └── 메서드(Method)
│
├── 상속(Inheritance)
│   ├── 부모 클래스
│   ├── 자식 클래스
│   ├── 부모의 속성과 메서드 재사용
│   ├── 메서드 오버라이딩(Overriding)
│   └── super()
│       └── 부모 클래스의 __init__ 또는 메서드 호출
│
└── 캡슐화(Encapsulation)
    ├── 객체 내부 데이터 보호
    ├── 프라이빗 속성(__속성)
    ├── Name Mangling
    ├── Getter
    └── Setter
```

### 오늘의 핵심 실행 흐름

```text
class Person
→ 객체를 만들기 위한 설계도 정의

Person("지현")
→ 클래스를 호출하여 실제 Person 객체 생성

생성된 Person 객체
→ Person 클래스의 인스턴스

p1 = Person("지현")
→ p1이라는 변수가 Person 인스턴스 객체를 가리킴

self
→ 현재 메서드를 실행 중인 인스턴스 객체 자신

self.name
→ 객체에 저장되는 속성

상속
→ 부모 클래스의 속성과 메서드를 자식 클래스가 재사용

오버라이딩
→ 부모 메서드를 자식 클래스가 같은 이름으로 다시 정의

super()
→ 자식 클래스에서 부모 클래스의 메서드 또는 __init__ 호출

캡슐화
→ 객체 내부의 중요한 데이터를 직접 수정하지 못하도록 관리
```

---

## 2. 중요 개념 정리

| 개념 | 핵심 의미 | 예시 |
|---|---|---|
| **클래스** | 객체를 만들기 위한 설계도 | `class Person:` |
| **객체** | 프로그램 안에 실제로 만들어져 존재하는 값 또는 대상 | `Person("지현")` 호출로 생성된 실제 객체 |
| **인스턴스** | 특정 클래스로부터 만들어진 객체라는 관계를 강조한 표현 | 생성된 객체는 `Person` 클래스의 인스턴스 |
| **변수** | 객체를 가리키는 이름 | `p1` |
| **`__init__`** | 객체 생성 시 초기 데이터를 설정하는 메서드 | `def __init__(self, name):` |
| **`self`** | 현재 메서드를 실행하고 있는 인스턴스 객체 자신 | `self.name` |
| **속성** | 객체가 가지고 있는 데이터 | `self.name`, `self.age` |
| **함수** | 특정 작업을 수행하도록 묶어놓은 코드 | `def add(a, b):` |
| **메서드** | 클래스에 소속된 함수 | `def move(self):` |
| **지역변수** | 함수/메서드 안에서 사용하는 변수 | `result = a + b` |
| **전역변수** | 함수 밖에서 정의된 변수 | `school = "스파르타"` |
| **상속** | 부모 클래스의 기능을 자식 클래스가 물려받는 것 | `class Dog(Animal):` |
| **오버라이딩** | 부모 메서드를 자식이 같은 이름으로 다시 정의 | 자식 클래스의 `move()` |
| **`super()`** | 자식 클래스에서 부모 클래스의 메서드를 호출할 때 사용 | `super().__init__("강아지")` |
| **캡슐화** | 객체 내부의 중요한 데이터를 안전하게 관리 | `self.__money` |
| **Getter** | 숨겨진 값을 조회하는 메서드 | `get_money()` |
| **Setter** | 값을 검증한 후 변경하는 메서드 | `set_money()` |

### 상속과 `super()` 예제

```python
class Animal:
    def __init__(self, kind):
        self.kind = kind

    def move(self):
        print("동물이 움직인다.")


class Dog(Animal):
    def __init__(self):
        super().__init__("강아지")

    def move(self):
        print("강아지 걸음으로 움직인다.")
```

실행 흐름:

```text
dog = Dog()
↓
Dog 객체 생성 시작
↓
Dog.__init__() 실행
↓
super().__init__("강아지")
↓
부모 Animal.__init__() 실행
↓
self.kind = "강아지"
↓
다시 Dog.__init__()으로 돌아옴
```

`Dog`의 `move()`는 부모 `Animal.move()`와 같은 이름으로 다시 정의했으므로 **메서드 오버라이딩**이다.

---

## 3. 헷갈렸던 것 리뷰

### 3-1. 변수와 객체는 같은 것이 아니다

```python
name = "지현"
```

```text
name
→ 변수

"지현"
→ str 객체

name이라는 변수가 "지현" 객체를 가리킨다.
```

---

### 3-2. `p1 = Person("지현")`에서 `p1`은 `"지현"`이 아니다

```python
class Person:
    def __init__(self, name):
        self.name = name

p1 = Person("지현")
```

구조:

```text
p1
 ↓
Person 객체
 └── name
      ↓
    "지현"
```

따라서:

```text
p1
→ Person 객체 전체를 가리키는 변수

p1.name
→ "지현"
```

---

### 3-3. 객체와 인스턴스

```text
객체
→ 실제 만들어진 값이라는 점을 강조

인스턴스
→ 어느 클래스로부터 만들어졌는지를 강조
```

즉 `Person("지현")`을 호출한 결과 만들어진 실제 객체는:

```text
객체이면서
Person 클래스의 인스턴스이다.
```

`p1`은 그 인스턴스 객체를 가리키는 변수이다.

---

### 3-4. `Person()` 자체와 생성된 객체 구분

```text
Person
→ 클래스

Person()
→ 클래스를 호출해서 객체를 생성하는 표현

Person() 호출 결과
→ 실제 Person 객체
→ Person 클래스의 인스턴스
```

---

### 3-5. `self`는 고정된 객체가 아니다

```python
dog1 = Dog("초코")
dog2 = Dog("보리")
```

```text
dog1의 메서드가 실행될 때 self
→ dog1이 가리키는 객체

dog2의 메서드가 실행될 때 self
→ dog2가 가리키는 객체
```

`self`라는 이름은 관례적으로 사용하지만, `self`가 가리키는 객체는 실행하는 인스턴스에 따라 달라진다.

---

### 3-6. `name`과 `self.name`은 다르다

```python
def __init__(self, name):
    self.name = name
```

```text
name
→ __init__으로 전달된 매개변수

self.name
→ 객체 안에 저장되는 속성
```

`p1 = Person("지현")`이라면:

```text
name = "지현"
↓
self.name = name
↓
p1이 가리키는 Person 객체의 name 속성에 "지현"이 연결됨
```

---

### 3-7. 함수와 메서드

```python
def hello():
    pass
```

→ 함수

```python
class Person:
    def hello(self):
        pass
```

→ 메서드

**메서드는 클래스에 소속된 함수**이다.

---

### 3-8. 함수는 소문자, 클래스는 대문자라서 구분되는 것이 아니다

보통:

```text
함수 이름 → 소문자로 시작
클래스 이름 → 대문자로 시작
```

하지만 이것은 **이름 짓기 관례**이다.

진짜 구분:

```text
def → 함수 정의
class → 클래스 정의
```

---

### 3-9. `super()` 사용 시 헷갈렸던 부분

잘못된 형태:

```python
super.__init__(self, "강아지")
```

올바른 형태:

```python
super().__init__("강아지")
```

그리고 부모 클래스도 `"강아지"`를 받을 매개변수가 있어야 한다.

```python
class Animal:
    def __init__(self, kind):
        self.kind = kind
```

핵심:

```text
super()
→ 부모 클래스 쪽 기능을 사용하기 위한 연결

super().__init__("강아지")
→ 부모의 __init__을 호출하면서 "강아지" 전달
```

---

### 3-10. 지역변수와 속성

```python
class Dog:
    def __init__(self, name):
        nickname = name
        self.name = name
```

```text
nickname
→ __init__ 안의 지역변수

self.name
→ Dog 객체의 속성
```

객체 생성 이후에도 사용하려는 데이터라면 `self.name`처럼 객체의 속성으로 저장해야 한다.

---

### 3-11. 클래스 변수와 인스턴스 변수

```python
class Person:
    species = "human"

    def __init__(self, name):
        self.name = name
```

```text
species
→ 클래스 변수

self.name
→ 인스턴스 변수(속성)
```

클래스 안에 있다고 해서 모두 인스턴스가 되는 것은 아니다.

---

### 3-12. 같은 객체를 여러 변수가 가리킬 수도 있다

```python
p1 = Person("지현")
p2 = p1
```

```text
p1 ──┐
     ▼
 Person 객체 하나
     ▲
p2 ──┘
```

객체가 두 개 만들어진 것이 아니라 두 변수가 같은 객체를 가리키는 상태이다.

<!-- TOP_SUMMARY_END -->

---

## 오늘의 학습 주제

오늘은 객체지향 프로그래밍의 기본 개념인 다음 내용을 학습했다.

- 클래스(Class)
- 인스턴스(Instance)
- `__init__`
- `self`
- 속성(Attribute)
- 메서드(Method)
- 상속(Inheritance)
- 메서드 오버라이딩(Method Overriding)
- `super()`
- 캡슐화(Encapsulation)
- 프라이빗 속성
- Getter / Setter

---

# 1. 객체지향 프로그래밍(OOP)

## 개념

객체지향 프로그래밍은 프로그램을 단순한 명령문의 나열로 보는 것이 아니라, 서로 관련된 **데이터와 기능을 객체라는 하나의 단위로 묶어서 관리하는 방식**이다.

예를 들어 회원 정보를 관리한다고 하면 다음처럼 데이터와 함수를 따로 관리할 수도 있다.

```python
user_name = "철수"
user_age = 20

def print_user(name):
    print(name)
```

객체지향 방식에서는 관련된 데이터와 기능을 하나의 클래스 안에 묶는다.

```python
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        print(f"저는 {self.name}입니다.")
```

## 왜 필요한가?

프로그램이 커질수록 관련 데이터와 함수가 많아진다.

객체지향 프로그래밍을 사용하면:

- 관련된 데이터와 기능을 함께 관리할 수 있다.
- 같은 구조의 객체를 여러 개 만들 수 있다.
- 기존 코드를 재사용하기 쉬워진다.
- 역할별로 코드를 나누어 관리하기 쉬워진다.

---

# 2. 클래스(Class)와 인스턴스(Instance)

## 클래스

클래스는 **객체를 만들기 위한 설계도**이다.

```python
class Car:
    pass
```

이 시점에는 실제 자동차 객체가 만들어진 것은 아니다.

`Car`라는 설계도만 만들어진 상태이다.

## 인스턴스

클래스를 이용해 실제로 만들어진 객체를 인스턴스라고 한다.

```python
car_a = Car()
car_b = Car()
```

여기서:

- `Car` → 클래스
- `car_a` → 인스턴스
- `car_b` → 인스턴스

`car_a`와 `car_b`는 같은 클래스로 만들었지만 서로 다른 객체이다.

```python
print(car_a is car_b)
```

출력:

```text
False
```

## 비유

```text
붕어빵 틀 → 클래스
팥 붕어빵 → 인스턴스
슈크림 붕어빵 → 인스턴스
```

---

# 3. `__init__` 생성자

## 개념

`__init__`은 객체가 생성될 때 초기 데이터를 설정할 때 사용하는 특수 메서드이다.

```python
class Character:
    def __init__(self, nickname):
        self.nickname = nickname
```

객체를 만들면:

```python
player = Character("스파르타")
```

실행 흐름은 다음과 같다.

```text
Character("스파르타")
        ↓
Character 객체 생성
        ↓
__init__ 실행
        ↓
nickname = "스파르타"
        ↓
self.nickname = nickname
        ↓
player.nickname = "스파르타"
```

## 중요한 점

`__init__`은 클래스에 반드시 작성해야 하는 것은 아니다.

객체가 생성될 때 초기값으로 저장할 데이터가 없다면 생략할 수 있다.

예:

```python
class Animal:
    def move(self):
        print("동물이 움직인다.")
```

이 클래스는 처음 생성될 때 저장해야 할 별도의 데이터가 없으므로 `__init__` 없이 사용할 수 있다.

---

# 4. `self`

## 개념

`self`는 **현재 메서드를 사용하고 있는 인스턴스 자기 자신**을 의미한다.

```python
class Smartphone:
    def __init__(self, model):
        self.model = model
```

객체를 생성하면:

```python
phone = Smartphone("Galaxy")
```

이때 개념적으로:

```text
self → phone
```

이라고 생각할 수 있다.

따라서:

```python
self.model = model
```

은 결과적으로:

```text
phone.model = "Galaxy"
```

라는 상태를 만든다.

## 한 줄 정리

`self`는 **지금 작업 중인 객체 자기 자신을 가리킨다.**

---

# 5. 속성(Attribute)과 메서드(Method)

다음 클래스를 보자.

```python
class Smartphone:
    def __init__(self, model):
        self.model = model
        self.battery = 100

    def charge(self):
        self.battery = 100
        print(f"{self.model} 충전 완료!")
```

## 속성

객체가 가지고 있는 데이터를 속성이라고 한다.

```python
self.model
self.battery
```

## 메서드

클래스 안에서 정의된 함수를 메서드라고 한다.

```python
def charge(self):
```

## 구조

```text
Smartphone 객체

속성
├── model
└── battery

메서드
└── charge()
```

---

# 6. BankAccount 클래스 예제

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if self.balance >= amount:
            self.balance -= amount

        return self.balance
```

객체 생성:

```python
chulsu = BankAccount("철수", 10000)
```

저장되는 값:

```text
chulsu.owner = "철수"
chulsu.balance = 10000
```

입금:

```python
chulsu.deposit(5000)
```

실행 흐름:

```text
기존 balance = 10000
        ↓
10000 + 5000
        ↓
balance = 15000
```

다른 객체도 만들 수 있다.

```python
younghee = BankAccount("영희", 30000)
```

각 인스턴스는 독립된 데이터를 가진다.

```text
chulsu.balance   → 15000
younghee.balance → 30000
```

---

# 7. 상속(Inheritance)

## 개념

상속은 **기존 클래스의 속성과 메서드를 새로운 클래스가 물려받아 사용하는 것**이다.

```python
class Animal:
    def breathe(self):
        print("숨을 쉽니다.")


class Dog(Animal):
    def bark(self):
        print("멍멍 짖습니다.")
```

여기서:

```text
Animal → 부모 클래스
Dog → 자식 클래스
```

`Dog`에는 `breathe()`가 직접 작성되어 있지 않다.

하지만 `Animal`을 상속했기 때문에 사용할 수 있다.

```python
baduk = Dog()

baduk.breathe()
baduk.bark()
```

출력:

```text
숨을 쉽니다.
멍멍 짖습니다.
```

## 실행 흐름

```text
baduk.breathe()
      ↓
Dog 클래스에서 breathe() 검색
      ↓
없음
      ↓
부모 Animal에서 검색
      ↓
breathe() 발견
      ↓
실행
```

## 언제 사용하는가?

여러 클래스가 공통된 기능을 가지고 있을 때 사용한다.

예:

```python
class User:
    def login(self):
        print("로그인")


class Customer(User):
    def buy(self):
        print("상품 구매")


class Admin(User):
    def delete_product(self):
        print("상품 삭제")
```

`Customer`와 `Admin` 모두 `login()`을 다시 작성하지 않고 부모 클래스의 기능을 재사용할 수 있다.

---

# 8. 메서드 오버라이딩(Method Overriding)

## 개념

부모 클래스에서 물려받은 메서드를 **자식 클래스에서 같은 이름으로 다시 정의하는 것**을 오버라이딩이라고 한다.

```python
class Animal:
    def sound(self):
        print("소리를 냅니다.")


class Cat(Animal):
    def sound(self):
        print("야옹 하고 웁니다.")
```

실행:

```python
nabi = Cat()
nabi.sound()
```

출력:

```text
야옹 하고 웁니다.
```

자식 클래스 안에 같은 이름의 메서드가 있으면 자식 메서드가 우선 실행된다.

## 예제

```python
class Animal:
    def move(self):
        print("동물이 움직인다.")


class Dog(Animal):
    def move(self):
        print("강아지 걸음으로 움직인다.")


class Cat(Animal):
    def move(self):
        print("고양이 걸음으로 움직인다.")
```

여기서 `Dog`와 `Cat`은 부모의 `move()`를 자신에게 맞게 다시 정의했다.

## 언제 사용하는가?

공통된 행동 이름은 같지만 실제 행동이 달라야 할 때 사용한다.

```text
Animal.move()
Dog.move()
Cat.move()
```

모두 `move()`라는 행동을 하지만 실제 움직임은 다르게 구현할 수 있다.

---

# 9. `super()`

## 개념

`super()`는 자식 클래스 안에서 **부모 클래스의 메서드를 호출할 때** 사용한다.

특히 부모의 `__init__()`을 재사용할 때 자주 사용한다.

```python
class Person:
    def __init__(self, name):
        self.name = name


class Student(Person):
    def __init__(self, name, major):
        super().__init__(name)
        self.major = major
```

객체 생성:

```python
student = Student("김철수", "컴퓨터공학")
```

실행 흐름:

```text
Student("김철수", "컴퓨터공학")
        ↓
Student.__init__()
        ↓
super().__init__(name)
        ↓
Person.__init__()
        ↓
self.name = "김철수"
        ↓
Student.__init__으로 돌아옴
        ↓
self.major = "컴퓨터공학"
```

최종 상태:

```text
student
├── name = "김철수"
└── major = "컴퓨터공학"
```

## 주의

잘못된 코드:

```python
super.__init__(self, "강아지")
```

올바른 코드:

```python
super().__init__("강아지")
```

`super()`에는 괄호가 필요하고, `self`는 직접 전달하지 않는다.

---

# 10. `super()` 사용 시 매개변수 오류

다음 코드는 오류가 발생한다.

```python
class Animal:
    def __init__(self):
        self.kind = kind


class Dog(Animal):
    def __init__(self):
        super().__init__("강아지")
```

오류:

```text
TypeError: Animal.__init__() takes 1 positional argument but 2 were given
```

이유는 부모 `Animal.__init__()`이 `self`만 받을 준비가 되어 있는데 자식이 `"강아지"`라는 값을 하나 더 전달했기 때문이다.

수정:

```python
class Animal:
    def __init__(self, kind):
        self.kind = kind


class Dog(Animal):
    def __init__(self):
        super().__init__("강아지")
```

실행 흐름:

```text
Dog()
 ↓
Dog.__init__()
 ↓
super().__init__("강아지")
 ↓
Animal.__init__(kind="강아지")
 ↓
self.kind = "강아지"
```

---

# 11. 들여쓰기 오류(IndentationError)

클래스 안의 메서드는 같은 깊이로 들여써야 한다.

잘못된 예:

```python
class Cat(Animal):
    def __init__(self):
        super().__init__("고양이")

     def move(self):
            print("고양이 걸음으로 움직인다.")
```

올바른 예:

```python
class Cat(Animal):
    def __init__(self):
        super().__init__("고양이")

    def move(self):
        print("고양이 걸음으로 움직인다.")
```

구조:

```text
class Cat
    ├── def __init__
    └── def move
```

파이썬은 들여쓰기로 코드의 소속을 판단하므로 같은 클래스 안의 메서드는 들여쓰기 깊이를 맞춰야 한다.

---

# 12. 캡슐화(Encapsulation)

## 개념

캡슐화는 관련된 데이터와 기능을 하나의 클래스 안에 묶고, 중요한 내부 데이터는 외부에서 함부로 변경하지 못하도록 관리하는 개념이다.

예:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
```

객체 생성:

```python
person = Person("김철수", 20)
```

외부에서 다음과 같이 직접 바꿀 수 있다.

```python
person.age = -100
```

하지만 사람의 나이가 `-100`이라는 값은 정상적이지 않다.

그래서 중요한 데이터를 직접 바꾸게 하지 않고, 중간에 검사하는 메서드를 두는 방식이 필요하다.

---

# 13. 프라이빗 속성 `__변수`

파이썬에서는 속성 이름 앞에 언더바 두 개를 붙일 수 있다.

```python
class Secret:
    def __init__(self):
        self.__password = "1234"
```

다음처럼 원래 이름으로 직접 접근하면 오류가 발생한다.

```python
my_secret = Secret()
print(my_secret.__password)
```

파이썬은 내부적으로 이름을 변형한다.

```text
__password
↓
_Secret__password
```

이것을 **Name Mangling(이름 변형)**이라고 한다.

## 주의

`__`는 완벽한 보안 기능이 아니다.

다음처럼 내부 이름을 알면 접근이 가능하다.

```python
print(my_secret._Secret__password)
```

따라서 의미는 다음에 가깝다.

> 이 값은 클래스 내부에서 관리할 값이므로 외부에서 직접 수정하지 말자.

---

# 14. Getter와 Setter

## Getter

숨겨진 값을 외부에서 조회할 수 있도록 반환하는 메서드이다.

## Setter

외부에서 전달된 값을 검사한 후 내부 값을 수정하는 메서드이다.

교안 예제:

```python
class Wallet:
    def __init__(self):
        self.__money = 1000

    def get_money(self):
        return self.__money

    def set_money(self, amount):
        if amount >= 0:
            self.__money = amount
        else:
            print("경고: 지갑의 돈은 음수가 될 수 없습니다.")
```

---

# 15. Getter 실행 흐름

```python
wallet = Wallet()

print(wallet.get_money())
```

실행:

```text
wallet.get_money()
      ↓
get_money() 실행
      ↓
self.__money 조회
      ↓
1000 반환
```

Getter는 객체 내부의 숨겨진 데이터를 읽기 위한 정식 통로라고 생각하면 된다.

---

# 16. Setter 실행 흐름

```python
wallet.set_money(-500)
```

실행 순서:

```text
wallet.set_money(-500)
        ↓
amount = -500
        ↓
amount >= 0 ?
        ↓
False
        ↓
else 실행
        ↓
경고 출력
        ↓
__money는 변경되지 않음
```

Setter의 중요한 역할은 단순히 값을 변경하는 것이 아니라 **값이 올바른지 먼저 검사하는 것**이다.

---

# 17. 클래스 / 상속 / 캡슐화 비교

| 개념 | 핵심 질문 | 역할 |
|---|---|---|
| 클래스 | 객체를 어떻게 만들까? | 데이터와 기능을 하나로 묶는다. |
| 인스턴스 | 클래스로 실제 무엇을 만들까? | 클래스 설계도로 만든 실제 객체 |
| `__init__` | 객체를 만들 때 어떤 값을 넣을까? | 초기 데이터 설정 |
| `self` | 지금 어느 객체를 다루고 있나? | 현재 인스턴스 자신 |
| 상속 | 기존 클래스를 어떻게 재사용할까? | 부모 기능을 자식이 물려받는다. |
| 오버라이딩 | 부모 기능을 다르게 만들고 싶다면? | 자식이 같은 메서드를 다시 정의한다. |
| `super()` | 부모 기능도 사용하고 싶다면? | 부모 메서드를 호출한다. |
| 캡슐화 | 객체 데이터를 어떻게 안전하게 관리할까? | 내부 데이터 보호 |
| Getter | 숨겨진 값을 어떻게 읽을까? | 값을 반환한다. |
| Setter | 숨겨진 값을 어떻게 안전하게 바꿀까? | 검사 후 값을 변경한다. |

---

# 18. 모든 개념을 합친 예제

```python
class Character:
    def __init__(self, name, hp):
        self.name = name
        self.__hp = hp

    def move(self):
        print("캐릭터가 움직입니다.")

    def get_hp(self):
        return self.__hp

    def set_hp(self, hp):
        if hp >= 0:
            self.__hp = hp


class Warrior(Character):
    def __init__(self, name, hp, weapon):
        super().__init__(name, hp)
        self.weapon = weapon

    def move(self):
        print("전사가 갑옷을 입고 움직입니다.")
```

## 코드 안의 개념

### 클래스

```python
class Character:
```

캐릭터 설계도이다.

### 생성자

```python
def __init__(self, name, hp):
```

객체 생성 시 초기값을 설정한다.

### 속성

```python
self.name
self.__hp
```

객체가 가지고 있는 데이터이다.

### 캡슐화

```python
self.__hp
```

HP를 외부에서 직접 접근하기 어렵게 만든다.

### Getter

```python
def get_hp(self):
    return self.__hp
```

HP를 조회한다.

### Setter

```python
def set_hp(self, hp):
```

HP를 검사한 후 수정한다.

### 상속

```python
class Warrior(Character):
```

`Character`의 기능을 `Warrior`가 물려받는다.

### `super()`

```python
super().__init__(name, hp)
```

부모의 초기화 기능을 재사용한다.

### 오버라이딩

```python
def move(self):
    print("전사가 갑옷을 입고 움직입니다.")
```

부모의 `move()`를 전사에게 맞게 다시 정의한다.

---

# 19. 오늘 반드시 이해해야 하는 내용

## 반드시 이해

```text
class
→ 객체를 만들기 위한 설계도

인스턴스
→ 클래스로 실제 만들어진 객체

__init__
→ 객체 생성 시 초기값 설정

self
→ 현재 객체 자기 자신

속성
→ 객체가 가지고 있는 데이터

메서드
→ 객체가 수행하는 행동

상속
→ 부모 클래스의 기능을 자식이 물려받는 것

오버라이딩
→ 부모의 메서드를 자식이 같은 이름으로 다시 정의하는 것

super()
→ 부모 클래스의 메서드를 호출하는 방법

캡슐화
→ 객체의 중요한 데이터를 안전하게 관리하는 것

Getter
→ 숨겨진 값을 읽는 메서드

Setter
→ 값을 검사한 후 수정하는 메서드
```

## 나중에 자세히 학습해도 되는 내용

- `__str__`
- `__repr__`
- Name Mangling의 내부 구현 원리
- 다중 상속
- MRO
- `@property`
- 추상 클래스
- 클래스 메서드
- 정적 메서드

---

# 20. 오늘의 핵심 실행 흐름

```text
dog = Dog()
     ↓
Dog 객체 생성
     ↓
Dog.__init__()
     ↓
super().__init__()
     ↓
부모 Animal.__init__()
     ↓
self를 통해 현재 Dog 객체에 데이터 저장
```

이 흐름을 이해하면 `__init__`, `self`, 상속, `super()`가 서로 어떻게 연결되는지 이해할 수 있다.

---

# 한 줄 요약

> 클래스는 객체를 만드는 설계도이고, 상속은 기존 설계도를 재사용하고 확장하는 방법이며, 캡슐화는 객체 내부의 중요한 데이터를 안전하게 관리하는 방법이다.

---

# 확인 문제

다음 코드를 보고 답해보자.

```python
class Animal:
    def __init__(self, kind):
        self.kind = kind


class Dog(Animal):
    def __init__(self, name):
        super().__init__("강아지")
        self.name = name


dog = Dog("초코")
```

질문:

1. `dog.kind`에는 어떤 값이 저장되는가?
2. `dog.name`에는 어떤 값이 저장되는가?
3. `"강아지"`라는 값은 어느 `__init__()`으로 전달되는가?


---

# 21. 헷갈렸던 개념 다시 정리하기

오늘 객체지향을 배우면서 특히 다음 개념들이 서로 섞이기 쉬웠다.

- 클래스
- 객체
- 인스턴스
- 변수
- 함수
- 메서드
- 지역변수
- 전역변수
- 속성
- `self`

이 부분은 각각을 따로 외우기보다 **서로 어떤 관계인지 연결해서 이해하는 것이 중요하다.**

## 21.1 클래스 / 객체 / 인스턴스 / 변수

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p1 = Person("지현", 30)
```

정확하게 분해하면:

```text
Person
→ 클래스
→ Person 객체를 만들기 위한 설계도

Person("지현", 30)
→ Person 클래스를 호출하는 표현
→ 호출 결과 Person 객체가 하나 생성됨

생성된 Person 객체
→ 객체
→ 동시에 Person 클래스의 인스턴스

p1
→ 생성된 Person 객체를 가리키는 변수
```

머릿속에서는 다음처럼 생각하면 된다.

```text
p1
 ↓
┌────────────────────┐
│ Person 객체         │
│ name → "지현"      │
│ age  → 30          │
└────────────────────┘
```

중요한 점:

```text
p1
→ Person 객체 전체를 가리킴

p1.name
→ Person 객체 안의 name 속성

"지현"
→ name 속성이 가리키는 문자열 객체
```

즉:

```text
p1 → Person 객체 → name 속성 → "지현"
```

`p1` 자체가 `"지현"`인 것은 아니다.

---

## 21.2 객체(Object)

객체는 **파이썬 프로그램 안에서 실제로 존재하는 하나의 값 또는 대상**이다.

예:

```python
10
"지현"
[1, 2, 3]
{"name": "지현"}
```

각각 다음 클래스의 객체이다.

```text
10 → int 객체
"지현" → str 객체
[1, 2, 3] → list 객체
{"name": "지현"} → dict 객체
```

한 줄 정의:

> 객체는 파이썬 안에서 실제로 만들어져 존재하는 값 또는 대상이다.

---

## 21.3 객체와 변수는 다르다

```python
name = "지현"
```

객체 관점에서 보면:

```text
name
→ 변수 이름

"지현"
→ str 객체

name이라는 변수가 "지현" 객체를 가리킨다.
```

따라서:

> 변수는 객체 자체가 아니라 객체를 가리키는 이름이다.

리스트도 같다.

```python
numbers = [1, 2, 3]
```

```text
numbers → 변수
[1, 2, 3] → list 객체
```

---

## 21.4 인스턴스(Instance)

인스턴스는 객체와 완전히 다른 물건이 아니다.

**어떤 클래스로부터 만들어졌는지를 강조해서 객체를 부르는 표현**이다.

```python
class Person:
    pass

p1 = Person()
```

여기서 만들어진 실제 객체는:

```text
객체이다.
+
Person 클래스의 인스턴스이다.
```

차이는 관점이다.

```text
객체
→ 실제 존재하는 값이라는 점을 강조

인스턴스
→ 어떤 클래스에서 만들어졌는지를 강조
```

정확한 표현:

> `p1`은 변수이고, `p1`이 가리키는 객체가 Person 클래스의 인스턴스이다.

---

## 21.5 `Person()` 자체가 인스턴스인가?

```python
p1 = Person()
```

정확한 순서:

```text
Person
→ 클래스

Person()
→ 클래스를 호출하는 표현
→ 객체를 생성함

생성된 실제 객체
→ Person 클래스의 인스턴스

p1
→ 생성된 인스턴스 객체를 가리키는 변수
```

따라서 더 정확한 표현은:

> `Person()`을 호출한 결과 만들어진 객체가 Person 클래스의 인스턴스이다.

---

# 22. 함수와 클래스 비교

## 함수

함수는 **특정 작업을 수행하도록 묶어놓은 코드**이다.

```python
def add(a, b):
    return a + b
```

호출:

```python
result = add(3, 5)
```

한 줄 정의:

> 함수는 특정 작업을 수행하는 코드 묶음이다.

## 클래스

클래스는 **어떤 객체가 어떤 데이터와 기능을 가질지 정의해 둔 설계도**이다.

```python
class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        print("멍멍")
```

핵심 차이:

```text
def → 함수를 정의
class → 클래스를 정의
```

함수 이름은 보통 소문자, 클래스 이름은 보통 대문자로 시작하지만 이것은 문법 강제가 아니라 이름 짓기 관례이다.

---

# 23. 함수와 메서드

함수와 메서드는 둘 다 `def`로 만든다.

차이는 **클래스에 소속되어 있는가**이다.

함수:

```python
def hello():
    print("안녕하세요")
```

메서드:

```python
class Dog:
    def bark(self):
        print("멍멍")
```

한 줄 정의:

> 메서드는 클래스에 소속된 함수이다.

---

# 24. 변수 / 지역변수 / 전역변수

## 변수

```python
age = 20
```

```text
age → 변수 이름
20 → int 객체
```

## 전역변수

함수 밖에서 만들어진 변수이다.

```python
school = "스파르타"

def hello():
    print(school)
```

`school`은 전역변수이다.

## 지역변수

함수 또는 메서드 안에서 만들어져 그 함수가 실행되는 동안 주로 사용하는 변수이다.

```python
def add(a, b):
    result = a + b
    return result
```

`result`는 지역변수이다.

```python
number = add(3, 5)
```

```text
a = 3
b = 5
result = 8
→ add() 함수의 지역변수

return 8

number = 8
→ 함수 밖의 변수
```

`result`와 `number`는 서로 다른 변수이고 값만 둘 다 `8`이다.

---

# 25. 매개변수와 속성

```python
class Person:
    def __init__(self, name):
        self.name = name
```

여기에서:

```text
name
→ __init__의 매개변수

self.name
→ Person 객체의 속성
```

`name`과 `self.name`은 이름이 비슷하지만 역할이 다르다.

---

# 26. 지역변수와 객체 속성의 차이

```python
class Dog:
    def __init__(self, name):
        nickname = name
        self.name = name
```

```text
nickname
→ __init__ 안의 지역변수

self.name
→ Dog 객체의 속성
```

따라서:

```python
dog = Dog("초코")
print(dog.name)
```

은 가능하지만:

```python
print(dog.nickname)
```

은 불가능하다.

`nickname`을 객체 속성으로 저장한 적이 없기 때문이다.

---

# 27. `self` 다시 정리

`self`는 고정된 객체가 아니다.

> 현재 그 메서드를 실행하고 있는 인스턴스 객체 자신을 가리킨다.

```python
class Dog:
    def __init__(self, name):
        self.name = name

dog1 = Dog("초코")
dog2 = Dog("보리")
```

```text
dog1을 만들 때 self
→ dog1이 가리키는 Dog 객체

dog2를 만들 때 self
→ dog2가 가리키는 Dog 객체
```

즉:

```text
self라는 이름
→ 관례적으로 사용

self가 가리키는 객체
→ 호출한 객체에 따라 달라짐
```

---

# 28. `self.name = name` 정확히 이해하기

```python
class Person:
    def __init__(self, name):
        self.name = name
```

```python
p1 = Person("지현")
```

실행 흐름:

```text
Person("지현")
↓
"지현"이 name 매개변수로 전달
↓
name = "지현"
↓
self는 현재 생성 중인 Person 객체
↓
self.name = name
↓
현재 Person 객체의 name 속성이 "지현"을 가리킴
```

최종 구조:

```text
p1
 ↓
Person 객체
 └── name
      ↓
    "지현"
```

따라서:

```text
p1 자체 ≠ "지현"
p1.name = "지현"
```

---

# 29. 클래스 변수와 인스턴스 변수

```python
class Person:
    species = "human"

    def __init__(self, name):
        self.name = name
```

```text
species
→ 클래스 변수

self.name
→ 인스턴스 변수(객체의 속성)
```

예:

```python
p1 = Person("지현")
p2 = Person("철수")
```

```text
Person 클래스
└── species = "human"

p1 객체
└── name = "지현"

p2 객체
└── name = "철수"
```

---

# 30. 같은 객체를 여러 변수가 가리킬 수도 있다

```python
p1 = Person("지현")
p2 = p1
```

객체가 두 개 생성되는 것이 아니다.

```text
p1 ──┐
     ▼
  Person 객체 하나
     ▲
p2 ──┘
```

따라서 변수와 객체는 같은 개념이 아니다.

---

# 31. 헷갈렸던 표현 교정

### "p1이 인스턴스다"

개발 중에는 흔히 쓰지만 더 정확하게는:

> `p1`은 변수이고, `p1`이 가리키는 객체가 Person 클래스의 인스턴스이다.

### "Person()이 인스턴스다"

더 정확하게는:

> `Person()`을 호출한 결과 만들어진 객체가 Person 클래스의 인스턴스이다.

### "p1 = '지현'이다"

다음 코드에서는 틀리다.

```python
p1 = Person("지현")
```

정확하게는:

```text
p1 → Person 객체 전체
p1.name → "지현"
```

### "변수 안에 객체를 넣는다"

초보 설명으로는 가능하지만 객체 관점에서는:

> 변수 이름이 객체를 가리키도록 연결된다.

라고 이해하는 것이 더 정확하다.

### "클래스 안에 있는 변수는 인스턴스다"

틀리다.

```python
class Person:
    species = "human"
```

`species`는 인스턴스가 아니라 클래스 변수이다.

---

# 32. 오늘 헷갈린 개념 최종 연결

```python
class Person:
    species = "human"

    def __init__(self, name):
        message = "Person 생성"
        self.name = name

    def hello(self):
        greeting = "안녕하세요"
        print(greeting)

p1 = Person("지현")
```

| 코드 | 개념 |
|---|---|
| `Person` | 클래스 |
| `Person("지현")` | Person 클래스를 호출하여 객체를 생성하는 표현 |
| 생성된 실제 Person 객체 | 객체이자 Person 클래스의 인스턴스 |
| `p1` | Person 인스턴스 객체를 가리키는 변수 |
| `species` | 클래스 변수 |
| `name` | `__init__()`의 매개변수 |
| `self.name` | Person 인스턴스의 속성 |
| `message` | `__init__()`의 지역변수 |
| `hello()` | Person 클래스의 메서드 |
| `greeting` | `hello()` 메서드의 지역변수 |
| `self` | 현재 메서드를 실행 중인 Person 인스턴스 자신 |

---

# 33. 가장 중요한 그림

```text
                Person
                클래스
                  │
                  │ Person("지현") 호출
                  ▼
          ┌────────────────┐
p1 ─────→ │ Person 객체    │
          │ name → "지현"  │
          └────────────────┘

Person 객체
= 객체
= Person 클래스의 인스턴스

p1
= 그 객체를 가리키는 변수
```

---

# 34. 오늘 헷갈린 내용 한 줄씩

```text
클래스
→ 객체를 만들기 위한 설계도

객체
→ 프로그램 안에서 실제로 존재하는 값 또는 대상

인스턴스
→ 특정 클래스로부터 만들어진 객체라는 표현

변수
→ 객체를 가리키는 이름

함수
→ 특정 작업을 수행하도록 묶은 코드

메서드
→ 클래스에 소속된 함수

전역변수
→ 함수 밖에서 만든 변수

지역변수
→ 함수나 메서드 안에서 사용하는 변수

속성
→ 객체가 가지고 있는 데이터

self
→ 현재 메서드를 실행하고 있는 인스턴스 객체 자신
```

# 35. 오늘의 최종 핵심 문장

> 파이썬에서 변수는 값을 담는 상자라기보다 객체를 가리키는 이름으로 이해하는 것이 좋다. 클래스는 객체를 만들기 위한 설계도이고, 클래스를 호출하면 실제 객체가 생성된다. 그 객체를 특정 클래스와의 관계를 강조해서 인스턴스라고 부른다.

예:

```python
p1 = Person("지현")
```

```text
Person
→ 클래스

Person("지현")
→ 객체 생성 호출

생성된 객체
→ Person 클래스의 인스턴스

p1
→ 그 인스턴스를 가리키는 변수

p1.name
→ "지현"
```
