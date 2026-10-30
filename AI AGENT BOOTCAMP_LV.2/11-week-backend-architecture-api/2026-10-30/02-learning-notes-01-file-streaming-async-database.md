# Learning Notes | 파일 스트리밍과 비동기 데이터베이스 준비

> LV.2 · Week 11 · 2026-10-30

## 1. 실제 학습 범위

오늘은 FastAPI의 파일 업로드·다운로드와 응답 이후 작업을 코드로 따라간 뒤, 관계형 데이터베이스와 비동기 PostgreSQL 연결을 준비했다.

- `UploadFile`과 `aiofiles`를 이용한 청크 단위 저장
- async generator와 `StreamingResponse`를 이용한 청크 단위 다운로드
- `BackgroundTasks`를 이용한 응답 이후 작업 등록
- 파일 자체와 메모리의 파일 메타데이터를 분리해서 관리하는 이유
- ORM과 RDBMS의 역할 차이
- SQLAlchemy, `asyncpg`, `greenlet`의 관계
- `uv add`, `uv run`, FastAPI CLI와 Uvicorn 명령의 차이
- 환경 변수에서 DB 연결 설정을 읽는 초기 코드

5장 1강의 동시성 부분은 완료하지 않고 보류했으며, 5장 2강의 비동기 DB 준비 단계로 이동했다. PostgreSQL 연결, `AsyncEngine`, `AsyncSession`, 커넥션 풀과 행 잠금은 아직 실제 실행하지 않았다.

## 2. 파일 업로드는 수신과 영구 저장을 구분한다

`UploadFile`은 multipart 요청으로 전달된 파일을 읽기 위한 인터페이스다. 파일명과 MIME type을 제공하지만 애플리케이션의 영구 저장소에 자동으로 보존하지는 않는다.

```python
@app.post("/assets")
async def upload_asset(file: UploadFile = File()):
    filename = os.path.basename(file.filename)
    target = storage_dir / filename

    async with aiofiles.open(target, "wb") as output:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            await output.write(chunk)

    await file.close()
```

이 반복문은 최대 1MB씩 읽고 저장한다.

```text
파일 수신
→ 1MB 읽기
→ 빈 bytes인지 확인
→ 디스크에 쓰기
→ 다음 1MB 읽기
→ 파일 끝에서 반복 종료
```

청크 처리는 큰 파일 전체를 한 번에 애플리케이션 메모리로 읽는 부담을 줄인다. 다만 용량 제한, 안전한 파일명, 허용 형식과 중간 실패 시 불완전 파일 삭제는 별도로 설계해야 한다.

## 3. 스트리밍 다운로드

다운로드도 파일 전체를 한 번에 읽는 대신 async generator가 조각을 차례로 제공할 수 있다.

```python
async def get_file_chunks(
    file_path: Path,
    chunk_size: int = 1024 * 1024,
) -> AsyncGenerator[bytes, None]:
    async with aiofiles.open(file_path, "rb") as source:
        while True:
            chunk = await source.read(chunk_size)
            if not chunk:
                break
            yield chunk
```

`yield`는 함수 실행을 완전히 끝내지 않고 현재 위치를 기억한 채 한 조각을 전달한다. `StreamingResponse`는 다음 데이터가 필요할 때 generator의 실행을 이어간다.

```python
headers = {
    "Content-Disposition": f'attachment; filename="{asset.filename}"',
    "Content-Length": str(asset.file_size),
    "Cache-Control": "no-cache",
}

return StreamingResponse(
    get_file_chunks(target),
    media_type=asset.content_type,
    headers=headers,
)
```

- `Content-Disposition`: 브라우저가 다운로드 파일명으로 사용할 정보를 전달한다.
- `Content-Length`: 전체 응답 크기를 byte 단위로 전달한다.
- `media_type`: 응답 본문의 MIME type을 지정한다.
- `Cache-Control`: 캐시 정책을 전달한다.

## 4. 디스크 파일과 메모리 메타데이터는 다르다

파일 실습에서는 디스크에 저장된 파일과 메모리 딕셔너리에 등록된 자산 정보가 따로 존재했다.

```python
asset_repository: dict[int, MultimediaAsset] = {}
```

다운로드 endpoint가 먼저 이 딕셔너리를 조회한다면, 디스크에 파일이 남아 있어도 서버가 reload된 뒤에는 자산을 찾지 못할 수 있다.

