import api from "./api";

export const configService = {
  getDepartments:   ()           => api.get("/config/departments").then((r) => r.data),
  addDepartment:    (name)       => api.post("/config/departments", { name }).then((r) => r.data),
  deleteDepartment: (name)       => api.delete(`/config/departments/${encodeURIComponent(name)}`).then((r) => r.data),

  getDesignations:   ()          => api.get("/config/designations").then((r) => r.data),
  addDesignation:    (name)      => api.post("/config/designations", { name }).then((r) => r.data),
  deleteDesignation: (name)      => api.delete(`/config/designations/${encodeURIComponent(name)}`).then((r) => r.data),
};
