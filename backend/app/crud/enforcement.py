from sqlalchemy.orm import Session
from app.models.enforcement import EnforcementAction
from app.schemas.enforcement import EnforcementActionCreate, EnforcementActionUpdate
from uuid import UUID
from datetime import datetime

def get_enforcement_action(db: Session, action_id: UUID) -> EnforcementAction:
    return db.query(EnforcementAction).filter(EnforcementAction.id == action_id).first()

def get_enforcement_actions(db: Session, status: str = None, officer_id: UUID = None, skip: int = 0, limit: int = 100):
    query = db.query(EnforcementAction)
    if status:
        query = query.filter(EnforcementAction.status == status)
    if officer_id:
        query = query.filter(EnforcementAction.officer_id == officer_id)
    return query.order_by(EnforcementAction.dispatched_at.desc()).offset(skip).limit(limit).all()

def create_enforcement_action(db: Session, action_in: EnforcementActionCreate) -> EnforcementAction:
    db_obj = EnforcementAction(
        violation_id=action_in.violation_id,
        officer_id=action_in.officer_id,
        action_type=action_in.action_type,
        status=action_in.status or "dispatched"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_enforcement_action(db: Session, db_action: EnforcementAction, action_in: EnforcementActionUpdate) -> EnforcementAction:
    update_data = action_in.model_dump(exclude_unset=True) if hasattr(action_in, 'model_dump') else action_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_action, field, value)
        
    if db_action.status == "resolved" and not db_action.resolved_at:
        db_action.resolved_at = datetime.utcnow()
        
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    return db_action
