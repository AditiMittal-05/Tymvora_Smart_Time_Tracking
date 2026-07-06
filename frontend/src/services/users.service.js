import api from "./api";

export const usersService = {
  list: async (params = {}) => {
    const res = await api.get("/users", { params });
    return res.data;
  },

  get: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/users", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },

  deactivate: async (id) => {
    await api.patch(`/users/${id}/deactivate`);
  },

  activate: async (id) => {
    await api.patch(`/users/${id}/activate`);
  },

  dropdown: async () => {
    const res = await api.get("/users/dropdown");
    return res.data;
  },

  orgTree: async () => {
    const res = await api.get("/users/org-tree");
    return res.data;
  },

  approvers: async () => {
    const res = await api.get("/users/approvers");
    return res.data;
  },

  setManager: async (userId, managerId) => {
    const res = await api.put(`/users/${userId}/manager`, { manager_id: managerId });
    return res.data;
  },

  toggleApprover: async (userId, canApprove) => {
    const res = await api.patch(`/users/${userId}/toggle-approver`, { can_approve_timesheets: canApprove });
    return res.data;
  },

  getUserProjects: async (userId) => {
    const res = await api.get(`/users/${userId}/projects`);
    return res.data;
  },

  assignProjects: async (userId, projectIds) => {
    const res = await api.post(`/users/${userId}/projects`, { project_ids: projectIds });
    return res.data;
  },
};
