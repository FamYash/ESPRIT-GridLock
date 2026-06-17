class CongestionCalculator:
    def __init__(self, free_flow_speed: float = 45.0):
        self.free_flow_speed = free_flow_speed
        print(f"[AI CongestionCalculator] Initialized. Free-flow target speed: {free_flow_speed} km/h")

    def compute_congestion_index(self, avg_speed: float, vehicle_count: int, occupancy: float) -> float:
        """
        Computes a normalized congestion score [0.0 to 1.0].
        - 0.0 represents clear, high-speed free flow.
        - 1.0 represents absolute standstill/gridlock.
        
        Formula blends:
        1. Speed drop ratio below free-flow speed.
        2. Road occupancy density percentage.
        """
        # Speed ratio drops as congestion increases
        speed_score = max(0.0, 1.0 - (avg_speed / self.free_flow_speed))
        
        # Occupancy density ratio
        occupancy_score = min(1.0, occupancy / 100.0)
        
        # Combined weighted score (60% speed drops, 40% occupancy levels)
        congestion_index = (0.6 * speed_score) + (0.4 * occupancy_score)
        
        return round(max(0.0, min(1.0, congestion_index)), 2)
