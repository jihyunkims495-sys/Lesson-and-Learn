# 4장 예습 - APIRouter, Middleware, BackgroundTasks, StreamingResponse

- 학습일: 2026-10-29
- 과정: AI Agent Bootcamp LV.2 / Week 11
- 범위: APIRouter와 Middleware, BackgroundTasks와 스트리밍 파일 처리
- 문서 성격: 수업 전 예습
- 실습 상태: 아래 항목은 예정 실습이며 아직 실행하지 않음
- 이해도 상태: 이 문서에서는 평가하지 않음

## 1. 이번 범위의 큰 구조

4장 1강은 **요청을 어떤 기능 코드로 보낼지**, 그리고 모든 요청의 공통 길목을 어떻게 제어할지를 다룬다. 4장 2강은 **큰 파일과 오래 걸리는 후속 작업을 어떻게 다룰지**로 이어진다.

```text
클라이언트 요청
  → 전역 Middleware 전처리
  → APIRouter가 endpoint 선택
  → router dependency로 기능별 공통 검사
  → endpoint가 요청 처리
  → 정상 응답 생성
  → 전역 Middleware 후처리
  → 클라이언트 응답
```

파일 처리 흐름은 다음과 같다.

```text
multipart/form-data 업로드
  → UploadFile 수신
  → 파일을 청크 단위로 저장
  → 도메인 객체를 PENDING 상태로 등록
  → BackgroundTasks에 후속 작업 예약
  → 업로드 응답 반환
  → 응답 이후 후속 작업 실행
  → PROCESSING → COMPLETED 상태 변경
```

다운로드 흐름은 다음과 같다.

```text
다운로드 요청
  → 자산·실제 파일 존재 확인
  → 비동기 제너레이터가 파일 일부를 읽음
  → yield로 청크 생성
  → StreamingResponse가 청크를 순서대로 전송
  → 파일 끝까지 반복
```

## 2. 학습 목표

### 4장 1강 - APIRouter와 미들웨어

1. `APIRouter`로 회원·상품·주문처럼 기능별 endpoint를 분리한다.
2. `prefix`, `tags`, `dependencies`가 router 전체에 미치는 영향을 설명한다.
3. 분리한 router를 `app.include_router()`로 하나의 FastAPI 앱에 등록한다.
4. Middleware의 요청 전처리와 응답 후처리 위치를 구분한다.
5. 여러 Middleware가 겹칠 때 요청·응답 실행 순서를 추적한다.
6. 전역 Middleware와 특정 router의 `Depends`를 적용 범위에 따라 선택한다.
7. 메인 모듈의 로그 설정과 하위 모듈의 이름 있는 logger를 연결한다.

### 4장 2강 - 백그라운드 태스크 및 스트리밍 파일 처리

1. `bytes`와 `UploadFile`의 메모리 사용 방식과 메타데이터 차이를 구분한다.
2. 업로드 파일을 청크 단위로 읽고 저장하는 흐름을 이해한다.
3. 업로드 용량·파일명·MIME 유형을 별도로 검증해야 하는 이유를 설명한다.
4. `BackgroundTasks.add_task()`로 응답 이후 실행할 후속 작업을 예약한다.
5. `PENDING → PROCESSING → COMPLETED` 상태 전이를 통해 비동기 후속 작업을 관찰한다.
6. 비동기 제너레이터와 `yield`가 `StreamingResponse`에 데이터를 공급하는 흐름을 추적한다.
7. 업로드·백그라운드 처리·스트리밍 각각의 실패 지점을 분리한다.

## 3. 선행 개념

