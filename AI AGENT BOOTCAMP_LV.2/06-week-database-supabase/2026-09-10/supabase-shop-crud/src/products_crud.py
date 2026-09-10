from typing import Any

from supabase import Client

from .common import (
    get_current_user_id,
    keep_allowed_fields,
    require_non_empty,
    require_non_negative,
    utc_now,
)


class ProductsCRUD:
    TABLE = "products"
    UPDATABLE_FIELDS = {"name", "description", "price"}

    def __init__(self, client: Client):
        self.client = client

    def create(
        self, name: str, price: int, description: str | None = None
    ) -> list[dict[str, Any]]:
        payload = {
            "name": require_non_empty(name, "name"),
            "description": description,
            "price": require_non_negative(price, "price"),
            "seller_id": get_current_user_id(self.client),
        }
        response = self.client.table(self.TABLE).insert(payload).execute()
        return response.data

    def read_all(self, limit: int = 20) -> list[dict[str, Any]]:
        response = (
            self.client.table(self.TABLE)
            .select("*")
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data

    def read_my_products(self) -> list[dict[str, Any]]:
        response = (
            self.client.table(self.TABLE)
            .select("*")
            .eq("seller_id", get_current_user_id(self.client))
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    def update(self, product_id: str, **changes: Any) -> list[dict[str, Any]]:
        payload = keep_allowed_fields(changes, self.UPDATABLE_FIELDS)
        if "name" in payload:
            payload["name"] = require_non_empty(str(payload["name"]), "name")
        if "price" in payload:
            payload["price"] = require_non_negative(int(payload["price"]), "price")
        if not payload:
            raise ValueError("수정할 값이 없습니다.")

        payload["modified_at"] = utc_now()
        response = (
            self.client.table(self.TABLE)
            .update(payload)
            .eq("id", product_id)
            .eq("seller_id", get_current_user_id(self.client))
            .select("*")
            .execute()
        )
        return response.data

    def soft_delete(self, product_id: str) -> list[dict[str, Any]]:
        now = utc_now()
        response = (
            self.client.table(self.TABLE)
            .update({"deleted_at": now, "modified_at": now})
            .eq("id", product_id)
            .eq("seller_id", get_current_user_id(self.client))
            .select("id, deleted_at")
            .execute()
        )
        return response.data
