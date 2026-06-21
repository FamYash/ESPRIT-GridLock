from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List
from uuid import UUID

from app.core.database import get_db
from app.schemas.zone import ZoneCreate, ZoneUpdate, ZoneResponse, CameraCreate, CameraUpdate, CameraResponse
from app.crud.zone import get_zone, get_zones, create_zone, update_zone, create_camera, get_cameras, update_camera
from app.api.auth import get_current_user
from app.models.user import User
from app.models.zone import Camera
from app.core.mock_store import MockStore

router = APIRouter()

# Zones Endpoints
@router.get("", response_model=List[ZoneResponse])
def read_zones(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    try:
        return get_zones(db)
    except Exception as e:
        print(f"Database error in read_zones, falling back to mock_store: {e}")
        return MockStore.get_zones()

@router.post("", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def add_zone(zone_in: ZoneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    if current_user.get("role") not in ["admin", "operator"] if isinstance(current_user, dict) else current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to create zones")
    try:
        return create_zone(db, zone_in=zone_in)
    except Exception as e:
        print(f"Database error in add_zone: {e}")
        # Return mock created zone
        import datetime
        mock_z = {
            "id": UUID(int=0),
            "name": zone_in.name,
            "risk_level": zone_in.risk_level or "low",
            "enforcement_priority": 0.0,
            "boundary": zone_in.boundary,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "cameras": []
        }
        MockStore.get_zones().append(mock_z)
        return mock_z

@router.get("/{zone_id}", response_model=ZoneResponse)
def read_zone_by_id(zone_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    try:
        zone = get_zone(db, zone_id=zone_id)
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        return zone
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in read_zone_by_id, falling back to mock_store: {e}")
        zone = MockStore.get_zone(zone_id)
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        return zone

@router.put("/{zone_id}", response_model=ZoneResponse)
def modify_zone(zone_id: UUID, zone_in: ZoneUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify zones")
    try:
        db_zone = get_zone(db, zone_id=zone_id)
        if not db_zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        return update_zone(db, db_zone=db_zone, zone_in=zone_in)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in modify_zone: {e}")
        zone = MockStore.get_zone(zone_id)
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        update_data = zone_in.model_dump(exclude_unset=True) if hasattr(zone_in, 'model_dump') else zone_in.dict(exclude_unset=True)
        for k, v in update_data.items():
            zone[k] = v
        return zone


# Cameras Endpoints
@router.get("/cameras/all", response_model=List[CameraResponse])
def read_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    try:
        return get_cameras(db)
    except Exception as e:
        print(f"Database error in read_cameras, falling back to mock_store: {e}")
        return MockStore.get_cameras()

@router.post("/cameras/add", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def add_camera(camera_in: CameraCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to register cameras")
    try:
        return create_camera(db, camera_in=camera_in)
    except Exception as e:
        print(f"Database error in add_camera: {e}")
        import datetime
        mock_c = {
            "id": UUID(int=0),
            "zone_id": camera_in.zone_id,
            "name": camera_in.name,
            "stream_url": camera_in.stream_url,
            "latitude": camera_in.latitude,
            "longitude": camera_in.longitude,
            "status": camera_in.status or "online",
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }
        # Add to matching zone if found
        if camera_in.zone_id:
            zone = MockStore.get_zone(camera_in.zone_id)
            if zone:
                zone["cameras"].append(mock_c)
        return mock_c

@router.put("/cameras/{camera_id}", response_model=CameraResponse)
def modify_camera(camera_id: UUID, camera_in: CameraUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit cameras")
    try:
        db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not db_camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        return update_camera(db, db_camera=db_camera, camera_in=camera_in)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in modify_camera: {e}")
        cams = MockStore.get_cameras()
        target = None
        for c in cams:
            if c["id"] == camera_id:
                target = c
                break
        if not target:
            raise HTTPException(status_code=404, detail="Camera not found")
        update_data = camera_in.model_dump(exclude_unset=True) if hasattr(camera_in, 'model_dump') else camera_in.dict(exclude_unset=True)
        for k, v in update_data.items():
            target[k] = v
        return target