| 선행 개념 | 이번 범위와의 연결 |
|---|---|
| FastAPI 앱 | `app = FastAPI()`가 모든 router와 middleware를 통합하는 중심이다. |
| endpoint와 HTTP 메서드 | router 파일로 옮겨도 `@router.get`, `@router.post`가 요청을 함수에 연결한다. |
| Path·Query·Header | `X-Delivery-Token` 같은 Header 값도 FastAPI가 매개변수로 수집·검증한다. |
| Pydantic Schema | 업로드 메타데이터·회원·배송 요청과 응답 구조를 검증한다. |
| `HTTPException` | dependency 또는 endpoint에서 요청을 중단하고 오류 응답을 만든다. |
| `async`·`await` | 파일 읽기·쓰기와 후속 작업의 대기 지점에서 다른 작업에 실행 기회를 넘긴다. |
| 반복자·제너레이터 | `yield`가 전체 결과 대신 다음 데이터 조각을 하나씩 제공한다. |
| HTTP Header | 토큰, `Content-Type`, `Content-Disposition`, `Content-Length`가 요청·응답 의미를 전달한다. |
| MIME type | `image/png`, `video/mp4`처럼 파일 내용의 형식을 나타낸다. |

## 4. 4장 1강 핵심 개념

### 4.1 APIRouter는 새 서버가 아니다

`APIRouter`는 관련 endpoint를 묶는 등록용 컨테이너다. router 파일만 만들었다고 URL이 활성화되는 것은 아니다. 메인 앱에서 `include_router()`로 등록해야 외부 요청이 해당 endpoint에 도달한다.

```python
# routers/users.py
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("")
async def list_users():
    return []
```

```python
# main.py
from fastapi import FastAPI
from routers.users import router as user_router

app = FastAPI()
app.include_router(user_router)
```

최종 URL은 router의 `prefix`와 endpoint decorator의 경로가 결합되어 결정된다.

```text
prefix="/users" + @router.get("")       → GET /users
prefix="/users" + @router.get("/{id}") → GET /users/{id}
```

### 4.2 router 설정의 역할

| 설정 | 역할 | 관찰 지점 |
|---|---|---|
| `prefix` | router 안 endpoint의 공통 URL 시작 부분 | 실제 요청 URL |
| `tags` | endpoint를 문서에서 기능별로 묶음 | `/docs`, `/redoc` |
| `dependencies` | router의 모든 endpoint 전에 공통 검사 실행 | 요청 성공·실패와 로그 |
| `include_router` | 분리한 router를 FastAPI 앱의 route 목록에 등록 | `/docs`의 endpoint 목록 |

### 4.3 Middleware의 위치

Middleware는 특정 endpoint가 실행되기 전과 응답이 나가기 직전에 모든 HTTP 흐름을 감싼다.

```python
@app.middleware("http")
async def measure_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.perf_counter() - start)
    return response
```

`await call_next(request)`가 경계다.

- 위쪽: endpoint 실행 전 전처리
- `await call_next(request)`: 다음 middleware 또는 router·endpoint로 이동
- 아래쪽: endpoint가 만든 응답에 대한 후처리

### 4.4 Middleware 실행 순서

나중에 추가된 Middleware가 가장 바깥에서 애플리케이션을 감싼다.

```text
등록: Middleware A → Middleware B

요청: B 전처리 → A 전처리 → endpoint
응답: endpoint → A 후처리 → B 후처리
```

코드 줄의 위아래만 보고 실행 순서를 판단하지 않고, **겹겹이 감싼 스택**으로 추적해야 한다.

### 4.5 Middleware와 Depends 선택 기준

| 구분 | Middleware | router dependency |
|---|---|---|
| 적용 범위 | 거의 모든 HTTP 요청·응답 | 특정 router 또는 endpoint |
| 대표 목적 | 처리 시간, 공통 로그, 호스트·CORS 정책 | 인증·인가, 기능별 검사, DB 세션 |
| 실행 위치 | router 선택 전후의 전역 통로 | endpoint 실행 준비 단계 |
| 오류 처리 | middleware 계층의 응답 흐름을 고려 | `HTTPException` 등 FastAPI 흐름 사용 |

판단 질문은 간단하다.

