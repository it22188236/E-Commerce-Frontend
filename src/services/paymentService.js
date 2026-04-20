import apiClient from "../utils/apiClient";

const PAYMENTS_ENDPOINT = "/payments";

export const paymentService = {
  processPayment: async (payload) => {
    const response = await apiClient.request({
      method: "post",
      url: `${PAYMENTS_ENDPOINT}/process`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  getPayPalConfig: async () => {
    const response = await apiClient.request({
      method: "get",
      url: `${PAYMENTS_ENDPOINT}/paypal/config`,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  createPayPalOrder: async (payload) => {
    const response = await apiClient.request({
      method: "post",
      url: `${PAYMENTS_ENDPOINT}/orders`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  capturePayPalOrder: async (orderId, payload) => {
    const response = await apiClient.request({
      method: "post",
      url: `${PAYMENTS_ENDPOINT}/orders/${orderId}/capture`,
      data: payload,
    });
    return { data: response?.data?.data ?? response?.data };
  },

  getPaymentDetails: async (paymentId) => {
    const response = await apiClient.request({
      method: "get",
      url: `${PAYMENTS_ENDPOINT}/${paymentId}`,
    });
    return { data: response?.data?.data ?? response?.data };
  },
};
