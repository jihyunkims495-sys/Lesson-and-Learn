# [Python] 동기·비동기 · 코루틴 · 비동기 태스크 학습정리

> Python 3.13 / 11장 전체 정리  
> 범위: 11장 1강 ~ 3강

---

# 1. 오늘 학습 전체 구조

```text
11장 비동기 프로그래밍
│
├─ 1강. 동기(Sync) vs 비동기(Async)
│  ├─ CPU Bound
│  ├─ I/O Bound
│  ├─ Blocking
│  ├─ Non-blocking
│  ├─ Event Loop
│  ├─ Call Stack
│  ├─ Background
│  └─ Callback Queue
│
├─ 2강. Coroutine과 async / await
│  ├─ Coroutine
│  ├─ async def
│  ├─ await
│  ├─ asyncio.sleep()
│  ├─ asyncio.gather()
│  ├─ Jupyter 실행 방식
│  └─ asyncio.run()
│
└─ 3강. 비동기 태스크 동시 처리
   ├─ asyncio.gather()
   ├─ httpx.Client
   ├─ httpx.AsyncClient
   ├─ 동기 vs 비동기 HTTP 요청
   ├─ Blocking 함수 혼용 문제
   ├─ try-except
   ├─ Type Hint
   └─ 성능 비교
```

11장의 전체 흐름:

```text
작업에는 연산 시간이 있고 대기 시간이 있다
↓
대기 시간에는 CPU가 놀 수 있다
↓
비동기는 이 대기 시간에 다른 작업을 진행한다
↓
이벤트 루프가 작업 순서를 관리한다
↓
async def로 코루틴을 만든다
↓
await에서 제어권을 양보한다
↓
gather()로 여러 코루틴을 동시에 스케줄링한다
↓
httpx.AsyncClient로 실제 I/O 작업을 병렬적으로 처리한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 동기 | 앞 작업이 끝난 뒤 다음 작업 실행 |
| 비동기 | 대기 중 다른 작업을 진행 |
| CPU Bound | CPU 연산량이 전체 속도를 좌우 |
| I/O Bound | 네트워크·파일 등 외부 응답 대기가 속도를 좌우 |
| Blocking | 작업이 끝날 때까지 제어권을 붙잡음 |
| Non-blocking | 대기 중 제어권을 돌려줌 |
| Event Loop | 비동기 작업의 실행 순서를 조율 |
| Coroutine | 실행을 중단했다가 다시 이어갈 수 있는 함수 |
| `async def` | 코루틴 함수 정의 |
| `await` | 대기하면서 이벤트 루프에 제어권 양보 |
| `asyncio.gather()` | 여러 코루틴을 동시에 실행하고 결과 취합 |
| `asyncio.run()` | 일반 `.py`에서 이벤트 루프 생성·실행 |
| `httpx.AsyncClient` | 비동기 HTTP 요청 클라이언트 |
| try-except | 네트워크 오류 시 전체 중단 방지 |
| Type Hint | 인수·변수에 예상 타입을 표시하는 명세 |

---

# 3. 1강 — 동기와 비동기

## 동기(Synchronous)

```text
작업 A 시작
↓
작업 A 종료
↓
작업 B 시작
↓
작업 B 종료
```

앞선 작업이 끝나야 다음 작업이 실행된다.

예:

```python
download_data("서울", 2)
download_data("뉴욕", 3)
```

총 대기 시간은 대략:

```text
2초 + 3초 = 5초
```

---

## 비동기(Asynchronous)

```text
작업 A 요청
↓
A 대기 중
↓
작업 B 실행
↓
완료된 작업부터 처리
```

대기 시간이 발생하면 다른 작업으로 넘어간다.

---

# 4. CPU Bound vs I/O Bound

## CPU Bound

CPU가 계속 계산해야 하는 작업.

예:

```text
대용량 압축
암호화
영상 렌더링
복잡한 수치 계산
```

핵심:

> CPU 성능이 전체 속도를 결정한다.

---

## I/O Bound

외부 입력·출력을 기다리는 시간이 긴 작업.

예:

```text
API 요청
파일 다운로드
DB 조회
네트워크 통신
```

핵심:

> CPU가 계산하는 시간보다 외부 응답 대기 시간이 더 크다.

비동기는 특히 I/O Bound 작업에서 효과적이다.

---

# 5. Blocking vs Non-blocking

## Blocking

```text
하위 작업 요청
↓
끝날 때까지 기다림
↓
다음 코드 실행
```

예:

```python
time.sleep(3)
```

이 시간 동안 현재 실행 흐름은 멈춘다.

---

## Non-blocking

```text
하위 작업 요청
↓
대기 시작
↓
제어권 반환
↓
다른 작업 실행
```

비동기 코드에서는 `await` 지점에서 이런 흐름이 만들어진다.

---

# 6. 이벤트 루프(Event Loop)

이벤트 루프는 비동기 작업을 관리하는 중앙 관리자다.

교안의 카페 비유:

```text
Call Stack
→ 지금 직접 처리 중인 작업

