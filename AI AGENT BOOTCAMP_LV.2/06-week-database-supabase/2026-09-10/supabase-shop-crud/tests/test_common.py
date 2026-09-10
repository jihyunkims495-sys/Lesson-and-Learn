import unittest

from src.common import keep_allowed_fields, require_non_empty, require_non_negative
from src.constants import ORDER_STATUSES


class CommonValidationTests(unittest.TestCase):
    def test_keep_allowed_fields(self):
        result = keep_allowed_fields(
            {"name": "상품", "seller_id": "변경 금지"}, {"name"}
        )
        self.assertEqual(result, {"name": "상품"})

    def test_require_non_empty(self):
        self.assertEqual(require_non_empty("  상품  ", "name"), "상품")
        with self.assertRaises(ValueError):
            require_non_empty("   ", "name")

    def test_require_non_negative(self):
        self.assertEqual(require_non_negative(0, "price"), 0)
        with self.assertRaises(ValueError):
            require_non_negative(-1, "price")

    def test_order_status_values(self):
        self.assertIn("READY_ORDER", ORDER_STATUSES)
        self.assertIn("DONE_DELIVERY", ORDER_STATUSES)


if __name__ == "__main__":
    unittest.main()
