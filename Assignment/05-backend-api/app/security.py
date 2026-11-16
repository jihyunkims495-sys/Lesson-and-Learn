"""비밀번호 저장과 토큰 설정. 원문 비밀번호·토큰은 로그로 출력하지 않는다."""
import hashlib
import hmac
import os
import secrets

JWT_SECRET = os.environ.get('JWT_SECRET', '')
if len(JWT_SECRET) < 32:
    raise RuntimeError('JWT_SECRET은 무작위 32자 이상이어야 합니다')


class PasswordHash:
    """표준 라이브러리 scrypt 사용. salt 16바이트, N=2^14, r=8, p=1."""
    @staticmethod
    def hash(password: str) -> str:
        salt = secrets.token_bytes(16)
        digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
        return salt.hex() + ':' + digest.hex()

    @staticmethod
    def verify(password: str, encoded: str) -> bool:
        try:
            salt, digest = encoded.split(':')
            actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1, dklen=32)
            return hmac.compare_digest(actual, bytes.fromhex(digest))
        except (ValueError, TypeError):
            return False


password_hash = PasswordHash()
dummy_hash = password_hash.hash('dummy-login-timing-password')
