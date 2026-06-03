from sqlmodel import Field, SQLModel
from typing import Optional

class DigitalFootprint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    platform_name: str = Field(index=True)
    category: Optional[str] = None
    risk_level: Optional[str] = "Low"
    