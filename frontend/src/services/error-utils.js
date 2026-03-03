import { ContractUnavailableError } from "./backend-contract";

export function normalizeApiError(error) {
  if (error instanceof ContractUnavailableError) {
    return {
      status: 0,
      message: error.reason,
      validationErrors: {},
      code: error.code,
    };
  }

  const status = error?.response?.status ?? 0;
  const data = error?.response?.data ?? {};

  return {
    status,
    message: data.message ?? error?.message ?? "Request failed.",
    validationErrors: data.errors ?? {},
    code: data.code ?? null,
  };
}

export function firstFieldError(validationErrors, field) {
  const fieldErrors = validationErrors?.[field];

  if (!fieldErrors || fieldErrors.length === 0) {
    return "";
  }

  return fieldErrors[0];
}
