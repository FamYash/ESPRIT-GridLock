import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  LogOut,
  Car
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "operator", "officer"] },
    { to: "/map", label: "Live Heatmap", icon: MapIcon, roles: ["admin", "operator", "officer"] },
    { to: "/analytics", label: "Congestion Impact", icon: BarChart3, roles: ["admin", "operator"] },
    { to: "/enforcement", label: "Enforcement Log", icon: ShieldAlert, roles: ["admin", "operator", "officer"] },
    { to: "/settings", label: "Configuration", icon: SettingsIcon, roles: ["admin", "operator"] },
  ];

  const filteredLinks = links.filter(link => user && link.roles.includes(user.role));

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 glass-panel border-r border-slate-800 flex flex-col justify-between ${
      isOpen ? "w-64" : "w-16"
    }`}>
      <div className="flex flex-col gap-1 py-4 px-2 overflow-y-auto">
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-250 ${
                isActive
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {isOpen && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-2 border-t border-slate-850 flex flex-col gap-3">
        {isOpen && user && (
          <div className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{user.role}</span>
            <span className="text-sm font-medium truncate text-slate-200">{user.full_name}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut size={20} className="shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
