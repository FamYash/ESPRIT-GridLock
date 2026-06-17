from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.enforcement import EnforcementActionCreate, EnforcementActionUpdate, EnforcementActionResponse
from app.crud.enforcement import get_enforcement_action, get_enforcement_actions, create_enforcement_action, update_enforcement_action
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[EnforcementActionResponse])
def read_enforcement_actions(
    status: Optional[str] = None,
    officer_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return get_enforcement_actions(db, status=status, officer_id=officer_id)

@router.post("", response_model=EnforcementActionResponse, status_code=status.HTTP_201_CREATED)
def dispatch_officer(
    action_in: EnforcementActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to dispatch officers")
    return create_enforcement_action(db, action_in=action_in)

@router.put("/{action_id}", response_model=EnforcementActionResponse)
def modify_enforcement_action(
    action_id: UUID,
    action_in: EnforcementActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    db_action = get_enforcement_action(db, action_id=action_id)
    if not db_action:
        raise HTTPException(status_code=404, detail="Enforcement action not found")
        
    # Only the assigned officer or an operator/admin can update the dispatch status
    if current_user.role == "officer" and db_action.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify other officers dispatches")
        
    return update_enforcement_action(db, db_action=db_action, action_in=action_in)
