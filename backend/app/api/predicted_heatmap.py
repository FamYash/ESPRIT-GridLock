from fastapi import APIRouter
from app.services.prediction_service import generate_predicted_heatmap

router = APIRouter()


@router.get("/predicted")
def predicted_heatmap():
    points = generate_predicted_heatmap()
    return points