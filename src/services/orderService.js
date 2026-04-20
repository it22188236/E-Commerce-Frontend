import apiClient from "../utils/apiClient";

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

const buildOrderPayload = (orderData) => {
  const normalizedItems = Array.isArray(orderData?.items)
    ? orderData.items.map((item) => ({
        productId: item.productId ?? item.id,
        productName: item.productName ?? item.name ?? "",
        quantity: Number(item.quantity ?? 1),
        price: Number(item.price ?? 0),
        subtotal: Number(
          item.subtotal ?? Number(item.price ?? 0) * Number(item.quantity ?? 1),
        ),
      }))
    : [];

  const computedTotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.subtotal ?? 0),
    0,
  );

  return {
    user: {
      userId: orderData?.user?.userId ?? orderData?.user?.id ?? null,
      email: orderData?.user?.email ?? "",
      name: orderData?.user?.name ?? "",
    },
    items: normalizedItems,
    totalAmount: Number(orderData?.totalAmount ?? computedTotal),
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
      email: orderData?.customer?.email ?? orderData?.user?.email ?? "",
      phone: orderData?.customer?.phone ?? "",
    },
  };
};

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
    const response = await apiClient.request({
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
