from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.violation import ViolationCreate, ViolationUpdate, ViolationResponse
from app.crud.violation import get_violation, get_violations, create_violation, update_violation
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

# WebSocket Manager for Real-Time Violations Broadcast
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Remove stale connection
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# REST Endpoints
@router.get("", response_model=List[ViolationResponse])
def read_violations(
    status: Optional[str] = None,
    zone_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
) -> Any:
    return get_violations(db, status=status, zone_id=zone_id)

@router.post("", response_model=ViolationResponse, status_code=status.HTTP_201_CREATED)
async def add_violation(violation_in: ViolationCreate, db: Session = Depends(get_db)) -> Any:
    # Note: AI pipeline will call this POST endpoint to push new violations.
    # We allow this without user auth for simulation / remote AI runner convenience.
    violation = create_violation(db, violation_in=violation_in)
    
    # Broadcast to dashboard in real-time
    violation_payload = {
        "event": "violation_detected",
        "data": {
            "id": str(violation.id),
            "camera_id": str(violation.camera_id) if violation.camera_id else None,
            "zone_id": str(violation.zone_id),
            "latitude": violation.latitude,
            "longitude": violation.longitude,
            "vehicle_type": violation.vehicle_type,
            "license_plate": violation.license_plate,
            "image_url": violation.image_url,
            "status": violation.status,
            "detection_start": violation.detection_start.isoformat(),
            "created_at": violation.created_at.isoformat()
        }
    }
    await manager.broadcast(violation_payload)
    return violation

@router.get("/{violation_id}", response_model=ViolationResponse)
def read_violation_by_id(violation_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    violation = get_violation(db, violation_id=violation_id)
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    return violation

@router.put("/{violation_id}", response_model=ViolationResponse)
async def modify_violation(
    violation_id: UUID, 
    violation_in: ViolationUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> Any:
    db_violation = get_violation(db, violation_id=violation_id)
    if not db_violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    updated_violation = update_violation(db, db_violation=db_violation, violation_in=violation_in)
    
    # Broadcast update (e.g., when cited or cleared)
    update_payload = {
        "event": "violation_updated",
        "data": {
            "id": str(updated_violation.id),
            "status": updated_violation.status,
            "duration_seconds": updated_violation.duration_seconds,
            "detection_end": updated_violation.detection_end.isoformat() if updated_violation.detection_end else None
        }
    }
    await manager.broadcast(update_payload)
    return updated_violation
