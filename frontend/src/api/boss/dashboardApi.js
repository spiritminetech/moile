import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchDashboardSummary = (payload) => {
    
  return API.get('/boss/dashboard/summary', {
    params: { companyId:payload.companyId, date:payload.date}
  });
};
export const fetchAISummary = (payload) => {
  return API.post('/ai/dashboard-summary', payload);
};