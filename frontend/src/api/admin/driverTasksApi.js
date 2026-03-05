import axios from "axios";

const driverTasksAPI = axios.create({
  baseURL: "http://localhost:5000/api",
});

/* ===============================
   AUTH TOKEN INTERCEPTOR
================================ */
driverTasksAPI.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


  export const getDriverTasks = (params) =>
  driverTasksAPI.get("/transport/driver-tasks", { params });

  

  


export default driverTasksAPI;
