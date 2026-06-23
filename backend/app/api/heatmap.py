from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter()

@router.get("/historical")
def historical_heatmap(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            ST_Y(location_point::geometry) as lat,
            ST_X(location_point::geometry) as lng,
            COUNT(*) as weight
        FROM violations

        WHERE status IN ('active', 'detected')

        AND detection_start >= (
            SELECT MAX(detection_start) - INTERVAL '30 days'
            FROM violations
        )

        GROUP BY
            ROUND(ST_Y(location_point::geometry)::numeric,4),
            ROUND(ST_X(location_point::geometry)::numeric,4),
            ST_Y(location_point::geometry),
            ST_X(location_point::geometry)
    """)

    result = db.execute(query)

    return [
        {
            "lat": float(row.lat),
            "lng": float(row.lng),
            "weight": min(row.weight / 100, 100)
        }
        for row in result
    ]
    
@router.get("/top-hotspots")
def top_hotspots(db: Session = Depends(get_db)):
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

        GROUP BY z.name
        HAVING COUNT(*) > 500
        ORDER BY weight DESC

        LIMIT 5
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