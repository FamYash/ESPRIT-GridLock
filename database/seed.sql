-- Seed Data for Bengaluru GridLock System
-- Coordinates represent points and polygons in Central Bengaluru / M.G. Road area (approx: 12.9740° N, 77.6080° E)

-- 1. Seed Users (passwords are 'password123' hashed with bcrypt: '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2')
INSERT INTO users (id, email, hashed_password, full_name, role, status) VALUES
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf1', 'admin@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'System Administrator', 'admin', 'active'),
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf2', 'operator@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'Traffic Operator', 'operator', 'active'),
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf3', 'officer1@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'Officer Rajesh Kumar', 'officer', 'on_duty'),
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf4', 'officer2@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'Officer Amit Singh', 'officer', 'on_duty');

-- 2. Seed Zones (Polygons representing M.G. Road and Brigade Road commercial hotspots)
INSERT INTO zones (id, name, boundary_polygon, risk_level, enforcement_priority) VALUES
(
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  'MG Road Metro Junction', 
  ST_GeomFromText('POLYGON((77.6055 12.9730, 77.6105 12.9730, 77.6105 12.9748, 77.6055 12.9748, 77.6055 12.9730))', 4326), 
  'high', 
  0.90
),
(
  'e04cb249-ea26-47a3-83bd-09d57a27eb22', 
  'Brigade Road Commercial Belt', 
  ST_GeomFromText('POLYGON((77.6055 12.9705, 77.6085 12.9705, 77.6085 12.9725, 77.6055 12.9725, 77.6055 12.9705))', 4326), 
  'medium', 
  0.65
),
(
  'e04cb249-ea26-47a3-83bd-09d57a27eb23', 
  'Commercial Street Crossings', 
  ST_GeomFromText('POLYGON((77.6075 12.9805, 77.6110 12.9805, 77.6110 12.9830, 77.6075 12.9830, 77.6075 12.9805))', 4326), 
  'high', 
  0.95
);

-- 3. Seed Cameras associated with Zones
INSERT INTO cameras (id, zone_id, name, stream_url, location_point, status) VALUES
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  'Camera MG-Road-01', 
  'https://assets.mixkit.co/videos/preview/mixkit-traffic-at-night-in-a-large-city-39824-large.mp4', 
  ST_GeomFromText('POINT(77.6080 12.9740)', 4326), 
  'online'
),
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf02', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb22', 
  'Camera Brigade-Rd-01', 
  'https://assets.mixkit.co/videos/preview/mixkit-cars-on-a-highway-at-night-28498-large.mp4', 
  ST_GeomFromText('POINT(77.6070 12.9715)', 4326), 
  'online'
),
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb23', 
  'Camera Commercial-St-01', 
  'https://assets.mixkit.co/videos/preview/mixkit-busy-intersection-with-traffic-lights-in-china-39908-large.mp4', 
  ST_GeomFromText('POINT(77.6087 12.9818)', 4326), 
  'online'
),
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf04', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  'Camera MG-Road-02', 
  'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-freeway-seen-from-above-41584-large.mp4', 
  ST_GeomFromText('POINT(77.6065 12.9735)', 4326), 
  'maintenance'
);

-- 4. Seed Violations (Active and Historical Detections)
INSERT INTO violations (id, camera_id, zone_id, location_point, detection_start, detection_end, duration_seconds, vehicle_type, license_plate, image_url, status) VALUES
(
  'd91783cf-0504-4b53-85fe-5b651bfef201', 
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  ST_GeomFromText('POINT(77.6083 12.9741)', 4326),
  NOW() - INTERVAL '45 minutes', 
  NOW() - INTERVAL '15 minutes', 
  1800, 
  'truck', 
  'KA 03 MB 5678', 
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400', 
  'cleared'
),
(
  'd91783cf-0504-4b53-85fe-5b651bfef202', 
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  ST_GeomFromText('POINT(77.6080 12.9738)', 4326),
  NOW() - INTERVAL '20 minutes', 
  NULL, 
  1200, 
  'car', 
  'KA 01 ND 9012', 
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400', 
  'active'
),
(
  'd91783cf-0504-4b53-85fe-5b651bfef203', 
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb23', 
  ST_GeomFromText('POINT(77.6092 12.9815)', 4326),
  NOW() - INTERVAL '35 minutes', 
  NULL, 
  2100, 
  'motorcycle', 
  'KA 04 P 1234', 
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400', 
  'cited'
);

-- 5. Seed Traffic Metrics (Simulating congestion indices)
INSERT INTO traffic_metrics (zone_id, timestamp, average_speed_kmh, vehicle_count, occupancy_percentage, congestion_index) VALUES
('e04cb249-ea26-47a3-83bd-09d57a27eb21', NOW() - INTERVAL '1 hour', 40.5, 120, 45.0, 0.25),
('e04cb249-ea26-47a3-83bd-09d57a27eb21', NOW() - INTERVAL '30 minutes', 22.1, 195, 78.0, 0.68),
('e04cb249-ea26-47a3-83bd-09d57a27eb21', NOW(), 12.4, 250, 92.5, 0.91), -- High Congestion correlated with active violations

('e04cb249-ea26-47a3-83bd-09d57a27eb22', NOW() - INTERVAL '1 hour', 35.0, 80, 30.0, 0.20),
('e04cb249-ea26-47a3-83bd-09d57a27eb22', NOW - INTERVAL '30 minutes', 28.5, 95, 42.0, 0.35),
('e04cb249-ea26-47a3-83bd-09d57a27eb22', NOW(), 24.0, 110, 50.0, 0.45),

('e04cb249-ea26-47a3-83bd-09d57a27eb23', NOW() - INTERVAL '1 hour', 18.2, 180, 82.0, 0.72),
('e04cb249-ea26-47a3-83bd-09d57a27eb23', NOW() - INTERVAL '30 minutes', 8.5, 230, 96.0, 0.95), -- High Congestion
('e04cb249-ea26-47a3-83bd-09d57a27eb23', NOW(), 5.2, 260, 99.0, 0.98); -- Total Gridlock

-- 6. Seed Enforcement Actions
INSERT INTO enforcement_actions (violation_id, officer_id, action_type, dispatched_at, resolved_at, status, notes) VALUES
(
  'd91783cf-0504-4b53-85fe-5b651bfef201', 
  'b3017cf7-6bc8-4f24-a212-32b0f4dc7cf3', 
  'warning', 
  NOW() - INTERVAL '40 minutes', 
  NOW() - INTERVAL '15 minutes', 
  'resolved', 
  'Officer warned the driver. Driver immediately moved the vehicle.'
),
(
  'd91783cf-0504-4b53-85fe-5b651bfef203', 
  'b3017cf7-6bc8-4f24-a212-32b0f4dc7cf4', 
  'ticket', 
  NOW() - INTERVAL '30 minutes', 
  NULL, 
  'dispatched', 
  'Officer Amit Singh dispatched to Commercial Street to issue ticket.'
);
