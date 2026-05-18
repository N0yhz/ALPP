import redis
from src.config.settings import settings

class RedisService:
    def __init__(self):
        self.client = redis.from_url(settings.redis_url, decode_responses=True)

    def set_with_expiry(self, key: str, value: str, expiry_seconds: int):
        self.client.setex(key, expiry_seconds, value)

    def exists(self, key: str) -> bool:
        return self.client.exists(key) > 0

    def set_otp(self, email: str, code: str, expiry_seconds: int = 600):
        # Using a prefix to avoid collisions with blacklisted tokens
        key = f"otp:{email}"
        self.client.setex(key, expiry_seconds, code)

    def get_otp(self, email: str) -> str:
        key = f"otp:{email}"
        return self.client.get(key)

    def delete_otp(self, email: str):
        key = f"otp:{email}"
        self.client.delete(key)

    def get(self, key: str) -> str:
        return self.client.get(key)

    def delete(self, key: str):
        self.client.delete(key)

redis_service = RedisService()
