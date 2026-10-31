
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT to every API request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("syncTogetherToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("syncTogetherToken");

      window.dispatchEvent(
        new CustomEvent("session-expired")
      );
    }

    return Promise.reject(error);
  }
);

export default api;
