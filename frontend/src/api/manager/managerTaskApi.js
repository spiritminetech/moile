import axios from '../axios';

const API_BASE = '/manager/tasks';

export const managerTaskApi = {
  // Get master data for dropdowns
  getMasterData: (companyId) => {
    const params = companyId ? { companyId } : {};
    return axios.get(`${API_BASE}/master-data`, { params });
  },

  // Create new task
  createTask: (taskData) => {
    return axios.post(API_BASE, taskData);
  },

  // Get tasks with filters
  getTasks: (filters = {}) => {
    return axios.get(API_BASE, { params: filters });
  },

  // Get single task
  getTaskById: (id) => {
    return axios.get(`${API_BASE}/${id}`);
  },

  // Update task
  updateTask: (id, taskData) => {
    return axios.put(`${API_BASE}/${id}`, taskData);
  },

  // Delete task
  deleteTask: (id) => {
    return axios.delete(`${API_BASE}/${id}`);
  }
};