> 이 규칙이 `/docs`와 정적 파일을 포함한 거의 모든 요청에 필요한가, 특정 기능 그룹에만 필요한가?

### 4.6 로깅 모듈화

로그 출력 형식은 메인 시작점에서 한 번 설정하고, 하위 모듈은 이름 있는 logger를 사용한다.

```python
# main.py
logging.basicConfig(level=logging.INFO)

# routers/deliveries.py
logger = logging.getLogger("delivery_system.deliveries")
```

모듈 이름이 로그에 남으면 어느 기능에서 발생한 기록인지 추적하기 쉬워진다.

## 5. 4장 2강 핵심 개념

### 5.1 bytes와 UploadFile

| 구분 | `bytes = File()` | `UploadFile` |
|---|---|---|
| 파일 내용 | 전체 내용을 메모리에 읽은 뒤 전달 | spooled file 객체로 제공 |
| 큰 파일 | 메모리 사용량이 파일 크기만큼 증가 | 일정 크기 이후 임시 디스크를 활용할 수 있음 |
| 메타데이터 | 직접 얻기 어려움 | `filename`, `content_type` 제공 |
| 인터페이스 | 이미 준비된 bytes | `read`, `write`, `seek`, `close` async 메서드 |
| 적합한 경우 | 크기가 작고 제한이 확실한 파일 | 이미지·영상 등 큰 바이너리 |

`UploadFile`을 쓴다고 업로드 정책이 자동으로 완성되는 것은 아니다. 최소한 다음을 별도로 결정해야 한다.

- 최대 허용 용량
- 허용 MIME type과 실제 파일 내용 검사
- 원본 파일명 정규화
- 저장 경로와 덮어쓰기 정책
- 중간 실패 시 불완전 파일 제거
- 동일 파일·중복 요청 처리

### 5.2 업로드 저장 흐름

```python
while True:
    chunk = await file.read(1024 * 1024)
    if not chunk:
        break
    await local_file.write(chunk)
```

이 반복문은 파일 전체를 애플리케이션 메모리에 한 번에 복사하지 않고 1MB씩 처리한다. 누적 바이트 수를 계산하면 저장 도중 설정한 한도를 넘는지 검사할 수 있다.

### 5.3 BackgroundTasks

```python
@app.post("/assets")
async def create_asset(
    background_tasks: BackgroundTasks,
    file: UploadFile,
):
    # 파일 저장 및 자산 등록
    background_tasks.add_task(process_asset, asset_id)
    return {"id": asset_id, "status": "PENDING"}
```

핵심은 **함수를 지금 호출하는 것**과 **나중에 실행하도록 함수와 인수를 등록하는 것**의 차이다.

```text
process_asset(asset_id)                         → 지금 호출
background_tasks.add_task(process_asset, asset_id) → 응답 이후 실행 예약
```

### 5.4 작업 상태를 별도로 관리하는 이유

응답을 먼저 보낸 뒤 작업이 실행되므로 업로드 성공과 후속 처리 성공은 같은 사건이 아니다.

```text
PENDING    작업 등록됨
PROCESSING 후속 작업 실행 중
COMPLETED  작업 완료
FAILED     작업 실패 - 실제 서비스에서 별도 설계 필요
```

클라이언트는 상태 조회 endpoint를 통해 최종 결과를 확인해야 한다. 이미 보낸 성공 응답은 이후 background task 예외 때문에 자동으로 오류 응답으로 바뀌지 않는다.

### 5.5 StreamingResponse와 비동기 제너레이터

```python
async def file_chunks(path: Path):
    async with aiofiles.open(path, "rb") as source:
        while chunk := await source.read(1024 * 1024):
            yield chunk

return StreamingResponse(
    file_chunks(path),
    media_type="application/octet-stream",
)
```

`return`은 함수 실행을 끝내고 한 번의 결과를 돌려주지만, `yield`는 현재 위치를 기억한 채 한 조각을 제공하고 다음 요청 때 이어서 실행한다.

