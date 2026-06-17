import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.zone import Zone, Camera
from app.schemas.zone import ZoneCreate, ZoneUpdate, CameraCreate, CameraUpdate
from uuid import UUID

# Spatial converters
def coords_to_polygon_wkt(coords: list[list[float]]) -> str:
    # Ensure the polygon is closed (first coordinate equals last)
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    
    # PostGIS WKT is "POLYGON((lng1 lat1, lng2 lat2, ...))"
    points_str = ", ".join([f"{c[1]} {c[0]}" for c in coords])
    return f"POLYGON(({points_str}))"

def wkt_polygon_to_coords(geojson_str: str) -> list[list[float]]:
    try:
        geojson = json.loads(geojson_str)
        # GeoJSON is [lng, lat]. We want [lat, lng] for frontend
        lng_lats = geojson["coordinates"][0]
        return [[p[1], p[0]] for p in lng_lats]
    except Exception:
        return []

# Zone CRUD
def get_zone(db: Session, zone_id: UUID) -> Zone:
    return db.query(Zone).filter(Zone.id == zone_id).first()

def get_zones(db: Session, skip: int = 0, limit: int = 100):
    # Query zones, converting the geometry to GeoJSON
    zones = db.query(Zone).offset(skip).limit(limit).all()
    
    # Process zones to populate custom attributes for easy access
    for zone in zones:
        # Fetch GeoJSON string for boundary_polygon
        geojson_str = db.query(func.ST_AsGeoJSON(Zone.boundary_polygon)).filter(Zone.id == zone.id).scalar()
        zone.boundary = wkt_polygon_to_coords(geojson_str)
        
        # Populate coordinates for cameras
        for camera in zone.cameras:
            lat = db.query(func.ST_Y(Camera.location_point)).filter(Camera.id == camera.id).scalar()
            lng = db.query(func.ST_X(Camera.location_point)).filter(Camera.id == camera.id).scalar()
            camera.latitude = lat
            camera.longitude = lng
            
    return zones

def create_zone(db: Session, zone_in: ZoneCreate) -> Zone:
    wkt_polygon = coords_to_polygon_wkt(zone_in.boundary)
    db_obj = Zone(
        name=zone_in.name,
        boundary_polygon=func.ST_GeomFromText(wkt_polygon, 4326),
        risk_level=zone_in.risk_level or "low"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Bind coordinates array dynamically for schema mapping
    db_obj.boundary = zone_in.boundary
    db_obj.cameras = []
    return db_obj

def update_zone(db: Session, db_zone: Zone, zone_in: ZoneUpdate) -> Zone:
    update_data = zone_in.model_dump(exclude_unset=True) if hasattr(zone_in, 'model_dump') else zone_in.dict(exclude_unset=True)
    
    if "boundary" in update_data and update_data["boundary"]:
        wkt_polygon = coords_to_polygon_wkt(update_data["boundary"])
        db_zone.boundary_polygon = func.ST_GeomFromText(wkt_polygon, 4326)
        db_zone.boundary = update_data["boundary"]
        del update_data["boundary"]
        
    for field, value in update_data.items():
        setattr(db_zone, field, value)
        
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

# Camera CRUD
def create_camera(db: Session, camera_in: CameraCreate) -> Camera:
    point_wkt = f"POINT({camera_in.longitude} {camera_in.latitude})"
    db_obj = Camera(
        zone_id=camera_in.zone_id,
        name=camera_in.name,
        stream_url=camera_in.stream_url,
        location_point=func.ST_GeomFromText(point_wkt, 4326),
        status=camera_in.status or "online"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Bind coordinates array dynamically
    db_obj.latitude = camera_in.latitude
    db_obj.longitude = camera_in.longitude
    return db_obj

def get_cameras(db: Session, skip: int = 0, limit: int = 100):
    cameras = db.query(Camera).offset(skip).limit(limit).all()
    for camera in cameras:
        lat = db.query(func.ST_Y(Camera.location_point)).filter(Camera.id == camera.id).scalar()
        lng = db.query(func.ST_X(Camera.location_point)).filter(Camera.id == camera.id).scalar()
        camera.latitude = lat
        camera.longitude = lng
    return cameras

def update_camera(db: Session, db_camera: Camera, camera_in: CameraUpdate) -> Camera:
    update_data = camera_in.model_dump(exclude_unset=True) if hasattr(camera_in, 'model_dump') else camera_in.dict(exclude_unset=True)
    
    if "latitude" in update_data or "longitude" in update_data:
        lat = update_data.get("latitude", db.query(func.ST_Y(Camera.location_point)).filter(Camera.id == db_camera.id).scalar())
        lng = update_data.get("longitude", db.query(func.ST_X(Camera.location_point)).filter(Camera.id == db_camera.id).scalar())
        point_wkt = f"POINT({lng} {lat})"
        db_camera.location_point = func.ST_GeomFromText(point_wkt, 4326)
        db_camera.latitude = lat
        db_camera.longitude = lng
        if "latitude" in update_data: del update_data["latitude"]
        if "longitude" in update_data: del update_data["longitude"]
        
    for field, value in update_data.items():
        setattr(db_camera, field, value)
        
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera
