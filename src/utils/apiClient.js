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

const GATEWAY_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const resolveServiceBaseUrl = (serviceUrl) =>
  serviceUrl ? withApiPrefix(serviceUrl) : GATEWAY_BASE_URL;

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
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-error"));
      }
      return Promise.reject(error);
    },
  );
};

const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });
  attachInterceptors(client);
  return client;
};

const apiClient = createApiClient(GATEWAY_BASE_URL);
const authClient = createApiClient(
  resolveServiceBaseUrl(import.meta.env.VITE_AUTH_SERVICE_URL),
);
const productClient = createApiClient(
  resolveServiceBaseUrl(import.meta.env.VITE_PRODUCT_SERVICE_URL),
);
const orderClient = createApiClient(
  resolveServiceBaseUrl(import.meta.env.VITE_ORDER_SERVICE_URL),
);
const paymentClient = createApiClient(
  resolveServiceBaseUrl(import.meta.env.VITE_PAYMENT_SERVICE_URL),
);

export default apiClient;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const unwrap = (response) => response?.data?.data ?? response?.data;

// ---------------------------------------------------------------------------
// AUTH  –  auth-service:5001  →  /api/auth/*
// ---------------------------------------------------------------------------
export const authService = {
  /** POST /api/auth/login */
  login: async (credentials) => {
    const response = await authClient.post("/auth/login", credentials);
    const payload = unwrap(response);
    return { data: { token: payload?.token, user: payload?.user } };
  },

  /** POST /api/auth/register */
  register: async (userData) => {
    const response = await authClient.post("/auth/register", {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    const payload = unwrap(response);
    return { data: { token: payload?.token, user: payload?.user } };
  },

  /** GET /api/auth/profile  (requires auth token) */
  getProfile: async () => {
    const response = await authClient.get("/auth/profile");
    const payload = unwrap(response);
    return { data: { user: payload?.user ?? payload } };
  },
};

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
    const response = await productClient.get(PRODUCTS_ENDPOINT);
    return { data: normalizeProductList(unwrap(response)) };
  },

  /** GET /api/products/:id  (public) */
  getProductById: async (id) => {
    const response = await productClient.get(`${PRODUCTS_ENDPOINT}/${id}`);
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** POST /api/products  (admin) */
  createProduct: async (productData) => {
    const response = await productClient.post(
      PRODUCTS_ENDPOINT,
      buildProductPayload(productData),
    );
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** PUT /api/products/:id  (admin) */
  updateProduct: async (id, productData) => {
    const response = await productClient.put(
      `${PRODUCTS_ENDPOINT}/${id}`,
      buildProductPayload(productData),
    );
    return { data: normalizeProduct(unwrap(response)) };
  },

  /** DELETE /api/products/:id  (admin) */
  deleteProduct: async (id) => {
    const response = await productClient.delete(`${PRODUCTS_ENDPOINT}/${id}`);
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
    const response = await orderClient.get(ORDERS_ENDPOINT);
    return { data: normalizeOrders(response?.data?.data) };
  },

  /** GET /api/orders/:id  (auth) */
  getOrderById: async (orderId) => {
    const response = await orderClient.get(`${ORDERS_ENDPOINT}/${orderId}`);
    return { data: normalizeOrder(response?.data?.data) };
  },

  /** POST /api/orders  (auth) */
  createOrder: async (orderData) => {
    const response = await orderClient.post(
      ORDERS_ENDPOINT,
      buildOrderPayload(orderData),
    );
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
    const response = await orderClient.put(`${ORDERS_ENDPOINT}/${orderId}`, {
      orderStatus: status.toLowerCase(),
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
    const response = await paymentClient.post(
      `${PAYMENTS_ENDPOINT}/process`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  getPayPalConfig: async () => {
    const response = await paymentClient.get(
      `${PAYMENTS_ENDPOINT}/paypal/config`,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  createPayPalOrder: async (payload) => {
    const response = await paymentClient.post(
      `${PAYMENTS_ENDPOINT}/orders`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  capturePayPalOrder: async (orderId, payload) => {
    const response = await paymentClient.post(
      `${PAYMENTS_ENDPOINT}/orders/${orderId}/capture`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },

  /** GET /api/payments/:paymentId  (auth) */
  getPaymentDetails: async (paymentId) => {
    const response = await paymentClient.get(
      `${PAYMENTS_ENDPOINT}/${paymentId}`,
    );
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
    const response = await paymentClient.get(NOTIFICATIONS_ENDPOINT);
    const data = response?.data?.data;
    return { data: Array.isArray(data) ? data.map(normalizeNotification) : [] };
  },

  /** POST /api/notifications/send  (auth) */
  sendNotification: async (payload) => {
    const response = await paymentClient.post(
      `${NOTIFICATIONS_ENDPOINT}/send`,
      payload,
    );
    return { data: response?.data?.data ?? response?.data };
  },
};
