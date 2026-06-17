import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldAlert, 
  User as UserIcon, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Play
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

  const loadData = async () => {
    try {
      const actionsRes = await api.get("/enforcement");
      setActions(actionsRes.data);

      const violationsRes = await api.get("/violations?status=active");
      setActiveViolations(violationsRes.data);

      // In a real environment, we'd fetch users and filter officers.
      // We will seed mock officers in state if users endpoint is limited.
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
      
      const response = await api.post("/enforcement", payload);
      
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Enforcement Dispatch Logs</h1>
        <p className="text-sm text-slate-400">Deploy traffic officers, track citations, and monitor street clearing responses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Officer Dispatch Form (Only for Operators and Admins) */}
        {user && user.role !== "officer" && (
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              <Play size={18} className="text-blue-500" />
              Dispatch Patrol Unit
            </h2>

            <form onSubmit={handleDispatch} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Target Violation</label>
                <select
                  required
                  value={dispatchViolationId}
                  onChange={(e) => setDispatchViolationId(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select target vehicle...</option>
                  {activeViolations.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900 text-slate-200">
                      {v.license_plate} ({v.vehicle_type}) - Location: {v.latitude.toFixed(4)},{v.longitude.toFixed(4)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Assign Officer</label>
                <select
                  required
                  value={dispatchOfficerId}
                  onChange={(e) => setDispatchOfficerId(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">Select officer...</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id} className="bg-slate-900 text-slate-200">
                      {off.full_name} ({off.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Enforcement Action</label>
                <select
                  value={dispatchActionType}
                  onChange={(e) => setDispatchActionType(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="warning" className="bg-slate-900 text-slate-200">Warning</option>
                  <option value="ticket" className="bg-slate-900 text-slate-200">Issue Ticket / Fine</option>
                  <option value="towing" className="bg-slate-900 text-slate-200">Towing Request</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Dispatch Instructions</label>
                <textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Enter dispatch notes, specific street coordinates guidance..."
                  rows={3}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={activeViolations.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
              >
                Send Patrol Unit
              </button>
            </form>
          </div>
        )}

        {/* Live Dispatch Records */}
        <div className={`${user && user.role !== "officer" ? "lg:col-span-2" : "lg:col-span-3"} glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4`}>
          <h2 className="text-lg font-bold text-white border-b border-slate-850 pb-3 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-400" />
            Active Patrol Dispatches
          </h2>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px]">
            {actions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No dispatch logs currently registered.
              </div>
            ) : (
              actions.map((act) => (
                <div 
                  key={act.id} 
                  className={`p-4 rounded-xl bg-slate-950/40 border ${
                    act.status === "resolved" 
                      ? "border-emerald-500/20 bg-emerald-500/5" 
                      : "border-slate-850"
                  } flex flex-col gap-3 transition`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        act.status === "resolved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        act.status === "dispatched" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {act.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Action: <strong className="text-slate-200 capitalize">{act.action_type}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Dispatched: {new Date(act.dispatched_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5 text-slate-400">
                      <span className="flex items-center gap-1"><UserIcon size={13} /> Patrol: <strong className="text-slate-200">{act.officer?.full_name || "Unassigned"}</strong></span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> Coordinates: <strong className="text-slate-200">{act.violation?.latitude?.toFixed(4)}, {act.violation?.longitude?.toFixed(4)}</strong></span>
                    </div>
                    <div className="flex flex-col gap-1 text-slate-400">
                      <span className="flex items-center gap-1"><FileText size={13} /> License: <strong className="text-slate-200 uppercase">{act.violation?.license_plate || "N/A"}</strong></span>
                      <span className="truncate">Notes: {act.notes || "None"}</span>
                    </div>
                  </div>

                  {/* Complete buttons (Only for assigned officer or admins to resolve tickets on screen) */}
                  {act.status !== "resolved" && (
                    <div className="flex justify-end gap-2 border-t border-slate-900 pt-3">
                      <button
                        onClick={() => handleResolve(act.id, "ignored", "False alarm. Area is clear.")}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Ignore / Area Clear
                      </button>
                      <button
                        onClick={() => handleResolve(act.id, "resolved", `Successfully completed ${act.action_type}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
