import joblib
import numpy as np
import pandas as pd
import json
from pathlib import Path
from datetime import datetime, timedelta

BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_PATH = (
    BASE_DIR
    / "ai_models"
    / "trained_models"
    / "parking_hotspot_model.pkl"
)

FEATURES_PATH = (
    BASE_DIR
    / "ai_models"
    / "trained_models"
    / "feature_columns.json"
)

COORDS_PATH = (
    BASE_DIR
    / "ai_models"
    / "trained_models"
    / "junction_coordinates.csv"
)

model = joblib.load(MODEL_PATH)

with open(FEATURES_PATH, "r") as f:
    feature_columns = json.load(f)

junction_coords = pd.read_csv(COORDS_PATH)

print("Model Loaded Successfully")
print("Junctions:", len(junction_coords))


def _build_feature_row(junction_name: str, t: datetime) -> dict:
    row = {}
    for col in feature_columns:
        if col == "junction_name":
            row[col] = junction_name
        elif col == "location":
            row[col] = junction_name
        elif col == "hour":
            row[col] = t.hour
        elif col == "minute":
            row[col] = t.minute
        elif col == "month":
            row[col] = t.month
        elif col == "day":
            row[col] = t.day
        elif col == "dayofweek":
            row[col] = t.weekday()
        elif col == "weekofyear":
            row[col] = t.isocalendar()[1]
        elif col == "dayofyear":
            row[col] = t.timetuple().tm_yday
        elif col == "quarter":
            row[col] = (t.month - 1) // 3 + 1
        elif col == "weekend":
            row[col] = 1 if t.weekday() >= 5 else 0
        elif col == "hour_sin":
            row[col] = np.sin(2 * np.pi * t.hour / 24)
        elif col == "hour_cos":
            row[col] = np.cos(2 * np.pi * t.hour / 24)
        elif col == "month_sin":
            row[col] = np.sin(2 * np.pi * (t.month - 1) / 12)
        elif col == "dayofweek_sin":
            row[col] = np.sin(2 * np.pi * t.weekday() / 7)
        elif col == "dayofweek_cos":
            row[col] = np.cos(2 * np.pi * t.weekday() / 7)
        elif col == "validation_missing":
            row[col] = 1
        elif col == "scita_missing":
            row[col] = 1
        elif col == "data_sent_to_scita":
            row[col] = 0
        else:
            row[col] = 0
    return row


def generate_predicted_heatmap():
    now = datetime.now()
    results = []

    for _, junction in junction_coords.iterrows():
        junction_name = junction["junction_name"]
        lat = float(junction["latitude"])
        lng = float(junction["longitude"])
        hourly_weights = []

        for hour_offset in range(24):
            t = now + timedelta(hours=hour_offset)
            row = _build_feature_row(junction_name, t)
            df = pd.DataFrame([row])[feature_columns]
            pred = float(model.predict(df)[0])
            hourly_weights.append(max(pred, 0))

        total_weight = sum(hourly_weights)

        results.append({
            "lat": lat,
            "lng": lng,
            "weight": total_weight
        })

    if results:
        max_w = max(r["weight"] for r in results)
        if max_w > 0:
            for r in results:
                r["weight"] = min(r["weight"] / max_w * 100, 100)

    return results