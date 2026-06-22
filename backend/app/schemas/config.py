from pydantic import BaseModel

class ConfigSettings(BaseModel):
    risk_threshold: float
    alert_radius: int
    priority_enforcement: bool
    congestion_alert_level: str
