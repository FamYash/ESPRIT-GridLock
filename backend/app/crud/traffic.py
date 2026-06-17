from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.traffic import TrafficMetric
from app.models.zone import Zone
from app.models.violation import Violation
from app.schemas.traffic import TrafficMetricCreate, CongestionStats
from uuid import UUID
from datetime import datetime

def create_traffic_metric(db: Session, metric_in: TrafficMetricCreate) -> TrafficMetric:
    db_obj = TrafficMetric(
        zone_id=metric_in.zone_id,
        timestamp=metric_in.timestamp,
        average_speed_kmh=metric_in.average_speed_kmh,
        vehicle_count=metric_in.vehicle_count,
        occupancy_percentage=metric_in.occupancy_percentage,
        congestion_index=metric_in.congestion_index
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_traffic_metrics(db: Session, zone_id: UUID = None, limit: int = 100):
    query = db.query(TrafficMetric)
    if zone_id:
        query = query.filter(TrafficMetric.zone_id == zone_id)
    return query.order_by(TrafficMetric.timestamp.desc()).limit(limit).all()

def get_congestion_statistics(db: Session) -> list[CongestionStats]:
    zones = db.query(Zone).all()
    results = []
    
    for zone in zones:
        # Get latest traffic metric
        latest_metric = db.query(TrafficMetric).filter(TrafficMetric.zone_id == zone.id).order_by(TrafficMetric.timestamp.desc()).first()
        
        # Get active violations count
        active_violations_count = db.query(func.count(Violation.id)).filter(
            Violation.zone_id == zone.id,
            Violation.status.in_(["active", "detected", "cited"])
        ).scalar() or 0
        
        congestion_index = latest_metric.congestion_index if latest_metric else 0.0
        avg_speed = latest_metric.average_speed_kmh if latest_metric else 40.0 # Default speed limit
        
        results.append(
            CongestionStats(
                zone_id=zone.id,
                zone_name=zone.name,
                current_congestion_index=congestion_index,
                average_speed_kmh=avg_speed,
                active_violations_count=active_violations_count,
                risk_level=zone.risk_level,
                priority_score=zone.enforcement_priority
            )
        )
        
    return results
