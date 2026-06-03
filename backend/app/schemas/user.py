from pydantic import BaseModel, EmailStr
from typing import Optional

class UserResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: EmailStr

    class Config:
        from_attributes = True