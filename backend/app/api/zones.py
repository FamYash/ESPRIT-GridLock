from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List
from uuid import UUID

from app.core.database import get_db
from app.schemas.zone import ZoneCreate, ZoneUpdate, ZoneResponse, CameraCreate, CameraUpdate, CameraResponse
from app.crud.zone import get_zone, get_zones, create_zone, update_zone, create_camera, get_cameras, update_camera
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

# Zones Endpoints
@router.get("", response_model=List[ZoneResponse])
def read_zones(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    return get_zones(db)

@router.post("", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def add_zone(zone_in: ZoneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to create zones")
    return create_zone(db, zone_in=zone_in)

@router.get("/{zone_id}", response_model=ZoneResponse)
def read_zone_by_id(zone_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    zone = get_zone(db, zone_id=zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

@router.put("/{zone_id}", response_model=ZoneResponse)
def modify_zone(zone_id: UUID, zone_in: ZoneUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify zones")
    db_zone = get_zone(db, zone_id=zone_id)
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return update_zone(db, db_zone=db_zone, zone_in=zone_in)


# Cameras Endpoints
@router.get("/cameras/all", response_model=List[CameraResponse])
def read_cameras(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    return get_cameras(db)

@router.post("/cameras/add", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def add_camera(camera_in: CameraCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to register cameras")
    return create_camera(db, camera_in=camera_in)

@router.put("/cameras/{camera_id}", response_model=CameraResponse)
def modify_camera(camera_id: UUID, camera_in: CameraUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit cameras")
    db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return update_camera(db, db_camera=db_camera, camera_in=camera_in)
