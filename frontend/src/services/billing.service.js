import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function getBillingStatus() {
  requireContractEndpoint("billing", "status");
  const response = await api.get("/billing/status");
  return response.data?.data ?? response.data;
}

export async function createBillingCheckoutSession(payload) {
  requireContractEndpoint("billing", "checkoutSession");
  const response = await api.post("/billing/checkout-session", payload);
  return response.data?.data ?? response.data;
}

export async function createBillingPortalSession(payload) {
  requireContractEndpoint("billing", "portalSession");
  const response = await api.post("/billing/portal-session", payload);
  return response.data?.data ?? response.data;
}
