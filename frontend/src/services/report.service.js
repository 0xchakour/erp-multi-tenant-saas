import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function getRevenueReport(params = {}) {
  requireContractEndpoint("reports", "revenue");
  const response = await api.get("/reports/revenue", { params });
  return response.data?.data ?? {};
}

export async function getAgingReport(params = {}) {
  requireContractEndpoint("reports", "aging");
  const response = await api.get("/reports/aging", { params });
  return response.data?.data ?? {};
}

export async function getTopClientsReport(params = {}) {
  requireContractEndpoint("reports", "topClients");
  const response = await api.get("/reports/top-clients", { params });
  return response.data?.data ?? {};
}
