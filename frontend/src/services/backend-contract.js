export const BACKEND_CONTRACT = Object.freeze({
  auth: {
    register: { method: "POST", path: "/register", available: true },
    login: { method: "POST", path: "/login", available: true },
    me: { method: "GET", path: "/me", available: true },
    logout: { method: "POST", path: "/logout", available: true },
  },
  publicApi: {
    plans: { method: "GET", path: "/plans/public", available: true },
  },
  dashboard: {
    stats: { method: "GET", path: "/dashboard", available: true },
  },
  billing: {
    status: { method: "GET", path: "/billing/status", available: true },
    plans: { method: "GET", path: "/billing/plans", available: true },
    events: { method: "GET", path: "/billing/events", available: true },
    checkoutSession: {
      method: "POST",
      path: "/billing/checkout-session",
      available: true,
    },
    portalSession: {
      method: "POST",
      path: "/billing/portal-session",
      available: true,
    },
  },
  subscriptionPlans: {
    list: { method: "GET", path: "/subscription-plans", available: true },
    details: { method: "GET", path: "/subscription-plans/{subscription_plan}", available: true },
    create: { method: "POST", path: "/subscription-plans", available: true },
    update: {
      method: "PUT|PATCH",
      path: "/subscription-plans/{subscription_plan}",
      available: true,
    },
    destroy: {
      method: "DELETE",
      path: "/subscription-plans/{subscription_plan}",
      available: true,
    },
  },
  reports: {
    revenue: { method: "GET", path: "/reports/revenue", available: true },
    aging: { method: "GET", path: "/reports/aging", available: true },
    topClients: { method: "GET", path: "/reports/top-clients", available: true },
  },
  clients: {
    list: { method: "GET", path: "/clients", available: true },
    create: { method: "POST", path: "/clients", available: true },
    details: { method: "GET", path: "/clients/{client}", available: true },
    update: { method: "PUT|PATCH", path: "/clients/{client}", available: true },
    destroy: { method: "DELETE", path: "/clients/{client}", available: true },
  },
  products: {
    list: {
      method: "GET",
      path: "/products",
      available: true,
    },
    create: {
      method: "POST",
      path: "/products",
      available: true,
    },
    details: { method: "GET", path: "/products/{product}", available: true },
    update: { method: "PUT|PATCH", path: "/products/{product}", available: true },
    destroy: { method: "DELETE", path: "/products/{product}", available: true },
  },
  invoices: {
    create: { method: "POST", path: "/invoices", available: true },
    list: {
      method: "GET",
      path: "/invoices",
      available: true,
    },
    details: {
      method: "GET",
      path: "/invoices/{invoice}",
      available: true,
    },
    pdf: {
      method: "GET",
      path: "/invoices/{invoice}/pdf",
      available: true,
    },
    update: { method: "PUT|PATCH", path: "/invoices/{invoice}", available: true },
    destroy: { method: "DELETE", path: "/invoices/{invoice}", available: true },
    status: { method: "PATCH", path: "/invoices/{invoice}/status", available: true },
    paymentsList: { method: "GET", path: "/invoices/{invoice}/payments", available: true },
    paymentsCreate: { method: "POST", path: "/invoices/{invoice}/payments", available: true },
    paymentsDelete: {
      method: "DELETE",
      path: "/invoices/{invoice}/payments/{payment}",
      available: true,
    },
  },
});

export class ContractUnavailableError extends Error {
  constructor(moduleName, operation, reason) {
    super(`Contract unavailable for ${moduleName}.${operation}: ${reason}`);
    this.name = "ContractUnavailableError";
    this.code = "CONTRACT_UNAVAILABLE";
    this.moduleName = moduleName;
    this.operation = operation;
    this.reason = reason;
  }
}

export function hasContractEndpoint(moduleName, operation) {
  return Boolean(BACKEND_CONTRACT[moduleName]?.[operation]?.available);
}

export function requireContractEndpoint(moduleName, operation) {
  const endpoint = BACKEND_CONTRACT[moduleName]?.[operation];

  if (!endpoint || !endpoint.available) {
    const reason = endpoint?.reason ?? "Endpoint is not declared in the extracted backend contract.";
    throw new ContractUnavailableError(moduleName, operation, reason);
  }

  return endpoint;
}
