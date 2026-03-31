import api from "./client";

export const studentsApi = {
  list: (q = "") => api.get(`/students${q ? `?q=${encodeURIComponent(q)}` : ""}`),
};

export const staffApi = { list: () => api.get("/staff") };
export const gradesApi = {
  list: (params = "") => api.get(`/grades${params ? `?${params}` : ""}`),
  classPerformance: () => api.get("/grades/summary/class-performance"),
  rankings: () => api.get("/grades/summary/rankings")
};
export const budgetApi = { list: () => api.get("/budget") };
export const inventoryApi = { list: () => api.get("/inventory") };
