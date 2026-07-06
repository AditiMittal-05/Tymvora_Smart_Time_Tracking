import api from "./api";

export const dashboardService = {
  employee: async () => {
    const res = await api.get("/dashboard/employee");
    return res.data;
  },

  superAdmin: async () => {
    const res = await api.get("/dashboard/super-admin");
    return res.data;
  },

  approver: async () => {
    const res = await api.get("/dashboard/approver");
    return res.data;
  },
};
