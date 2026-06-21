import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

from app.core.database import SessionLocal
from app.models.zone import Zone
from app.models.violation import Violation
from app.models.traffic import TrafficMetric
from sqlalchemy import func
from datetime import datetime

db = SessionLocal()

try:

    zones = db.query(Zone).all()

    # Find highest violation count among all zones
    max_count = (
        db.query(
            Violation.zone_id,
            func.count(Violation.id).label("cnt")
        )
        .group_by(Violation.zone_id)
        .order_by(func.count(Violation.id).desc())
        .first()
    )

    max_violations = max_count.cnt

    print(f"Max violations in a zone: {max_violations}")

    created = 0

    for zone in zones:

        vehicle_count = (
            db.query(func.count(Violation.id))
            .filter(Violation.zone_id == zone.id)
            .scalar()
        )

        if vehicle_count == 0:
            continue

        congestion_index = vehicle_count / max_violations

        occupancy_percentage = congestion_index * 100

        average_speed_kmh = max(
            10,
            60 * (1 - congestion_index)
        )

        metric = TrafficMetric(
            zone_id=zone.id,
            timestamp=datetime.utcnow(),
            average_speed_kmh=average_speed_kmh,
            vehicle_count=vehicle_count,
            occupancy_percentage=occupancy_percentage,
            congestion_index=congestion_index
        )

        db.add(metric)

        created += 1

    db.commit()

    print(f"Created {created} traffic metrics")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()