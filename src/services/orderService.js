import apiClient from "../utils/apiClient";

const ORDERS_ENDPOINT = "/api/orders";

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
  getOrders: async () => {
    const response = await apiClient.request({
      method: "get",
      url: ORDERS_ENDPOINT,
    });
    return { data: normalizeOrders(response?.data?.data) };
  },

  getOrderById: async (orderId) => {
    const response = await apiClient.request({
      method: "get",
      url: `${ORDERS_ENDPOINT}/${orderId}`,
    });
    return { data: normalizeOrder(response?.data?.data) };
  },

  createOrder: async (orderData) => {
    console.log("Creating Order with Data:", orderData);
    const response = await apiClient.request({
      method: "post",
      url: ORDERS_ENDPOINT,
      data: buildOrderPayload(orderData),
    });

    console.log("Create Order Response:", response);
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

  updateOrderStatus: async (orderId, status) => {
    const response = await apiClient.request({
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
