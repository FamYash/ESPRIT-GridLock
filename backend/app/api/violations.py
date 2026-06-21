from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
import datetime
import asyncio
import random
import uuid

from app.core.database import get_db
from app.schemas.violation import ViolationCreate, ViolationUpdate, ViolationResponse
from app.crud.violation import get_violation, get_violations, create_violation, update_violation
from app.api.auth import get_current_user
from app.models.user import User
from app.core.mock_store import MockStore

router = APIRouter()

# WebSocket Manager for Real-Time Violations Broadcast
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except Exception:
                try:
                    self.active_connections.remove(connection)
                except ValueError:
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


# Live Geofenced Bengaluru Violation Simulator Loop
async def violation_simulator_loop():
    print("Starting Live Geofenced Bengaluru Violation Simulator Loop...")
    vehicle_types = ["car", "motorcycle", "truck", "auto"]
    
    images = [
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=400"
    ]

    await asyncio.sleep(15)  # Let server fully boot first
    
    while True:
        try:
            active_violations = MockStore.get_violations(status="active")
            # Only add if active violations < 6 to prevent congestion overload
            if len(active_violations) < 6:
                zone = random.choice(MockStore.get_zones())
                # Calculate simple center of the zone boundary polygon
                base_lat = sum(p[0] for p in zone["boundary"]) / len(zone["boundary"])
                base_lng = sum(p[1] for p in zone["boundary"]) / len(zone["boundary"])
                
                # Jitter location slightly
                lat = base_lat + random.uniform(-0.0006, 0.0006)
                lng = base_lng + random.uniform(-0.0006, 0.0006)
                
                v_type = random.choice(vehicle_types)
                plate = f"KA {random.randint(1, 5):02d} {chr(random.randint(65, 90))}{chr(random.randint(65, 90))} {random.randint(1000, 9999)}"
                img = random.choice(images)
                
                new_v = {
                    "id": uuid.uuid4(),
                    "camera_id": random.choice(zone["cameras"])["id"] if zone["cameras"] else None,
                    "zone_id": zone["id"],
                    "latitude": lat,
                    "longitude": lng,
                    "vehicle_type": v_type,
                    "license_plate": plate,
                    "image_url": img,
                    "status": "active",
                    "detection_start": datetime.datetime.now(datetime.timezone.utc),
                }
                
                created = MockStore.create_violation(new_v)
                
                # Broadcast new violation
                payload = {
                    "event": "violation_detected",
                    "data": {
                        "id": str(created["id"]),
                        "camera_id": str(created["camera_id"]) if created["camera_id"] else None,
                        "zone_id": str(created["zone_id"]),
                        "latitude": created["latitude"],
                        "longitude": created["longitude"],
                        "vehicle_type": created["vehicle_type"],
                        "license_plate": created["license_plate"],
                        "image_url": created["image_url"],
                        "status": created["status"],
                        "detection_start": created["detection_start"].isoformat(),
                        "created_at": created["created_at"].isoformat()
                    }
                }
                await manager.broadcast(payload)
                print(f"[Simulated Alert] Generated geofenced blockage: {plate} in {zone['name']}")
                
        except Exception as e:
            print(f"Error in violation simulator loop: {e}")
            
        await asyncio.sleep(40)  # Sleep for 40 seconds


# REST Endpoints
@router.get("", response_model=List[ViolationResponse])
def read_violations(
    status: Optional[str] = None,
    zone_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        return get_violations(db, status=status, zone_id=zone_id)
    except Exception as e:
        print(f"Database error in read_violations, falling back to mock_store: {e}")
        return MockStore.get_violations(status=status, zone_id=zone_id)

@router.post("", response_model=ViolationResponse, status_code=status.HTTP_201_CREATED)
async def add_violation(violation_in: ViolationCreate, db: Session = Depends(get_db)) -> Any:
    try:
        violation = create_violation(db, violation_in=violation_in)
        
        v_id = violation.id
        cam_id = violation.camera_id
        z_id = violation.zone_id
        lat = violation.latitude
        lng = violation.longitude
        v_type = violation.vehicle_type
        plate = violation.license_plate
        img = violation.image_url
        v_status = violation.status
        det_start = violation.detection_start
        created = violation.created_at
    except Exception as e:
        print(f"Database error in add_violation, adding to mock_store: {e}")
        v_dict = violation_in.model_dump() if hasattr(violation_in, 'model_dump') else violation_in.dict()
        violation = MockStore.create_violation(v_dict)
        
        v_id = violation["id"]
        cam_id = violation["camera_id"]
        z_id = violation["zone_id"]
        lat = violation["latitude"]
        lng = violation["longitude"]
        v_type = violation["vehicle_type"]
        plate = violation["license_plate"]
        img = violation["image_url"]
        v_status = violation["status"]
        det_start = violation["detection_start"]
        created = violation["created_at"]
    
    # Broadcast to dashboard in real-time
    violation_payload = {
        "event": "violation_detected",
        "data": {
            "id": str(v_id),
            "camera_id": str(cam_id) if cam_id else None,
            "zone_id": str(z_id),
            "latitude": lat,
            "longitude": lng,
            "vehicle_type": v_type,
            "license_plate": plate,
            "image_url": img,
            "status": v_status,
            "detection_start": det_start.isoformat() if hasattr(det_start, 'isoformat') else str(det_start),
            "created_at": created.isoformat() if hasattr(created, 'isoformat') else str(created)
        }
    }
    await manager.broadcast(violation_payload)
    return violation

@router.get("/{violation_id}", response_model=ViolationResponse)
def read_violation_by_id(violation_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    try:
        violation = get_violation(db, violation_id=violation_id)
        if not violation:
            raise HTTPException(status_code=404, detail="Violation not found")
        return violation
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in read_violation_by_id, falling back to mock_store: {e}")
        violation = MockStore.get_violation(violation_id)
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
    try:
        db_violation = get_violation(db, violation_id=violation_id)
        if not db_violation:
            raise HTTPException(status_code=404, detail="Violation not found")
        
        updated_violation = update_violation(db, db_violation=db_violation, violation_in=violation_in)
        
        v_id = updated_violation.id
        v_status = updated_violation.status
        v_dur = updated_violation.duration_seconds
        v_end = updated_violation.detection_end
    except Exception as e:
        print(f"Database error in modify_violation, updating in mock_store: {e}")
        update_data = violation_in.model_dump(exclude_unset=True) if hasattr(violation_in, 'model_dump') else violation_in.dict(exclude_unset=True)
        updated_violation = MockStore.update_violation(violation_id, update_data)
        if not updated_violation:
            raise HTTPException(status_code=404, detail="Violation not found")
            
        v_id = updated_violation["id"]
        v_status = updated_violation["status"]
        v_dur = updated_violation["duration_seconds"]
        v_end = updated_violation["detection_end"]
    
    # Broadcast update (e.g., when cited or cleared)
    update_payload = {
        "event": "violation_updated",
        "data": {
            "id": str(v_id),
            "status": v_status,
            "duration_seconds": v_dur,
            "detection_end": v_end.isoformat() if hasattr(v_end, 'isoformat') and v_end else str(v_end) if v_end else None
        }
    }
    await manager.broadcast(update_payload)
    return updated_violation
