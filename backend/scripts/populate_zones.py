import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.zone import Zone
from sqlalchemy import func

db = SessionLocal()

try:
    # Get all junctions except No Junction
    result = db.execute(text("""
        SELECT
            junction_name,
            AVG(latitude) as lat,
            AVG(longitude) as lon,
            COUNT(*) as violations
        FROM parking_violations
        WHERE junction_name != 'No Junction'
        GROUP BY junction_name
    """))

    rows = result.fetchall()

    max_violations = max(row.violations for row in rows)

    for row in rows:

        lat = float(row.lat)
        lon = float(row.lon)

        buffer = 0.001

        boundary = [
            [lat - buffer, lon - buffer],
            [lat - buffer, lon + buffer],
            [lat + buffer, lon + buffer],
            [lat + buffer, lon - buffer],
            [lat - buffer, lon - buffer]
        ]

        points_str = ", ".join(
            [f"{p[1]} {p[0]}" for p in boundary]
        )

        polygon_wkt = f"POLYGON(({points_str}))"

        priority = row.violations / max_violations

        zone = Zone(
            name=row.junction_name,
            boundary_polygon=func.ST_GeomFromText(
                polygon_wkt,
                4326
            ),
            risk_level="medium",
            enforcement_priority=priority
        )

        db.add(zone)

    db.commit()

    print(f"Created {len(rows)} zones")

except Exception as e:
    db.rollback()
    print(e)

finally:
    db.close()