```text
파일 업로드
→ 디스크에 파일 저장
→ 메모리 딕셔너리에 메타데이터 등록

서버 reload
→ 디스크 파일은 유지
→ 메모리 딕셔너리는 빈 상태로 초기화

다운로드 요청
→ 딕셔너리 조회 실패
→ 404 응답
```

이 문제는 파일과 메타데이터를 모두 영속적으로 관리해야 하는 이유를 보여준다. 관계형 데이터베이스에 파일 ID, 저장 이름, 크기와 MIME type을 보존하면 서버를 재시작한 뒤에도 다시 조회할 수 있다.

## 5. BackgroundTasks

`BackgroundTasks`는 HTTP 응답을 반환한 뒤 같은 애플리케이션 프로세스에서 실행할 작은 후속 작업을 등록한다.

```python
async def send_notification(address: str):
    await asyncio.sleep(3)


@app.get("/signup")
async def signup(background_tasks: BackgroundTasks):
    background_tasks.add_task(send_notification, "sample@example.com")
    return {"message": "가입이 완료되었습니다."}
```

다음 두 코드는 실행 시점이 다르다.

```text
await send_notification(address)
→ endpoint 안에서 작업 완료를 기다린 뒤 응답

background_tasks.add_task(send_notification, address)
→ 작업을 등록하고 먼저 응답한 뒤 후속 실행
```

`BackgroundTasks`는 외부 작업 큐처럼 내구성 있는 재시도와 여러 서버 간 분산 처리를 제공하지 않는다. 중요한 장시간 작업에는 별도의 작업 시스템과 상태 저장이 필요하다.

## 6. 오류를 실행 단계별로 추적하기

오늘 발생한 오류는 다음 순서로 구분할 수 있었다.

| 현상 | 최초로 잘못된 지점 | 수정 방향 |
|---|---|---|
| 함수 선언 뒤 `IndentationError` | 함수 본문이 없음 | 임시 `pass` 또는 실제로 들여쓴 본문 작성 |
| `Status` ImportError | FastAPI 이름의 대소문자 오류 | 소문자 `status` 사용 |
| `StreamingREsponse` ImportError | 클래스명 철자 오류 | `StreamingResponse` 사용 |
| 다운로드 404 | reload 후 메모리 저장소 초기화 | 같은 실행 세션에서 재업로드하거나 DB에 메타데이터 저장 |
| 다운로드 500 | 잘못된 속성 접근과 인자명 | `str(asset.file_size)`, `media_type` 사용 |
| 새 route의 404 | 실행 중인 서버가 최신 코드를 로드하지 않음 | 개발 서버 reload 또는 수동 재시작 |
| `No such command 'uvicorn'` | FastAPI CLI와 Uvicorn 명령을 결합 | 두 실행 명령 중 하나만 사용 |

오류를 고칠 때는 문법 검사, import, 서버 시작, route 등록, endpoint 실행과 응답 생성 단계를 분리해서 확인해야 한다.

## 7. ORM과 RDBMS

RDBMS는 데이터를 관계형 테이블에 저장하고 SQL, 제약조건과 트랜잭션으로 관리하는 시스템이다. PostgreSQL, MySQL과 SQLite가 대표적인 예다.

ORM은 Python 객체와 관계형 테이블 사이를 연결한다.

| Python | 관계형 데이터베이스 |
|---|---|
| 클래스 | 테이블 |
| 객체 한 개 | 행 한 개 |
| 객체 속성 | 열 |
| 객체 ID | 기본키 |

현재 파일 실습의 개념도 구분할 수 있다.

- 도메인 클래스: 파일 자산의 상태와 규칙을 표현한다.
- Pydantic Schema: API 응답의 필드와 타입을 검증한다.
- 메모리 딕셔너리: 현재 프로세스에서만 자산을 임시 보관한다.
- ORM Model: Python 클래스와 DB 테이블을 연결한다.
- RDBMS: 데이터를 실제로 영속 저장하고 관계·제약·트랜잭션을 관리한다.

ORM을 사용한다고 SQL과 트랜잭션이 사라지는 것은 아니다. ORM이 Python 코드에서 SQL을 만들고 결과 행을 객체로 변환해 주는 것이다.

## 8. SQLAlchemy, asyncpg와 greenlet

비동기 PostgreSQL 연결의 역할은 다음처럼 나뉜다.

```text
FastAPI endpoint
→ SQLAlchemy AsyncSession
→ SQLAlchemy AsyncEngine와 Connection Pool
→ asyncpg 드라이버
→ PostgreSQL
```

### SQLAlchemy

