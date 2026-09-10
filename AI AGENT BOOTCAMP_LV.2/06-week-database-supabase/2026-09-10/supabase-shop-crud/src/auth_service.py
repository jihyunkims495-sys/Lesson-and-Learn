from supabase import Client


def sign_up(client: Client, email: str, password: str):
    """Supabase Auth에 회원 계정을 만든다."""
    return client.auth.sign_up({"email": email, "password": password})


def sign_in(client: Client, email: str, password: str):
    """이메일과 비밀번호로 로그인한다."""
    return client.auth.sign_in_with_password(
        {"email": email, "password": password}
    )


def sign_out(client: Client) -> None:
    """현재 세션에서 로그아웃한다."""
    client.auth.sign_out()
