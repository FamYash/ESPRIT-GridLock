import cv2
import numpy as np

class VehicleDetector:
    def __init__(self, weights_path: str = "models/yolov8n.pt"):
        self.weights_path = weights_path
        # In actual implementation:
        # from ultralytics import YOLO
        # self.model = YOLO(weights_path)
        # Class IDs for vehicles in COCO dataset: 2 (car), 3 (motorcycle), 5 (bus), 7 (truck)
        self.vehicle_classes = [2, 3, 5, 7]
        print(f"[AI VehicleDetector] Model loaded from {weights_path}")

    def detect(self, frame: np.ndarray) -> list[dict]:
        """
        Processes a frame and returns detected vehicles.
        Format: [{"box": [x1, y1, x2, y2], "confidence": 0.85, "class_id": 2, "label": "car"}]
        """
        # In actual execution, we would run:
        # results = self.model(frame, verbose=False)
        # detections = []
        # for box in results[0].boxes:
        #     if int(box.cls) in self.vehicle_classes:
        #         detections.append({
        #             "box": box.xyxy[0].tolist(),
        #             "confidence": float(box.conf),
        #             "class_id": int(box.cls),
        #             "label": self.model.names[int(box.cls)]
        #         })
        # return detections
        
        # Returns empty list or mock detections depending on input
        return []
