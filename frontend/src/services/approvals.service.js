import api from "./api";

export const approvalsService = {
  pending: async (params = {}) => {
    const res = await api.get("/approvals/pending", { params });
    return res.data;
  },

  all: async (params = {}) => {
    const res = await api.get("/approvals/all", { params });
    return res.data;
  },

  approve: async (headerId, comment) => {
    const res = await api.post(`/approvals/${headerId}/approve`, { comment });
    return res.data;
  },

  reject: async (headerId, comment) => {
    const res = await api.post(`/approvals/${headerId}/reject`, { comment });
    return res.data;
  },

  unlock: async (headerId, comment) => {
    const res = await api.post(`/approvals/${headerId}/unlock`, { comment });
    return res.data;
  },

  history: async (headerId) => {
    const res = await api.get(`/approvals/${headerId}/history`);
    return res.data;
  },

  approveWeek: async (weekStartDate) => {
    const res = await api.post("/approvals/approve-week", { week_start_date: weekStartDate });
    return res.data;
  },
};
