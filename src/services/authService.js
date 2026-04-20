import apiClient from "../utils/apiClient";

const unwrap = (response) => response?.data?.data ?? response?.data;

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.request({
      method: "post",
      url: "/auth/login",
      data: credentials,
    });
    const payload = unwrap(response);
    return { data: { token: payload?.token, user: payload?.user } };
  },

  register: async (userData) => {
    const response = await apiClient.request({
      method: "post",
      url: "/auth/register",
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      },
    });
    const payload = unwrap(response);
    return { data: { token: payload?.token, user: payload?.user } };
  },

  getProfile: async () => {
    const response = await apiClient.request({
      method: "get",
      url: "/auth/profile",
    });
    const payload = unwrap(response);
    return { data: { user: payload?.user ?? payload } };
  },
};
