import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer, APIKeyCookie
from sqlalchemy.orm import Session
from src.config.settings import settings
from src.data.database import get_db
from src.repositories.user_repository import UserRepository
from src.services.auth_service import AuthService
from src.entity.user import User

# Standard Bearer for manual tokens/Postman
bearer_scheme = HTTPBearer(auto_error=False)

# Cookie scheme for Frontend/Browser
cookie_scheme = APIKeyCookie(name="access_token", auto_error=False)

# OAuth2 scheme for Swagger /docs "Authorize" button
# We will point this to /auth/token which we'll create next
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))

async def get_current_user(
    request: Request,
    # This dependency triggers the lock icon in Swagger UI
    token_from_header: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    # 1. Try to find token in 3 places:
    # A. Secure Cookie (Best for FE)
    token = request.cookies.get("access_token")
    
    # B. Authorization Header (Standard / Swagger)
    if not token:
        token = token_from_header
            
    # C. Query Param (Fallback for Swagger OAuth2 if needed, though usually in header)
    if not token:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Check blacklist
    if auth_service.is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again."
        )

    try:
        # 3. Decode JWT
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    # 4. Get User
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account deactivated")
        
    return user
