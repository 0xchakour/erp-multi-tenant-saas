import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function listClients() {
  requireContractEndpoint("clients", "list");
  const response = await api.get("/clients");
  return response.data?.data ?? [];
}

export async function createClient(payload) {
  requireContractEndpoint("clients", "create");
  const response = await api.post("/clients", payload);
  return response.data;
}

export async function updateClient(clientId, payload) {
  requireContractEndpoint("clients", "update");
  const response = await api.put(`/clients/${clientId}`, payload);
  return response.data?.data ?? response.data;
}

export async function deleteClient(clientId) {
  requireContractEndpoint("clients", "destroy");
  await api.delete(`/clients/${clientId}`);
}
