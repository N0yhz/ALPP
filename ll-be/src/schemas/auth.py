from pydantic import BaseModel, EmailStr
from enum import Enum

class JobRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    OTHER = "other"

class SystemRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str
