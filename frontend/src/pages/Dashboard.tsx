import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Car, 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  MapPin, 
  Video, 
  Navigation,
  ArrowRight,
  Maximize2
} from "lucide-react";

interface Violation {
  id: string;
  camera_id: string;
  zone_id: string;
  latitude: number;
  longitude: number;
  vehicle_type: string;
  license_plate: string;
  image_url: string;
  status: string;
  detection_start: string;
}

interface CongestionStat {
  zone_id: string;
  zone_name: string;
  current_congestion_index: number;
  average_speed_kmh: number;
  active_violations_count: number;
  risk_level: string;
  priority_score: number;
}

interface DashboardProps {
  wsViolations: Violation[];
}

const BENGALURU_MOCK_STATS: CongestionStat[] = [
  {
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb21",
    zone_name: "MG Road Metro Junction",
    current_congestion_index: 0.91,
    average_speed_kmh: 12.4,
    active_violations_count: 2,
    risk_level: "high",
    priority_score: 0.90
  },
  {
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb22",
    zone_name: "Brigade Road Commercial Belt",
    current_congestion_index: 0.45,
    average_speed_kmh: 24.0,
    active_violations_count: 1,
    risk_level: "medium",
    priority_score: 0.65
  },
  {
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb23",
    zone_name: "Commercial Street Crossings",
    current_congestion_index: 0.98,
    average_speed_kmh: 5.2,
    active_violations_count: 1,
    risk_level: "high",
    priority_score: 0.95
  }
];

const BENGALURU_MOCK_VIOLATIONS: Violation[] = [
  {
    id: "d91783cf-0504-4b53-85fe-5b651bfef202",
    camera_id: "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf01",
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb21",
    latitude: 12.9738,
    longitude: 77.6080,
    vehicle_type: "car",
    license_plate: "KA 01 ND 9012",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400",
    detection_start: new Date(Date.now() - 20 * 60000).toISOString()
  },
  {
    id: "d91783cf-0504-4b53-85fe-5b651bfef203",
    camera_id: "c8a77a9b-7dbb-43d9-95e2-63b7c8dfbf03",
    zone_id: "e04cb249-ea26-47a3-83bd-09d57a27eb23",
    latitude: 12.9815,
    longitude: 77.6092,
    vehicle_type: "motorcycle",
    license_plate: "KA 04 P 1234",
    status: "active",
    image_url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400",
    detection_start: new Date(Date.now() - 35 * 60000).toISOString()
  }
];

