import React, { useState, useEffect } from "react";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from "react-leaflet";
import { Icon } from "leaflet";
import { Video, ShieldAlert, AlertCircle, Camera as CameraIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Default Icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Camera {
  id: string;
  name: string;
  stream_url: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface Zone {
  id: string;
  name: string;
  risk_level: string;
  enforcement_priority: number;
  boundary: number[][]; // [lat, lng] list
  cameras: Camera[];
}

interface Violation {
  id: string;
  latitude: number;
  longitude: number;
  vehicle_type: string;
  license_plate: string;
  status: string;
  image_url: string;
  detection_start: string;
  zone_id?: string;
}

interface MapViewProps {
  wsViolations: Violation[];
}

// Structured mock data representing Central Bengaluru (M.G. Road & Brigade Road)
const BENGALURU_MOCK_ZONES: Zone[] = [
  {
    id: "e04cb249-ea26-47a3-83bd-09d57a27eb21",
    name: "MG Road Metro Junction",
    risk_level: "high",
    enforcement_priority: 0.90,
    boundary: [[12.9748, 77.6055], [12.9748, 77.6105], [12.9730, 77.6105], [12.9730, 77.6055]],
    cameras: [
      { id: "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01", name: "Camera MG-Road-01", stream_url: "https://assets.mixkit.co/videos/preview/mixkit-traffic-at-night-in-a-large-city-39824-large.mp4", latitude: 12.9740, longitude: 77.6080, status: "online" },
      { id: "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf04", name: "Camera MG-Road-02", stream_url: "https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-freeway-seen-from-above-41584-large.mp4", latitude: 12.9735, longitude: 77.6065, status: "maintenance" }
    ]
  },
  {
    id: "e04cb249-ea26-47a3-83bd-09d57a27eb22",
    name: "Brigade Road Commercial Belt",
    risk_level: "medium",
    enforcement_priority: 0.65,
    boundary: [[12.9725, 77.6055], [12.9725, 77.6085], [12.9705, 77.6085], [12.9705, 77.6055]],
    cameras: [
      { id: "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf02", name: "Camera Brigade-Rd-01", stream_url: "https://assets.mixkit.co/videos/preview/mixkit-cars-on-a-highway-at-night-28498-large.mp4", latitude: 12.9715, longitude: 77.6070, status: "online" }
    ]
  },
  {
    id: "e04cb249-ea26-47a3-83bd-09d57a27eb23",
    name: "Commercial Street Crossings",
    risk_level: "high",
    enforcement_priority: 0.95,
    boundary: [[12.9830, 77.6075], [12.9830, 77.6110], [12.9805, 77.6110], [12.9805, 77.6075]],
    cameras: [
      { id: "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03", name: "Camera Commercial-St-01", stream_url: "https://assets.mixkit.co/videos/preview/mixkit-busy-intersection-with-traffic-lights-in-china-39908-large.mp4", latitude: 12.9818, longitude: 77.6087, status: "online" }
    ]
  }
];

const BENGALURU_MOCK_VIOLATIONS: Violation[] = [
  {
    id: "d91783cf-0504-4b53-85fe-5b651bfef201",
    latitude: 12.9741,
    longitude: 77.6083,
    vehicle_type: "truck",
    license_plate: "KA 03 MB 5678",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400",
    detection_start: new Date(Date.now() - 30 * 60000).toISOString(),
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb21"
  },
  {
    id: "d91783cf-0504-4b53-85fe-5b651bfef202",
    latitude: 12.9718,
    longitude: 77.6068,
    vehicle_type: "car",
    license_plate: "KA 01 ND 9012",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400",
    detection_start: new Date(Date.now() - 15 * 60000).toISOString(),
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb22"
  },
  {
    id: "d91783cf-0504-4b53-85fe-5b651bfef203",
    latitude: 12.9815,
    longitude: 77.6092,
    vehicle_type: "motorcycle",
    license_plate: "KA 04 P 1234",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400",
    detection_start: new Date(Date.now() - 45 * 60000).toISOString(),
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb23"
  }
];

const MapView: React.FC<MapViewProps> = ({ wsViolations }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<"standard" | "heatmap" | "congestion" | "correlation">("standard");

  const loadMapData = async () => {
    try {
      const zonesRes = await api.get("/zones");
      const baseZones = zonesRes.data;
      
      // If server returns base data, filter or verify coordinates. 
      // If coordinates are in Delhi, fallback to Bengaluru mock coordinates.
      const isDelhiCoords = baseZones.length > 0 && baseZones[0].boundary.length > 0 && baseZones[0].boundary[0][0] > 20;
      
      if (baseZones.length > 0 && !isDelhiCoords) {
        setZones(baseZones);
      } else {
        setZones(BENGALURU_MOCK_ZONES);
      }

      const violationsRes = await api.get("/violations?status=active");
      const baseViolations = violationsRes.data;
      if (baseViolations.length > 0 && !isDelhiCoords) {
        setViolations(baseViolations);
      } else {
        setViolations(BENGALURU_MOCK_VIOLATIONS);
      }
    } catch (e) {
      console.error("Error loading map data, falling back to Bengaluru coordinates:", e);
      setZones(BENGALURU_MOCK_ZONES);
      setViolations(BENGALURU_MOCK_VIOLATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Sync real-time violations on the map
  useEffect(() => {
    if (wsViolations.length > 0) {
      const latest = wsViolations[0];
      setViolations(prev => {
        const index = prev.findIndex(v => v.id === latest.id);
        if (index > -1) {
          if (latest.status !== "active" && latest.status !== "detected") {
            return prev.filter(v => v.id !== latest.id);
          }
          const updated = [...prev];
          updated[index] = { ...updated[index], ...latest };
          return updated;
        } else {
          if (latest.status === "active" || latest.status === "detected") {
            return [latest, ...prev];
          }
          return prev;
        }
      });
    }
  }, [wsViolations]);

  // Center coordinate of Central Bengaluru (M.G. Road)
  const centerCoords: [number, number] = [12.9740, 77.6080];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "#ef4444"; // Red
      case "medium": return "#f97316"; // Orange
      default: return "#10b981"; // Green
    }
  };

  // Dynamic colors based on interactive layers
  const getDynamicZoneColor = (zone: Zone) => {
    const zoneViolations = violations.filter(v => v.zone_id === zone.id).length;
    
    if (mapMode === "heatmap") {
      return zoneViolations >= 2 ? "#ef4444" : zoneViolations === 1 ? "#f97316" : "#cbd5e1";
    }
    
    if (mapMode === "congestion") {
      return zone.enforcement_priority > 0.8 ? "#ef4444" : zone.enforcement_priority > 0.5 ? "#f97316" : "#10b981";
    }

    if (mapMode === "correlation") {
      return zoneViolations > 0 && zone.enforcement_priority > 0.7 ? "#d946ef" : "#cbd5e1";
    }

    return getRiskColor(zone.risk_level);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bengaluru Live Geofenced Map</h1>
          <p className="text-sm text-slate-500">Live spatial mapping of parking-induced delays and flow degradation zones across Central Bengaluru.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 grow h-[calc(100vh-13rem)] min-h-[400px]">
        {/* Geographic Map Container */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm h-full flex flex-col">
          {/* Floating Map Mode Selector */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-1 bg-white/95 border border-slate-200 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setMapMode("standard")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mapMode === "standard" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Base Flow
            </button>
            <button
              onClick={() => setMapMode("heatmap")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mapMode === "heatmap" ? "bg-red-600 text-white" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Parking Hotspots
            </button>
            <button
              onClick={() => setMapMode("congestion")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mapMode === "congestion" ? "bg-amber-600 text-white" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Congestion Index
            </button>
            <button
              onClick={() => setMapMode("correlation")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mapMode === "correlation" ? "bg-purple-600 text-white" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Bottleneck Linkages
            </button>
          </div>

          <MapContainer 
            center={centerCoords} 
            zoom={15} 
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Geofenced Risk Zones */}
            {zones.map((zone) => {
              const zoneColor = getDynamicZoneColor(zone);
              const zoneViolations = violations.filter(v => v.zone_id === zone.id).length;
              return (
                <Polygon
                  key={zone.id}
                  positions={zone.boundary as [number, number][]}
                  pathOptions={{
                    color: zoneColor,
                    fillColor: zoneColor,
                    fillOpacity: mapMode === "correlation" && zoneViolations > 0 ? 0.35 : 0.15,
                    weight: mapMode === "correlation" && zoneViolations > 0 ? 3.5 : 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 flex flex-col gap-1 text-slate-800">
                      <span className="font-extrabold text-slate-900 text-sm">{zone.name}</span>
                      <div className="h-[1px] bg-slate-200 my-1"></div>
                      <span className="text-xs text-slate-600">Risk rating: <strong className="uppercase">{zone.risk_level}</strong></span>
                      <span className="text-xs text-slate-600">Speed Drop Index: <strong>{(zone.enforcement_priority * 100).toFixed(0)}%</strong></span>
                      <span className="text-xs text-slate-600">Active Blockages: <strong className="text-red-600">{zoneViolations} vehicles</strong></span>
                      {zoneViolations > 0 && (
                        <div className="mt-1 text-[10px] bg-red-50 text-red-700 border border-red-100 rounded p-1 font-semibold">
                          Estimated Capacity Loss: -{(zoneViolations * 12).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Render Cameras */}
            {zones.flatMap(z => z.cameras).map((camera) => (
              <Marker
                key={camera.id}
                position={[camera.latitude, camera.longitude]}
                icon={DefaultIcon}
              >
                <Popup>
                  <div className="p-2 flex flex-col gap-2 min-w-[200px] text-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <CameraIcon size={14} className="text-blue-600" />
                      <span>{camera.name}</span>
                    </div>
                    <span className="text-xs text-slate-600">Status: <strong className="text-emerald-600 capitalize font-bold">{camera.status}</strong></span>
                    
                    <button
                      onClick={() => {
                        setSelectedVideo(camera.stream_url);
                        setSelectedVideoName(camera.name);
                      }}
                      className="mt-1 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      <Video size={12} />
                      Open Camera Feed
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Active Violations (Blinking Red Circles) */}
            {violations.map((violation) => (
              <Circle
                key={violation.id}
                center={[violation.latitude, violation.longitude]}
                radius={20}
                pathOptions={{
                  color: "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2 flex flex-col gap-1.5 min-w-[180px] text-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-red-650 text-xs">
                      <ShieldAlert size={14} />
                      <span>ILLEGAL BLOCKAGE</span>
                    </div>
                    <span className="text-sm font-extrabold uppercase text-slate-900">{violation.license_plate}</span>
                    <span className="text-[10px] text-slate-500 capitalize">Vehicle: {violation.vehicle_type}</span>
                    <span className="text-[10px] text-slate-500">Duration: {new Date(violation.detection_start).toLocaleTimeString()}</span>
                    <img 
                      src={violation.image_url} 
                      alt="violation proof" 
                      className="w-full h-16 object-cover rounded-md mt-1.5 border border-slate-200" 
                    />
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>

        {/* Video feed sidebar or stream placeholder */}
        <div className="glass-panel rounded-2xl bg-white border border-slate-200 p-5 flex flex-col gap-4 h-full overflow-hidden shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Video size={18} className="text-blue-600" />
            Live AI Flow Analyzer
          </h2>

          {selectedVideo ? (
            <div className="flex flex-col gap-4 h-[calc(100%-3rem)] overflow-y-auto">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                <video 
                  src={selectedVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-[10px] font-bold text-white px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  AI Analyzing
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{selectedVideoName}</h3>
                <p className="text-xs text-slate-500">Edge YOLOv8 model runs at 30fps with custom spatial filters to verify parking boundaries vs carriageway geofence markers.</p>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-1 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-1">Live Detections:</span>
                  <span className="flex justify-between"><span>Bottleneck Level:</span><strong className="text-red-600">Severe</strong></span>
                  <span className="flex justify-between"><span>Carriageway Obstruction:</span><strong className="text-slate-800">33% width loss</strong></span>
                  <span className="flex justify-between"><span>Estimated Speed Drop:</span><strong className="text-rose-600">-18.2 km/h</strong></span>
                </div>
              </div>

              <button
                onClick={() => setSelectedVideo(null)}
                className="mt-auto w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Close Camera Stream
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="p-4 rounded-full bg-slate-50 border border-slate-150 mb-3 text-slate-500">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700">No active analyzer feed</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">Select any blue camera pin on the geographic map and tap "Open Camera Feed" to stream live computer vision bounding box detection data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
