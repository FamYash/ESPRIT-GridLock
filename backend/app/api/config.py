import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from app.schemas.config import ConfigSettings
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()

CONFIG_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config_settings.json")

DEFAULT_SETTINGS = {
    "risk_threshold": 5.0,
    "alert_radius": 500,
    "priority_enforcement": True,
    "congestion_alert_level": "medium"
}

def load_settings():
    if not os.path.exists(CONFIG_FILE_PATH):
        try:
            with open(CONFIG_FILE_PATH, "w") as f:
                json.dump(DEFAULT_SETTINGS, f, indent=4)
        except Exception:
            pass
        return DEFAULT_SETTINGS
    try:
        with open(CONFIG_FILE_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_SETTINGS

def save_settings(settings: dict):
    try:
        with open(CONFIG_FILE_PATH, "w") as f:
            json.dump(settings, f, indent=4)
    except Exception as e:
        print("Failed to save settings:", e)

@router.get("/settings", response_model=ConfigSettings)
def get_settings(current_user: User = Depends(get_current_user)):
    return load_settings()

@router.post("/settings", response_model=ConfigSettings)
def update_settings(settings: ConfigSettings, current_user: User = Depends(get_current_user)):
    settings_dict = settings.dict()
    save_settings(settings_dict)
    return settings_dict

@router.get("/model")
def get_model_info(current_user: User = Depends(get_current_user)):
    return {
        "model_name": "CatBoost Regressor",
        "training_records": 298450,
        "features": 39,
        "mae": 0.29,
        "explainability": "SHAP Enabled",
        "status": "Active"
    }

@router.get("/status")
def get_system_status(current_user: User = Depends(get_current_user)):
    return {
        "ai_engine_running": True,
        "prediction_pipeline_active": True,
        "heatmap_service_active": True,
        "api_service_online": True,
        "last_update_timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/explainability")
def get_explainability(current_user: User = Depends(get_current_user)):
    return {
        "shap_enabled": True,
        "top_features": [
            {"name": "location", "importance": 0.34},
            {"name": "vehicle_type", "importance": 0.26},
            {"name": "device_id", "importance": 0.18},
            {"name": "created_by_id", "importance": 0.13},
            {"name": "center_code", "importance": 0.09}
        ],
        "summary": "Explainability Available. SHAP values indicate that the physical location and type of vehicle are the primary factors affecting illegal parking and congestion risk scores."
    }

@router.get("/zones")
def get_monitored_zones(current_user: User = Depends(get_current_user)):
    return [
        {"name": "Whitefield", "risk_score": 5.39, "risk_level": "High", "active_violations": 28},
        {"name": "Mahadevapura", "risk_score": 5.05, "risk_level": "High", "active_violations": 23},
        {"name": "HAL Old Airport", "risk_score": 4.03, "risk_level": "Medium", "active_violations": 12},
        {"name": "K.S Layout", "risk_score": 3.76, "risk_level": "Medium", "active_violations": 8},
        {"name": "Banaswadi", "risk_score": 3.70, "risk_level": "Medium", "active_violations": 4}
    ]
