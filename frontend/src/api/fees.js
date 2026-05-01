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
  listClearanceStatus: (studentId) =>
    api.get(`/fees/clearance-status${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`),
  sendDefaulterMessage: (studentId, message) => api.post(`/fees/defaulters/${studentId}/message`, { message }),
  listDefaulterMessages: () => api.get("/fees/defaulters/messages"),
  recordPocketMoney: (studentId, payload) => api.post(`/fees/pocket-money/${studentId}`, payload),
  getPocketMoneyBalance: (studentId) => api.get(`/fees/pocket-money/${studentId}`),
};
