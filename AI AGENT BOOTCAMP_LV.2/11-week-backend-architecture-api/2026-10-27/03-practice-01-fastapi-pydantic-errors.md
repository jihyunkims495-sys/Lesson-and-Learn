# 실습 및 오류 기록 - FastAPI와 Pydantic

- 학습일: 2026-10-27
- 과정: AI Agent Bootcamp LV.2 / Week 11
- 범위: 2장 1강 실습 코드와 당일 오류

## 검증 경계

- 확인함: 현재 Python 소스 내용, 포트 상태, AST 문법 검사
- 이전에 재현함: 잘못된 import로 인한 앱 import 실패, 두 종류의 들여쓰기 오류
- 사용자 보고: Postman `ECONNREFUSED`, 문자열 종료 오류
- 확인하지 못함: 현재 Uvicorn 정상 시작, 실제 POST 성공·오류 응답

## 1. Postman 연결 거절

### 기대

Postman이 `127.0.0.1:8000`의 FastAPI 서버에 요청하고 응답을 받는다.

### 실제

```text
Error: connect ECONNREFUSED 127.0.0.1:8000
```

### 확인한 원인 흐름

```text
book.presentaion import 오타
  → 실제 book/presentation 패키지를 찾지 못함
  → main.py import 실패
  → Uvicorn 앱 시작 실패
  → 8000번 포트가 열리지 않음
  → Postman 연결 거절
```

현재 코드는 `book.presentation.schemas`로 수정되어 있다. 다만 현재도 8000번 포트는 열려 있지 않으며 이번 마무리에서는 서버를 다시 실행하지 않았으므로 HTTP 성공은 미확인이다.

## 2. unexpected indent

### 실제 오류

```text
IndentationError: unexpected indent
```

이전 코드 블록을 주석 처리하는 과정에서 `BookCreate()` 한 줄만 주석이 빠진 채 최상위에서 들여쓰기되어 있었다. Python은 들여쓰기할 상위 블록이 없으므로 오류를 냈다.

현재 해당 줄은 제거되거나 주석 처리된 상태이며 `main.py`는 AST 검사를 통과했다.

## 3. unindent does not match

### 실제 오류

```text
IndentationError: unindent does not match any outer indentation level
```

`schemas.py`에서 클래스 내부 데코레이터와 메서드, 메서드 본문의 공백 수가 4칸·8칸 규칙과 맞지 않았다. 탭 혼용이 아니라 같은 블록의 들여쓰기 폭 불일치가 직접 원인이었다.

현재 저장본은 AST 검사를 통과한다.

## 4. unterminated string literal

### 사용자 보고

```text
SyntaxError: unterminated string literal (detected at line 22)
```

현재 저장본에서는 따옴표가 닫히지 않은 문자열을 찾지 못했고 AST 검사도 통과했다. 저장 전 편집 상태나 reload가 읽은 이전 파일일 가능성은 있지만 정확한 오류 상태를 재현하지 못했으므로 해결 완료로 판단하지 않는다.

## 5. 현재 코드의 다음 검증

1. before·after validator 함수 이름을 서로 다르게 만든다.
2. before validator가 원본 데이터를 받는 올바른 서명인지 확인한다.
3. 서버를 실행해 `Application startup complete`와 8000번 LISTEN 상태를 확인한다.
4. Swagger UI 또는 Postman으로 정상 도서 JSON을 전송한다.
5. 가격 0, 짧은 제목, 공백 제목을 전송해 오류 상태와 메시지를 기록한다.
6. POST endpoint의 반환값과 GET 공통 응답을 확인한다.

