# TIL | 2026-10-30 | 파일 스트리밍과 비동기 데이터베이스 준비

> LV.2 · Week 11

> **파일 자체와 메타데이터의 생명주기를 분리해서 보고, 비동기 API와 데이터 정합성도 서로 다른 문제로 구분해야 한다.**

> 오늘은 파일 업로드·스트리밍 다운로드를 실제 오류 흐름으로 추적하고, 이를 ORM·RDBMS·비동기 PostgreSQL 연결의 필요성과 이어서 이해했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- `UploadFile`은 업로드된 파일을 읽게 해 주지만 애플리케이션 저장소에 자동으로 영구 보존하지 않는다.
- 청크 업로드는 파일을 작은 단위로 읽어 저장하고, `StreamingResponse`는 generator가 제공하는 데이터를 작은 단위로 응답한다.
- 디스크에 파일이 존재하는 것과 서버 메모리에 파일 메타데이터가 등록된 것은 서로 다른 상태다.
- `BackgroundTasks`는 응답 이후 같은 애플리케이션 프로세스에서 실행할 작은 작업을 등록한다.
- RDBMS는 관계형 테이블과 트랜잭션으로 데이터를 영구 관리하고, ORM은 Python 객체와 테이블을 연결한다.
- `asyncpg`는 PostgreSQL 비동기 드라이버이고 `greenlet`은 SQLAlchemy의 내부 실행 흐름 전환을 지원한다.
- `uv add`는 의존성 설치, `uv run`은 설치된 프로그램 실행에 사용한다.

### 핵심 코드

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


return StreamingResponse(
    get_file_chunks(target_path),
    media_type=asset.content_type,
    headers={
        "Content-Disposition": (
            f'attachment; filename="{asset.filename}"'
        ),
        "Content-Length": str(asset.file_size),
        "Cache-Control": "no-cache",
    },
)
```

```python
@app.get("/signup")
async def signup(background_tasks: BackgroundTasks):
    background_tasks.add_task(send_notification, "sample@example.com")
    return {"message": "가입이 완료되었습니다."}
```

### 오늘 수행한 실습

- `UploadFile`을 1MB 청크로 읽어 `aiofiles`로 저장하는 endpoint를 작성했다.
- async generator와 `StreamingResponse`를 사용한 다운로드 endpoint를 작성했다.
- 다운로드 파일명, 길이, MIME type과 캐시 정책을 응답에 연결했다.
- `BackgroundTasks.add_task()`로 응답 이후 작업을 등록하는 endpoint를 작성했다.
- 실제 HTTP 404·500 응답과 OpenAPI route 목록을 확인하며 오류 단계를 추적했다.
- ORM, RDBMS, SQLAlchemy, `asyncpg`, `greenlet`의 역할을 비교했다.
- 비동기 DB 실습용 프로젝트에 필요한 의존성과 초기 설정 코드를 준비했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드:
- 청크 파일 업로드와 스트리밍 다운로드
- BackgroundTasks endpoint
- FastAPI 앱과 DB 환경 설정 읽기

검증 방법:
- 관련 Python 파일 6개의 AST 문법 검사
- 로컬 HTTP 요청의 404·500 응답 확인
- OpenAPI에 등록된 route와 저장 코드 비교
- 프로젝트 의존성과 실행 명령 확인

확인한 결과:
- 점검한 Python 파일 6개는 문법 파싱 통과
- reload 이후 메모리 메타데이터가 사라져 404가 발생하는 흐름 확인
- 응답 Header와 StreamingResponse 인자 오타가 500으로 이어지는 흐름 확인
- FastAPI CLI와 Uvicorn을 별도 명령으로 실행해야 함을 확인

미완료:
- 수정 후 파일 업로드부터 다운로드까지 최종 성공 검증
- BackgroundTasks 실행 완료 로그 확인
- PostgreSQL 연결과 AsyncSession 생성
- 커넥션 풀·트랜잭션·동시성 제어 실행
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- 큰 파일 전체를 메모리에 올리지 않고 처리하려면 청크 단위 I/O가 필요하다.
- 업로드 성공과 후속 처리 성공을 분리해야 실패 상태를 정확히 관리할 수 있다.
- 메모리 딕셔너리만 사용하면 서버가 재시작될 때 파일 메타데이터가 사라진다.
- ORM과 RDBMS를 사용하면 서버가 다시 시작돼도 자산 정보를 조회할 수 있다.
- 비동기 DB 드라이버는 DB 응답을 기다리는 동안 event loop가 다른 작업을 처리할 수 있게 한다.
- 비동기 처리는 대기 효율을 높이지만 같은 데이터를 동시에 변경할 때의 정합성을 자동으로 보장하지 않는다.

### 내 생각

> 다운로드 오류를 보면서 파일이 존재한다는 사실만으로는 충분하지 않다는 점이 분명해졌다. API가 파일을 찾으려면 파일 ID와 저장 이름 같은 메타데이터도 유지해야 한다. 이 문제는 메모리 딕셔너리에서 데이터베이스로 넘어가는 이유와 직접 연결된다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. 클라이언트가 multipart 요청으로 파일을 전송한다.
2. FastAPI가 `UploadFile`로 파일과 메타데이터를 제공한다.
3. endpoint가 파일을 청크 단위로 읽어 디스크에 저장한다.
4. 파일 ID, 저장 이름, 크기와 MIME type을 별도로 등록한다.
5. 다운로드 요청은 먼저 메타데이터를 찾고 실제 파일 존재 여부를 확인한다.
6. async generator가 파일을 청크 단위로 읽어 `yield`한다.
7. `StreamingResponse`가 각 청크를 클라이언트에 전달한다.
8. 영속 DB를 연결하면 SQLAlchemy가 Python 객체를 SQL로 변환하고 `asyncpg`가 PostgreSQL과 통신한다.

### 내 말로 설명하기

> 업로드는 클라이언트에서 서버로 파일을 보내는 과정이고, 다운로드는 서버가 파일을 조각내 클라이언트에 보내는 과정이다. 파일 bytes와 파일 정보는 따로 관리해야 한다. 서버를 재시작해도 파일 정보를 유지하려면 RDBMS에 저장하고, SQLAlchemy ORM을 사용하면 Python 객체로 그 테이블을 다룰 수 있다.

---

## 5. 오늘의 문제 해결

### 문제 상황

- 함수 본문 누락으로 `IndentationError`가 발생했다.
- FastAPI의 이름과 `StreamingResponse` 철자 오류로 import가 중단됐다.
- 디스크에 파일이 있는데도 다운로드 요청에서 404가 발생했다.
- 다운로드 응답을 만드는 과정에서 500이 발생했다.
- 새로 작성한 route가 404를 반환했다.
- FastAPI CLI에서 `uvicorn`을 하위 명령으로 인식해 실행하지 못했다.

### 문제의 원인

- Python은 함수 선언 다음에 들여쓴 본문이 필요하다.
- Python 이름은 대소문자와 철자가 정확히 일치해야 한다.
- 서버 reload 뒤 메모리 딕셔너리가 초기화됐지만 디스크 파일은 남아 있었다.
- `str.asset.file_size`처럼 잘못된 속성 접근과 `meda_type` 오타가 있었다.
- reload 없이 실행 중인 서버가 최신 route를 불러오지 않았다.
- `fastapi`와 `uvicorn`은 서로 다른 실행 명령이다.

### 해결한 코드

```python
from fastapi import status
from fastapi.responses import StreamingResponse

