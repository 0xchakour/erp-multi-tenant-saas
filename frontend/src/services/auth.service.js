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
