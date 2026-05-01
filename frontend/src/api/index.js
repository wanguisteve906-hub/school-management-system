import api from "./client";
export { feesApi } from "./fees";

export const studentsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/students${qs ? `?${qs}` : ""}`);
  },
};

export const staffApi = { list: () => api.get("/staff") };
export const gradesApi = {
  list: (params = "") => api.get(`/grades${params ? `?${params}` : ""}`),
  classPerformance: () => api.get("/grades/summary/class-performance"),
  rankings: () => api.get("/grades/summary/rankings")
};
export const analyticsApi = {
  overview: (params = "") => api.get(`/analytics/overview${params ? `?${params}` : ""}`),
  subjectTeacher: (params = "") => api.get(`/analytics/subject-teacher${params ? `?${params}` : ""}`),
  streams: (params = "") => api.get(`/analytics/streams${params ? `?${params}` : ""}`),
  rankingsOutliers: (params = "") => api.get(`/analytics/rankings-outliers${params ? `?${params}` : ""}`),
  operationalFeed: (params = "") => api.get(`/analytics/operational-feed${params ? `?${params}` : ""}`),
  studentDrilldown: (studentId, params = "") =>
    api.get(`/analytics/student/${studentId}${params ? `?${params}` : ""}`),
  teacherDrilldown: (teacherId, params = "") =>
    api.get(`/analytics/teacher/${teacherId}${params ? `?${params}` : ""}`),
};
export const budgetApi = { list: () => api.get("/budget") };
export const inventoryApi = { list: () => api.get("/inventory") };

export const classTeacherApi = {
  classStudents: () => api.get("/class-teacher/my-class/students"),
  attendance: (targetDate) => api.get(`/class-teacher/my-class/attendance?target_date=${encodeURIComponent(targetDate)}`),
  updateAttendance: (payload) => api.put("/class-teacher/my-class/attendance", payload),
};
