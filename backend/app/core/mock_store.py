import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any

# Mock Users (Officers and Admins)
MOCK_USERS = [
    {
        "id": uuid.UUID("b3017cf7-6bc8-4f24-a212-32b0f4dc7cf3"),
        "email": "rajesh@gridlock.com",
        "full_name": "Officer Rajesh Kumar",
        "role": "officer",
        "status": "on_duty",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=10),
    },
    {
        "id": uuid.UUID("b3017cf7-6bc8-4f24-a212-32b0f4dc7cf4"),
        "email": "amit@gridlock.com",
        "full_name": "Officer Amit Singh",
        "role": "officer",
        "status": "on_duty",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=10),
    },
    {
        "id": uuid.UUID("a1117cf7-6bc8-4f24-a212-32b0f4dc7cf1"),
        "email": "admin@gridlock.com",
        "full_name": "Demo Admin",
        "role": "admin",
        "status": "active",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=10),
    }
]

# Mock Zones with matching UI definitions
MOCK_ZONES = [
    {
        "id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb21"),
        "name": "MG Road Metro Junction",
        "risk_level": "high",
        "enforcement_priority": 0.90,
        "boundary": [[12.9748, 77.6055], [12.9748, 77.6105], [12.9730, 77.6105], [12.9730, 77.6055]],
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "cameras": [
            {
                "id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01"),
                "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb21"),
                "name": "Camera MG-Road-01",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-traffic-at-night-in-a-large-city-39824-large.mp4",
                "latitude": 12.9740,
                "longitude": 77.6080,
                "status": "online",
                "created_at": datetime.now(timezone.utc) - timedelta(days=5)
            },
            {
                "id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf04"),
                "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb21"),
                "name": "Camera MG-Road-02",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-freeway-seen-from-above-41584-large.mp4",
                "latitude": 12.9735,
                "longitude": 77.6065,
                "status": "maintenance",
                "created_at": datetime.now(timezone.utc) - timedelta(days=5)
            }
        ]
    },
    {
        "id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb22"),
        "name": "Brigade Road Commercial Belt",
        "risk_level": "medium",
        "enforcement_priority": 0.65,
        "boundary": [[12.9725, 77.6055], [12.9725, 77.6085], [12.9705, 77.6085], [12.9705, 77.6055]],
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "cameras": [
            {
                "id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf02"),
                "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb22"),
                "name": "Camera Brigade-Rd-01",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-cars-on-a-highway-at-night-28498-large.mp4",
                "latitude": 12.9715,
                "longitude": 77.6070,
                "status": "online",
                "created_at": datetime.now(timezone.utc) - timedelta(days=5)
            }
        ]
    },
    {
        "id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb23"),
        "name": "Commercial Street Crossings",
        "risk_level": "high",
        "enforcement_priority": 0.95,
        "boundary": [[12.9830, 77.6075], [12.9830, 77.6110], [12.9805, 77.6110], [12.9805, 77.6075]],
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "cameras": [
            {
                "id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03"),
                "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb23"),
                "name": "Camera Commercial-St-01",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-busy-intersection-with-traffic-lights-in-china-39908-large.mp4",
                "latitude": 12.9818,
                "longitude": 77.6087,
                "status": "online",
                "created_at": datetime.now(timezone.utc) - timedelta(days=5)
            }
        ]
    }
]

# In-memory mock violations store
MOCK_VIOLATIONS = [
    {
        "id": uuid.UUID("d91783cf-0504-4b53-85fe-5b651bfef201"),
        "camera_id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01"),
        "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb21"),
        "latitude": 12.9741,
        "longitude": 77.6083,
        "vehicle_type": "truck",
        "license_plate": "KA 03 MB 5678",
        "status": "active",
        "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400",
        "detection_start": datetime.now(timezone.utc) - timedelta(minutes=30),
        "detection_end": None,
        "duration_seconds": 1800.0,
        "created_at": datetime.now(timezone.utc) - timedelta(minutes=30),
    },
    {
        "id": uuid.UUID("d91783cf-0504-4b53-85fe-5b651bfef202"),
        "camera_id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf02"),
        "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb22"),
        "latitude": 12.9718,
        "longitude": 77.6068,
        "vehicle_type": "car",
        "license_plate": "KA 01 ND 9012",
        "status": "active",
        "image_url": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400",
        "detection_start": datetime.now(timezone.utc) - timedelta(minutes=15),
        "detection_end": None,
        "duration_seconds": 900.0,
        "created_at": datetime.now(timezone.utc) - timedelta(minutes=15),
    },
    {
        "id": uuid.UUID("d91783cf-0504-4b53-85fe-5b651bfef203"),
        "camera_id": uuid.UUID("c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03"),
        "zone_id": uuid.UUID("e04cb249-ea26-47a3-83bd-09d57a27eb23"),
        "latitude": 12.9815,
        "longitude": 77.6092,
        "vehicle_type": "motorcycle",
        "license_plate": "KA 04 P 1234",
        "status": "active",
        "image_url": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400",
        "detection_start": datetime.now(timezone.utc) - timedelta(minutes=45),
        "detection_end": None,
        "duration_seconds": 2700.0,
        "created_at": datetime.now(timezone.utc) - timedelta(minutes=45),
    }
]

# In-memory mock enforcement dispatches
MOCK_ENFORCEMENT_ACTIONS = []

