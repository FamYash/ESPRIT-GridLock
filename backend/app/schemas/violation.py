from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class ViolationBase(BaseModel):
    camera_id: Optional[UUID] = None
    zone_id: UUID
    latitude: float
    longitude: float
    detection_start: datetime
    detection_end: Optional[datetime] = None
    duration_seconds: Optional[float] = 0.0
    vehicle_type: str
    license_plate: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = "detected"

class ViolationCreate(ViolationBase):
    pass

class ViolationUpdate(BaseModel):
    detection_end: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    status: Optional[str] = None
    license_plate: Optional[str] = None
    image_url: Optional[str] = None

class ViolationResponse(BaseModel):
    id: UUID
    camera_id: Optional[UUID]
    zone_id: UUID
    latitude: float
    longitude: float
    detection_start: datetime
    detection_end: Optional[datetime]
    duration_seconds: float
    vehicle_type: str
    license_plate: Optional[str]
    image_url: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True
