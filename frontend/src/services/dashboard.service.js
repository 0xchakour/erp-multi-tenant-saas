import api from "./api";
import { requireContractEndpoint } from "./backend-contract";

const EMPTY_DASHBOARD = {
  metrics: {
    total_revenue: 0,
    monthly_revenue: 0,
    paid_invoices: 0,
    overdue_invoices: 0,
    sent_invoices: 0,
    partially_paid_invoices: 0,
    cancelled_invoices: 0,
    outstanding_amount: 0,
  },
  revenue_chart: [],
};

export async function getDashboardStats() {
  requireContractEndpoint("dashboard", "stats");
  const response = await api.get("/dashboard");
  return response.data?.data ?? EMPTY_DASHBOARD;
}
