import api from "./client";

export const feesApi = {
  listStructures: () => api.get("/fees/structures"),
  createStructure: (payload) => api.post("/fees/structures", payload),
  assignToGrade: (feeId, grade) => api.post(`/fees/assign/${feeId}/${grade}`),
  listStudentFees: (studentId) =>
    api.get(`/fees/student-fees${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`),
  recordPayment: (payload) => api.post("/fees/payments", payload),
  getBalance: (studentId) => api.get(`/fees/balance/${studentId}`),
  listDefaulters: () => api.get("/fees/defaulters"),
};
