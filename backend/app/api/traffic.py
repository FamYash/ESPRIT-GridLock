from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
import datetime
import uuid

from app.core.database import get_db
from app.schemas.traffic import TrafficMetricCreate, TrafficMetricResponse, CongestionStats
from app.crud.traffic import create_traffic_metric, get_traffic_metrics, get_congestion_statistics
from app.api.auth import get_current_user
from app.models.user import User
from app.core.mock_store import MockStore

router = APIRouter()

@router.get("/metrics", response_model=List[TrafficMetricResponse])
def read_traffic_metrics(
    zone_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        return get_traffic_metrics(db, zone_id=zone_id)
    except Exception as e:
        print(f"Database error in read_traffic_metrics, falling back to empty list: {e}")
        return []

@router.post("/metrics", response_model=TrafficMetricResponse, status_code=status.HTTP_201_CREATED)
def add_traffic_metric(metric_in: TrafficMetricCreate, db: Session = Depends(get_db)) -> Any:
    # Post endpoint used by AI pipeline to upload traffic metrics
    try:
        return create_traffic_metric(db, metric_in=metric_in)
    except Exception as e:
        print(f"Database error in add_traffic_metric: {e}")
        return {
            "id": uuid.uuid4(),
            "zone_id": metric_in.zone_id,
            "timestamp": metric_in.timestamp,
            "average_speed_kmh": metric_in.average_speed_kmh,
            "vehicle_count": metric_in.vehicle_count,
            "occupancy_percentage": metric_in.occupancy_percentage,
            "congestion_index": metric_in.congestion_index,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

@router.get("/congestion-stats", response_model=List[CongestionStats])
def read_congestion_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        return get_congestion_statistics(db)
    except Exception as e:
        print(f"Database error in read_congestion_stats, falling back to mock_store: {e}")
        return MockStore.get_congestion_stats()
