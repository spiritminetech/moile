// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export const loginApi = (data) => API.post("/auth/login", data);
// export const selectCompanyApi = (data) =>
//   API.post("/auth/select-company", data);

// import axios from 'axios';

// const API = axios.create({
//   baseURL: 'http://localhost:5000/api',
// });

// export const login = (payload) =>
//   API.post('/auth/login', payload);

// export const selectCompany = (companyId, token) =>
//   API.post(
//     '/auth/select-company',
//     { companyId },
//     { headers: { Authorization: `Bearer ${token}` } }
//   );

// src/api/authApi.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Token must be saved after login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const login = (payload) => API.post('/auth/login', payload);

export const selectCompany = (companyId) =>
  API.post('/auth/select-company', { companyId }); // token auto-attached

export default API; // export instance for other API calls
