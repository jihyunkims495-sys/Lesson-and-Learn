# AsyncTicket 구현

공연 티켓 예매 API와 Jinja2 화면을 담은 팀 프로젝트 구현본입니다.

- [애플리케이션 소스](src/asyncticket/)
- [테스트](tests/)
- [스키마 정합성 및 동시성 확인 스크립트](scripts/)

## 로컬 실행

Python 3.13 이상, uv, PostgreSQL이 필요합니다.
본인의 DB 접속 정보를 환경변수 `DATABASE_URL`에 설정하고
`JWT_SECRET_KEY`에 충분히 긴 무작위 값을 지정합니다.
결제 기능을 사용할 때는 본인이 발급한 Toss Payments 테스트 키를 설정합니다.

```bash
uv sync --locked
uv run uvicorn asyncticket.main:app --host 127.0.0.1 --port 8000
```

기본 테스트는 가짜 저장소와 메모리 SQLite를 사용합니다.

```bash
uv run --with aiosqlite python -B -m unittest discover -s tests -v
```

도메인별 테스트는 `tests/users`, `tests/auth`, `tests/reservations`,
`tests/seat_queries`, `tests/shared_core`, `tests/database_session`,
`tests/frontend`를 각각 `-s`에 지정해 실행할 수 있습니다.
