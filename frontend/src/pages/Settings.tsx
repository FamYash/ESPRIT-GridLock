import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Plus, Camera as CameraIcon, Map, Settings as SettingsIcon, AlertCircle } from "lucide-react";

interface Camera {
  id: string;
  name: string;
  stream_url: string;
  latitude: number;
  longitude: number;
  status: string;
  zone_id?: string;
}

interface Zone {
  id: string;
  name: string;
  risk_level: string;
  boundary: number[][];
}

const Settings: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [camName, setCamName] = useState("");
  const [camUrl, setCamUrl] = useState("");
  const [camLat, setCamLat] = useState("");
  const [camLng, setCamLng] = useState("");
  const [camZoneId, setCamZoneId] = useState("");

  const [zoneName, setZoneName] = useState("");
  const [zoneRisk, setZoneRisk] = useState("low");
  const [zoneCoords, setZoneCoords] = useState(""); // JSON format [[lat,lng], [lat,lng]...]

  const loadConfig = async () => {
    try {
      const zonesRes = await api.get("/zones");
      setZones(zonesRes.data);

      const camsRes = await api.get("/zones/cameras/all");
      setCameras(camsRes.data);
    } catch (e) {
      console.error("Failed to load configs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: camName,
        stream_url: camUrl,
        latitude: parseFloat(camLat),
        longitude: parseFloat(camLng),
        zone_id: camZoneId || null,
        status: "online"
      };

      await api.post("/zones/cameras/add", payload);
      
      // Reset form
      setCamName("");
      setCamUrl("");
      setCamLat("");
      setCamLng("");
      setCamZoneId("");
      
      loadConfig();
    } catch (err) {
      console.error("Failed to add camera:", err);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedBoundary = JSON.parse(zoneCoords);
      if (!Array.isArray(parsedBoundary)) {
        alert("Coordinates must be a JSON array of arrays: [[lat, lng], [lat, lng], ...]");
        return;
      }
      
      const payload = {
        name: zoneName,
        risk_level: zoneRisk,
        boundary: parsedBoundary
      };

      await api.post("/zones", payload);

      // Reset form
      setZoneName("");
      setZoneCoords("");
      setZoneRisk("low");
      
      loadConfig();
    } catch (err) {
      console.error("Failed to add zone:", err);
      alert("Error adding zone. Make sure coordinates JSON is formatted correctly.");
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
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-sm text-slate-400">Manage surveillance feeds, draw boundary geofences, and configure enforcement parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manage & Add Cameras */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              <CameraIcon size={18} className="text-blue-500" />
              Surveillance Camera Registration
            </h2>

            <form onSubmit={handleAddCamera} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Camera Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Camera RC-East-03"
                  value={camName}
                  onChange={(e) => setCamName(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Stream URL (Video / RTSP Link)</label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://domain.com/feed.mp4"
                  value={camUrl}
                  onChange={(e) => setCamUrl(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Latitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="28.6300"
                  value={camLat}
                  onChange={(e) => setCamLat(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Longitude</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="77.2100"
                  value={camLng}
                  onChange={(e) => setCamLng(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Associate Zone</label>
                <select
                  value={camZoneId}
                  onChange={(e) => setCamZoneId(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select parent sector (Optional)...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} className="bg-slate-900 text-slate-200">
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="col-span-2 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Register Camera Device
              </button>
            </form>
          </div>

          {/* List Cameras */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            <h3 className="font-bold text-white text-sm border-b border-slate-850 pb-2">Surveillance Devices Logs</h3>
            {cameras.map(c => (
              <div key={c.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-950/20 border border-slate-900">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-200">{c.name}</span>
                  <span className="text-slate-500 font-mono leading-none truncate max-w-xs">{c.stream_url}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-semibold uppercase ${
                  c.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Manage & Add Zones */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              <Map size={18} className="text-blue-500" />
              Define Enforcement Hotspots
            </h2>

            <form onSubmit={handleAddZone} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Zone / Sector Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Palika Bazar Crossings"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Zone Risk Allocation</label>
                <select
                  value={zoneRisk}
                  onChange={(e) => setZoneRisk(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="low" className="bg-slate-900 text-slate-200">Low Risk</option>
                  <option value="medium" className="bg-slate-900 text-slate-200">Medium Risk</option>
                  <option value="high" className="bg-slate-900 text-slate-200">High Risk</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Boundary Coordinates (WGS84 Polygon JSON)</label>
                </div>
                <textarea
                  required
                  placeholder="[[28.6300, 77.2170], [28.6300, 77.2200], [28.6320, 77.2200], [28.6320, 77.2170]]"
                  value={zoneCoords}
                  onChange={(e) => setZoneCoords(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm font-mono text-slate-200 outline-none focus:border-blue-500 resize-none"
                />
                <span className="text-[10px] text-slate-500">
                  Must be an array of coordinate arrays mapping corners: [[lat, lng], [lat, lng], ...]
                </span>
              </div>

              <button
                type="submit"
                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Draw Geofenced Sector
              </button>
            </form>
          </div>

          {/* List Zones */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            <h3 className="font-bold text-white text-sm border-b border-slate-850 pb-2">Active Geofences</h3>
            {zones.map(z => (
              <div key={z.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-950/20 border border-slate-900">
                <span className="font-bold text-slate-200">{z.name}</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold uppercase ${
                  z.risk_level === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  z.risk_level === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {z.risk_level} risk
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
