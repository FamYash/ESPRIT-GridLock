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
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-300 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm ${
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
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {isOpen && <span>{link.label}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-2 border-t border-slate-100 flex flex-col gap-3">
        {isOpen && user && (
          <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{user.role}</span>
            <span className="text-sm font-semibold truncate text-slate-700">{user.full_name}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
        >
          <LogOut size={20} className="shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
