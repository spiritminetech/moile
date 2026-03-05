// src/api/transportApi.js
import axios from "axios";

/* ❗ Local axios instance (works, but duplicates config) */
const API = axios.create({
  baseURL: process.env.REACT_APP_URL || "http://localhost:5000/api",
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= TRANSPORT APIs ================= */

export const fetchTransportInit = (date, projectId) =>
  API.get("/transport/assignment/init", {
    params: { date, projectId }
  });

export const validateTransport = payload =>
  API.post("/transport/assignment/validate", payload);

export const assignTransport = payload =>
  API.post("/transport/assignment/assign", payload);
