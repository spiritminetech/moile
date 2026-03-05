import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProjectOverview = (projectId) =>
  API.get(`/boss/projects/${projectId}/overview`);

export const getProgressTimeline = (projectId) =>
  API.get(`/boss/projects/${projectId}/progress-timeline`);

export const getAttendanceSnapshot = (projectId, date) =>
  API.get(`/boss/projects/${projectId}/attendance-snapshot`, {
    params: { date }
  });

// export const getFleetStatus = (projectId, date) =>
//   API.get(`/boss/projects/${projectId}/fleet-status`, {
//     params: { date }
//   });

export const getAIRiskAnalysis = (payload) =>
  API.post(`/ai/project-risk-analysis`, payload);

export const fetchProjectList = (companyId) =>
  API.get('/boss/projectList', {
    params: { companyId }
  });
