# [Python] 파일 입출력 · 구조화 데이터 · 데이터 분석 · 시각화 학습정리

> Python 3.13 / 10장 전체 정리  
> 범위: 10장 1강 ~ 2강

---

# 1. 오늘 학습 전체 구조

```text
10장 파일과 데이터 분석
│
├─ 1강. 파일 입출력과 구조화된 데이터 변환
│  ├─ with open()
│  ├─ read()
│  ├─ readline()
│  ├─ readlines()
│  ├─ CSV
│  ├─ JSON
│  ├─ 직렬화
│  ├─ 역직렬화
│  ├─ json.dump() / json.load()
│  └─ csv.writer() / csv.reader()
│
└─ 2강. 외부 라이브러리를 활용한 데이터 분석 및 시각화
   ├─ uv add
   ├─ pandas
   ├─ Series
   ├─ DataFrame
   ├─ info()
   ├─ describe()
   ├─ matplotlib
   ├─ plt.plot()
   ├─ plt.title()
   ├─ plt.grid()
   └─ plt.show()
```

10장의 핵심 흐름:

```text
파일에서 데이터를 읽는다
↓
Python 자료구조로 바꾼다
↓
필요하면 CSV / JSON으로 저장한다
↓
Pandas DataFrame으로 표 형태 데이터를 분석한다
↓
info() / describe()로 구조와 통계를 확인한다
↓
Matplotlib으로 시각화한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 파일 입출력 | 파일을 읽고 쓰는 작업 |
| `with open()` | 파일을 안전하게 열고 자동으로 닫는 방식 |
| `read()` | 파일 전체를 하나의 문자열로 읽기 |
| `readline()` | 한 줄씩 읽기 |
| `readlines()` | 모든 줄을 리스트로 읽기 |
| CSV | 쉼표로 구분된 표 형태 텍스트 데이터 |
| JSON | Key-Value 구조를 표현하는 표준 텍스트 포맷 |
| 직렬화 | Python 객체를 저장/전송 가능한 형태로 변환 |
| 역직렬화 | 저장된 텍스트를 Python 객체로 복원 |
| `json.dumps()` | Python 객체 → JSON 문자열 |
| `json.loads()` | JSON 문자열 → Python 객체 |
| `json.dump()` | Python 객체 → JSON 파일 |
| `json.load()` | JSON 파일 → Python 객체 |
| Pandas | 표 형태 데이터를 다루는 데이터 분석 라이브러리 |
| Series | 1차원 데이터 구조 |
| DataFrame | 2차원 표 형태 데이터 구조 |
| `info()` | 데이터프레임 구조와 타입 확인 |
| `describe()` | 수치형 데이터의 기초 통계 요약 |
| Matplotlib | 데이터 시각화 라이브러리 |
| `plt.plot()` | 선 그래프 생성 |
| `plt.show()` | 그래프 최종 출력 |

---

# 3. 1강 — 파일 입출력

프로그램이 종료되면 메모리의 데이터는 사라진다.

데이터를 계속 보관하려면 파일에 저장해야 한다.

기본 흐름:

```text
파일 열기
↓
읽기 또는 쓰기
↓
파일 닫기
```

---

# 4. `with open()`

```python
with open("test.txt", "w", encoding="utf-8") as file:
    file.write("파이썬 파일 입출력 공부 시작!\n")
```

핵심:

> `with` 블록이 끝나면 파일이 자동으로 닫힌다.

따라서 직접:

```python
file.close()
```

를 매번 작성하지 않아도 된다.

---

# 5. 파일 모드

자주 쓰는 모드:

```text
"r" → 읽기
"w" → 쓰기
```

`w` 모드는 기존 파일 내용을 덮어쓸 수 있으므로 주의한다.

---

# 6. `read()`

```python
with open("test.txt", "r", encoding="utf-8") as file:
    content = file.read()
```

파일 전체 내용을 하나의 문자열로 읽는다.

적합한 경우:

```text
파일 크기가 작고
전체 내용을 한 번에 다룰 때
```

---

# 7. `readline()`

```python
with open("test.txt", "r", encoding="utf-8") as file:
    line = file.readline()
```

한 번 호출할 때 한 줄씩 읽는다.

대용량 파일을 조금씩 처리할 때 유리하다.

---

# 8. `readlines()`

```python
with open("test.txt", "r", encoding="utf-8") as file:
    lines = file.readlines()
