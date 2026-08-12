import { apiFetch } from "./client";

export interface AuthResponse {
  token: string;
  username: string;
}

export function register(username: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