Background
→ 네트워크/파일 등 외부 대기 작업

Callback Queue
→ 완료되어 다시 실행되기를 기다리는 작업
```

이벤트 루프는 현재 실행 공간이 비었을 때 완료된 작업을 다시 실행시킨다.

---

# 7. 동기 코드 예제

```python
import time

def download_data(name, delay):
    print(f"[시작] {name}")
    time.sleep(delay)
    print(f"[완료] {name}")
```

`time.sleep()`은 Blocking이다.

---

# 8. 비동기 코드 예제

```python
import asyncio

async def download_data_async(name, delay):
    print(f"[시작] {name}")
    await asyncio.sleep(delay)
    print(f"[완료] {name}")
```

핵심:

```text
async def
→ 비동기 함수 정의

await
→ 대기 + 제어권 양보
```

---

# 9. 2강 — 코루틴(Coroutine)

코루틴은 실행을 잠시 멈췄다가 다시 이어갈 수 있는 함수다.

일반 함수:

```text
시작
↓
끝까지 실행
↓
종료
```

코루틴:

```text
시작
↓
await
↓
일시 정지
↓
다른 작업
↓
다시 재개
```

---

# 10. `async def`

```python
async def brew_coffee(customer_name, wait_seconds):
    ...
```

`async def`로 정의된 함수는 호출 즉시 일반 결과값을 내놓는 함수가 아니라 코루틴 객체를 만든다.

---

# 11. `await`

```python
await asyncio.sleep(wait_seconds)
```

`await`를 만나면:

```text
현재 작업 대기
↓
제어권을 이벤트 루프에 양보
↓
다른 코루틴 실행 가능
↓
대기 완료
↓
원래 위치에서 재개
```

---

# 12. Jupyter와 `.py` 실행 방식 차이

## Jupyter Notebook

이미 이벤트 루프가 실행 중이므로:

```python
await main()
```

사용.

## 일반 `.py`

직접 이벤트 루프를 만들어야 하므로:

```python
asyncio.run(main())
```

사용.

핵심:

```text
Jupyter
→ await main()

