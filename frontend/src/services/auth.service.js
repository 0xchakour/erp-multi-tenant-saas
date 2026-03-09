import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function login(payload) {
  requireContractEndpoint("auth", "login");
  const response = await api.post("/login", payload);
  return response.data;
}

export async function register(payload) {
  requireContractEndpoint("auth", "register");
  const response = await api.post("/register", payload);
  return response.data;
}

export async function forgotPassword(payload) {
  requireContractEndpoint("auth", "forgotPassword");
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
}

export async function verifyResetCode(payload) {
  requireContractEndpoint("auth", "verifyResetCode");
  const response = await api.post("/auth/verify-reset-code", payload);
  return response.data;
}

export async function resetPassword(payload) {
  requireContractEndpoint("auth", "resetPassword");
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
}

export async function getMe() {
  requireContractEndpoint("auth", "me");
  const response = await api.get("/me");
  return response.data;
}

export async function logout() {
  requireContractEndpoint("auth", "logout");
  const response = await api.post("/logout");
  return response.data;
}
