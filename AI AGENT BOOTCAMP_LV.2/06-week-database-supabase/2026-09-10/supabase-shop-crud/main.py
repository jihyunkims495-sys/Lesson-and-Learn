from getpass import getpass

from src.auth_service import sign_in, sign_out
from src.config import get_supabase_client
from src.orders_crud import OrdersCRUD
from src.products_crud import ProductsCRUD
from src.user_details_crud import UserDetailsCRUD


def main() -> None:
    """로그인한 사용자의 데이터를 읽는 안전한 실행 예제."""
    client = get_supabase_client()

    email = input("이메일: ").strip()
    password = getpass("비밀번호: ")
    sign_in(client, email, password)

    users = UserDetailsCRUD(client)
    products = ProductsCRUD(client)
    orders = OrdersCRUD(client)

    print("내 회원정보:", users.read_my_profile())
    print("전체 활성 상품:", products.read_all())
    print("내 주문:", orders.read_my_orders())

    sign_out(client)


if __name__ == "__main__":
    main()
