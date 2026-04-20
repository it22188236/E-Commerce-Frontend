import axios from "axios";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const stripTrailingSlash = (url = "") => url.replace(/\/+$/, "");

const withApiPrefix = (url = "") => {
  const normalized = stripTrailingSlash(url);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const GATEWAY_BASE_URL = withApiPrefix(import.meta.env.VITE_API_BASE_URL || "");
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

const enrichError = (error) => {
  const status = error?.response?.status;
  const timeoutDetected =
    error?.code === "ECONNABORTED" ||
    /timeout/i.test(error?.message ?? "") ||
    /max redirects exceeded/i.test(error?.message ?? "");

  const isUnauthorized = status === 401;
  const isServiceUnavailable = status === 503;
  const isGatewayTimeout = status === 504 || timeoutDetected;

  let userMessage = "Unexpected error. Please try again.";
  if (isUnauthorized) {
    userMessage = "Your session expired. Please log in again.";
  } else if (isServiceUnavailable) {
    userMessage =
      "Service is temporarily unavailable. Please try again shortly.";
  } else if (isGatewayTimeout) {
    userMessage = "Request timed out at API gateway. Please try again.";
  } else if (!status) {
    userMessage =
      "Unable to reach API gateway. Check your connection and retry.";
  }

  return Object.assign(error, {
    statusCode: status ?? 0,
    isUnauthorized,
    isServiceUnavailable,
    isGatewayTimeout,
    isTimeout: timeoutDetected,
    userMessage,
  });
};

const attachInterceptors = (client) => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const enriched = enrichError(error);

      if (enriched.isUnauthorized) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-error"));
      }

      if (enriched.isServiceUnavailable || enriched.isGatewayTimeout) {
        window.dispatchEvent(new Event("api-unavailable"));
      }

      return Promise.reject(enriched);
    },
  );
};

const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: API_TIMEOUT_MS,
    headers: { "Content-Type": "application/json" },
  });
  attachInterceptors(client);
  return client;
};

const apiClient = createApiClient(GATEWAY_BASE_URL);
const paymentClient = apiClient;

export default apiClient;

// ---------------------------------------------------------------------------
// NOTIFICATIONS  –  payment-service:5004  →  /api/notifications/*
// ---------------------------------------------------------------------------
const NOTIFICATIONS_ENDPOINT = "/notifications";

const normalizeNotification = (n) => ({
  id: n?._id ?? n?.id,
  type: n?.type ?? "",
  subject: n?.subject ?? "",
  status: n?.status ?? "sent",
  sentAt: n?.sentAt ?? n?.createdAt ?? new Date().toISOString(),
});

export const notificationService = {
  /** GET /api/notifications  (auth) */
  getUserNotifications: async () => {
    const response = await paymentClient.request({
      method: "get",
      url: NOTIFICATIONS_ENDPOINT,
    });
    const data = response?.data?.data;
    return { data: Array.isArray(data) ? data.map(normalizeNotification) : [] };
  },

  /** POST /api/notifications/send  (auth) */
  sendNotification: async (payload) => {
    const response = await paymentClient.request({
      method: "post",
      url: `${NOTIFICATIONS_ENDPOINT}/send`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },
};
