import os
import time
import requests
import random
from datetime import datetime

# FastAPI Endpoints
BACKEND_URL = "http://localhost:8000/api/v1"

class AIParkingCongestionPipeline:
    def __init__(self):
        print("[AI Pipeline] Initializing AI-driven Parking & Congestion pipeline...")
        # In a real environment, we would load model weights here:
        # self.yolo_model = YOLO("models/yolov8n.pt")
        # self.tracker = ByteTrack()
        self.simulation_mode = True
        
    def fetch_cameras(self) -> list:
        try:
            # Bypass authentication for API streams since AI nodes are trusted
            # In production, use token-based validation for edge node uploads
            # For simplicity, we query directly or mock the cameras
            response = requests.get(f"{BACKEND_URL}/zones")
            if response.status_code == 200:
                zones = response.json()
                cameras = []
                for zone in zones:
                    for camera in zone.get("cameras", []):
                        cameras.append({
                            "id": camera["id"],
                            "zone_id": zone["id"],
                            "name": camera["name"],
                            "stream_url": camera["stream_url"],
                            "lat": camera["latitude"],
                            "lng": camera["longitude"],
                            "boundary": zone["boundary"]
                        })
                return cameras
        except Exception as e:
            print(f"[AI Pipeline] Error fetching cameras: {e}")
        
        # Fallback cameras if database is empty/offline
        return [
            {
                "id": "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01",
                "zone_id": "e04cb249-ea26-47a3-83bd-09d57a27eb21",
                "name": "Camera RC-East-01 (Simulated)",
                "stream_url": "https://assets.mixkit.co/videos/preview/mixkit-traffic-at-night-in-a-large-city-39824-large.mp4",
                "lat": 28.6310,
                "lng": 77.2185,
                "boundary": [[28.6300, 77.2170], [28.6300, 77.2200], [28.6320, 77.2200], [28.6320, 77.2170]]
            }
        ]

    def point_in_polygon(self, lat: float, lng: float, polygon: list[list[float]]) -> bool:
        """Ray-casting algorithm to determine if a point is inside a polygon boundary."""
        num = len(polygon)
        j = num - 1
        c = False
        for i in range(num):
            if ((polygon[i][1] > lng) != (polygon[j][1] > lng)) and \
                    (lat < (polygon[j][0] - polygon[i][0]) * (lng - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]):
                c = not c
            j = i
        return c

    def report_violation(self, camera_id: str, zone_id: str, lat: float, lng: float, vehicle_type: str, plate: str):
        payload = {
            "camera_id": camera_id,
            "zone_id": zone_id,
            "latitude": lat,
            "longitude": lng,
            "detection_start": datetime.utcnow().isoformat() + "Z",
            "vehicle_type": vehicle_type,
            "license_plate": plate,
            "image_url": f"https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400",
            "status": "active"
        }
        try:
            res = requests.post(f"{BACKEND_URL}/violations", json=payload)
            if res.status_code == 201:
                print(f"[AI Pipeline] REPORTED VIOLATION: {vehicle_type} [{plate}] parked illegally in Zone {zone_id}")
            else:
                print(f"[AI Pipeline] Failed to post violation: {res.text}")
        except Exception as e:
            print(f"[AI Pipeline] Connection error reporting violation: {e}")

    def report_traffic_metrics(self, zone_id: str, avg_speed: float, count: int, occupancy: float):
        # Calculate congestion index based on speed drop and vehicle counts
        # e.g., if speed drops below 10 km/h, congestion index is near 1.0 (blocked)
        congestion_index = max(0.0, min(1.0, 1.0 - (avg_speed / 45.0)))
        
        payload = {
            "zone_id": zone_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "average_speed_kmh": avg_speed,
            "vehicle_count": float(count),
            "occupancy_percentage": occupancy,
            "congestion_index": congestion_index
        }
        try:
            res = requests.post(f"{BACKEND_URL}/traffic/metrics", json=payload)
            if res.status_code == 201:
                print(f"[AI Pipeline] UPDATED TRAFFIC: Zone {zone_id} speed={avg_speed}km/h, count={count}, congestion={congestion_index:.2f}")
        except Exception as e:
            print(f"[AI Pipeline] Connection error updating traffic: {e}")

    def run(self):
        print("[AI Pipeline] Pipeline is running. Fetching active streams...")
        plates = ["DL 3C AY 9901", "HR 26 BQ 8899", "DL 8S CZ 9012", "MH 12 QQ 1122", "UP 16 AT 5432"]
        vehicles = ["car", "motorcycle", "truck", "bus"]
        
        while True:
            cameras = self.fetch_cameras()
            
            for cam in cameras:
                # 1. Simulate video processing & object detection
                if self.simulation_mode:
                    # Randomly decide to generate a violation (10% chance per camera scan)
                    if random.random() < 0.15:
                        # Pick a coordinate slightly offset from camera location, but within bounds
                        offset_lat = cam["lat"] + random.uniform(-0.001, 0.001)
                        offset_lng = cam["lng"] + random.uniform(-0.001, 0.001)
                        
                        # Verify coordinate falls inside the zone boundary polygon
                        is_inside = self.point_in_polygon(offset_lat, offset_lng, cam["boundary"])
                        
                        if is_inside:
                            plate = random.choice(plates)
                            vehicle = random.choice(vehicles)
                            self.report_violation(
                                camera_id=cam["id"],
                                zone_id=cam["zone_id"],
                                lat=offset_lat,
                                lng=offset_lng,
                                vehicle_type=vehicle,
                                plate=plate
                            )
                    
                    # 2. Simulate traffic congestion calculations
                    # If multiple vehicles are stationary, speed drops and vehicle count rises
                    vehicle_count = random.randint(15, 250)
                    avg_speed = max(5.0, 45.0 - (vehicle_count * 0.15) - random.uniform(0, 5))
                    occupancy = min(100.0, (vehicle_count / 2.5))
                    self.report_traffic_metrics(
                        zone_id=cam["zone_id"],
                        avg_speed=round(avg_speed, 1),
                        count=vehicle_count,
                        occupancy=round(occupancy, 1)
                    )
            
            # Scan feeds every 15 seconds
            time.sleep(15)

if __name__ == "__main__":
    pipeline = AIParkingCongestionPipeline()
    try:
        pipeline.run()
    except KeyboardInterrupt:
        print("[AI Pipeline] Stopped.")
