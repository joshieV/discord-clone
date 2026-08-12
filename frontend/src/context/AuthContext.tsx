import { createContext, useContext, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";

interface AuthContextValue {
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));

  async function login(user: string, password: string) {
    const res = await authApi.login(user, password);
    setToken(res.token);
    localStorage.setItem("username", res.username);
    setUsername(res.username);
  }

  async function register(user: string, email: string, password: string) {
    const res = await authApi.register(user, email, password);
    setToken(res.token);
    localStorage.setItem("username", res.username);
    setUsername(res.username);
  }

  function logout() {
    clearToken();
    localStorage.removeItem("username");
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
