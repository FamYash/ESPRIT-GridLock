from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.violation import Violation
from app.models.zone import Zone
from app.models.traffic import TrafficMetric
from datetime import timedelta

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    latest_date = db.query(
        func.max(Violation.detection_start)
    ).scalar()

    active_violations = (
        db.query(Violation)
        .filter(
            Violation.status.in_(["active", "detected"]),
            Violation.detection_start >= latest_date - timedelta(days=30)
        )
        .count()
    )

    critical_zones = (
        db.query(Zone)
        .filter(Zone.risk_level == "high")
        .count()
    )

    avg_congestion = (
        db.query(func.avg(TrafficMetric.congestion_index))
        .scalar()
    )

    avg_speed = (
        db.query(func.avg(TrafficMetric.average_speed_kmh))
        .scalar()
    )

    return {
        "active_violations": active_violations,
        "critical_zones": critical_zones,
        "avg_congestion": round((avg_congestion or 0) * 100, 2),
        "avg_speed": round(avg_speed or 0, 2)
    }