const Dashboard: React.FC<DashboardProps> = ({ wsViolations }) => {
  const navigate = useNavigate();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [congestionStats, setCongestionStats] = useState<CongestionStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive drill down state
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const violationsRes = await api.get("/violations?status=active");
      const vData = violationsRes.data;

      const statsRes = await api.get("/traffic/congestion-stats");
      const sData = statsRes.data;

      // Check if data is Delhi coordinate and replace if so
      const isDelhi = sData.length > 0 && sData[0].zone_name.includes("Rajiv");

      if (vData.length > 0 && sData.length > 0 && !isDelhi) {
        setViolations(vData);
        setCongestionStats(sData);
        setSelectedZoneId(sData[0].zone_id);
      } else {
        // Fallback to Bengaluru mockup
        setViolations(BENGALURU_MOCK_VIOLATIONS);
        setCongestionStats(BENGALURU_MOCK_STATS);
        setSelectedZoneId(BENGALURU_MOCK_STATS[0].zone_id);
      }
    } catch (error) {
      console.error("Failed to load dashboard data, using Bengaluru mockup:", error);
      setViolations(BENGALURU_MOCK_VIOLATIONS);
      setCongestionStats(BENGALURU_MOCK_STATS);
      setSelectedZoneId(BENGALURU_MOCK_STATS[0].zone_id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Merge WebSocket real-time events with base violations
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

  // Recalculate KPIs
  const activeCount = violations.length;
  const averageCongestion = congestionStats.length > 0
    ? (congestionStats.reduce((sum, item) => sum + item.current_congestion_index, 0) / congestionStats.length) * 100
    : 0;
  
  const calculatedCapacityLoss = Math.min(
    violations.reduce((sum, v) => sum + (v.vehicle_type === 'truck' ? 25 : v.vehicle_type === 'bus' ? 30 : 12), 0),
    100
  );

  const avgSpeed = congestionStats.length > 0
    ? congestionStats.reduce((sum, item) => sum + item.average_speed_kmh, 0) / congestionStats.length
    : 40;
  
  const speedDegradation = Math.max(0, 40 - avgSpeed);

  // Drill down details calculation
  const selectedZone = congestionStats.find(s => s.zone_id === selectedZoneId);
  const selectedZoneViolations = violations.filter(v => v.zone_id === selectedZoneId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Bengaluru Smarter Mobility Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-950/50 p-6 shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[150%] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none rotate-45"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
                Flipkart Gridlock 2.0
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                Operational Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Helping Bengaluru Move Smarter
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed mt-1">
              On-street illegal parking and spillover parking near commercial hubs, metro stations, and event venues choke critical carriageways and reduce lane throughput. **GRIDLOCK** utilizes real-time AI computer vision to monitor, quantify, and target parking-induced bottlenecks dynamically.
            </p>
          </div>
          <div className="flex flex-row md:flex-col items-start gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl shrink-0">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200 block">AI Focus Mode</span>
              Quantifying parking impact on traffic flow velocity to enable targeted enforcement.
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-505 uppercase tracking-wider">Active Bottlenecks</span>
            <span className="text-3xl font-extrabold text-red-650">{activeCount}</span>
            <span className="text-[10px] text-slate-500">Illegally parked lane blockages</span>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-550 border border-red-100 shadow-inner">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lane Capacity Loss</span>
            <span className="text-3xl font-extrabold text-amber-600">{calculatedCapacityLoss}%</span>
            <span className="text-[10px] text-slate-500">Effective width reduction index</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shadow-inner">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Speed Loss</span>
            <span className="text-3xl font-extrabold text-rose-600">-{speedDegradation.toFixed(1)} km/h</span>
            <span className="text-[10px] text-slate-500">Due to street spillover friction</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shadow-inner">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Congestion Level</span>
            <span className="text-3xl font-extrabold text-emerald-600">{averageCongestion.toFixed(0)}%</span>
            <span className="text-[10px] text-slate-500">Monitored zone average load</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-inner">
            <Car size={24} />
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Detections Feed */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm bg-white">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 glow-active-violation animate-ping"></span>
              Live AI Violation Tracker
            </h2>
            <span className="text-[10px] uppercase font-bold text-slate-505 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
              Autoscrolling & Realtime
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {violations.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-sm">
                No active parking violations detected.
              </div>
            ) : (
              violations.map((violation) => {
                const isHeavy = violation.vehicle_type === 'truck' || violation.vehicle_type === 'bus';
                const capacityLossVal = violation.vehicle_type === 'truck' ? 25 : violation.vehicle_type === 'bus' ? 30 : 12;
                return (
                  <div 
                    key={violation.id} 
                    className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <img 
                          src={violation.image_url} 
                          alt="violation proof" 
                          className="w-16 h-12 object-cover rounded-lg border border-slate-200" 
                        />
                        <span className="absolute -bottom-1 -right-1 bg-red-600 text-[8px] font-bold text-white px-1.5 py-0.2 rounded uppercase">
                          AI Proof
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 border border-slate-200 rounded uppercase tracking-wider shadow-sm">
                            {violation.license_plate || "UNREAD PLATE"}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            violation.vehicle_type === 'truck' ? 'bg-amber-50 text-amber-600 border border-amber-255' :
                            violation.vehicle_type === 'bus' ? 'bg-blue-50 text-blue-600 border border-blue-255' :
                            'bg-indigo-50 text-indigo-600 border border-indigo-255'
                          }`}>
                            {violation.vehicle_type}
                          </span>
                          {isHeavy && (
                            <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-150 px-1.5 py-0.2 rounded font-bold uppercase">
                              Heavy Obstruction
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1 font-semibold"><MapPin size={12} /> {violation.latitude.toFixed(5)}, {violation.longitude.toFixed(5)}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(violation.detection_start).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 self-stretch sm:self-auto justify-center">
                      <span className="text-xs text-red-650 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg font-extrabold shadow-sm">
                        -{capacityLossVal}% Capacity
                      </span>
                      <span className="text-[9px] text-slate-505 font-medium">Choking lane throughput</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sector Health Check & Dynamic Drill-Down */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 bg-white shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">Zone Capacity Heat Levels</h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Click a zone to review localized live camera blockage profiles.</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto">
              {congestionStats.map((stat) => {
                const isSelected = stat.zone_id === selectedZoneId;
                return (
                  <div 
                    key={stat.zone_id} 
                    onClick={() => setSelectedZoneId(stat.zone_id)}
                    className={`flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? "border-blue-600 bg-blue-50/30 shadow-md" 
                        : "border-slate-150 bg-slate-50 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-850">{stat.zone_name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        stat.risk_level === 'high' ? 'bg-red-50 text-red-600 border border-red-150' :
                        stat.risk_level === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-150' : 
                        'bg-emerald-50 text-emerald-600 border border-emerald-150'
                      }`}>
                        {stat.risk_level} risk
                      </span>
                    </div>
                    
                    {/* Visual progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          stat.current_congestion_index > 0.75 ? "bg-gradient-to-r from-red-600 to-rose-500 animate-pulse" :
                          stat.current_congestion_index > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${stat.current_congestion_index * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-550 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold">Flow: <strong className="text-slate-800">{stat.average_speed_kmh.toFixed(0)} km/h</strong></span>
                      <span className="flex items-center gap-1">Blockages: <strong className="text-slate-800">{stat.active_violations_count}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Zone Details Drawer (Triggered by selecting a zone) */}
      {selectedZone && (
        <div className="glass-panel rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between gap-6 bg-white shadow-md animate-fade-in">
          <div className="flex flex-col gap-2 max-w-xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit">
              Active Zone Insights: {selectedZone.zone_name}
            </span>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Zone Performance Summary
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Currently displaying geofence bottleneck analytics for **{selectedZone.zone_name}**. This zone is experiencing **{(selectedZone.current_congestion_index * 100).toFixed(0)}%** congestion load with **{selectedZoneViolations.length}** active geofence parking violations registered. 
            </p>
            {selectedZoneViolations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedZoneViolations.map((v) => (
                  <span key={v.id} className="text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-100 rounded px-2 py-1 shadow-sm">
                    {v.license_plate} ({v.vehicle_type})
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0 justify-center">
            <button
              onClick={() => navigate("/map")}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Maximize2 size={14} /> Open Live Map View
            </button>
            <button
              onClick={() => navigate("/enforcement")}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 animate-pulse"
            >
              Deploy Patrol Unit <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
