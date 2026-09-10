from typing import Any

from supabase import Client

from .common import get_current_user_id, keep_allowed_fields, utc_now
from .constants import USER_TYPES


class UserDetailsCRUD:
    TABLE = "user_details"
    USER_TYPES = USER_TYPES
    UPDATABLE_FIELDS = {
        "type",
        "cellphone",
        "zipcode",
        "address",
        "address_sub",
    }

    def __init__(self, client: Client):
        self.client = client

    def create(
        self,
        user_type: str = "BUYER",
        cellphone: str | None = None,
        zipcode: str | None = None,
        address: str | None = None,
        address_sub: str | None = None,
    ) -> list[dict[str, Any]]:
        user_type = user_type.upper()
        if user_type not in self.USER_TYPES:
            raise ValueError("type은 SELLER 또는 BUYER여야 합니다.")

        payload = {
            "id": get_current_user_id(self.client),
            "type": user_type,
            "cellphone": cellphone,
            "zipcode": zipcode,
            "address": address,
            "address_sub": address_sub,
        }

        response = self.client.table(self.TABLE).insert(payload).execute()
        return response.data

    def read_my_profile(self) -> list[dict[str, Any]]:
        response = (
            self.client.table(self.TABLE)
            .select("*")
            .eq("id", get_current_user_id(self.client))
            .is_("deleted_at", "null")
            .execute()
        )
        return response.data

    def update_my_profile(self, **changes: Any) -> list[dict[str, Any]]:
        payload = keep_allowed_fields(changes, self.UPDATABLE_FIELDS)
        if "type" in payload:
            payload["type"] = str(payload["type"]).upper()
            if payload["type"] not in self.USER_TYPES:
                raise ValueError("type은 SELLER 또는 BUYER여야 합니다.")
        if not payload:
            raise ValueError("수정할 값이 없습니다.")

        payload["modified_at"] = utc_now()
        response = (
            self.client.table(self.TABLE)
            .update(payload)
            .eq("id", get_current_user_id(self.client))
            .select("*")
            .execute()
        )
        return response.data

    def soft_delete_my_profile(self) -> list[dict[str, Any]]:
        """행을 지우지 않고 deleted_at을 기록한다."""
        response = (
            self.client.table(self.TABLE)
            .update({"deleted_at": utc_now(), "modified_at": utc_now()})
            .eq("id", get_current_user_id(self.client))
            .select("id, deleted_at")
            .execute()
        )
        return response.data
