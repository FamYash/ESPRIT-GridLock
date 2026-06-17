-- Mock Seed Data for GridLock System
-- Coordinates represent standard points and polygons in New Delhi / Connaught Place area (approx: 28.6304° N, 77.2177° E)

-- 1. Seed Users (passwords are 'password123' hashed with bcrypt: '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2')
INSERT INTO users (id, email, hashed_password, full_name, role, status) VALUES
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf1', 'admin@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'System Administrator', 'admin', 'active'),
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf2', 'operator@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'Traffic Operator', 'operator', 'active'),
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf3', 'officer1@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'Officer Rajesh Kumar', 'officer', 'on_duty'),
('b3017cf7-6bc8-4f24-a212-32b0f4dc7cf4', 'officer2@gridlock.io', '$2b$12$EixZaYVK1fsAH1pt4.qiuiS22U58Y_12Vv6.4fB2BqY2tqR3mZ1e2', 'Officer Amit Singh', 'officer', 'on_duty');

-- 2. Seed Zones (Polygons representing commercial and metro hot spots)
INSERT INTO zones (id, name, boundary_polygon, risk_level, enforcement_priority) VALUES
(
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  'Rajiv Chowk Metro Exit 2', 
  ST_GeomFromText('POLYGON((77.2170 28.6300, 77.2200 28.6300, 77.2200 28.6320, 77.2170 28.6320, 77.2170 28.6300))', 4326), 
  'high', 
  0.85
),
(
  'e04cb249-ea26-47a3-83bd-09d57a27eb22', 
  'Palika Bazaar Commercial Belt', 
  ST_GeomFromText('POLYGON((77.2150 28.6280, 77.2175 28.6280, 77.2175 28.6305, 77.2150 28.6305, 77.2150 28.6280))', 4326), 
  'medium', 
  0.60
),
(
  'e04cb249-ea26-47a3-83bd-09d57a27eb23', 
  'Janpath Market Crossroad', 
  ST_GeomFromText('POLYGON((77.2180 28.6250, 77.2210 28.6250, 77.2210 28.6280, 77.2180 28.6280, 77.2180 28.6250))', 4326), 
  'high', 
  0.92
);

-- 3. Seed Cameras associated with Zones
INSERT INTO cameras (id, zone_id, name, stream_url, location_point, status) VALUES
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  'Camera RC-East-01', 
  'https://assets.mixkit.co/videos/preview/mixkit-traffic-at-night-in-a-large-city-39824-large.mp4', 
  ST_GeomFromText('POINT(77.2185 28.6310)', 4326), 
  'online'
),
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf02', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb22', 
  'Camera PB-West-02', 
  'https://assets.mixkit.co/videos/preview/mixkit-cars-on-a-highway-at-night-28498-large.mp4', 
  ST_GeomFromText('POINT(77.2162 28.6292)', 4326), 
  'online'
),
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb23', 
  'Camera JM-Intersection-01', 
  'https://assets.mixkit.co/videos/preview/mixkit-busy-intersection-with-traffic-lights-in-china-39908-large.mp4', 
  ST_GeomFromText('POINT(77.2195 28.6265)', 4326), 
  'online'
),
(
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf04', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  'Camera RC-North-02', 
  'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-freeway-seen-from-above-41584-large.mp4', 
  ST_GeomFromText('POINT(77.2175 28.6318)', 4326), 
  'maintenance'
);

-- 4. Seed Violations (Active and Historical Detections)
INSERT INTO violations (id, camera_id, zone_id, location_point, detection_start, detection_end, duration_seconds, vehicle_type, license_plate, image_url, status) VALUES
(
  'd91783cf-0504-4b53-85fe-5b651bfef201', 
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  ST_GeomFromText('POINT(77.2184 28.6309)', 4326),
  NOW() - INTERVAL '45 minutes', 
  NOW() - INTERVAL '15 minutes', 
  1800, 
  'car', 
  'DL 3C AY 4321', 
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400', 
  'cleared'
),
(
  'd91783cf-0504-4b53-85fe-5b651bfef202', 
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb21', 
  ST_GeomFromText('POINT(77.2186 28.6311)', 4326),
  NOW() - INTERVAL '20 minutes', 
  NULL, 
  1200, 
  'truck', 
  'HR 26 BQ 8899', 
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400', 
  'active'
),
(
  'd91783cf-0504-4b53-85fe-5b651bfef203', 
  'c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03', 
  'e04cb249-ea26-47a3-83bd-09d57a27eb23', 
  ST_GeomFromText('POINT(77.2194 28.6266)', 4326),
  NOW() - INTERVAL '35 minutes', 
  NULL, 
  2100, 
  'motorcycle', 
  'DL 8S CZ 9012', 
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400', 
  'cited'
);

-- 5. Seed Traffic Metrics (Simulating congestion indices)
INSERT INTO traffic_metrics (zone_id, timestamp, average_speed_kmh, vehicle_count, occupancy_percentage, congestion_index) VALUES
('e04cb249-ea26-47a3-83bd-09d57a27eb21', NOW() - INTERVAL '1 hour', 40.5, 120, 45.0, 0.25),
('e04cb249-ea26-47a3-83bd-09d57a27eb21', NOW() - INTERVAL '30 minutes', 22.1, 195, 78.0, 0.68),
('e04cb249-ea26-47a3-83bd-09d57a27eb21', NOW(), 12.4, 250, 92.5, 0.91), -- High Congestion correlated with active violations

('e04cb249-ea26-47a3-83bd-09d57a27eb22', NOW() - INTERVAL '1 hour', 35.0, 80, 30.0, 0.20),
('e04cb249-ea26-47a3-83bd-09d57a27eb22', NOW() - INTERVAL '30 minutes', 28.5, 95, 42.0, 0.35),
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
  'Officer Amit Singh dispatched to Janpath Crossroad to issue ticket.'
);
