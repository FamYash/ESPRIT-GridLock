from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

# Camera Schemas
class CameraBase(BaseModel):
    name: str
    stream_url: str
    latitude: float
    longitude: float
    status: Optional[str] = "online"

class CameraCreate(CameraBase):
    zone_id: Optional[UUID] = None

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    stream_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    zone_id: Optional[UUID] = None

class CameraResponse(BaseModel):
    id: UUID
    zone_id: Optional[UUID]
    name: str
    stream_url: str
    latitude: float
    longitude: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True


# Zone Schemas
class ZoneBase(BaseModel):
    name: str
    risk_level: Optional[str] = "low"
    # List of [latitude, longitude] pairs representing boundary polygon vertices
    boundary: List[List[float]] 

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    risk_level: Optional[str] = None
    boundary: Optional[List[List[float]]] = None
    enforcement_priority: Optional[float] = None

class ZoneResponse(BaseModel):
    id: UUID
    name: str
    risk_level: str
    enforcement_priority: float
    boundary: List[List[float]]
    created_at: datetime
    cameras: List[CameraResponse] = []

    class Config:
        from_attributes = True
        orm_mode = True
