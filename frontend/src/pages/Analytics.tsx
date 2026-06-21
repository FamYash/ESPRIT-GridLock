import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { RefreshCcw, Info, Sliders } from "lucide-react";

interface CongestionStat {
  zone_id: string;
  zone_name: string;
  current_congestion_index: number;
  average_speed_kmh: number;
  active_violations_count: number;
  risk_level: string;
  priority_score: number;
}

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<CongestionStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Simulator State
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [clearedViolations, setClearedViolations] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await api.get("/traffic/congestion-stats");
      const data = response.data;
      setStats(data);
      if (data.length > 0 && !selectedZoneId) {
        setSelectedZoneId(data[0].zone_id);
      }
    } catch (e) {
      console.error("Failed to load statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const activeZone = stats.find(s => s.zone_id === selectedZoneId);
  const maxViolations = activeZone ? activeZone.active_violations_count : 0;

  // Reset slider if zone changes
  useEffect(() => {
    setClearedViolations(0);
  }, [selectedZoneId]);

  // Calculate speed improvement: each violation cleared restores up to 10 km/h of speed towards 40 km/h speed limit
  const currentSpeed = activeZone ? activeZone.average_speed_kmh : 0;
  const simulatedSpeed = Math.min(40, currentSpeed + (clearedViolations * 10));
  const simulatedCongestion = Math.max(0, (activeZone ? activeZone.current_congestion_index : 0) - (clearedViolations * 0.25)) * 100;

  // Format data for speed vs violations scatter correlation
  const correlationData = stats.map(s => ({
    name: s.zone_name.split(" ")[0], // Short name
    violations: s.active_violations_count,
    speed: Math.round(s.average_speed_kmh),
    congestion: Math.round(s.current_congestion_index * 100)
  }));

  // Historical simulation for chart layouts
  const hourlyData = [
    { hour: "08:00", violations: 2, avgSpeed: 38 },
    { hour: "10:00", violations: 8, avgSpeed: 15 },
    { hour: "12:00", violations: 4, avgSpeed: 28 },
    { hour: "14:00", violations: 5, avgSpeed: 24 },
    { hour: "16:00", violations: 12, avgSpeed: 8 },
    { hour: "18:00", violations: 15, avgSpeed: 5 },
    { hour: "20:00", violations: 7, avgSpeed: 19 },
    { hour: "22:00", violations: 3, avgSpeed: 35 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Congestion Impact Analytics</h1>
          <p className="text-sm text-slate-500">Quantifying the direct impact of illegal street parking violations on traffic flow velocity.</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-sm transition"
        >
          <RefreshCcw size={14} /> Refresh Analytics
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Correlation Plot */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-850">Violations vs Congestion Index</h2>
            <p className="text-xs text-slate-500 mt-0.5">Comparative load mapping current street blockages against speed indices.</p>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlationData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#ef4444" style={{ fontSize: 11 }} label={{ value: 'Violations Count', angle: -90, position: 'insideLeft', fill: '#ef4444', offset: 5 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" style={{ fontSize: 11 }} label={{ value: 'Congestion Index %', angle: 90, position: 'insideRight', fill: '#f59e0b', offset: 5 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, color: '#0f172a' }} />
                <Legend style={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="violations" name="Active Violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="congestion" name="Congestion Index (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time-Series Trend Line (Simulating the speed degradation based on violations) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-850">Diurnal Speed Degradation Curve</h2>
            <p className="text-xs text-slate-500 mt-0.5">Hourly performance curve mapping street velocity drop against violations peaks.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, color: '#0f172a' }} />
                <Legend style={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="avgSpeed" name="Avg Velocity (km/h)" stroke="#10b981" fillOpacity={1} fill="url(#colorSpeed)" />
                <Area type="monotone" dataKey="violations" name="Violations Peak" stroke="#ef4444" fillOpacity={1} fill="url(#colorViolations)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Simulator Playground Widget */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 shadow-sm border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="text-blue-600" size={20} />
          <div>
            <h2 className="text-lg font-bold text-slate-800">Simulated Flow Recovery Simulator</h2>
            <p className="text-xs text-slate-500">Calculate how targeted vehicle removals instantly restore bottleneck flow rates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Target Sector</label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                {stats.map((s) => (
                  <option key={s.zone_id} value={s.zone_id}>
                    {s.zone_name} ({s.active_violations_count} active blockages)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>REMOVE VEHICLES</span>
                <span className="text-blue-600 font-bold">{clearedViolations} / {maxViolations}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxViolations}
                value={clearedViolations}
                onChange={(e) => setClearedViolations(parseInt(e.target.value))}
                disabled={maxViolations === 0}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Speed Restore KPI Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Restored Flow Velocity</span>
              <span className="text-3xl font-extrabold text-emerald-600 flex items-center gap-1.5">
                {simulatedSpeed.toFixed(1)} km/h
              </span>
              <span className="text-xs text-slate-500 mt-2">
                Original speed: <strong className="text-slate-700">{currentSpeed.toFixed(1)} km/h</strong> (+{((simulatedSpeed - currentSpeed) / (currentSpeed || 1) * 100).toFixed(0)}%)
              </span>
            </div>

            {/* Congestion Level Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Simulated Congestion</span>
              <span className="text-3xl font-extrabold text-amber-500">
                {simulatedCongestion.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500 mt-2">
                Original index: <strong className="text-slate-700">{(activeZone ? activeZone.current_congestion_index * 100 : 0).toFixed(0)}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory notes box */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-blue-50/20 flex gap-4 items-start text-slate-700">
        <Info className="shrink-0 text-blue-600 mt-0.5" size={20} />
        <div className="flex flex-col gap-1 text-sm">
          <strong className="text-slate-800">Understanding Congestion Metrics</strong>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our AI engine computes speed drops on the carriageway by comparing real-time optical velocity against standard free-flow parameters. When vehicles park illegally on standard carriageways, they reduce lane capacity, inducing bottlenecks that lead to rapid, non-linear drops in vehicle velocity index and corresponding congestion peaks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
