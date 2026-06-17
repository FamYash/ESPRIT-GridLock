from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.traffic import TrafficMetricCreate, TrafficMetricResponse, CongestionStats
from app.crud.traffic import create_traffic_metric, get_traffic_metrics, get_congestion_statistics
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/metrics", response_model=List[TrafficMetricResponse])
def read_traffic_metrics(
    zone_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return get_traffic_metrics(db, zone_id=zone_id)

@router.post("/metrics", response_model=TrafficMetricResponse, status_code=status.HTTP_201_CREATED)
def add_traffic_metric(metric_in: TrafficMetricCreate, db: Session = Depends(get_db)) -> Any:
    # Post endpoint used by AI pipeline to upload traffic metrics
    return create_traffic_metric(db, metric_in=metric_in)

@router.get("/congestion-stats", response_model=List[CongestionStats])
def read_congestion_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return get_congestion_statistics(db)
