import api from "./api";

export const authService = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  refresh: async (refreshToken) => {
    const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return res.data;
  },

  me: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  forgotPassword: async (email) => {
    await api.post("/auth/forgot-password", { email });
  },

  verifyOtp: async (email, otp, new_password) => {
    await api.post("/auth/verify-otp", { email, otp, new_password });
  },

  resetPassword: async (token, new_password) => {
    await api.post("/auth/reset-password", { token, new_password });
  },

  changePassword: async (old_password, new_password) => {
    await api.post("/auth/change-password", { old_password, new_password });
  },
};
