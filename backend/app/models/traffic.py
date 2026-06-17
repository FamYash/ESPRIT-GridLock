from sqlalchemy import Column, DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class TrafficMetric(Base):
    __tablename__ = "traffic_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    average_speed_kmh = Column(Float, nullable=False)
    vehicle_count = Column(Float, nullable=False)
    occupancy_percentage = Column(Float, nullable=False)
    congestion_index = Column(Float, nullable=False)  # Normalized 0.0 - 1.0
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    zone = relationship("Zone", back_populates="traffic_metrics")
