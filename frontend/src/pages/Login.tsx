import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Car, Lock, Mail, AlertTriangle, ArrowRight } from "lucide-react";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        "Failed to authenticate. Please check your credentials and ensure PostgreSQL/FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-screen w-full flex items-center justify-center bg-[#0b0f19] px-4 relative overflow-hidden pt-12 pb-12">
      {/* Visual background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 mb-4">
            <Car size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            GRID<span className="text-blue-500">LOCK</span>
          </h1>
          <p className="text-slate-400 text-sm">
            AI-Driven Parking Intelligence & Traffic Enforcement Platform
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-900/25 border border-red-500/30 text-red-300 text-xs flex gap-2 items-start">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="operator@gridlock.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/40"
            >
              {loading ? "Authenticating..." : "Access Control Center"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            For testing: <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 text-slate-400">operator@gridlock.io</code> / <code className="bg-slate-900 px-1 py-0.5 rounded border border-slate-800 text-slate-400">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
