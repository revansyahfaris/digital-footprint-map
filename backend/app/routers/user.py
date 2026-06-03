from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.models.user import User
from app.schemas.user import UserResponse
from app.routers.scan import get_current_user_id
from app.core.database import session as get_session

# Create a specialized router for User-related operations
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_session)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")
    
    return user