from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
import httpx

from app.core.database import session as get_session
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Schema to receive JSON data from the frontend
class TokenPayload(BaseModel):
    access_token: str

@router.post("/google")
async def google_authentication(payload: TokenPayload, db: Session = Depends(get_session)):
    # 1. Validate Access Token with official Google Userinfo API
    google_userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    headers = {"Authorization": f"Bearer {payload.access_token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(google_userinfo_url, headers=headers)
    
    # If Google responds with anything other than 200, token is invalid or expired
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google Access Token"
        )
    
    # 2. Get profile data from Google response
    google_data = response.json()
    email = google_data.get("email")
    name = google_data.get("name")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account configuration error: Email missing"
        )
    
    # 3. Synchronize with database using SQLModel
    statement = select(User).where(User.email == email)
    existing_user = db.exec(statement).first()
    
    if existing_user:
        # If user has logged in before, update their token
        existing_user.google_access_token = payload.access_token
        existing_user.name = name
        db.add(existing_user)
        db.commit()
        db.refresh(existing_user)
        user_record = existing_user
    else:
        # If this is the user's first login, create a new record
        new_user = User(
            email=email,
            name=name,
            google_access_token=payload.access_token
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_record = new_user
        
    return {
        "status": "success",
        "message": "User authenticated successfully",
        "user": {
            "id": user_record.id,
            "email": user_record.email,
            "name": user_record.name
        }
    }