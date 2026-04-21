import axios from "axios";

// Dev: empty base → requests go to the Vite dev server, which proxies to FastAPI (no CORS issues).
// Production build: set VITE_API_BASE_URL to your public API origin.
export const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  : "";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("elimu_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("elimu_token");
      window.location.assign("/");
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (first_name, last_name, tsc_number) =>
    axios.post(`${API_BASE_URL}/auth/signup`, {
      first_name,
      last_name,
      tsc_number
    }),
  login: (tsc_number, password, name) =>
    axios.post(`${API_BASE_URL}/auth/login`, {
      tsc_number,
      password,
      name
    })
};

export default api;
