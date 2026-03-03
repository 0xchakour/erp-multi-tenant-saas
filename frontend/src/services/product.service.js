import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function listProducts() {
  requireContractEndpoint("products", "list");
  const response = await api.get("/products");
  return response.data?.data ?? response.data ?? [];
}

export async function createProduct(payload) {
  requireContractEndpoint("products", "create");
  const response = await api.post("/products", payload);
  return response.data;
}

export async function getProductById(productId) {
  requireContractEndpoint("products", "details");
  const response = await api.get(`/products/${productId}`);
  return response.data?.data ?? response.data;
}

export async function updateProduct(productId, payload) {
  requireContractEndpoint("products", "update");
  const response = await api.put(`/products/${productId}`, payload);
  return response.data?.data ?? response.data;
}

export async function deleteProduct(productId) {
  requireContractEndpoint("products", "destroy");
  await api.delete(`/products/${productId}`);
}
