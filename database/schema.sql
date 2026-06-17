-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'officer')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_duty')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Zones Table
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    boundary_polygon GEOMETRY(Polygon, 4326) NOT NULL, -- WGS84 Geo Coordinate Polygon
    risk_level VARCHAR(50) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    enforcement_priority FLOAT DEFAULT 0.0, -- Calculated weight based on violations vs congestion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    stream_url VARCHAR(500) NOT NULL,
    location_point GEOMETRY(Point, 4326) NOT NULL, -- Camera location Point
    status VARCHAR(50) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Violations / Detections Table
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id UUID REFERENCES cameras(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    location_point GEOMETRY(Point, 4326) NOT NULL, -- Coordinates of illegal parking violation
    detection_start TIMESTAMP WITH TIME ZONE NOT NULL,
    detection_end TIMESTAMP WITH TIME ZONE,
    duration_seconds FLOAT DEFAULT 0.0,
    vehicle_type VARCHAR(50) NOT NULL, -- car, truck, motorcycle, bus
    license_plate VARCHAR(50),
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'detected' CHECK (status IN ('detected', 'active', 'cleared', 'cited')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for spatial query speed
CREATE INDEX IF NOT EXISTS idx_zones_boundary ON zones USING GIST (boundary_polygon);
CREATE INDEX IF NOT EXISTS idx_cameras_location ON cameras USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_violations_location ON violations USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_violations_active ON violations (status) WHERE status = 'active';

-- 5. Traffic Metrics Table
CREATE TABLE IF NOT EXISTS traffic_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    average_speed_kmh FLOAT NOT NULL,
    vehicle_count FLOAT NOT NULL,
    occupancy_percentage FLOAT NOT NULL, -- Density indicator
    congestion_index FLOAT NOT NULL, -- Normalized value [0-1] where 1 is total gridlock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_traffic_metrics_lookup ON traffic_metrics (zone_id, timestamp DESC);

-- 6. Enforcement Actions Table
CREATE TABLE IF NOT EXISTS enforcement_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_id UUID REFERENCES violations(id) ON DELETE SET NULL,
    officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warning', 'ticket', 'towing')),
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'on_scene', 'resolved', 'ignored')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
