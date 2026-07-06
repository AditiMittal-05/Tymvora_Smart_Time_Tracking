import api from "./api";

export const departmentService = {
  list: async (params = {}) => {
    const res = await api.get("/departments", { params });
    return res.data;
  },

  allActive: async () => {
    const res = await api.get("/departments/all-active");
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/departments", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },

  deactivate: async (id) => {
    await api.patch(`/departments/${id}/deactivate`);
  },

  activate: async (id) => {
    await api.patch(`/departments/${id}/activate`);
  },
};
