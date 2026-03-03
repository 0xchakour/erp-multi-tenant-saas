import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function listPublicPlans() {
  requireContractEndpoint("publicApi", "plans");
  const response = await api.get("/plans/public");
  return response.data?.data ?? response.data ?? [];
}
