import cv2
import numpy as np

class OpticalFlowVelocityEstimator:
    def __init__(self):
        self.prev_gray = None
        print("[AI TrafficAnalyzer] Initialized optical flow speed estimator.")

    def estimate_speed(self, frame: np.ndarray) -> float:
        """
        Calculates pixel velocity vectors using Gunnar Farneback dense optical flow.
        Maps pixel shifts to real-world km/h based on camera calibration factors.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if self.prev_gray is None:
            self.prev_gray = gray
            return 40.0  # Return base speed limit when stream begins
            
        # Compute dense optical flow
        flow = cv2.calcOpticalFlowFarneback(self.prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        
        # Calculate magnitude of flow vectors
        magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        avg_flow = np.mean(magnitude)
        
        self.prev_gray = gray
        
        # Calibration coefficient mapping pixel displacement to speed (km/h)
        calibration_factor = 2.5 
        estimated_speed = avg_flow * calibration_factor
        return estimated_speed
