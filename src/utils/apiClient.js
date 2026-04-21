// import axios from "axios";

// // ---------------------------------------------------------------------------
// // Axios instance
// // ---------------------------------------------------------------------------
// const stripTrailingSlash = (url = "") => url.replace(/\/+$/, "");

// const withApiPrefix = (url = "") => {
//   const normalized = stripTrailingSlash(url);
//   return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
// };

// const GATEWAY_BASE_URL = withApiPrefix(import.meta.env.VITE_API_BASE_URL || "");
// const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

// const enrichError = (error) => {
//   const status = error?.response?.status;
//   const timeoutDetected =
//     error?.code === "ECONNABORTED" ||
//     /timeout/i.test(error?.message ?? "") ||
//     /max redirects exceeded/i.test(error?.message ?? "");

//   const isUnauthorized = status === 401;
//   const isServiceUnavailable = status === 503;
//   const isGatewayTimeout = status === 504 || timeoutDetected;

//   let userMessage = "Unexpected error. Please try again.";
//   if (isUnauthorized) {
//     userMessage = "Your session expired. Please log in again.";
//   } else if (isServiceUnavailable) {
//     userMessage =
//       "Service is temporarily unavailable. Please try again shortly.";
//   } else if (isGatewayTimeout) {
//     userMessage = "Request timed out at API gateway. Please try again.";
//   } else if (!status) {
//     userMessage =
//       "Unable to reach API gateway. Check your connection and retry.";
//   }

//   return Object.assign(error, {
//     statusCode: status ?? 0,
//     isUnauthorized,
//     isServiceUnavailable,
//     isGatewayTimeout,
//     isTimeout: timeoutDetected,
//     userMessage,
//   });
// };

// const attachInterceptors = (client) => {
//   client.interceptors.request.use(
//     (config) => {
//       const token = localStorage.getItem("token");
//       if (token && config.headers) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error),
//   );

//   client.interceptors.response.use(
//     (response) => response,
//     (error) => {
//       const enriched = enrichError(error);

//       if (enriched.isUnauthorized) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         window.dispatchEvent(new Event("auth-error"));
//       }

//       if (enriched.isServiceUnavailable || enriched.isGatewayTimeout) {
//         window.dispatchEvent(new Event("api-unavailable"));
//       }

//       return Promise.reject(enriched);
//     },
//   );
// };

// const createApiClient = (baseURL) => {
//   const client = axios.create({
//     baseURL,
//     timeout: API_TIMEOUT_MS,
//     headers: { "Content-Type": "application/json" },
//   });
//   attachInterceptors(client);
//   return client;
// };

// const apiClient = createApiClient(GATEWAY_BASE_URL);
// const paymentClient = apiClient;

// export default apiClient;

// // ---------------------------------------------------------------------------
// // NOTIFICATIONS  –  payment-service:5004  →  /api/notifications/*
// // ---------------------------------------------------------------------------
// const NOTIFICATIONS_ENDPOINT = "/notifications";

// const normalizeNotification = (n) => ({
//   id: n?._id ?? n?.id,
//   type: n?.type ?? "",
//   subject: n?.subject ?? "",
//   status: n?.status ?? "sent",
//   sentAt: n?.sentAt ?? n?.createdAt ?? new Date().toISOString(),
// });

// export const notificationService = {
//   /** GET /api/notifications  (auth) */
//   getUserNotifications: async () => {
//     const response = await paymentClient.request({
//       method: "get",
//       url: NOTIFICATIONS_ENDPOINT,
//     });
//     const data = response?.data?.data;
//     return { data: Array.isArray(data) ? data.map(normalizeNotification) : [] };
//   },

//   /** POST /api/notifications/send  (auth) */
//   sendNotification: async (payload) => {
//     const response = await paymentClient.request({
//       method: "post",
//       url: `${NOTIFICATIONS_ENDPOINT}/send`,
//       data: payload,
//     });
//     return { data: response?.data?.data ?? response?.data };
//   },
// };

import axios from "axios";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const stripTrailingSlash = (url = "") => url.replace(/\/+$/, "");

