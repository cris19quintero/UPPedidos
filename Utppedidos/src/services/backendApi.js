// src/services/backendApi.js
import axios from "axios";

const backendApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Para que se envíen cookies si usas auth con cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adjuntar token en cada request
backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refrescar token si expira
backendApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config._retry
    ) {
      error.config._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${backendApi.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.token;
        localStorage.setItem("token", newToken);

        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        return backendApi(error.config);
      } catch (refreshError) {
        console.error("Error refrescando token", refreshError);
        localStorage.removeItem("token");
        window.location.href = "/login"; // redirigir al login
      }
    }
    return Promise.reject(error);
  }
);

export default backendApi;
