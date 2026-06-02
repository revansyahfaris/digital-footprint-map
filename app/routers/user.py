from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.models.user import User
from app.core.database import session as get_session  # Import session function from database.py

# Create a specialized router for User-related operations
router = APIRouter(prefix="/users", tags=["Users"])

# 1. Get all users (GET method)
@router.get("/")
def get_all_users(db: Session = Depends(get_session)):
    users = db.exec(select(User)).all()
    return users

# 2. Create a new user (POST method)
@router.post("/")
def create_new_user(user: User, db: Session = Depends(get_session)):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user