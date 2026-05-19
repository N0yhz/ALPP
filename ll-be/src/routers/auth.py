from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.data.database import get_db
from src.services.security import get_auth_service, get_current_user, oauth2_scheme
from src.services.auth_service import AuthService
from src.schemas.auth import UserRegister, UserLogin, OTPVerify, TokenResponse, PasswordResetRequest, PasswordResetConfirm
from src.entity.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegister, 
    background_tasks: BackgroundTasks,
    service: AuthService = Depends(get_auth_service)
):
    success = await service.register(payload.email, payload.password, background_tasks)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists, is verified and active"
        )
    return {"message": "User registered. OTP sent to your email in background."}

@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    payload: UserLogin, 
    service: AuthService = Depends(get_auth_service)
):
    token = service.login(payload.email, payload.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials, user not verified, or account deactivated"
        )
    
    # Set secure cookie for auto-login
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=86400, # 24 hours
        samesite="none",
        secure=True # Set to True in production with HTTPS
    )
    
    return TokenResponse(access_token=token)

@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def login_for_swagger(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service)
):
    """
    Compatibility endpoint for Swagger UI 'Authorize' button.
    It takes username (email) and password from the form.
    """
    token = service.login(form_data.username, form_data.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Also set cookie when logging in via Swagger
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False
    )
    
    return TokenResponse(access_token=token)

@router.post("/verify", response_model=TokenResponse)
async def verify_otp(
    response: Response,
    payload: OTPVerify, 
    service: AuthService = Depends(get_auth_service)
):
    token = service.verify_otp(payload.email, payload.code)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    # Set cookie after verification too
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False
    )
    
    return TokenResponse(access_token=token)

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service)
):
    """
    Logout user by blacklisting the token and clearing the secure cookie.
    Works even if the token is already expired.
    """
    # 1. Extract token for blacklisting
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    # 2. Blacklist the token if present
    if token:
        service.logout(token)

    # 3. Clear the cookie with matching parameters from login
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False # Set to True in production with HTTPS
    )
    
    return {"message": "Successfully logged out. Cookies cleared."}

@router.post("/password-reset/request")
async def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    service: AuthService = Depends(get_auth_service)
):
    await service.request_password_reset(payload.email, background_tasks)
    # Always return success to prevent email enumeration
    return {"message": "If the email exists and is active, a reset code has been sent."}

@router.post("/password-reset/confirm")
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    service: AuthService = Depends(get_auth_service)
):
    success = service.reset_password(payload.email, payload.code, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or reset code"
        )
    return {"message": "Password reset successful."}

@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
):
    service.deactivate_account(current_user)
    response.delete_cookie("access_token")
    return {"message": "Account successfully deactivated. You have been logged out."}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "job_role": current_user.job_role,
        "verified": current_user.verified,
        "is_active": current_user.is_active
    }
