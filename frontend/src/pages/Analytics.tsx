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
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { BarChart3, TrendingDown, RefreshCcw, Info } from "lucide-react";

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

  const fetchStats = async () => {
    try {
      const response = await api.get("/traffic/congestion-stats");
      setStats(response.data);
    } catch (e) {
      console.error("Failed to load statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format data for speed vs violations scatter correlation
  const correlationData = stats.map(s => ({
    name: s.zone_name,
    violations: s.active_violations_count,
    speed: Math.round(s.average_speed_kmh),
    congestion: Math.round(s.current_congestion_index * 100)
  }));

  // Historical simulation for chart layouts
  const hourlyData = [
    { hour: "08:00", violations: 2, avgSpeed: 38 },
    { hour: "10:00", violations: 8, avgSpeed: 15 }, // Morning Peak
    { hour: "12:00", violations: 4, avgSpeed: 28 },
    { hour: "14:00", violations: 5, avgSpeed: 24 },
    { hour: "16:00", violations: 12, avgSpeed: 8 },  // Heavy spillover parking / metro exit peak
    { hour: "18:00", violations: 15, avgSpeed: 5 },  // Maximum Peak
    { hour: "20:00", violations: 7, avgSpeed: 19 },
    { hour: "22:00", violations: 3, avgSpeed: 35 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Congestion Impact Analytics</h1>
          <p className="text-sm text-slate-400">Quantifying the mathematical correlation between illegal street parking violations and road throughput delay.</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 flex items-center gap-2 text-xs font-semibold cursor-pointer transition"
        >
          <RefreshCcw size={14} /> Refresh Data
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Core Correlation Plot */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Violations vs Congestion Index</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time sector comparison mapping current blockages against speed indices.</p>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="99%" height={280}>
              <BarChart data={correlationData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#ef4444" style={{ fontSize: 11 }} label={{ value: 'Violations Count', angle: -90, position: 'insideLeft', fill: '#ef4444', offset: 5 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" style={{ fontSize: 11 }} label={{ value: 'Congestion Index %', angle: 90, position: 'insideRight', fill: '#f59e0b', offset: 5 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8, color: '#f3f4f6' }} />
                <Legend style={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="violations" name="Active Violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="congestion" name="Congestion Index (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time-Series Trend Line (Simulating the speed degradation based on violations) */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Diurnal Speed Degradation Curve</h2>
            <p className="text-xs text-slate-500 mt-0.5">Hourly performance curve mapping street velocity drop against violations peaks.</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="99%" height={280}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8, color: '#f3f4f6' }} />
                <Legend style={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="avgSpeed" name="Avg Velocity (km/h)" stroke="#10b981" fillOpacity={1} fill="url(#colorSpeed)" />
                <Area type="monotone" dataKey="violations" name="Violations Peak" stroke="#ef4444" fillOpacity={1} fill="url(#colorViolations)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Explanatory notes box */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex gap-4 items-start bg-blue-950/10 border-blue-500/10 text-slate-300">
        <Info className="shrink-0 text-blue-400 mt-0.5" size={20} />
        <div className="flex flex-col gap-1 text-sm">
          <strong className="text-white">Understanding Congestion Metrics</strong>
          <p className="text-xs text-slate-400">
            Our AI engine computes speed drops on the carriageway by comparing real-time optical velocity against standard free-flow parameters. When vehicles park illegally on standard carriageways, they reduce lane capacity, inducing bottlenecks that lead to rapid, non-linear drops in vehicle velocity index and corresponding congestion peaks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