.py
→ asyncio.run(main())
```

---

# 13. `asyncio.gather()`

여러 코루틴을 동시에 실행하도록 등록한다.

```python
results = await asyncio.gather(
    brew_coffee("철수", 3),
    brew_coffee("영희", 1)
)
```

실행 흐름:

```text
철수 작업 시작
영희 작업 시작
↓
둘 다 대기
↓
1초 후 영희 완료
↓
3초 후 철수 완료
↓
전체 종료
```

총 시간은:

```text
3초 + 1초 = 4초
```

가 아니라 대략:

```text
max(3초, 1초) = 3초
```

가 된다.

---

# 14. gather의 결과

`asyncio.gather()`는 여러 코루틴의 결과를 모아서 반환한다.

```python
results = await asyncio.gather(task1(), task2())
```

결과는 각 코루틴의 반환값을 담은 리스트 형태로 받을 수 있다.

---

# 15. 3강 — HTTP 비동기 통신

외부 API 요청은 대표적인 I/O Bound 작업이다.

따라서 비동기 방식으로 처리하면 대기 시간을 겹쳐 사용할 수 있다.

---

# 16. httpx

설치:

```bash
uv add httpx pandas
```

동기 클라이언트:

```python
httpx.Client()
```

비동기 클라이언트:

```python
httpx.AsyncClient()
```

---

# 17. 동기 HTTP 요청

```python
with httpx.Client() as client:
    response = client.get(url)
```

요청 후 응답이 올 때까지 현재 실행 흐름이 대기한다.

즉 Blocking 방식이다.

---

# 18. 비동기 HTTP 요청

```python
async with httpx.AsyncClient() as client:
    response = await client.get(url)
```

핵심:

```text
AsyncClient
+
await
```

를 사용한다.

`await`가 있어야 네트워크 응답을 기다리는 동안 이벤트 루프가 다른 작업을 실행할 수 있다.

---

# 19. httpx Response

대표 기능:

| 속성/메서드 | 역할 |
|---|---|
| `.status_code` | HTTP 상태 코드 |
| `.text` | 응답 문자열 |
| `.content` | 응답 bytes |
| `.json()` | JSON → Python 객체 |
| `.raise_for_status()` | 4xx/5xx 응답이면 예외 발생 |

---

# 20. 여러 API 동시 요청

```python
tasks = [
    fetch_post_async(client, post_id)
    for post_id in POST_IDS
]

results = await asyncio.gather(*tasks)
```

실행 구조:

```text
10개 코루틴 생성
↓
gather에 등록
↓
API 요청 거의 동시에 전송
↓
각 요청은 응답 대기
↓
이벤트 루프가 다른 태스크 실행
↓
모두 완료 후 결과 취합
```

---

# 21. 동기 vs 비동기 성능 차이

동기:

```text
요청 1 대기
↓
요청 2 대기
↓
요청 3 대기
```

비동기:

```text
요청 1
요청 2
요청 3
거의 동시에 시작
↓
대기 시간 중첩
```

따라서 여러 I/O 작업에서는 비동기가 유리할 수 있다.

---

# 22. 비동기 코드 안의 Blocking 함수 문제

잘못된 예:

```python
async def broken():
    time.sleep(3)
```

또는:

```python
async def broken():
    requests.get(url)
```

문제:

```text
async 함수 안에 있음
↓
하지만 내부 작업은 Blocking
↓
이벤트 루프가 멈춤
↓
다른 코루틴 실행 못함
```

즉:

> `async def`라고 해서 내부 코드가 자동으로 비동기가 되는 것은 아니다.

---

# 23. 올바른 비동기 대기

```python
await asyncio.sleep(3)
```

네트워크:

```python
response = await client.get(url)
```

핵심:

> 대기 시간이 있는 I/O 작업은 비동기 지원 함수와 `await`를 함께 사용해야 한다.

---

# 24. try-except 예외 처리

외부 API는 언제든 실패할 수 있다.

```python
try:
    response = await client.get(url)
    response.raise_for_status()
except httpx.HTTPError as error:
    print(error)
```

목적:

```text
특정 요청 실패
↓
전체 프로그램 종료 방지
↓
대체 처리
↓
나머지 작업 계속
```

---

# 25. `return_exceptions`

```python
await asyncio.gather(
    *tasks,
    return_exceptions=True
)
```

교안 기준:

```text
False
→ 예외가 발생하면 전체 흐름에 영향을 줄 수 있음

