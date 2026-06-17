from sqlalchemy import Column, String, DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
from app.core.database import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    boundary_polygon = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=False)
    risk_level = Column(String(50), default="low")  # low, medium, high
    enforcement_priority = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cameras = relationship("Camera", back_populates="zone", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="zone", cascade="all, delete-orphan")
    traffic_metrics = relationship("TrafficMetric", back_populates="zone", cascade="all, delete-orphan")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    stream_url = Column(String(500), nullable=False)
    location_point = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    status = Column(String(50), default="online")  # online, offline, maintenance
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    zone = relationship("Zone", back_populates="cameras")
    violations = relationship("Violation", back_populates="camera")
