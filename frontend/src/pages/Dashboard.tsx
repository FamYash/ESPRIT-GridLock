import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  Car, 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  MapPin, 
  Video, 
  Navigation 
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

const Dashboard: React.FC<DashboardProps> = ({ wsViolations }) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [congestionStats, setCongestionStats] = useState<CongestionStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const violationsRes = await api.get("/violations?status=active");
      setViolations(violationsRes.data);

      const statsRes = await api.get("/traffic/congestion-stats");
      setCongestionStats(statsRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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
      // Check if it's already in the list
      setViolations(prev => {
        const index = prev.findIndex(v => v.id === latest.id);
        if (index > -1) {
          // If updated and status is not active, filter it out
          if (latest.status !== "active" && latest.status !== "detected") {
            return prev.filter(v => v.id !== latest.id);
          }
          const updated = [...prev];
          updated[index] = { ...updated[index], ...latest };
          return updated;
        } else {
          // If status is active, insert at the beginning
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
  const criticalZonesCount = congestionStats.filter(item => item.current_congestion_index > 0.75).length;
  const avgSpeed = congestionStats.length > 0
    ? congestionStats.reduce((sum, item) => sum + item.average_speed_kmh, 0) / congestionStats.length
    : 40;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Control Panel</h1>
        <p className="text-sm text-slate-400">Real-time illegal parking tracking and traffic congestion analytics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Violations</span>
            <span className="text-3xl font-extrabold text-red-500">{activeCount}</span>
            <span className="text-[10px] text-slate-500">Currently choking carriageways</span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Congestion Level</span>
            <span className="text-3xl font-extrabold text-amber-500">{averageCongestion.toFixed(0)}%</span>
            <span className="text-[10px] text-slate-500">Throughput speed drop index</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Zones</span>
            <span className="text-3xl font-extrabold text-rose-500">{criticalZonesCount}</span>
            <span className="text-[10px] text-slate-500">Congestion Index &gt; 75%</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Traffic Speed</span>
            <span className="text-3xl font-extrabold text-emerald-500">{avgSpeed.toFixed(1)} km/h</span>
            <span className="text-[10px] text-slate-500">Across all monitored sectors</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Car size={24} />
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Detections Feed */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 glow-active-violation"></span>
              Live Violation Feed
            </h2>
            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              Autoscrolling
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {violations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No active parking violations detected.
              </div>
            ) : (
              violations.map((violation) => (
                <div 
                  key={violation.id} 
                  className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/60 transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center">
                    <img 
                      src={violation.image_url} 
                      alt="violation proof" 
                      className="w-16 h-12 object-cover rounded-lg border border-slate-800" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 bg-slate-900 px-2 py-0.5 border border-slate-850 rounded uppercase">
                          {violation.license_plate || "UNREAD PLATE"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          violation.vehicle_type === 'truck' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          violation.vehicle_type === 'bus' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {violation.vehicle_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {violation.latitude.toFixed(5)}, {violation.longitude.toFixed(5)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(violation.detection_start).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full font-semibold">
                      Choking Lane
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sector Health Check & Congestion Ratings */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">Zone Congestion Index</h2>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[420px]">
            {congestionStats.map((stat) => (
              <div key={stat.zone_id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/20 border border-slate-900">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-200">{stat.zone_name}</span>
                  <span className={`text-xs font-bold uppercase ${
                    stat.risk_level === 'high' ? 'text-red-400' :
                    stat.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {stat.risk_level} risk
                  </span>
                </div>
                
                {/* Visual bar */}
                <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      stat.current_congestion_index > 0.75 ? "bg-red-500" :
                      stat.current_congestion_index > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${stat.current_congestion_index * 100}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Speed: {stat.average_speed_kmh.toFixed(0)} km/h</span>
                  <span>Violations: {stat.active_violations_count} active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
