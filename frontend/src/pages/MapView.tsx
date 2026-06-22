import React, { useState, useEffect } from "react";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import { Video, ShieldAlert, AlertCircle, Camera as CameraIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Default Icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import HeatmapLayer from "../components/common/HeatmapLayer";

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
}

interface MapViewProps {
  wsViolations: Violation[];
}

const MapView: React.FC<MapViewProps> = ({ wsViolations }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<
  [number, number, number][]
>([]);
const [topHotspots, setTopHotspots] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const loadMapData = async () => {
    try {
      const zonesRes = await api.get("/zones");
      setZones(zonesRes.data);

      const violationsRes = await api.get("/violations?status=active");
      setViolations(violationsRes.data);

      const heatmapRes = await api.get(
        "/heatmap/historical"
      );

      const formattedPoints = heatmapRes.data.map((p:any) => [
        p.lat,
        p.lng,
        p.weight
      ]);

      console.log("Heatmap Points:", formattedPoints.slice(0,10));

      setHeatmapPoints(formattedPoints);

      setTopHotspots(
        heatmapRes.data
          .sort((a:any,b:any)=>b.weight-a.weight)
          .slice(0,5)
      );

    } catch (e) {
      console.error("Error loading map data:", e);
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

  // Center coordinate of Delhi Connaught Place
  const centerCoords: [number, number] = [12.9808, 77.6005];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "#ef4444"; // Red
      case "medium": return "#f97316"; // Orange
      default: return "#10b981"; // Green
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Violation Heatmap</h1>
          <p className="text-sm text-slate-400">Live geographic display of gridlock areas, camera streams, and active parking violations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 grow h-[calc(100vh-13rem)] min-h-[400px]">
        {/* Geographic Leaflet Map */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-800 h-full">
          <MapContainer 
            center={centerCoords} 
            zoom={15} 
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {heatmapPoints.length > 0 && (
              <HeatmapLayer
                points={heatmapPoints}
              />
            )}

            {topHotspots.slice(0, 5).map((spot, index) => (
              <Marker
                key={index}
                position={[spot.lat, spot.lng]}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">
                      {spot.name}
                    </h3>

                    <p>
                      Violations: {spot.weight}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Geofenced Risk Zones */}
            {/* {zones.map((zone) => (
              <Polygon
                key={zone.id}
                positions={zone.boundary as [number, number][]}
                pathOptions={{
                  color: getRiskColor(zone.risk_level),
                  fillColor: getRiskColor(zone.risk_level),
                  fillOpacity: 0.03,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="p-1 flex flex-col gap-1">
                    <span className="font-bold text-slate-200 text-sm">{zone.name}</span>
                    <span className="text-xs text-slate-400">Risk rating: <strong className="uppercase">{zone.risk_level}</strong></span>
                    <span className="text-xs text-slate-400">Enforcement Priority: <strong>{(zone.enforcement_priority * 100).toFixed(0)}%</strong></span>
                  </div>
                </Popup>
              </Polygon>
            ))} */}

            {/* Render Cameras */}
            {false && zones.flatMap(z => z.cameras).map((camera) => (
              <Marker
                key={camera.id}
                position={[camera.latitude, camera.longitude]}
                icon={DefaultIcon}
              >
                <Popup>
                  <div className="p-2 flex flex-col gap-2 min-w-[200px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200 text-sm">
                      <CameraIcon size={14} className="text-blue-400" />
                      <span>{camera.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">Status: <strong className="text-emerald-400 capitalize">{camera.status}</strong></span>
                    
                    <button
                      onClick={() => {
                        setSelectedVideo(camera.stream_url);
                        setSelectedVideoName(camera.name);
                      }}
                      className="mt-1 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-2 rounded text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Video size={12} />
                      Open Camera Feed
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Video feed sidebar or stream placeholder */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col gap-4 h-full overflow-hidden">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <Video size={18} className="text-blue-400" />
            Heatmap Analytics
          </h2>

          {selectedVideo ? (
            <div className="flex flex-col gap-4 h-[calc(100%-3rem)] overflow-y-auto">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                <video 
                  src={selectedVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-red-600 text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  AI Analyzing
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{selectedVideoName}</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time object mapping. YOLOv8 is running at 30fps with automatic geofence checks.</p>
              </div>

              <button
                onClick={() => setSelectedVideo(null)}
                className="mt-auto w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Close Camera Stream
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-3 text-slate-400">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-6">

              <div>
                <p className="text-slate-400 text-sm">
                  30-Day Violations
                </p>

                <h2 className="text-4xl font-bold text-red-400">
                  26,699
                </h2>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Hotspot Clusters
                </p>

                <h2 className="text-3xl font-bold text-yellow-400">
                  288
                </h2>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Critical Zones
                </p>

                <h2 className="text-3xl font-bold text-pink-400">
                  6
                </h2>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Coverage Period
                </p>

                <div className="border-t border-slate-800 pt-4">
                  <h3 className="text-white font-semibold mb-3">
                    Top Hotspots
                  </h3>

                  <div className="space-y-3">
                    {topHotspots.map((spot,index)=>(
                      <div
                        key={index}
                        className="flex justify-between items-start gap-2"
                      >
                        <span className="text-slate-300 text-xs flex-1 pr-2">
                          {spot.name}
                        </span>

                        <span className="text-red-400 font-bold">
                          {spot.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-green-400">
                  Last 30 Days
                </h2>
              </div>

            </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">Click on any camera pin on the geographic map and tap "Open Camera Feed" to stream AI detection analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
