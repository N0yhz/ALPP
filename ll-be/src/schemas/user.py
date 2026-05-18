from pydantic import BaseModel
from typing import Optional
from src.schemas.auth import JobRole, SystemRole

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_role: Optional[JobRole] = None
    role: Optional[SystemRole] = None
