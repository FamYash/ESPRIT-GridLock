from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.violation import Violation
from app.schemas.violation import ViolationCreate, ViolationUpdate
from uuid import UUID
from datetime import datetime

def get_violation(db: Session, violation_id: UUID) -> Violation:
    violation = db.query(Violation).filter(Violation.id == violation_id).first()
    if violation:
        lat = db.query(func.ST_Y(Violation.location_point)).filter(Violation.id == violation.id).scalar()
        lng = db.query(func.ST_X(Violation.location_point)).filter(Violation.id == violation.id).scalar()
        violation.latitude = lat
        violation.longitude = lng
    return violation

def get_violations(db: Session, status: str = None, zone_id: UUID = None, skip: int = 0, limit: int = 100):
    query = db.query(Violation)
    if status:
        query = query.filter(Violation.status == status)
    if zone_id:
        query = query.filter(Violation.zone_id == zone_id)
        
    violations = query.order_by(Violation.created_at.desc()).offset(skip).limit(limit).all()
    for violation in violations:
        lat = db.query(func.ST_Y(Violation.location_point)).filter(Violation.id == violation.id).scalar()
        lng = db.query(func.ST_X(Violation.location_point)).filter(Violation.id == violation.id).scalar()
        violation.latitude = lat
        violation.longitude = lng
    return violations

def create_violation(db: Session, violation_in: ViolationCreate) -> Violation:
    point_wkt = f"POINT({violation_in.longitude} {violation_in.latitude})"
    db_obj = Violation(
        camera_id=violation_in.camera_id,
        zone_id=violation_in.zone_id,
        location_point=func.ST_GeomFromText(point_wkt, 4326),
        detection_start=violation_in.detection_start,
        detection_end=violation_in.detection_end,
        duration_seconds=violation_in.duration_seconds or 0.0,
        vehicle_type=violation_in.vehicle_type,
        license_plate=violation_in.license_plate,
        image_url=violation_in.image_url,
        status=violation_in.status or "active"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    db_obj.latitude = violation_in.latitude
    db_obj.longitude = violation_in.longitude
    return db_obj

def update_violation(db: Session, db_violation: Violation, violation_in: ViolationUpdate) -> Violation:
    update_data = violation_in.model_dump(exclude_unset=True) if hasattr(violation_in, 'model_dump') else violation_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_violation, field, value)
        
    if db_violation.detection_end and db_violation.detection_start:
        delta = db_violation.detection_end - db_violation.detection_start
        db_violation.duration_seconds = delta.total_seconds()
        
    db.add(db_violation)
    db.commit()
    db.refresh(db_violation)
    
    lat = db.query(func.ST_Y(Violation.location_point)).filter(Violation.id == db_violation.id).scalar()
    lng = db.query(func.ST_X(Violation.location_point)).filter(Violation.id == db_violation.id).scalar()
    db_violation.latitude = lat
    db_violation.longitude = lng
    return db_violation
