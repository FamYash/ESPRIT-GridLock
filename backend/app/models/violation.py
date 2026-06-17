from sqlalchemy import Column, String, DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
from app.core.database import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(UUID(as_uuid=True), ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    location_point = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    detection_start = Column(DateTime(timezone=True), nullable=False)
    detection_end = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    vehicle_type = Column(String(50), nullable=False)  # car, truck, motorcycle, bus
    license_plate = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(50), default="detected")  # detected, active, cleared, cited
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    camera = relationship("Camera", back_populates="violations")
    zone = relationship("Zone", back_populates="violations")
    enforcement_actions = relationship("EnforcementAction", back_populates="violation", cascade="all, delete-orphan")
