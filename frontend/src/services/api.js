import axios from "axios";
import { apiEvents } from "./api-events";
import { clearToken, getToken } from "./session.service";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const subscriptionPatterns = [
  /subscription/i,
  /trial/i,
  /limit reached/i,
  /upgrade/i,
  /past[_\s-]?due/i,
  /inactive/i,
];

function isSubscriptionMessage(message) {
  return subscriptionPatterns.some((pattern) => pattern.test(message));
}

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message ?? "";

    if (status === 401) {
      clearToken();
      apiEvents.emitUnauthorized();
    }

    if (status === 403 && isSubscriptionMessage(message)) {
      apiEvents.emitSubscriptionBlocked({ message });
    }

    return Promise.reject(error);
  }
);

export default api;
