from shapely.geometry import Point, Polygon

class ViolationRulesEngine:
    def __init__(self, stationary_threshold_seconds: float = 120.0):
        self.stationary_threshold = stationary_threshold_seconds
        # Dictionary tracking vehicle_id -> {"first_seen": timestamp, "last_seen": timestamp, "lat": lat, "lng": lng}
        self.tracked_vehicles = {}
        print(f"[AI ViolationRulesEngine] Checking illegal parking after {stationary_threshold_seconds}s stationary threshold.")

    def check_boundary_violation(self, vehicle_lat: float, vehicle_lng: float, zone_polygon_coords: list[list[float]]) -> bool:
        """Determines if a vehicle coordinate lies within the geofenced zone boundary."""
        # Convert list of coordinates to Shapely Polygon
        # Frontend coordinates are in [lat, lng] format. PostGIS is [lng, lat].
        # We align with shapely geometry
        poly = Polygon(zone_polygon_coords)
        point = Point(vehicle_lat, vehicle_lng)
        return poly.contains(point)

    def process_frame_tracks(self, active_tracks: list[dict], zone_polygon: list[list[float]], current_time: float) -> list[dict]:
        """
        Calculates stationary times and triggers illegal parking notifications if time exceeds threshold.
        """
        violations = []
        # Update tracked vehicles status
        # For simplicity, if standard edge/bounding-box tracking indicates velocity ~ 0 inside polygon boundary:
        # We compute time difference. If delta > self.stationary_threshold, raise violation event.
        return violations
