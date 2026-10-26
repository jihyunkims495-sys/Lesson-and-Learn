# Practice | 2026-10-26 | FastAPI 실행과 오류 분석

## 1. Hello World와 로깅

```python
import logging
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")
app = FastAPI()

@app.get("/")
async def hello_world() -> dict:
    logger.info("로깅 연습, hello world!")
    return {"message": "Hello World"}
```

- Swagger UI에서 `GET / Hello World`가 표시되는 것을 확인했다.
- 최신 소스에서 `logging.basicConfig()`와 문자열 문법이 정상 형태로 작성된 것을 확인했다.
- 최신 파일을 서버에서 다시 실행하지는 않았다.

## 2. `Status` import 오류

```text
ImportError: cannot import name 'Status' from 'fastapi'
Did you mean: 'status'?
```

FastAPI의 상태 코드 모듈 이름은 소문자 `status`다.

```python
from fastapi import status

status.HTTP_201_CREATED
status.HTTP_400_BAD_REQUEST
```

최신 소스에서 소문자 `status`로 수정된 것을 확인했다.

## 3. 잘못 실행된 앱과 포트 구분

도서 앱을 기대했지만 Swagger UI에는 기본 제목 `FastAPI`와 `GET / Hello World`만 표시됐다. 이는 도서 앱이 아니라 이전 Hello World 앱이 응답한 화면이었다.

```text
8000 → 이전 Hello World 앱
8001 → 도서 앱 확인용 임시 포트
```

포트는 FastAPI 소스가 자동으로 바꾸는 값이 아니라 Uvicorn 실행 명령으로 정한다.

## 4. PowerShell과 cURL 문법

```text
Invoke-WebRequest : 'Headers' 매개 변수를 바인딩할 수 없습니다.
```

HTTP 요청이 FastAPI에 도착하기 전에 PowerShell에서 `curl`을 `Invoke-WebRequest`로 해석한 것이 원인이었다. Bash의 줄 연속 문자 `\`도 PowerShell에서는 같은 의미로 작동하지 않는다.

```powershell
curl.exe -i -X POST "http://127.0.0.1:8000/books" -H "Content-Type: application/json" -d '{"title":"쉽게 배우는 파이썬 백엔드","author":"스파르타 튜터"}'
```

## 5. 남은 도서 앱 오류

```python
new_book = Book.create(id_generator, title, author, "AVAILABLE")
return new_book.to_dict()
```

현재 `Book.create()`는 `book.validate()`를 호출하지만 `Book` 클래스에 `validate()`가 정의되지 않았다. 또한 `in_memory_db`는 선언만 되어 있고 새 책을 저장하지 않는다.

```text
현재: 객체 생성 시도 → JSON 응답 시도
미완료: 객체 생성 → in_memory_db 저장 → 조회
```

## 6. 검증 상태

```text
작성한 코드:
- GET / Hello World
- POST /books
- Book 생성·대여·반납·딕셔너리 변환

확인한 결과:
- Hello World Swagger UI 표시
- Status import 오류 원인과 소문자 수정
- 현재 소스의 미정의 validate()와 저장 누락

미완료:
- 최신 도서 앱 정상 시작
- POST /books의 201 응답
- 도서 인메모리 저장과 GET 조회
- 서버 재시작 뒤 데이터 소멸 확인
```