```text
read 1MB → yield → 전송
read 1MB → yield → 전송
...
빈 bytes → 반복 종료
```

### 5.6 업로드와 다운로드의 방향 구분

| 방향 | 입력·출력 | 핵심 도구 |
|---|---|---|
| 업로드 | 클라이언트 → 서버 | `UploadFile`, `multipart/form-data` |
| 저장 후 처리 | 서버 내부 | `BackgroundTasks`, 상태 전이 |
| 다운로드 | 서버 → 클라이언트 | async generator, `StreamingResponse` |

## 6. 예정 실습 프로젝트 구조

### 4장 1강 - 주문·배송 시스템

```text
order-delivery-system/
├── pyproject.toml
├── uv.lock
└── src/
    ├── main.py
    ├── schemas/
    │   └── delivery.py
    └── routers/
        ├── users.py
        └── deliveries.py
```

역할은 다음처럼 나뉜다.

- `main.py`: FastAPI 앱, 공통 logging, middleware, router 등록
- `schemas/delivery.py`: 요청·응답 데이터 형태와 검증 규칙
- `routers/users.py`: 사용자 endpoint와 사용자 logger
- `routers/deliveries.py`: 배송 endpoint, Header 기반 공통 dependency, 배송 logger

### 4장 2강 - 미디어 아카이브

```text
media-archive/
├── pyproject.toml
├── uv.lock
└── src/
    ├── main.py
    ├── domain/
    │   └── archive.py
    └── schemas/
        └── archive.py
```

- `domain/archive.py`: 자산 정보와 상태 전이 규칙
- `schemas/archive.py`: 외부 응답 데이터 형태
- `main.py`: 업로드, 저장, background task, 상태 조회, streaming download

## 7. 예상 난점

1. **router 파일과 독립 서버 혼동**: `APIRouter`는 같은 FastAPI 앱 안의 endpoint 묶음이다.
2. **폴더 위치와 URL 혼동**: 파일이 `routers/orders.py`에 있다고 `/orders`가 자동 생성되지는 않는다.
3. **prefix 중복**: router와 `include_router()` 양쪽의 prefix가 결합될 수 있으므로 최종 URL을 직접 계산해야 한다.
4. **Middleware와 Depends 범위**: 모든 요청에 필요한 규칙인지 특정 기능에만 필요한 규칙인지 먼저 판단한다.
5. **Middleware 순서**: 요청과 응답의 진행 방향이 반대다.
6. **UploadFile과 보안 혼동**: 메모리 사용을 줄여도 용량·확장자·MIME·경로 검증은 별도다.
7. **BackgroundTasks와 외부 작업 큐 혼동**: 응답 뒤 실행되지만 재시도·내구성·다중 서버 분산을 자동 제공하지 않는다.
8. **async와 CPU 작업 혼동**: `async def`나 background 등록만으로 CPU 집약적 변환이 빨라지지는 않는다.
9. **응답 성공과 후속 작업 성공 혼동**: background task 실패는 이미 전송된 응답을 바꾸지 못한다.
10. **StreamingResponse와 파일 안전성 혼동**: 청크 전송은 메모리를 줄이지만 파일 존재·닫기·중단·Range 요청은 별도 설계 대상이다.

## 8. 예정 실습과 관찰 기준

### 4장 1강

1. users·deliveries router를 분리하고 `include_router()` 전후 `/docs` 목록을 비교한다.
2. `prefix`와 decorator 경로를 조합해 최종 URL을 먼저 예상한 뒤 실제 요청과 비교한다.
3. 올바른 토큰·잘못된 토큰·누락된 토큰으로 배송 endpoint 결과를 비교한다.
4. 응답 Header의 `X-Process-Time`을 확인한다.
5. 두 middleware의 전처리·후처리 로그를 남겨 실행 순서를 확인한다.
6. 메인 로그 설정이 하위 users·deliveries logger에 적용되는지 확인한다.

