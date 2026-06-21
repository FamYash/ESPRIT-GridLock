from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.enforcement import EnforcementActionCreate, EnforcementActionUpdate, EnforcementActionResponse
from app.crud.enforcement import get_enforcement_action, get_enforcement_actions, create_enforcement_action, update_enforcement_action
from app.api.auth import get_current_user
from app.models.user import User
from app.core.mock_store import MockStore

router = APIRouter()

@router.get("", response_model=List[EnforcementActionResponse])
def read_enforcement_actions(
    status: Optional[str] = None,
    officer_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        return get_enforcement_actions(db, status=status, officer_id=officer_id)
    except Exception as e:
        print(f"Database error in read_enforcement_actions, falling back to mock_store: {e}")
        return MockStore.get_enforcement_actions(status=status, officer_id=officer_id)

@router.post("", response_model=EnforcementActionResponse, status_code=status.HTTP_201_CREATED)
def dispatch_officer(
    action_in: EnforcementActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to dispatch officers")
    try:
        return create_enforcement_action(db, action_in=action_in)
    except Exception as e:
        print(f"Database error in dispatch_officer, falling back to mock_store: {e}")
        act_dict = action_in.model_dump() if hasattr(action_in, 'model_dump') else action_in.dict()
        return MockStore.create_enforcement_action(act_dict)

@router.put("/{action_id}", response_model=EnforcementActionResponse)
def modify_enforcement_action(
    action_id: UUID,
    action_in: EnforcementActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    curr_user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    
    try:
        db_action = get_enforcement_action(db, action_id=action_id)
        if not db_action:
            raise HTTPException(status_code=404, detail="Enforcement action not found")
            
        # Only the assigned officer or an operator/admin can update the dispatch status
        if role == "officer" and db_action.officer_id != curr_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify other officers dispatches")
            
        return update_enforcement_action(db, db_action=db_action, action_in=action_in)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in modify_enforcement_action, falling back to mock_store: {e}")
        db_action = MockStore.get_enforcement_action(action_id)
        if not db_action:
            raise HTTPException(status_code=404, detail="Enforcement action not found")
            
        if role == "officer" and db_action["officer_id"] != curr_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify other officers dispatches")
            
        act_dict = action_in.model_dump(exclude_unset=True) if hasattr(action_in, 'model_dump') else action_in.dict(exclude_unset=True)
        return MockStore.update_enforcement_action(action_id, act_dict)
