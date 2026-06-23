import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import { Video, ShieldAlert, AlertCircle, Camera as CameraIcon, Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Default Icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import HeatmapLayer, { PREDICTED_GRADIENT } from "../components/common/HeatmapLayer";

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

type HeatmapMode = "historical" | "predicted" | "both";

interface MapViewProps {
  wsViolations: Violation[];
}

const MapView: React.FC<MapViewProps> = ({ wsViolations }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<
  [number, number, number][]
> ([]);
const [predictedHeatmapPoints, setPredictedHeatmapPoints] = useState<
  [number, number, number][]
>([]);
const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("historical");
const [topHotspots, setTopHotspots] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadMapData = useCallback(async () => {
    try {
      const zonesRes = await api.get("/zones");
      setZones(zonesRes.data);

      const violationsRes = await api.get("/violations?status=active");
      setViolations(violationsRes.data);

      const [heatmapRes, hotspotRes, predictedRes] = await Promise.all([
        api.get("/heatmap/historical"),
        api.get("/heatmap/top-hotspots"),
        api.get("/heatmap/predicted").catch(() => ({ data: [] })),
      ]);

      const formattedPoints = heatmapRes.data.map((p:any) => [
        p.lat,
        p.lng,
        p.weight
      ]);

      setHeatmapPoints(formattedPoints);

      const formattedPredicted = (predictedRes.data || []).map((p: any) => [
        p.lat,
        p.lng,
        p.weight,
      ]);
      setPredictedHeatmapPoints(formattedPredicted);

      setTopHotspots(hotspotRes.data);

    } catch (e) {
      console.error("Error loading map data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

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

            {(heatmapMode === "historical" || heatmapMode === "both") && heatmapPoints.length > 0 && (
              <HeatmapLayer points={heatmapPoints} />
            )}

            {(heatmapMode === "predicted" || heatmapMode === "both") && predictedHeatmapPoints.length > 0 && (
              <HeatmapLayer
                points={predictedHeatmapPoints}
                gradient={PREDICTED_GRADIENT}
                radius={35}
                blur={25}
                minOpacity={0.35}
              />
            )}

            {topHotspots.slice(0, 5).map((spot, index) => (
  <React.Fragment key={index}>
    <Circle
      center={[spot.lat, spot.lng]}
      radius={150}
      pathOptions={{
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.15,
        weight: 2,
      }}
    />

    <Marker position={[spot.lat, spot.lng]}>
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
  </React.Fragment>
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

          {/* Heatmap Layer Toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {(["historical", "predicted", "both"] as HeatmapMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setHeatmapMode(mode)}
                className={`flex-1 text-xs font-bold py-1.5 px-2 rounded-md capitalize transition cursor-pointer ${
                  heatmapMode === mode
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {mode === "both" ? "Both" : mode}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            {heatmapMode !== "predicted" && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(90deg, #3b82f6, #22c55e, #eab308, #f97316, #ef4444)" }}></span>
                Historical
              </span>
            )}
            {heatmapMode !== "historical" && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(90deg, #1e1b4b, #7c3aed, #a855f7, #d946ef, #fdf4ff)" }}></span>
                24h Predicted
              </span>
            )}
          </div>

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
            <div className="flex-1 flex flex-col items-center text-center p-4 text-slate-500 overflow-y-auto">
              <div className="space-y-5 w-full">

              {/* Stats - always visible */}
              <div>
                <p className="text-slate-400 text-xs">30-Day Violations</p>
                <h2 className="text-3xl font-bold text-red-400">26,699</h2>
              </div>

              <div>
                <p className="text-slate-400 text-xs">Hotspot Clusters</p>
                <h2 className="text-2xl font-bold text-yellow-400">288</h2>
              </div>

              <div>
                <p className="text-slate-400 text-xs">Critical Zones</p>
                <h2 className="text-2xl font-bold text-pink-400">6</h2>
              </div>

              {/* Predicted hotspots summary */}
              {heatmapMode !== "historical" && predictedHeatmapPoints.length > 0 && (
                <div className="border-t border-slate-800 pt-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
                    <Layers size={14} className="text-purple-400" />
                    24h Predicted Hotspots
                  </h3>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {[...predictedHeatmapPoints]
                      .sort((a, b) => b[2] - a[2])
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={i} className="flex justify-between items-center gap-2">
                          <span className="text-slate-300 text-[11px] flex-1 truncate text-left">
                            {p[0].toFixed(4)}, {p[1].toFixed(4)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                opacity: 0.3 + (p[2] / 100) * 0.7,
                                background: "#a855f7",
                              }}
                            ></div>
                            <span className="text-purple-300 font-bold text-xs">
                              {p[2].toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-white font-semibold text-sm mb-3">
                  Top Hotspots
                </h3>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {topHotspots.map((spot,index)=>(
                    <div
                      key={index}
                      className="flex justify-between items-start gap-2"
                    >
                      <span className="text-slate-300 text-xs flex-1 pr-2 text-left">
                        {spot.name}
                      </span>

                      <span className="text-red-400 font-bold text-xs">
                        {spot.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600">
                {heatmapMode === "historical" ? "Historical data: Last 30 Days" : heatmapMode === "predicted" ? "AI prediction: Next 24 Hours" : "Historical + 24h Prediction overlay"}
              </p>

            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
