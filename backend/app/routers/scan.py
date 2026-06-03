from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from cryptography.fernet import Fernet
import httpx
import re
import jwt
import asyncio

from app.core.database import session as get_session
from app.models.user import User
from app.models.footprint import DigitalFootprint
from app.core.config import settings

router = APIRouter(prefix="/scan", tags=["Radar Scanner"])

fernet = Fernet(settings.ENCRYPTION_KEY.encode())

# 1. Helper function for extracting platform name from email address using regex pattern matching
def extract_platform_name(email_from: str):
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', email_from)
    if not email_match:
        return None, None
    
    email = email_match.group(0).lower()
    local_part, domain = email.split('@')
    
    domain_parts = domain.split('.')
    if len(domain_parts) >= 2:
        platform_name = domain_parts[-2].upper()
    else:
        platform_name = local_part.upper()
        
    return platform_name, domain

# 2. JWT-based authentication dependency to get current user ID from Authorization header
def get_current_user_id(authorization: str = Header(...)) -> int:
    try:
        token_type, token = authorization.split(" ")
        if token_type.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token.")
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed.")

# 3. Parallelized function to fetch email metadata for a given message ID using Gmail API
async def fetch_message_metadata(client: httpx.AsyncClient, msg_id: str, headers: dict):
    detail_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=metadata&metadataHeaders=From"
    try:
        response = await client.get(detail_url, headers=headers)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return None

# MAIN RADAR ROUTER ENGINE
@router.post("/gmail")
async def scan_gmail_inbox(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_session)
):
    user = db.get(User, user_id)
    if not user or not user.google_access_token:
        raise HTTPException(status_code=404, detail="User or Access Token not found")

    try:
        decrypted_token = fernet.decrypt(user.google_access_token.encode()).decode()
    except Exception:
        raise HTTPException(status_code=500, detail="Token decryption failed")
    
    headers = {"Authorization": f"Bearer {decrypted_token}"}
    
    async with httpx.AsyncClient() as client:
        # Ambil daftar 100 ID email terakhir
        gmail_list_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100"
        list_response = await client.get(gmail_list_url, headers=headers)
        
        if list_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Google API Authorization failed.")
            
        messages = list_response.json().get("messages", [])
        detected_count = 0
        scanned_platforms = set()
        
        tasks = [fetch_message_metadata(client, msg["id"], headers) for msg in messages]
        
        completed_messages = await asyncio.gather(*tasks)
        
        for msg_data in completed_messages:
            if not msg_data:
                continue
                
            headers_data = msg_data.get("payload", {}).get("headers", [])
            email_from = next((h["value"] for h in headers_data if h["name"].lower() == "from"), "")
            
            if email_from:
                platform_name, domain = extract_platform_name(email_from)
                banned_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'ymail.com']
                
                if not platform_name or domain in banned_domains:
                    continue
                    
                if platform_name in scanned_platforms:
                    continue
                    
                scanned_platforms.add(platform_name)
                
                stmt = select(DigitalFootprint).where(
                    DigitalFootprint.user_id == user_id, 
                    DigitalFootprint.platform_name == platform_name
                )
                exists = db.exec(stmt).first()
                
                if not exists:
                    new_footprint = DigitalFootprint(
                        user_id=user_id,
                        platform_name=platform_name,
                        category="UNCATEGORIZED",
                        risk_level="MEDIUM",
                        description=f"Automated radar detection from official domain: {domain}"
                    )
                    db.add(new_footprint)
                    detected_count += 1
        
        db.commit()
        
    return {
        "status": "success",
        "messages_scanned": len(messages),
        "new_footprints_found": detected_count
    }

@router.get("/footprints")
def get_user_footprints(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_session)
):
    stmt = select(DigitalFootprint).where(DigitalFootprint.user_id == user_id)
    footprints = db.exec(stmt).all()
    return footprints