const withApiPrefix = (url = "") => {
  const normalized = stripTrailingSlash(url);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const GATEWAY_BASE_URL = withApiPrefix(import.meta.env.VITE_API_BASE_URL || "");

const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

// ---------------------------------------------------------------------------
// ERROR HANDLING
// ---------------------------------------------------------------------------
const enrichError = (error) => {
  const status = error?.response?.status;

  const timeoutDetected =
    error?.code === "ECONNABORTED" || /timeout/i.test(error?.message ?? "");

  let userMessage = "Unexpected error. Please try again.";

  if (status === 401) {
    userMessage = "Session expired. Please login again.";
  } else if (status === 503) {
    userMessage = "Service unavailable. Try again later.";
  } else if (status === 504 || timeoutDetected) {
    userMessage = "Gateway timeout. Please retry.";
  } else if (!status) {
    userMessage = "Cannot reach server. Check your connection.";
  }

  return Object.assign(error, {
    statusCode: status ?? 0,
    isTimeout: timeoutDetected,
    userMessage,
  });
};

// ---------------------------------------------------------------------------
// AXIOS INSTANCE
// ---------------------------------------------------------------------------
const attachInterceptors = (client) => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      const enriched = enrichError(error);

      if (enriched.statusCode === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-error"));
      }

      if (enriched.statusCode === 503 || enriched.statusCode === 504) {
        window.dispatchEvent(new Event("api-unavailable"));
      }

      return Promise.reject(enriched);
    },
  );
};

const apiClient = axios.create({
  baseURL: GATEWAY_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

attachInterceptors(apiClient);

export default apiClient;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const unwrap = (res) => res?.data?.data ?? res?.data;

// ---------------------------------------------------------------------------
// AUTH SERVICE
// ---------------------------------------------------------------------------
export const authService = {
  login: async (credentials) => {
    const res = await apiClient.post("/auth/login", credentials);
    return { data: unwrap(res) };
  },

  register: async (data) => {
    const res = await apiClient.post("/auth/register", data);
    return { data: unwrap(res) };
  },

  getProfile: async () => {
    const res = await apiClient.get("/auth/profile");
    return { data: unwrap(res) };
  },
};

// ---------------------------------------------------------------------------
// PRODUCT SERVICE
// ---------------------------------------------------------------------------
export const productService = {
  getProducts: async () => {
    const res = await apiClient.get("/products");
    return { data: unwrap(res) };
  },

  getProductById: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return { data: unwrap(res) };
  },

  createProduct: async (data) => {
    const res = await apiClient.post("/products", data);
    return { data: unwrap(res) };
  },

  updateProduct: async (id, data) => {
    const res = await apiClient.put(`/products/${id}`, data);
    return { data: unwrap(res) };
  },

  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/products/${id}`);
    return { data: unwrap(res) };
  },
};

// ---------------------------------------------------------------------------
// ORDER SERVICE
// ---------------------------------------------------------------------------
export const orderService = {
  getOrders: async () => {
    const res = await apiClient.get("/orders");
    return { data: unwrap(res) };
  },

  getOrderById: async (id) => {
    const res = await apiClient.get(`/orders/${id}`);
    return { data: unwrap(res) };
  },

  createOrder: async (orderData) => {
    const res = await apiClient.post("/orders", orderData);
    const payload = unwrap(res);

    return {
      data: {
        order: payload?.order,
        payment: payload?.payment,
      },
    };
  },

  updateOrderStatus: async (id, status) => {
    const res = await apiClient.put(`/orders/${id}`, {
      orderStatus: status,
    });
    return { data: unwrap(res) };
  },
};

// ---------------------------------------------------------------------------
// PAYMENT SERVICE
// ---------------------------------------------------------------------------
export const paymentService = {
  processPayment: async (payload) => {
    const res = await apiClient.post("/payments/process", payload);
    return { data: unwrap(res) };
  },

  getPaymentDetails: async (paymentId) => {
    const res = await apiClient.get(`/payments/${paymentId}`);
    return { data: unwrap(res) };
  },
};

// ---------------------------------------------------------------------------
// NOTIFICATION SERVICE
// ---------------------------------------------------------------------------
export const notificationService = {
  getUserNotifications: async () => {
    const res = await apiClient.get("/notifications");
    return { data: unwrap(res) };
  },

  sendNotification: async (payload) => {
    const res = await apiClient.post("/notifications/send", payload);
    return { data: unwrap(res) };
  },
};