```

결과 예:

```python
[
    "첫 번째 줄\n",
    "두 번째 줄\n",
    "세 번째 줄\n"
]
```

즉 모든 줄을 리스트로 반환한다.

---

# 9. `strip()`

```python
line.strip()
```

문자열 양쪽의 공백이나 줄바꿈 문자를 제거할 때 사용한다.

---

# 10. 텍스트 파일 가공 예제

```python
with open("source.txt", "r", encoding="utf-8") as infile:
    lines = infile.readlines()

with open("result.txt", "w", encoding="utf-8") as outfile:
    for index, line in enumerate(lines, start=1):
        outfile.write(f"{index}번 줄: {line}")
```

실행 흐름:

```text
파일 읽기
↓
줄별 리스트 생성
↓
enumerate()로 번호 부여
↓
새 파일에 저장
```

---

# 11. CSV

CSV:

```text
Comma-Separated Values
```

쉼표로 칸을 구분하는 표 형식의 텍스트 파일이다.

예:

```text
이름,나이,소속
홍길동,20,스파르타
```

Python에서는 보통 2차원 리스트와 연결해서 다룬다.

---

# 12. CSV 쓰기

```python
import csv

with open("data.csv", "w", encoding="utf-8", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["이름", "나이", "소속"])
    writer.writerow(["홍길동", "20", "스파르타"])
```

여러 행을 한 번에 저장:

```python
writer.writerows(member_data)
```

---

# 13. CSV 읽기

```python
with open("data.csv", "r", encoding="utf-8") as file:
    reader = csv.reader(file)
    data_list = list(reader)
```

결과:

```python
[
    ["이름", "나이", "소속"],
    ["홍길동", "20", "스파르타"]
]
```

주의:

> CSV로 읽은 값은 기본적으로 문자열이다.

숫자처럼 보여도 필요한 경우 직접 형변환해야 한다.

---

# 14. JSON

JSON은 웹에서 자주 사용하는 구조화된 텍스트 형식이다.

예:

```json
{
  "name": "스파르타",
  "level": 5,
  "skills": ["Python", "Django"]
}
```

Python에서는 다음과 연결된다.

```text
JSON Object → dict
JSON Array  → list
```

---

# 15. `json.loads()`

JSON 문자열을 Python 객체로 바꾼다.

```python
import json

json_data = '{"name": "스파르타", "level": 5}'
user_dict = json.loads(json_data)
```

결과:

```python
type(user_dict)
```

```text
dict
```

---

# 16. 직렬화와 역직렬화

## 직렬화

```text
Python 객체
↓
저장/전송 가능한 텍스트
```

## 역직렬화

```text
JSON 텍스트
↓
Python 객체
```

---

# 17. `dump`, `dumps`, `load`, `loads`

| 함수 | 역할 |
|---|---|
| `json.dumps()` | Python 객체 → JSON 문자열 |
| `json.loads()` | JSON 문자열 → Python 객체 |
| `json.dump()` | Python 객체 → JSON 파일 |
| `json.load()` | JSON 파일 → Python 객체 |

핵심 구분:

```text
s가 붙으면 문자열(string)
s가 없으면 파일(file)
```

---

# 18. JSON 파일 저장

```python
info = {
    "title": "Python Course",
    "students": 120
}

with open("info.json", "w", encoding="utf-8") as file:
    json.dump(info, file, indent=4)
```

---

# 19. JSON 파일 읽기

```python
with open("info.json", "r", encoding="utf-8") as file:
    restored_info = json.load(file)
```

이후 딕셔너리처럼 사용:

```python
restored_info["title"]
```

---

# 20. 2강 — 외부 라이브러리

파이썬 기본 설치에 포함되지 않은 기능은 외부 라이브러리를 설치해서 사용할 수 있다.

대표:

```text
NumPy
Pandas
Matplotlib
```

---

# 21. `uv add`

프로젝트에 라이브러리 추가:

```bash
uv add pandas matplotlib numpy
```

이 명령으로:

```text
패키지 설치
+
pyproject.toml 의존성 기록
```

이 함께 이루어진다.

---

# 22. Pandas

Pandas는 표 형태의 데이터를 다루는 데이터 분석 라이브러리다.

핵심 자료구조:

```text
Series
DataFrame
```

---

# 23. Series

1차원 데이터 구조.

개념적으로:

```text
하나의 열
```

과 비슷하게 생각하면 된다.

---

# 24. DataFrame

2차원 표 형태 데이터 구조.

```text
행(Row)
+
열(Column)
```

Excel 시트나 데이터베이스 테이블과 비슷하다.

---

# 25. DataFrame 만들기

```python
import pandas as pd

