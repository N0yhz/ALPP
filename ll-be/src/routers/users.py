from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.data.database import get_db
from src.services.security import get_current_user
from src.repositories.user_repository import UserRepository
from src.entity.user import User
from src.schemas.user import UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.patch("/me/profile")
async def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    
    # Filter out None values to only update provided fields
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    user_repo.update(current_user, update_data)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role,
            "job_role": current_user.job_role
        }
    }
