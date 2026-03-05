import API from "../axios";

/**
 * MANAGER – Daily Progress Approval APIs
 */

export const getPendingDailyProgress = (params) =>
  API.get("/manager/daily-progress/pending", { params });

export const getDailyProgressDetail = (id) =>
  API.get(`/manager/daily-progress/${id}`);

export const approveDailyProgress = (id) =>
  API.post(`/manager/daily-progress/${id}/approve`);

export const rejectDailyProgress = (id, reason) =>
  API.post(`/manager/daily-progress/${id}/reject`, { reason });
