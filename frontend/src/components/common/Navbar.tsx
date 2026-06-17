import React from "react";
import { Menu, Wifi, WifiOff, Car, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  wsConnected: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen, wsConnected }) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-850 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {user && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Car size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              GRID<span className="text-blue-500 font-extrabold">LOCK</span>
              <span className="text-[10px] uppercase font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                Intelligence
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status display */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>API Online</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            <span>Live Feed: {wsConnected ? "Active" : "Disconnected"}</span>
          </div>
        </div>

        {user && (
          <div className="h-8 w-[1px] bg-slate-800"></div>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm">
              {user.full_name.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs text-slate-400 leading-3">{user.role}</span>
              <span className="text-sm font-semibold text-slate-200 leading-normal">{user.full_name}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
