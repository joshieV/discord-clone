import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isAuthenticated } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