Python 객체와 테이블을 연결하고, query·transaction·connection pool을 관리하는 도구다. 비동기 환경에서는 `AsyncEngine`, `AsyncSession`과 `async_sessionmaker`를 사용한다.

### asyncpg

Python과 PostgreSQL이 asyncio 방식으로 통신하도록 하는 비동기 드라이버다. SQLAlchemy URL에서는 보통 다음처럼 driver 이름에 포함된다.

```python
DATABASE_URL = "postgresql+asyncpg://app_user@db-host:5432/app"
```

### greenlet

SQLAlchemy가 일부 동기식 내부 처리와 비동기 API 사이의 실행 흐름을 전환할 때 사용하는 저수준 보조 도구다. 일반적인 FastAPI endpoint에서 직접 import해 사용하는 패키지는 아니다. `greenlet` 자체가 데이터베이스 드라이버이거나 동시성 안전성을 보장하는 것은 아니다.

## 9. uv의 설치 명령과 실행 명령

`uv add`는 패키지를 프로젝트 의존성에 추가하고, `uv run`은 설치된 프로그램을 실행한다.

```bash
# 설치
uv add "fastapi[standard]" sqlalchemy asyncpg greenlet

# FastAPI CLI 실행
uv run fastapi dev main.py

# Uvicorn 직접 실행
uv run uvicorn main:app --reload
```

`uv run fastapi uvicorn ...`처럼 결합하면 `uvicorn`이 FastAPI CLI의 하위 명령으로 해석되므로 실행되지 않는다.

## 10. 현재 비동기 DB 준비 코드의 경계

현재 단계에서는 DB URL과 pool 관련 숫자를 환경 변수에서 읽고 FastAPI 앱을 생성하는 코드까지 작성했다. 그러나 다음 단계는 아직 연결하지 않았다.

- `create_async_engine()`으로 AsyncEngine 생성
- `async_sessionmaker()`로 Session factory 생성
- 요청마다 독립적인 `AsyncSession`을 제공하는 dependency
- PostgreSQL 연결과 health check
- ORM Model과 테이블 생성 또는 migration
- 실제 transaction의 commit·rollback
- 커넥션 풀 대기와 timeout 검증
- 서로 다른 Session을 사용한 동시 요청 검증

설정 문자열의 scheme, 환경 변수 로딩 방식과 pool 설정 이름도 엔진을 만들기 전에 다시 확인해야 한다.

## 11. 검증 결과와 미완료 항목

### 확인한 내용

- 파일 업로드·다운로드·BackgroundTasks 코드와 DB 준비 코드의 Python 문법을 정적으로 검사했다.
- 다운로드 요청에서 404와 500 응답을 실제로 확인하며 메모리 메타데이터 초기화와 응답 생성 오타를 구분했다.
- 실행 중인 앱의 OpenAPI route 목록과 저장된 코드가 다를 때 서버 reload가 필요함을 확인했다.
- FastAPI CLI의 하위 명령 오류를 통해 설치와 실행 명령을 구분했다.

### 아직 확인하지 않은 내용

- 수정 이후 파일 업로드부터 스트리밍 다운로드까지의 최종 성공
- 서버 재시작 이후에도 파일 메타데이터를 복구하는 영속화
- BackgroundTasks의 실제 로그 완료 시점
- PostgreSQL 연결 성공
- AsyncEngine·AsyncSession과 커넥션 풀 동작
- ORM Model의 저장·조회·commit·rollback
- 비동기 동시 요청과 행 잠금

## 핵심 요약

- `UploadFile`은 업로드를 읽는 인터페이스이고 영구 저장은 별도 로직이다.
- 청크 업로드와 스트리밍 다운로드는 데이터를 작은 단위로 처리한다.
- 디스크 파일과 메모리 메타데이터는 서로 다른 상태이며 reload 후 불일치할 수 있다.
- `BackgroundTasks`는 응답 이후 작은 후속 작업을 등록하지만 외부 작업 큐는 아니다.
- RDBMS는 데이터를 실제로 보존하고, ORM은 Python 객체와 테이블을 연결한다.
- `asyncpg`는 PostgreSQL 비동기 드라이버이고 `greenlet`은 SQLAlchemy 내부 실행 전환을 돕는다.
- `uv add`는 설치, `uv run`은 실행이다.
- 현재 DB 학습은 의존성·설정 준비 단계이며 실제 연결과 동시성 검증은 남아 있다.

[← Week 11 학습 기록](../README.md)