### 4장 2강

1. 작은 파일과 큰 파일에서 `bytes`와 `UploadFile`의 차이를 관찰한다.
2. 업로드 파일을 1MB 청크로 저장하며 누적 크기와 저장 결과를 확인한다.
3. 파일명 정규화 전후 저장 경로를 비교한다.
4. 업로드 직후 `PENDING`, 후속 작업 중 `PROCESSING`, 완료 후 `COMPLETED`를 조회한다.
5. background task 내부 예외와 클라이언트가 받은 기존 응답을 구분한다.
6. 다운로드 시 여러 청크가 순서대로 생성되는지 로그로 확인한다.
7. 존재하지 않는 자산과 실제 파일 누락을 서로 다른 오류로 확인한다.

## 9. 수업 전 확인 질문

1. 현재 주문 프로젝트의 `main.py`는 어떤 router를 `include_router()`로 등록하고 있는가?
2. router `prefix`와 endpoint decorator 경로가 합쳐진 최종 URL은 무엇인가?
3. 주문·배송 API의 어떤 규칙은 Middleware가 아니라 router dependency에 두는 것이 적합한가?
4. 여러 middleware를 등록했을 때 요청과 응답 순서를 로그로 어떻게 증명할 수 있는가?
5. 업로드 파일의 용량 제한은 어느 단계에서 검사하고, 초과한 임시 파일은 어떻게 정리할 것인가?
6. 파일의 `content_type` 값만 신뢰하면 어떤 문제가 생길 수 있는가?
7. background task 실패를 사용자가 나중에 확인하려면 어떤 상태와 조회 API가 필요한가?
8. CPU 집약적 미디어 변환을 앱 내부 background task가 아닌 별도 worker로 보내야 하는 기준은 무엇인가?
9. 단순한 정적 파일 다운로드라면 `StreamingResponse`와 `FileResponse` 중 무엇을 선택할 것인가?
10. 클라이언트가 스트리밍 도중 연결을 끊으면 파일·generator 자원을 어떻게 정리할 것인가?

## 10. 핵심 개념과 추가 주의점

### 핵심 개념

- `APIRouter`의 `prefix`, `tags`, `dependencies`, `include_router()`
- 사용자 정의 Middleware와 `TrustedHostMiddleware`
- Middleware의 스택 구조와 요청·응답 실행 순서
- 메인 모듈의 `logging.basicConfig()`와 하위 모듈의 `getLogger()`
- `bytes`와 `UploadFile`, spooled file, async 파일 인터페이스
- `BackgroundTasks.add_task()`와 응답 이후 후속 처리
- 비동기 제너레이터·`yield`·`StreamingResponse`
- 파일 업로드, 상태 조회, 스트리밍 다운로드를 연결한 미디어 아카이브 실습

### 추가로 정리한 주의점

- `APIRouter`는 독립 서버가 아니라 같은 FastAPI 앱에 등록되는 route 묶음이다.
- Middleware와 dependency는 기능보다 **적용 범위**를 기준으로 선택한다.
- `UploadFile`은 큰 파일의 애플리케이션 메모리 부담을 줄이지만 업로드 허용 정책 전체를 대신하지 않는다.
- `BackgroundTasks`는 같은 애플리케이션에서 처리할 작은 후속 작업에 적합하다. 중요한 장시간·CPU 집약 작업과 재시도가 필요한 작업은 별도 worker·queue를 검토한다.
- background task에서 필요한 DB 세션·파일 같은 자원은 요청 수명에 기대지 않고 task 안에서 준비·정리하는 편이 안전하다.
- `StreamingResponse`는 iterator가 만든 청크를 순서대로 전송하며, 단순 파일 전송에는 `FileResponse`도 비교 대상이다.

[← Week 11 학습 기록](../README.md)