headers = {
    "Content-Length": str(asset.file_size),
}

return StreamingResponse(
    get_file_chunks(target_path),
    media_type=asset.content_type,
    headers=headers,
)
```

```bash
# FastAPI CLI
uv run fastapi dev main.py

# 또는 Uvicorn 직접 실행
uv run uvicorn main:app --reload
```

### 해결 원리

> 오류 메시지를 개별 문법으로만 고치지 않고 파싱, import, 서버 reload, route 등록, 메타데이터 조회와 응답 생성 단계로 나눴다. 404는 route가 없을 때뿐 아니라 애플리케이션이 자산을 찾지 못할 때도 발생할 수 있으므로 응답 본문과 서버 상태를 함께 확인해야 한다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 오류 메시지, 저장된 코드, OpenAPI route와 실제 HTTP 응답을 함께 비교했다.
- 계속 유지할 학습 방법: 파일 존재, 메타데이터 존재, 서버 프로세스 상태를 서로 다른 검사 항목으로 본다.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: 서버 reload 뒤 디스크 파일과 메모리 상태가 달라지는 점
- 반복해서 확인할 부분: 클래스명, 상태 코드 상수와 함수 인자의 정확한 철자
- 아직 설명하기 어려운 부분: AsyncEngine·AsyncSession과 커넥션 풀의 실제 생명주기

### Try — 다음에 시도할 것

- 다시 공부할 내용: Engine, Connection Pool, Connection과 AsyncSession의 역할
- 예제를 보지 않고 작성해볼 코드: 요청마다 독립적인 AsyncSession을 제공하는 dependency
- 다음 학습에서 바꿔볼 방법: 코드 저장으로 reload가 발생한 시점과 HTTP 검증 시점을 함께 기록한다.

---

## 8. 이해도 점검

- [ ] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [ ] 코드가 실행되는 순서를 설명할 수 있다.
- [ ] 오늘 발생한 오류의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [ ] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

별도의 이해도 평가를 진행하지 않아 체크하지 않았다.

---

## 9. 다음 학습에서 할 일

1. 남아 있는 오류 상수와 DB 연결 문자열을 점검한 뒤 파일 업로드·다운로드를 처음부터 다시 검증한다.
2. `create_async_engine()`과 `async_sessionmaker()`를 연결하고 health check로 PostgreSQL 연결을 확인한다.
3. 요청마다 독립적인 AsyncSession을 만들고 commit·rollback·close 흐름을 로그로 확인한다.
4. 커넥션 풀 설정과 동시 요청의 관계를 실제 실행 결과로 기록한다.
5. 같은 데이터를 동시에 변경하는 요청에서 DB 잠금과 최종 상태를 검증한다.

---

## 관련 자료

- [수업 노트](./02-learning-notes-01-file-streaming-async-database.md)
- [Week 11 학습 기록](../README.md)
