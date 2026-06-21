import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldAlert, 
  User as UserIcon, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Play,
  Zap,
  Search
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
  role: string;
  status: string;
}

interface Violation {
  id: string;
  latitude: number;
  longitude: number;
  vehicle_type: string;
  license_plate: string;
  status: string;
  detection_start: string;
}

interface EnforcementAction {
  id: string;
  violation_id: string;
  officer_id: string;
  action_type: string;
  dispatched_at: string;
  resolved_at: string | null;
  status: string;
  notes: string;
  violation?: Violation;
  officer?: User;
}

const Enforcement: React.FC = () => {
  const { user } = useAuth();
  
  const [actions, setActions] = useState<EnforcementAction[]>([]);
  const [activeViolations, setActiveViolations] = useState<Violation[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dispatchViolationId, setDispatchViolationId] = useState("");
  const [dispatchOfficerId, setDispatchOfficerId] = useState("");
  const [dispatchActionType, setDispatchActionType] = useState("warning");
  const [dispatchNotes, setDispatchNotes] = useState("");

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "dispatched" | "resolved">("all");

  const loadData = async () => {
    try {
      const actionsRes = await api.get("/enforcement");
      setActions(actionsRes.data);

      const violationsRes = await api.get("/violations?status=active");
      setActiveViolations(violationsRes.data);

      setOfficers([
        { id: "b3017cf7-6bc8-4f24-a212-32b0f4dc7cf3", full_name: "Officer Rajesh Kumar", role: "officer", status: "on_duty" },
        { id: "b3017cf7-6bc8-4f24-a212-32b0f4dc7cf4", full_name: "Officer Amit Singh", role: "officer", status: "on_duty" }
      ]);
    } catch (e) {
      console.error("Failed to load enforcement logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchViolationId || !dispatchOfficerId) return;

    try {
      const payload = {
        violation_id: dispatchViolationId,
        officer_id: dispatchOfficerId,
        action_type: dispatchActionType,
        status: "dispatched",
        notes: dispatchNotes
      };
      
      await api.post("/enforcement", payload);
      
      // Update violation status to 'cited'
      await api.put(`/violations/${dispatchViolationId}`, { status: "cited" });
      
      // Reset form & reload
      setDispatchViolationId("");
      setDispatchOfficerId("");
      setDispatchNotes("");
      loadData();
    } catch (err) {
      console.error("Failed to dispatch officer:", err);
    }
  };

  const handleResolve = async (actionId: string, status: "resolved" | "ignored", notes: string) => {
    try {
      // 1. Resolve dispatch action
      await api.put(`/enforcement/${actionId}`, {
        status,
        notes: notes || "Resolved on scene."
      });
      
      // 2. Clear violation
      const actionObj = actions.find(a => a.id === actionId);
      if (actionObj && actionObj.violation_id) {
        await api.put(`/violations/${actionObj.violation_id}`, {
          status: "cleared",
          detection_end: new Date().toISOString()
        });
      }
      
      loadData();
    } catch (err) {
      console.error("Failed to resolve action:", err);
    }
  };

  const applySmartDispatch = (v: Violation) => {
    setDispatchViolationId(v.id);
    setDispatchOfficerId(officers[0]?.id || "");
    const recommendedAction = v.vehicle_type === "bus" || v.vehicle_type === "truck" ? "towing" : "ticket";
    setDispatchActionType(recommendedAction);
    setDispatchNotes(`AI Recommended Auto-Deploy: Obstruction by ${v.vehicle_type} (${v.license_plate}) causing significant bottleneck. Clear immediately.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // AI recommends ranking violations by obstruction level (bus/truck first)
  const sortedRecommendations = [...activeViolations].sort((a, b) => {
    const scoreA = a.vehicle_type === "bus" ? 9.5 : a.vehicle_type === "truck" ? 8.8 : 6.5;
    const scoreB = b.vehicle_type === "bus" ? 9.5 : b.vehicle_type === "truck" ? 8.8 : 6.5;
    return scoreB - scoreA;
  });

  // Filter actions based on status select and search input
  const filteredActions = actions.filter((act) => {
    const matchesSearch = 
      (act.officer?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.violation?.license_plate || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === "all" || act.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-850 tracking-tight">Smart Patrol Dispatch Console</h1>
          <p className="text-sm text-slate-500">Enable targeted enforcement, deployment tracking, and lane blockage clearances.</p>
        </div>
      </div>

      {/* AI Smart Dispatch Recommendation Card */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm border border-slate-200 bg-white">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Zap size={18} className="text-blue-600 animate-bounce" />
          AI Prioritized Enforcement Targets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {sortedRecommendations.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-full py-4 text-center">No active priority recommendations at this time.</p>
          ) : (
            sortedRecommendations.slice(0, 3).map((v) => {
              const priorityScore = v.vehicle_type === "bus" ? 9.5 : v.vehicle_type === "truck" ? 8.8 : 6.5;
              const actionRec = v.vehicle_type === "bus" || v.vehicle_type === "truck" ? "Towing Required" : "Issue Ticket";
              return (
                <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-xs font-extrabold text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    Score: {priorityScore}/10
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TARGET</span>
                    <strong className="text-sm text-slate-850 uppercase">{v.license_plate}</strong>
                    <span className="text-[11px] text-slate-500 block capitalize">Type: {v.vehicle_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">RECOMMENDED ENFORCEMENT</span>
                    <strong className="text-xs text-red-650 font-bold">{actionRec}</strong>
                  </div>
                  <button
                    onClick={() => applySmartDispatch(v)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    Auto-Fill Dispatch Details
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Officer Dispatch Form (Only for Operators and Admins) */}
        {user && user.role !== "officer" && (
          <div className="glass-panel rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 bg-white shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Play size={18} className="text-blue-600" />
              Deploy Patrol Unit
            </h2>

            <form onSubmit={handleDispatch} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Violation</label>
                <select
                  required
                  value={dispatchViolationId}
                  onChange={(e) => setDispatchViolationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-50 text-slate-500">Select target vehicle...</option>
                  {activeViolations.map((v) => (
                    <option key={v.id} value={v.id} className="text-slate-700">
                      {v.license_plate} ({v.vehicle_type}) - Location: {v.latitude.toFixed(4)},{v.longitude.toFixed(4)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Assign Officer</label>
                <select
                  required
                  value={dispatchOfficerId}
                  onChange={(e) => setDispatchOfficerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-50 text-slate-500">Select officer...</option>
                  {officers.map((off, index) => {
                    const distanceLabel = index === 0 ? "Proximity: 150m" : "Proximity: 420m";
                    return (
                      <option key={off.id} value={off.id} className="text-slate-700">
                        {off.full_name} ({distanceLabel})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Enforcement Action</label>
                <select
                  value={dispatchActionType}
                  onChange={(e) => setDispatchActionType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="warning" className="text-slate-700">Warning</option>
                  <option value="ticket" className="text-slate-700">Issue Ticket / Fine</option>
                  <option value="towing" className="text-slate-700">Towing Request</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Dispatch Instructions</label>
                <textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Enter dispatch notes, specific street coordinates guidance..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={activeViolations.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                Send Patrol Unit
              </button>
            </form>
          </div>
        )}

        {/* Live Dispatch Records */}
        <div className={`${user && user.role !== "officer" ? "lg:col-span-2" : "lg:col-span-3"} glass-panel rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 bg-white shadow-sm`}>
          <h2 className="text-lg font-bold text-slate-850 border-b border-slate-100 pb-1 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" />
            Active Patrol Dispatches
          </h2>

          {/* Interactive Search and Filter controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">
            <div className="flex gap-1 p-0.5 bg-slate-200/50 rounded-lg">
              {(["all", "dispatched", "resolved"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition cursor-pointer ${
                    statusFilter === status 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search plate or patrol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px]">
            {filteredActions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No matching dispatch logs currently registered.
              </div>
            ) : (
              filteredActions.map((act) => (
                <div 
                  key={act.id} 
                  className={`p-4 rounded-xl border ${
                    act.status === "resolved" 
                      ? "border-emerald-200 bg-emerald-50/20" 
                      : "border-slate-150 bg-slate-50"
                  } flex flex-col gap-3 transition`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        act.status === "resolved" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                        act.status === "dispatched" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                        "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}>
                        {act.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Action: <strong className="text-slate-750 capitalize">{act.action_type}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Dispatched: {new Date(act.dispatched_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5 text-slate-500">
                      <span className="flex items-center gap-1"><UserIcon size={13} /> Patrol: <strong className="text-slate-800">{act.officer?.full_name || "Unassigned"}</strong></span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> Coordinates: <strong className="text-slate-800">{act.violation?.latitude?.toFixed(4)}, {act.violation?.longitude?.toFixed(4)}</strong></span>
                    </div>
                    <div className="flex flex-col gap-1 text-slate-500">
                      <span className="flex items-center gap-1"><FileText size={13} /> License: <strong className="text-slate-800 uppercase">{act.violation?.license_plate || "N/A"}</strong></span>
                      <span className="truncate">Notes: {act.notes || "None"}</span>
                    </div>
                  </div>

                  {/* Complete buttons (Only for assigned officer or admins to resolve dispatches on screen) */}
                  {act.status !== "resolved" && (
                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                      <button
                        onClick={() => handleResolve(act.id, "ignored", "False alarm. Area is clear.")}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Ignore / Area Clear
                      </button>
                      <button
                        onClick={() => handleResolve(act.id, "resolved", `Successfully completed ${act.action_type}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        <CheckCircle2 size={13} />
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enforcement;