data = {
    "과목": ["파이썬", "장고", "데이터분석"],
    "수강생수": [120, 85, 95]
}

df = pd.DataFrame(data)
```

실행 흐름:

```text
dict
↓
pd.DataFrame()
↓
2차원 표 데이터
```

---

# 26. Jupyter에서 DataFrame 출력

Notebook에서는:

```python
df
```

처럼 마지막 줄에 변수명만 써도 표 형태로 보기 좋게 렌더링된다.

---

# 27. `info()`

```python
df.info()
```

확인할 수 있는 것:

```text
열 이름
Non-Null 개수
데이터 타입
전체 구조
```

즉:

> 데이터의 구조를 확인하는 함수

---

# 28. `describe()`

```python
df.describe()
```

수치형 데이터의 기초 통계를 보여준다.

대표 항목:

```text
count
mean
std
min
25%
50%
75%
max
```

즉:

> 데이터의 수치적 특징을 빠르게 확인하는 함수

---

# 29. Matplotlib

데이터를 그래프로 표현하는 시각화 라이브러리다.

주로:

```python
import matplotlib.pyplot as plt
```

형태로 불러온다.

---

# 30. 선 그래프 만들기

```python
x = [1, 2, 3, 4]
y = [10, 25, 13, 30]

plt.plot(x, y)
plt.show()
```

---

# 31. 그래프 꾸미기

```python
plt.title("Sample Chart")
plt.xlabel("X")
plt.ylabel("Y")
plt.grid(True)
plt.legend()
```

대표 역할:

| 함수 | 역할 |
|---|---|
| `plt.plot()` | 그래프 생성 |
| `plt.title()` | 제목 |
| `plt.xlabel()` | X축 이름 |
| `plt.ylabel()` | Y축 이름 |
| `plt.grid()` | 격자 |
| `plt.legend()` | 범례 |
| `plt.show()` | 최종 출력 |

---

# 32. DataFrame과 Matplotlib 연결

```python
plt.plot(df_sales["월"], df_sales["매출"])
```

실행 의미:

```text
df_sales["월"]
→ X축

df_sales["매출"]
→ Y축
```

즉 DataFrame의 특정 열을 그래프 축에 연결한다.

---

# 33. 전체 분석 흐름

```text
원본 데이터
↓
파일에서 읽기
↓
CSV / JSON
↓
Python list / dict
↓
Pandas DataFrame
↓
info()
↓
describe()
↓
Matplotlib
↓
그래프 시각화
```

---

# 34. 헷갈리기 쉬운 개념 리뷰

## `read()` vs `readlines()`

```text
read()
→ 전체를 하나의 문자열

readlines()
→ 각 줄을 리스트 요소로
```

## CSV vs JSON

```text
CSV
→ 표 형식
→ 행/열 구조

JSON
→ Key-Value 계층 구조
→ dict/list와 연결
```

## `dump()` vs `dumps()`

```text
dump()
→ 파일에 저장

dumps()
→ 문자열로 변환
```

## `load()` vs `loads()`

```text
load()
→ 파일에서 읽음

loads()
→ 문자열에서 읽음
```

## Series vs DataFrame

```text
Series
→ 1차원

DataFrame
→ 2차원
```

## `info()` vs `describe()`

```text
info()
→ 구조 / 타입 / 결측 여부

describe()
→ 수치 통계
```

---

# 35. 지금 반드시 알아야 하는 내용

## 반드시 이해

- 파일이 필요한 이유
- `with open()`
- `"r"` / `"w"`
- `read()`
- `readline()`
- `readlines()`
- CSV 기본 구조
- JSON 기본 구조
- 직렬화 / 역직렬화
- `json.dump()` / `json.load()`
- `json.dumps()` / `json.loads()`
- `uv add`
- Pandas
- Series
- DataFrame
- `pd.DataFrame()`
- `info()`
- `describe()`
- Matplotlib
- `plt.plot()`
- `plt.show()`

## 나중에 더 깊게 봐도 되는 내용

- 파일 버퍼링
- 대용량 스트리밍 처리
- CSV Dialect
- JSON Schema
- Pandas 인덱스 심화
- 결측치 처리
- 그룹 연산
- 다양한 Matplotlib 차트
- NumPy 내부 구조

---

# 36. 10장 핵심 한 줄 요약

> **파일 입출력으로 데이터를 저장하고 불러오며, CSV·JSON으로 구조화하고, Pandas로 분석한 뒤 Matplotlib으로 시각화한다.**
