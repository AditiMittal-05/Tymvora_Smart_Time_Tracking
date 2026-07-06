import api from "./api";

export const designationService = {
  list: async (params = {}) => {
    const res = await api.get("/designations", { params });
    return res.data;
  },

  allActive: async () => {
    const res = await api.get("/designations/all-active");
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/designations", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/designations/${id}`, data);
    return res.data;
  },

  deactivate: async (id) => {
    await api.patch(`/designations/${id}/deactivate`);
  },

  activate: async (id) => {
    await api.patch(`/designations/${id}/activate`);
  },
};
