from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.user import UserResponse
from app.schemas.violation import ViolationResponse

class EnforcementActionBase(BaseModel):
    violation_id: Optional[UUID] = None
    officer_id: UUID
    action_type: str  # warning, ticket, towing
    status: Optional[str] = "dispatched"
    notes: Optional[str] = None

class EnforcementActionCreate(EnforcementActionBase):
    pass

class EnforcementActionUpdate(BaseModel):
    status: Optional[str] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None

class EnforcementActionResponse(BaseModel):
    id: UUID
    violation_id: Optional[UUID]
    officer_id: Optional[UUID]
    action_type: str
    dispatched_at: datetime
    resolved_at: Optional[datetime]
    status: str
    notes: Optional[str]
    created_at: datetime
    
    # Optional detailed profiles for joined queries
    violation: Optional[ViolationResponse] = None
    officer: Optional[UserResponse] = None

    class Config:
        from_attributes = True
        orm_mode = True
