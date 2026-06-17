from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class TrafficMetricBase(BaseModel):
    zone_id: UUID
    timestamp: datetime
    average_speed_kmh: float
    vehicle_count: float
    occupancy_percentage: float
    congestion_index: float

class TrafficMetricCreate(TrafficMetricBase):
    pass

class TrafficMetricResponse(TrafficMetricBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

class CongestionStats(BaseModel):
    zone_id: UUID
    zone_name: str
    current_congestion_index: float
    average_speed_kmh: float
    active_violations_count: int
    risk_level: str
    priority_score: float