True
→ 예외를 결과 객체로 수집
→ 다른 작업은 계속 완료 가능
```

---

# 26. TaskGroup

Python 3.11부터:

```python
asyncio.TaskGroup
```

을 사용할 수 있다.

여러 태스크를 구조적으로 관리하는 현대적인 방식이다.

지금 단계에서는:

```text
gather()
→ 여러 코루틴을 동시에 실행하고 결과 취합
```

을 먼저 확실히 이해하면 된다.

---

# 27. 타입 힌트(Type Hint)

```python
async def fetch_post_async(
    client: httpx.AsyncClient,
    post_id: int
):
```

여기서:

```text
client: httpx.AsyncClient
post_id: int
```

는 타입 힌트다.

의미:

```text
client에는 AsyncClient 객체가 들어올 것으로 예상
post_id에는 int가 들어올 것으로 예상
```

실행을 강제로 제한하는 문법이라기보다 개발자가 타입을 이해하도록 돕는 명세 역할을 한다.

---

# 28. 11장 전체 연결 구조

```text
CPU Bound / I/O Bound
↓
Blocking / Non-blocking
↓
Event Loop
↓
Coroutine
↓
async def
↓
await
↓
asyncio.gather()
↓
AsyncClient
↓
여러 I/O 태스크 동시 실행
↓
try-except
↓
안전한 비동기 프로그램
```

---

# 29. 헷갈리기 쉬운 개념 리뷰

## 동기 vs Blocking

둘은 같은 말이 아니다.

교안에서 함께 등장하지만 개념의 기준이 다르다.

```text
동기 / 비동기
→ 작업 완료 시점을 어떻게 연결할지

Blocking / Non-blocking
→ 제어권을 누가 가지고 있는지
```

---

## 비동기 vs 병렬

비동기는 여러 작업의 대기 시간을 효율적으로 겹쳐 처리하는 방식이다.

항상 여러 CPU 코어에서 실제로 동시에 연산하는 병렬 처리와 같은 의미는 아니다.

---

## CPU Bound vs I/O Bound

```text
CPU Bound
→ 계산이 병목

I/O Bound
→ 기다림이 병목
```

비동기는 특히 I/O Bound에서 강점을 가진다.

---

## `time.sleep()` vs `asyncio.sleep()`

```text
time.sleep()
→ Blocking

await asyncio.sleep()
→ 제어권 양보
```

---

## `async def` vs `await`

```text
async def
→ 코루틴 함수 정의

await
→ 코루틴의 대기 지점에서 제어권 양보
```

---

## Jupyter vs `.py`

```text
Jupyter
→ await main()

.py
→ asyncio.run(main())
```

---

## `Client` vs `AsyncClient`

```text
httpx.Client
→ 동기

httpx.AsyncClient
→ 비동기
```

---

# 30. 지금 반드시 알아야 하는 내용

## 반드시 이해

- 동기와 비동기 차이
- CPU Bound / I/O Bound
- Blocking / Non-blocking
- 이벤트 루프 기본 구조
- 코루틴
- `async def`
- `await`
- `asyncio.sleep()`
- `asyncio.gather()`
- Jupyter의 `await main()`
- `.py`의 `asyncio.run(main())`
- `httpx.AsyncClient`
- `await client.get()`
- 비동기 함수 안에서 Blocking 함수를 쓰면 안 되는 이유
- `try-except`
- 타입 힌트의 기본 의미

## 나중에 더 깊게 봐도 되는 내용

- `asyncio.TaskGroup`
- `asyncio.create_task()`
- Semaphore
- Timeout
- Retry
- Rate Limit
- Connection Pool
- Thread / Process와의 비교
- CPU Bound 병렬 처리
- FastAPI의 async 처리 구조

---

# 31. 11장 핵심 한 줄 요약

> **비동기 프로그래밍은 I/O 대기 시간에 제어권을 이벤트 루프에 양보하여 다른 작업을 진행하고, async/await와 gather를 이용해 여러 코루틴을 효율적으로 동시에 처리하는 방식이다.**
