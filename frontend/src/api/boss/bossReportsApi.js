import axios from 'axios';

// ----------------- Axios Instance -----------------
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // backend base URL
  headers: { 'Content-Type': 'application/json' }
});

// Add Authorization token if exists
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // JWT token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------- Reports APIs -----------------
export const fetchAttendanceSummary = (period) =>
  API.get('/boss/reports/attendance-summary', { params: period });

export const fetchWorkerComparison = (period) =>
  API.get('/boss/reports/worker-comparison', { params: period });

export const fetchProjectUtilization = (period) =>
  API.get('/boss/reports/project-utilization', { params: period });

// export const fetchAIInsights = (period) =>
//   API.post('boss/ai/reports-insights', period);

export const exportReport = (payload) =>
  API.post('/boss/reports/export', payload, { responseType: 'blob' });

export const approveReport = (period) =>
  API.post('/boss/reports/approve', {
    reportType: 'FULL_REPORT',
    period
  });
