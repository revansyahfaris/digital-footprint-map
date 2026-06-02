from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import httpx
import re

from app.core.database import session as get_session
from app.models.user import User
from app.models.footprint import DigitalFootprint

router = APIRouter(prefix="/scan", tags=["Radar Scanner"])

def extract_platform_name(email_from_string: str):
    """
    Extracts platform name and domain from an email "From" string.
    Example: "Netflix <info@mail.netflix.com>" becomes ("Netflix", "netflix.com").
    """
    # 1. Find the email address in the string using regex
    email_match = re.search(r'[\w\.-]+@([\w\.-]+)', email_from_string)
    if not email_match:
        return None, None
        
    raw_domain = email_match.group(1).lower() # Example: "mail.netflix.com" or "info.tokopedia.com"
    
    # 2. Clean up common email subdomains
    # We remove prefixes like mail., noreply., info., notification., etc.
    cleaned_domain = re.sub(r'^(mail|noreply|info|notification|alerts|news|update|account)\.', '', raw_domain)
    
    # 3. Use the first part of the domain as the official Platform Name
    # Example: "netflix.com" becomes "Netflix"
    platform_name = cleaned_domain.split('.')[0].capitalize()
    
    return platform_name, cleaned_domain

@router.post("/gmail/{user_id}")
async def scan_gmail_inbox(user_id: int, db: Session = Depends(get_session)):
    user = db.get(User, user_id)
    if not user or not user.google_access_token:
        raise HTTPException(status_code=404, detail="User or Access Token not found")

    headers = {"Authorization": f"Bearer {user.google_access_token}"}
    
    async with httpx.AsyncClient() as client:
        # Scan the last 100 emails
        gmail_list_url = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100"
        list_response = await client.get(gmail_list_url, headers=headers)
        
        if list_response.status_code != 200:
            print(f"\n[!!!] GMAIL API ERROR - STATUS CODE: {list_response.status_code}")
            print(f"[!!!] GOOGLE RESPONSE: {list_response.text}\n")
            raise HTTPException(status_code=401, detail=f"Google API Error: {list_response.text}")
            
        messages = list_response.json().get("messages", [])
        detected_count = 0
        
        # Temporary set to avoid redundant database hits within the loop
        scanned_platforms = set()
        
        for msg in messages:
            msg_id = msg["id"]
            detail_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=metadata&metadataHeaders=From"
            detail_response = await client.get(detail_url, headers=headers)
            
            if detail_response.status_code == 200:
                headers_data = detail_response.json().get("payload", {}).get("headers", [])
                email_from = next((h["value"] for h in headers_data if h["name"].lower() == "from"), "")
                
                if email_from:
                    platform_name, domain = extract_platform_name(email_from)
                    
                    # Filter: Exclude personal email domains
                    banned_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'ymail.com', 'warga']
                    if not platform_name or domain in banned_domains:
                        continue
                        
                    # Prevent duplicate processing in a single scan session
                    if platform_name in scanned_platforms:
                        continue
                        
                    scanned_platforms.add(platform_name)
                    
                    # Check if this platform is already registered for the user
                    stmt = select(DigitalFootprint).where(
                        DigitalFootprint.user_id == user_id, 
                        DigitalFootprint.platform_name == platform_name
                    )
                    exists = db.exec(stmt).first()
                    
                    if not exists:
                        # Automatically create new footprint data
                        new_footprint = DigitalFootprint(
                            user_id=user_id,
                            platform_name=platform_name,
                            category="UNCATEGORIZED", # Default category
                            risk_level="MEDIUM",       # Default risk assessment
                            description= f"Automated radar detection from official domain: {domain}"
                        )
                        db.add(new_footprint)
                        detected_count += 1
        
        db.commit()
        
    return {
        "status": "success",
        "messages_scanned": len(messages),
        "new_footprints_found": detected_count
    }

@router.get("/footprints/{user_id}")
def get_user_footprints(user_id: int, db: Session = Depends(get_session)):
    # Retrieve all digital footprints for a specific user
    stmt = select(DigitalFootprint).where(DigitalFootprint.user_id == user_id)
    footprints = db.exec(stmt).all()
    return footprints