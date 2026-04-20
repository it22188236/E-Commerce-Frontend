import axios from "axios";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const stripTrailingSlash = (url = "") => url.replace(/\/+$/, "");

const withApiPrefix = (url = "") => {
  const normalized = stripTrailingSlash(url);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const normalizeEndpoint = (endpoint = "") => {
  if (!endpoint) return "";
  const withLeadingSlash = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return withLeadingSlash.startsWith("/api/")
    ? withLeadingSlash.replace("/api", "")
    : withLeadingSlash;
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
const productClient = apiClient;
const orderClient = apiClient;
const paymentClient = apiClient;

export default apiClient;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const unwrap = (response) => response?.data?.data ?? response?.data;

// ---------------------------------------------------------------------------
// PRODUCTS  –  product-service:5002  →  /api/products/*
// ---------------------------------------------------------------------------
const PRODUCTS_ENDPOINT = normalizeEndpoint(
  import.meta.env.VITE_PRODUCTS_ENDPOINT || "/products",
);

const normalizeProduct = (product) => {
  if (!product) return product;
  const primaryImage =
    product.image ??
    product.imageUrl ??
    product.thumbnail ??
    (Array.isArray(product.images) ? product.images[0]?.url : "") ??
    "";
  return {
    ...product,
    id: product.id ?? product._id ?? product.productId,
    name: product.name ?? product.title ?? "",
    category: product.category ?? "Uncategorized",
    description: product.description ?? "",
    image: primaryImage,
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? product.quantity ?? 0),
  };
};

const normalizeProductList = (payload) =>
  Array.isArray(payload) ? payload.map(normalizeProduct) : [];

const buildProductPayload = (d) => ({
  name: d.name?.trim(),
  category: d.category?.trim().toLowerCase(),
  description: d.description?.trim(),
  images: d.image
    ? [{ url: d.image, alt: d.name?.trim() || "Product image" }]
    : [],
  price: Number(d.price ?? 0),
  stock: Number(d.stock ?? 0),
});

export const productService = {
  /** GET /api/products  (public) */
  getProducts: async () => {
    const response = await productClient.request({
      method: "get",
      url: PRODUCTS_ENDPOINT,
    });
    return { data: normalizeProductList(unwrap(response)) };
  },

  /** GET /api/products/:id  (public) */
  getProductById: async (id) => {
    const response = await productClient.request({
      method: "get",
      url: `${PRODUCTS_ENDPOINT}/${id}`,
    });
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** POST /api/products  (admin) */
  createProduct: async (productData) => {
    const response = await productClient.request({
      method: "post",
      url: PRODUCTS_ENDPOINT,
      data: buildProductPayload(productData),
    });
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** PUT /api/products/:id  (admin) */
  updateProduct: async (id, productData) => {
    const response = await productClient.request({
      method: "put",
      url: `${PRODUCTS_ENDPOINT}/${id}`,
      data: buildProductPayload(productData),
    });
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** DELETE /api/products/:id  (admin) */
  deleteProduct: async (id) => {
    const response = await productClient.request({
      method: "delete",
      url: `${PRODUCTS_ENDPOINT}/${id}`,
    });
    return { data: unwrap(response) ?? { id } };
  },
};

// ---------------------------------------------------------------------------
// ORDERS  –  order-service:5003  →  /api/orders/*
// ---------------------------------------------------------------------------
const ORDERS_ENDPOINT = "/orders";

const toTitleCase = (v = "") =>
  v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v;

const normalizeOrder = (order) => ({
  id: order?._id ?? order?.id ?? order?.orderNumber,
  date: order?.createdAt ?? order?.date ?? new Date().toISOString(),
  total: Number(order?.totalAmount ?? order?.total ?? 0),
  status: toTitleCase(order?.orderStatus ?? order?.status ?? "pending"),
  user: {
    userId: order?.user?.userId ?? order?.userId ?? null,
    name: order?.user?.name ?? order?.customerName ?? "Unknown User",
    email: order?.user?.email ?? order?.customerEmail ?? "",
  },
  items: Array.isArray(order?.items)
    ? order.items.map((item) => ({
        name: item?.productName ?? item?.name ?? "Item",
        quantity: Number(item?.quantity ?? 1),
        price: Number(item?.price ?? 0),
      }))
    : [],
});

const normalizeOrders = (payload) =>
  Array.isArray(payload) ? payload.map(normalizeOrder) : [];

const buildOrderPayload = (orderData) => ({
  items: Array.isArray(orderData?.items)
    ? orderData.items.map((item) => ({
        productId: item.productId ?? item.id,
        quantity: Number(item.quantity ?? 1),
      }))
    : [],
  shippingAddress: {
    street: orderData?.shippingAddress?.street ?? "",
    city: orderData?.shippingAddress?.city ?? "",
    state: orderData?.shippingAddress?.state ?? "N/A",
    zipCode: orderData?.shippingAddress?.zipCode ?? "",
    country: orderData?.shippingAddress?.country ?? "N/A",
  },
  paymentMethod: orderData?.paymentMethod ?? "card",
  customer: {
    firstName: orderData?.customer?.firstName ?? "",
    lastName: orderData?.customer?.lastName ?? "",
    email: orderData?.customer?.email ?? "",
    phone: orderData?.customer?.phone ?? "",
    address: orderData?.customer?.address ?? "",
    city: orderData?.customer?.city ?? "",
    country: orderData?.customer?.country ?? "Sri Lanka",
  },
});

export const orderService = {
  /** GET /api/orders  (user sees own; admin sees all) */
  getOrders: async () => {
    const response = await orderClient.request({
      method: "get",
      url: ORDERS_ENDPOINT,
    });
    return { data: normalizeOrders(response?.data?.data) };
  },

  /** GET /api/orders/:id  (auth) */
  getOrderById: async (orderId) => {
    const response = await orderClient.request({
      method: "get",
      url: `${ORDERS_ENDPOINT}/${orderId}`,
    });
    return { data: normalizeOrder(response?.data?.data) };
  },

  /** POST /api/orders  (auth) */
  createOrder: async (orderData) => {
    const response = await orderClient.request({
      method: "post",
      url: ORDERS_ENDPOINT,
      data: buildOrderPayload(orderData),
    });
    const created = response?.data?.data?.order ?? response?.data?.data;
    const payment =
      response?.data?.data?.payment?.data ?? response?.data?.data?.payment;
    return {
      data: {
        order: normalizeOrder(created),
        payment,
      },
    };
  },

  /** PUT /api/orders/:id  (admin) */
  updateOrderStatus: async (orderId, status) => {
    const response = await orderClient.request({
      method: "put",
      url: `${ORDERS_ENDPOINT}/${orderId}`,
      data: {
        orderStatus: status.toLowerCase(),
      },
    });
    const updated = response?.data?.data?.order ?? response?.data?.data;
    return { data: normalizeOrder(updated) };
  },
};

// ---------------------------------------------------------------------------
// PAYMENTS  –  payment-service:5004  →  /api/payments/*
// ---------------------------------------------------------------------------
const PAYMENTS_ENDPOINT = "/payments";

export const paymentService = {
  /** POST /api/payments/process  (auth) */
  processPayment: async (payload) => {
    const response = await paymentClient.request({
      method: "post",
      url: `${PAYMENTS_ENDPOINT}/process`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  getPayPalConfig: async () => {
    const response = await paymentClient.request({
      method: "get",
      url: `${PAYMENTS_ENDPOINT}/paypal/config`,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  createPayPalOrder: async (payload) => {
    const response = await paymentClient.request({
      method: "post",
      url: `${PAYMENTS_ENDPOINT}/orders`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  capturePayPalOrder: async (orderId, payload) => {
    const response = await paymentClient.request({
      method: "post",
      url: `${PAYMENTS_ENDPOINT}/orders/${orderId}/capture`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  /** GET /api/payments/:paymentId  (auth) */
  getPaymentDetails: async (paymentId) => {
    const response = await paymentClient.request({
      method: "get",
      url: `${PAYMENTS_ENDPOINT}/${paymentId}`,
    });
    return { data: response?.data?.data ?? response?.data };
  },
};

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
