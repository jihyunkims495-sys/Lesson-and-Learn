import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """환경변수로 Supabase Client를 한 번만 생성한다."""
    load_dotenv()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_PUBLISHABLE_KEY")

    if not url or not key:
        raise RuntimeError(
            ".env에 SUPABASE_URL과 SUPABASE_PUBLISHABLE_KEY를 설정하세요."
        )

    return create_client(url, key)
