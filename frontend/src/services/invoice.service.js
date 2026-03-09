import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

export async function createInvoice(payload) {
  requireContractEndpoint("invoices", "create");
  const response = await api.post("/invoices", payload);
  return response.data?.data ?? response.data;
}

export async function listInvoices() {
  requireContractEndpoint("invoices", "list");
  const response = await api.get("/invoices");
  return response.data?.data ?? response.data ?? [];
}

export async function getInvoiceById(invoiceId) {
  requireContractEndpoint("invoices", "details");
  const response = await api.get(`/invoices/${invoiceId}`);
  return response.data?.data ?? response.data;
}

export async function deleteInvoice(invoiceId) {
  requireContractEndpoint("invoices", "destroy");
  await api.delete(`/invoices/${invoiceId}`);
}

export async function updateInvoiceStatus(invoiceId, payload) {
  requireContractEndpoint("invoices", "status");
  const body = typeof payload === "string" ? { status: payload } : payload;
  const response = await api.patch(`/invoices/${invoiceId}/status`, body);
  return response.data?.data ?? response.data;
}

export async function createInvoicePayment(invoiceId, payload) {
  requireContractEndpoint("invoices", "paymentsCreate");
  const response = await api.post(`/invoices/${invoiceId}/payments`, payload);
  return response.data;
}

export async function deleteInvoicePayment(invoiceId, paymentId) {
  requireContractEndpoint("invoices", "paymentsDelete");
  const response = await api.delete(`/invoices/${invoiceId}/payments/${paymentId}`);
  return response.data?.data ?? response.data;
}

export async function downloadInvoicePdf(invoiceId) {
  requireContractEndpoint("invoices", "pdf");
  const response = await api.get(`/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  });
  return response.data;
}