class MockStore:
    @staticmethod
    def get_zones() -> List[Dict]:
        return MOCK_ZONES

    @staticmethod
    def get_zone(zone_id: uuid.UUID) -> Optional[Dict]:
        for z in MOCK_ZONES:
            if z["id"] == zone_id:
                return z
        return None

    @staticmethod
    def get_cameras() -> List[Dict]:
        cams = []
        for z in MOCK_ZONES:
            cams.extend(z["cameras"])
        return cams

    @staticmethod
    def get_violations(status: Optional[str] = None, zone_id: Optional[uuid.UUID] = None) -> List[Dict]:
        res = MOCK_VIOLATIONS
        if status:
            res = [v for v in res if v["status"] == status]
        if zone_id:
            res = [v for v in res if v["zone_id"] == zone_id]
        # Sort by creation time desc
        return sorted(res, key=lambda x: x["created_at"], reverse=True)

    @staticmethod
    def get_violation(violation_id: uuid.UUID) -> Optional[Dict]:
        for v in MOCK_VIOLATIONS:
            if v["id"] == violation_id:
                return v
        return None

    @staticmethod
    def create_violation(v_dict: Dict) -> Dict:
        new_v = {
            "id": v_dict.get("id", uuid.uuid4()),
            "camera_id": v_dict.get("camera_id"),
            "zone_id": v_dict["zone_id"],
            "latitude": v_dict["latitude"],
            "longitude": v_dict["longitude"],
            "detection_start": v_dict.get("detection_start", datetime.now(timezone.utc)),
            "detection_end": v_dict.get("detection_end"),
            "duration_seconds": v_dict.get("duration_seconds", 0.0),
            "vehicle_type": v_dict["vehicle_type"],
            "license_plate": v_dict.get("license_plate", "KA 03 G 9999"),
            "image_url": v_dict.get("image_url", "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400"),
            "status": v_dict.get("status", "detected"),
            "created_at": datetime.now(timezone.utc),
        }
        MOCK_VIOLATIONS.append(new_v)
        return new_v

    @staticmethod
    def update_violation(violation_id: uuid.UUID, update_data: Dict) -> Optional[Dict]:
        for v in MOCK_VIOLATIONS:
            if v["id"] == violation_id:
                for k, val in update_data.items():
                    if val is not None:
                        v[k] = val
                return v
        return None

    @staticmethod
    def get_enforcement_actions(status: Optional[str] = None, officer_id: Optional[uuid.UUID] = None) -> List[Dict]:
        res = MOCK_ENFORCEMENT_ACTIONS
        if status:
            res = [a for a in res if a["status"] == status]
        if officer_id:
            res = [a for a in res if a["officer_id"] == officer_id]
        
        # Populate joins for schema mapping
        enriched = []
        for action in res:
            act_copy = action.copy()
            # Join Violation
            violation = MockStore.get_violation(action["violation_id"])
            if violation:
                act_copy["violation"] = violation
            # Join Officer
            for u in MOCK_USERS:
                if u["id"] == action["officer_id"]:
                    act_copy["officer"] = u
                    break
            enriched.append(act_copy)
            
        return enriched

    @staticmethod
    def get_enforcement_action(action_id: uuid.UUID) -> Optional[Dict]:
        for a in MOCK_ENFORCEMENT_ACTIONS:
            if a["id"] == action_id:
                return a
        return None

    @staticmethod
    def create_enforcement_action(action_dict: Dict) -> Dict:
        new_act = {
            "id": uuid.uuid4(),
            "violation_id": action_dict["violation_id"],
            "officer_id": action_dict["officer_id"],
            "action_type": action_dict["action_type"],
            "dispatched_at": datetime.now(timezone.utc),
            "resolved_at": None,
            "status": action_dict.get("status", "dispatched"),
            "notes": action_dict.get("notes", ""),
            "created_at": datetime.now(timezone.utc),
        }
        MOCK_ENFORCEMENT_ACTIONS.append(new_act)
        
        # Enrich for return
        violation = MockStore.get_violation(new_act["violation_id"])
        if violation:
            new_act["violation"] = violation
        for u in MOCK_USERS:
            if u["id"] == new_act["officer_id"]:
                new_act["officer"] = u
                break
                
        return new_act

    @staticmethod
    def update_enforcement_action(action_id: uuid.UUID, update_data: Dict) -> Optional[Dict]:
        for a in MOCK_ENFORCEMENT_ACTIONS:
            if a["id"] == action_id:
                for k, val in update_data.items():
                    if val is not None:
                        a[k] = val
                if update_data.get("status") == "resolved" and not a.get("resolved_at"):
                    a["resolved_at"] = datetime.now(timezone.utc)
                
                # Enrich for return
                a_copy = a.copy()
                violation = MockStore.get_violation(a["violation_id"])
                if violation:
                    a_copy["violation"] = violation
                for u in MOCK_USERS:
                    if u["id"] == a["officer_id"]:
                        a_copy["officer"] = u
                        break
                return a_copy
        return None

    @staticmethod
    def get_congestion_stats() -> List[Dict]:
        stats = []
        for zone in MOCK_ZONES:
            active_viol_count = len([v for v in MOCK_VIOLATIONS if v["zone_id"] == zone["id"] and v["status"] == "active"])
            
            # Recalculate Congestion and Speed dynamically based on violations
            # 0 active = 10% base congestion, 40 km/h avg speed
            # 1 active = 35% congestion, 30 km/h avg speed
            # 2 active = 75% congestion, 15 km/h avg speed
            # 3+ active = 95% congestion, 5 km/h avg speed
            if active_viol_count == 0:
                congestion = 0.10
                speed = 40.0
            elif active_viol_count == 1:
                congestion = 0.35
                speed = 30.0
            elif active_viol_count == 2:
                congestion = 0.75
                speed = 15.0
            else:
                congestion = 0.95
                speed = 5.0
                
            stats.append({
                "zone_id": zone["id"],
                "zone_name": zone["name"],
                "current_congestion_index": congestion,
                "average_speed_kmh": speed,
                "active_violations_count": active_viol_count,
                "risk_level": zone["risk_level"],
                "priority_score": zone["enforcement_priority"]
            })
        return stats
