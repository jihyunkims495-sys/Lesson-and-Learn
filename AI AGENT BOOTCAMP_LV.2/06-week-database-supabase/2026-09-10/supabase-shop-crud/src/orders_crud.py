from typing import Any

from supabase import Client

from .common import (
    get_current_user_id,
    keep_allowed_fields,
    require_non_empty,
    require_non_negative,
    utc_now,
)
from .constants import ORDER_STATUSES


class OrdersCRUD:
    TABLE = "orders"
    ORDER_STATUSES = ORDER_STATUSES
    UPDATABLE_FIELDS = {
        "order_name",
        "order_email",
        "order_phone",
        "receiver_name",
        "receiver_phone",
        "zipcode",
        "address",
        "address_sub",
        "delivery_memo",
        "total_price",
        "order_status",
    }

    def __init__(self, client: Client):
        self.client = client

    def create(
        self,
        *,
        order_no: str,
        order_name: str,
        order_email: str,
        order_phone: str,
        receiver_name: str,
        receiver_phone: str,
        zipcode: str,
        address: str,
        total_price: int,
        address_sub: str | None = None,
        delivery_memo: str | None = None,
        order_status: str = "READY_ORDER",
    ) -> list[dict[str, Any]]:
        order_status = order_status.upper()
        self._validate_status(order_status)

        payload = {
            "order_no": require_non_empty(order_no, "order_no"),
            "order_name": require_non_empty(order_name, "order_name"),
            "order_email": require_non_empty(order_email, "order_email"),
            "order_phone": require_non_empty(order_phone, "order_phone"),
            "receiver_name": require_non_empty(receiver_name, "receiver_name"),
            "receiver_phone": require_non_empty(receiver_phone, "receiver_phone"),
            "zipcode": require_non_empty(zipcode, "zipcode"),
            "address": require_non_empty(address, "address"),
            "address_sub": address_sub,
            "delivery_memo": delivery_memo,
            "total_price": require_non_negative(total_price, "total_price"),
            "order_status": order_status,
            "user_id": get_current_user_id(self.client),
        }
        response = self.client.table(self.TABLE).insert(payload).execute()
        return response.data

    def read_my_orders(self) -> list[dict[str, Any]]:
        response = (
            self.client.table(self.TABLE)
            .select("*")
            .eq("user_id", get_current_user_id(self.client))
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    def read_one(self, order_id: str) -> list[dict[str, Any]]:
        response = (
            self.client.table(self.TABLE)
            .select("*")
            .eq("id", order_id)
            .eq("user_id", get_current_user_id(self.client))
            .is_("deleted_at", "null")
            .execute()
        )
        return response.data

    def update(self, order_id: str, **changes: Any) -> list[dict[str, Any]]:
        payload = keep_allowed_fields(changes, self.UPDATABLE_FIELDS)
        if "total_price" in payload:
            payload["total_price"] = require_non_negative(
                int(payload["total_price"]), "total_price"
            )
        if "order_status" in payload:
            payload["order_status"] = str(payload["order_status"]).upper()
            self._validate_status(payload["order_status"])
        if not payload:
            raise ValueError("수정할 값이 없습니다.")

        payload["modified_at"] = utc_now()
        response = (
            self.client.table(self.TABLE)
            .update(payload)
            .eq("id", order_id)
            .eq("user_id", get_current_user_id(self.client))
            .select("*")
            .execute()
        )
        return response.data

    def soft_delete(self, order_id: str) -> list[dict[str, Any]]:
        now = utc_now()
        response = (
            self.client.table(self.TABLE)
            .update({"deleted_at": now, "modified_at": now})
            .eq("id", order_id)
            .eq("user_id", get_current_user_id(self.client))
            .select("id, deleted_at")
            .execute()
        )
        return response.data

    def _validate_status(self, order_status: str) -> None:
        if order_status not in self.ORDER_STATUSES:
            allowed = ", ".join(sorted(self.ORDER_STATUSES))
            raise ValueError(f"order_status는 다음 중 하나여야 합니다: {allowed}")
