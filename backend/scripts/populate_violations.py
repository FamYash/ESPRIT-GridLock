import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

from sqlalchemy import text, func
from app.core.database import SessionLocal
from app.models.violation import Violation
from app.models.zone import Zone

db = SessionLocal()

STATUS_MAP = {
    "approved": "active",
    "processing": "detected",
    "created1": "detected",
    "duplicate": "cleared",
    "rejected": "cleared",
    "NULL": "detected",
    None: "detected"
}

try:

    print("Loading zones...")

    zones = db.query(Zone).all()

    zone_lookup = {
        zone.name: zone.id
        for zone in zones
    }

    print(f"Loaded {len(zone_lookup)} zones")

    print("Reading parking violations...")

    result = db.execute(text("""
        SELECT
            latitude,
            longitude,
            vehicle_type,
            validation_status,
            created_datetime,
            junction_name
        FROM parking_violations
        WHERE junction_name != 'No Junction'
    """))

    rows = result.fetchall()

    print(f"Found {len(rows)} records")

    batch_size = 5000
    count = 0

    for row in rows:

        zone_id = zone_lookup.get(row.junction_name)

        if not zone_id:
            continue

        point_wkt = f"POINT({row.longitude} {row.latitude})"

        violation = Violation(
            zone_id=zone_id,
            camera_id=None,
            location_point=func.ST_GeomFromText(
                point_wkt,
                4326
            ),
            detection_start=row.created_datetime,
            detection_end=None,
            duration_seconds=0,
            vehicle_type=row.vehicle_type or "UNKNOWN",
            license_plate=None,
            image_url=None,
            status=STATUS_MAP.get(
                row.validation_status,
                "detected"
            )
        )

        db.add(violation)

        count += 1

        if count % batch_size == 0:
            db.commit()
            print(f"Inserted {count} violations")

    db.commit()

    print(f"Completed. Inserted {count} violations")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()