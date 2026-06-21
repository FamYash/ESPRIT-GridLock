import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import Analytics from "./pages/Analytics";
import Enforcement from "./pages/Enforcement";
import Settings from "./pages/Settings";

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

// Protected route element wrapper
const ProtectedLayout: React.FC<{ children: (wsViolations: Violation[]) => React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, token } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsViolations, setWsViolations] = useState<Violation[]>([]);

  // Open WebSocket connection for real-time violations updates
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Use WS protocol based on window location
    const wsUrl = "ws://localhost:8000/api/v1/violations/ws";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connection established.");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("[WebSocket] Event received:", payload);
        if (payload.event === "violation_detected" || payload.event === "violation_updated") {
          // Push to violations queue in state
          setWsViolations(prev => [payload.data, ...prev]);
        }
      } catch (err) {
        console.error("[WebSocket] Error parsing event data:", err);
      }
    };

    ws.onclose = () => {
      console.log("[WebSocket] Connection closed. Retrying in 5 seconds...");
      setWsConnected(false);
      // Retry connection after 5 seconds
      setTimeout(() => {
        // Trigger state refresh by mutating dummy value if needed
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated, token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} wsConnected={wsConnected} />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "pl-64" : "pl-16"}`}>
          {children(wsViolations)}
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedLayout>
            {(wsViolations) => <Dashboard wsViolations={wsViolations} />}
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/map" 
        element={
          <ProtectedLayout>
            {(wsViolations) => <MapView wsViolations={wsViolations} />}
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedLayout>
            {() => <Analytics />}
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/enforcement" 
        element={
          <ProtectedLayout>
            {() => <Enforcement />}
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedLayout>
            {() => <Settings />}
          </ProtectedLayout>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
