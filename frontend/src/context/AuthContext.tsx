import React, { createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin";
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const demoUser: User = {
  id: "1",
  email: "demo@gridlock.ai",
  full_name: "GridLock Demo User",
  role: "admin",
  status: "active",
};

const AuthContext = createContext<AuthContextType>({
  user: demoUser,
  token: "demo-token",
  loading: false,
  login: async () => {},
  logout: () => {},
  isAuthenticated: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AuthContext.Provider
      value={{
        user: demoUser,
        token: "demo-token",
        loading: false,
        login: async () => {},
        logout: () => {},
        isAuthenticated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);