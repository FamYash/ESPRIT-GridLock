from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter()

@router.get("/historical")
def historical_heatmap(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            z.name,
            AVG(ST_Y(v.location_point::geometry)) as lat,
            AVG(ST_X(v.location_point::geometry)) as lng,
            COUNT(*) as weight
        FROM violations v
        JOIN zones z
            ON v.zone_id = z.id

        WHERE v.status IN ('active', 'detected')
        AND v.detection_start >= (
                SELECT MAX(detection_start) - INTERVAL '30 days'
                FROM violations
        )

        GROUP BY z.name
        ORDER BY weight DESC
    """)

    result = db.execute(query)

    return [
        {
            "name": row.name,
            "lat": float(row.lat),
            "lng": float(row.lng),
            "weight": row.weight
        }
        for row in result
    ]