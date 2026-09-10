from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from supabase import Client


def utc_now() -> str:
    """Supabase timestamptz 컬럼에 저장할 UTC 시각을 반환한다."""
    return datetime.now(timezone.utc).isoformat()


def get_current_user_id(client: Client) -> str:
    """현재 로그인 사용자의 UUID를 반환한다."""
    response = client.auth.get_user()
    user = getattr(response, "user", None)

    if user is None:
        raise RuntimeError("로그인이 필요합니다.")

    return str(user.id)


def require_non_empty(value: str, field_name: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError(f"{field_name}은(는) 비워둘 수 없습니다.")
    return value


def require_non_negative(value: int, field_name: str) -> int:
    if value < 0:
        raise ValueError(f"{field_name}은(는) 0 이상이어야 합니다.")
    return value


def keep_allowed_fields(data: dict[str, Any], allowed: set[str]) -> dict[str, Any]:
    """수정 가능한 컬럼만 남겨 PK·FK의 의도치 않은 변경을 막는다."""
    return {key: value for key, value in data.items() if key in allowed}
