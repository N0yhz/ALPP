import random
import string
import jwt
import hashlib
import base64
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import BackgroundTasks
from src.repositories.user_repository import UserRepository
from src.entity.user import User
from src.config.settings import settings
from src.services.redis_service import redis_service
from src.services.mail_service import mail_service

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def _hash_password(self, password: str) -> str:
        # 1. Pre-hash with SHA-256 to bypass bcrypt 72-byte limit
        pwd_hash = hashlib.sha256(password.encode("utf-8")).digest()
        pwd_b64 = base64.b64encode(pwd_hash) # Keep as bytes for bcrypt
        
        # 2. Hash with bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_b64, salt)
        return hashed.decode("utf-8")

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            # 1. Pre-hash with SHA-256
            pwd_hash = hashlib.sha256(plain_password.encode("utf-8")).digest()
            pwd_b64 = base64.b64encode(pwd_hash)
            
            # 2. Verify with bcrypt
            return bcrypt.checkpw(pwd_b64, hashed_password.encode("utf-8"))
        except Exception:
            return False

    async def register(self, email: str, password: str, background_tasks: BackgroundTasks) -> bool:
        user = self.user_repo.get_by_email(email)
        if user and user.verified and user.is_active:
            return False # User already exists, is verified and active
        
        hashed_password = self._hash_password(password)
        
        if not user:
            user = User(email=email, hashed_password=hashed_password, verified=False, is_active=True)
            self.user_repo.create(user)
        else:
            # If user exists but is not verified or is inactive, update their password and reactivate
            # We also set verified=False to force them to verify their email again
            self.user_repo.update(user, {"hashed_password": hashed_password, "is_active": True, "verified": False})
        
        # Pass only the email string to avoid DetachedInstanceError in background tasks
        background_tasks.add_task(self._generate_and_send_otp, email)
        return True

    def login(self, email: str, password: str) -> Optional[str]:
        user = self.user_repo.get_by_email(email)
        if not user or not user.verified or not user.is_active:
            return None # User doesn't exist, not verified, or deactivated
        
        if not user.hashed_password or not self._verify_password(password, user.hashed_password):
            return None # Invalid password
        
        # Login is now instant without OTP
        return self._create_access_token({"sub": str(user.id), "email": user.email})

    async def _generate_and_send_otp(self, email: str):
        code = "".join(random.choices(string.digits, k=6))
        
        # Store in Redis with 10-minute expiry (600 seconds)
        redis_service.set_otp(email, code, expiry_seconds=600)
        
        # Real email sending
        await mail_service.send_otp_email(email, code)
        print(f"DEBUG: OTP for {email} is {code} (stored in Redis)")

    async def request_password_reset(self, email: str, background_tasks: BackgroundTasks) -> bool:
        user = self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            return False # Don't send reset for non-existent or deactivated users

        background_tasks.add_task(self._generate_and_send_reset_otp, email)
        return True

    async def _generate_and_send_reset_otp(self, email: str):
        code = "".join(random.choices(string.digits, k=6))
        # Store in Redis with prefix 'reset:'
        redis_service.set_with_expiry(f"reset:{email}", code, 600)
        await mail_service.send_reset_email(email, code)
        print(f"DEBUG: Password Reset OTP for {email} is {code}")

    def reset_password(self, email: str, code: str, new_password: str) -> bool:
        user = self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            return False

        stored_code = redis_service.get(f"reset:{email}")
        if not stored_code or stored_code != code:
            return False

        # Update password and clear reset token
        hashed_password = self._hash_password(new_password)
        self.user_repo.update(user, {"hashed_password": hashed_password})
        redis_service.delete(f"reset:{email}")
        return True

    def deactivate_account(self, user: User) -> bool:
        self.user_repo.update(user, {"is_active": False})
        return True

    def verify_otp(self, email: str, code: str) -> Optional[str]:
        user = self.user_repo.get_by_email(email)
        if not user:
            return None

        # Check Redis instead of DB
        stored_code = redis_service.get_otp(email)
        if not stored_code or stored_code != code:
            return None

        # 1. Delete OTP from Redis so it can't be used again
        redis_service.delete_otp(email)
        
        # 2. Activate user if they were pending
        if not user.verified:
            self.user_repo.update(user, {"verified": True})

        # 3. Return Token
        return self._create_access_token({"sub": str(user.id), "email": user.email})

    def logout(self, token: str):
        # Decode to get expiry
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            exp = payload.get("exp")
            now = datetime.utcnow().timestamp()
            ttl = int(exp - now)
            if ttl > 0:
                redis_service.set_with_expiry(f"blacklist:{token}", "true", ttl)
        except Exception:
            pass

    def is_token_blacklisted(self, token: str) -> bool:
        return redis_service.exists(f"blacklist:{token}")

    def _create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        # Use UTC for consistent expiration checking
        expire = datetime.utcnow() + timedelta(hours=24)
        to_encode.update({"exp": expire}) 
        return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
